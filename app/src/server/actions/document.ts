"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { createDocumentSchema, updateDocumentSchema } from "@/lib/validations/document";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ApiResponse, DocumentFilters, PaginatedResponse, DocumentWithRelations } from "@/types";
import { DocumentStatus } from ".prisma/client";

async function generateDocNumber(orgId: string, type: "EXPENSE" | "INCOME"): Promise<string> {
  const prefix = type === "EXPENSE" ? "EXP" : "INC";
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
  
  const count = await prisma.document.count({
    where: {
      organizationId: orgId,
      transactionType: type,
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
  });

  const sequence = (count + 1).toString().padStart(4, "0");
  return `${prefix}${year}${month}-${sequence}`;
}

export async function createDocument(formData: FormData): Promise<ApiResponse<{ id: string }>> {
  const session = await requireOrganization();
  
  const rawData = {
    transactionType: formData.get("transactionType") as string,
    docType: formData.get("docType") as string,
    docDate: formData.get("docDate") as string,
    dueDate: formData.get("dueDate") as string || undefined,
    subtotal: formData.get("subtotal") as string,
    vatAmount: formData.get("vatAmount") as string || "0",
    whtAmount: formData.get("whtAmount") as string || "0",
    totalAmount: formData.get("totalAmount") as string,
    vatRate: formData.get("vatRate") as string || undefined,
    isVatInclusive: formData.get("isVatInclusive") === "true",
    hasValidVat: formData.get("hasValidVat") === "true",
    hasWht: formData.get("hasWht") === "true",
    whtRate: formData.get("whtRate") as string || undefined,
    whtType: formData.get("whtType") as string || undefined,
    paymentMethod: formData.get("paymentMethod") as string || undefined,
    externalRef: formData.get("externalRef") as string || undefined,
    description: formData.get("description") as string || undefined,
    notes: formData.get("notes") as string || undefined,
    contactId: formData.get("contactId") as string || undefined,
    costCenterId: formData.get("costCenterId") as string || undefined,
    categoryId: formData.get("categoryId") as string || undefined,
  };

  const result = createDocumentSchema.safeParse(rawData);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0].message,
    };
  }

  const docNumber = await generateDocNumber(
    session.currentOrganization.id,
    result.data.transactionType
  );

  const document = await prisma.document.create({
    data: {
      organizationId: session.currentOrganization.id,
      docNumber,
      transactionType: result.data.transactionType,
      docType: result.data.docType,
      docDate: result.data.docDate,
      dueDate: result.data.dueDate,
      subtotal: result.data.subtotal,
      vatAmount: result.data.vatAmount,
      whtAmount: result.data.whtAmount,
      totalAmount: result.data.totalAmount,
      vatRate: result.data.vatRate,
      isVatInclusive: result.data.isVatInclusive,
      hasValidVat: result.data.hasValidVat,
      hasWht: result.data.hasWht,
      whtRate: result.data.whtRate,
      whtType: result.data.whtType,
      paymentMethod: result.data.paymentMethod,
      externalRef: result.data.externalRef,
      description: result.data.description,
      notes: result.data.notes,
      contactId: result.data.contactId || null,
      costCenterId: result.data.costCenterId || null,
      categoryId: result.data.categoryId || null,
      submittedById: session.id,
      status: DocumentStatus.DRAFT,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      documentId: document.id,
      userId: session.id,
      action: "CREATED",
      details: { docNumber },
    },
  });

  revalidatePath("/documents");
  
  return {
    success: true,
    data: { id: document.id },
  };
}

export async function updateDocument(
  documentId: string,
  formData: FormData
): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!document) {
    return {
      success: false,
      error: "ไม่พบเอกสาร",
    };
  }

  const rawData: Record<string, unknown> = {};
  
  // Only include fields that are present in formData
  const fields = [
    "docType", "docDate", "dueDate", "subtotal", "vatAmount", "whtAmount",
    "totalAmount", "vatRate", "isVatInclusive", "hasValidVat", "hasWht",
    "whtRate", "whtType", "paymentMethod", "externalRef", "description",
    "notes", "contactId", "costCenterId", "categoryId", "status"
  ];

  for (const field of fields) {
    const value = formData.get(field);
    if (value !== null) {
      if (field === "isVatInclusive" || field === "hasValidVat" || field === "hasWht") {
        rawData[field] = value === "true";
      } else {
        rawData[field] = value;
      }
    }
  }

  const result = updateDocumentSchema.safeParse(rawData);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0].message,
    };
  }

  await prisma.document.update({
    where: { id: documentId },
    data: result.data,
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      documentId,
      userId: session.id,
      action: "UPDATED",
      details: { fields: Object.keys(result.data) },
    },
  });

  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/documents");
  
  return {
    success: true,
    message: "อัปเดตเอกสารเรียบร้อยแล้ว",
  };
}

export async function submitDocument(documentId: string): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      organizationId: session.currentOrganization.id,
      status: DocumentStatus.DRAFT,
    },
  });

  if (!document) {
    return {
      success: false,
      error: "ไม่พบเอกสารหรือเอกสารไม่อยู่ในสถานะแบบร่าง",
    };
  }

  await prisma.document.update({
    where: { id: documentId },
    data: {
      status: DocumentStatus.PENDING_REVIEW,
      submittedAt: new Date(),
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      documentId,
      userId: session.id,
      action: "SUBMITTED",
    },
  });

  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/documents");
  revalidatePath("/inbox");
  
  return {
    success: true,
    message: "ส่งเอกสารเรียบร้อยแล้ว",
  };
}

export async function reviewDocument(
  documentId: string,
  action: "approve" | "reject" | "need_info",
  comment?: string
): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  // Check permission
  if (!["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    return {
      success: false,
      error: "คุณไม่มีสิทธิ์ตรวจสอบเอกสาร",
    };
  }

  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      organizationId: session.currentOrganization.id,
      status: { in: [DocumentStatus.PENDING_REVIEW, DocumentStatus.NEED_INFO] },
    },
  });

  if (!document) {
    return {
      success: false,
      error: "ไม่พบเอกสารหรือเอกสารไม่อยู่ในสถานะที่สามารถตรวจสอบได้",
    };
  }

  const statusMap = {
    approve: DocumentStatus.READY_TO_EXPORT,
    reject: DocumentStatus.REJECTED,
    need_info: DocumentStatus.NEED_INFO,
  };

  await prisma.$transaction(async (tx) => {
    await tx.document.update({
      where: { id: documentId },
      data: {
        status: statusMap[action],
        reviewedById: session.id,
        reviewedAt: new Date(),
      },
    });

    if (comment) {
      await tx.comment.create({
        data: {
          documentId,
          userId: session.id,
          content: comment,
          isInternal: false,
        },
      });
    }

    await tx.activityLog.create({
      data: {
        documentId,
        userId: session.id,
        action: `REVIEWED_${action.toUpperCase()}`,
        details: comment ? { comment } : undefined,
      },
    });
  });

  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/documents");
  revalidatePath("/inbox");
  
  return {
    success: true,
    message: action === "approve" 
      ? "อนุมัติเอกสารเรียบร้อยแล้ว" 
      : action === "reject"
      ? "ปฏิเสธเอกสารเรียบร้อยแล้ว"
      : "ขอข้อมูลเพิ่มเติมเรียบร้อยแล้ว",
  };
}

export async function getDocuments(
  filters?: DocumentFilters,
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<DocumentWithRelations>> {
  const session = await requireOrganization();
  
  const where: Record<string, unknown> = {
    organizationId: session.currentOrganization.id,
  };

  // Apply filters
  if (filters?.status?.length) {
    where.status = { in: filters.status };
  }
  if (filters?.transactionType) {
    where.transactionType = filters.transactionType;
  }
  if (filters?.docType?.length) {
    where.docType = { in: filters.docType };
  }
  if (filters?.categoryId) {
    where.categoryId = filters.categoryId;
  }
  if (filters?.costCenterId) {
    where.costCenterId = filters.costCenterId;
  }
  if (filters?.contactId) {
    where.contactId = filters.contactId;
  }
  if (filters?.dateFrom || filters?.dateTo) {
    where.docDate = {};
    if (filters.dateFrom) {
      (where.docDate as Record<string, Date>).gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      (where.docDate as Record<string, Date>).lte = filters.dateTo;
    }
  }
  if (filters?.search) {
    where.OR = [
      { docNumber: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { externalRef: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  // For staff, only show their own documents
  if (session.currentOrganization.role === "STAFF") {
    where.submittedById = session.id;
  }

  const [total, items] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.findMany({
      where,
      include: {
        files: true,
        contact: true,
        costCenter: true,
        category: true,
        submittedBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        reviewedBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { files: true, comments: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: items as unknown as DocumentWithRelations[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getDocument(documentId: string): Promise<DocumentWithRelations | null> {
  const session = await requireOrganization();
  
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      organizationId: session.currentOrganization.id,
      ...(session.currentOrganization.role === "STAFF" 
        ? { submittedById: session.id } 
        : {}),
    },
    include: {
      files: { orderBy: { pageOrder: "asc" } },
      contact: true,
      costCenter: true,
      category: true,
      submittedBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      reviewedBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      comments: {
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return document as unknown as DocumentWithRelations | null;
}

export async function deleteDocument(documentId: string): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      organizationId: session.currentOrganization.id,
      status: DocumentStatus.DRAFT,
    },
  });

  if (!document) {
    return {
      success: false,
      error: "ไม่พบเอกสารหรือไม่สามารถลบเอกสารนี้ได้",
    };
  }

  // Only allow delete if user is owner or admin, or if it's their own draft
  if (
    session.currentOrganization.role === "STAFF" &&
    document.submittedById !== session.id
  ) {
    return {
      success: false,
      error: "คุณไม่มีสิทธิ์ลบเอกสารนี้",
    };
  }

  await prisma.document.delete({
    where: { id: documentId },
  });

  revalidatePath("/documents");
  redirect("/documents");
}

export async function searchDocuments(query: string) {
  const session = await requireOrganization();
  
  if (!query.trim()) {
    return [];
  }

  const where: Record<string, unknown> = {
    organizationId: session.currentOrganization.id,
    OR: [
      { docNumber: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { externalRef: { contains: query, mode: "insensitive" } },
      { notes: { contains: query, mode: "insensitive" } },
      { contact: { name: { contains: query, mode: "insensitive" } } },
    ],
  };

  // For staff, only show their own documents
  if (session.currentOrganization.role === "STAFF") {
    where.submittedById = session.id;
  }

  const documents = await prisma.document.findMany({
    where,
    select: {
      id: true,
      docNumber: true,
      description: true,
      docDate: true,
      totalAmount: true,
      status: true,
      category: {
        select: { name: true },
      },
      submittedBy: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return documents;
}
