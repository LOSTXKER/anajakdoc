"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { createDocumentSchema, updateDocumentSchema } from "@/lib/validations/document";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ApiResponse, DocumentFilters, PaginatedResponse, DocumentWithRelations, SubDocType } from "@/types";
import { DocumentStatus } from ".prisma/client";
import { createNotification, notifyAccountingTeam } from "./notification";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

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
    // docType is now optional - defaults to RECEIPT for backward compatibility
    docType: (formData.get("docType") as string) || undefined,
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

  // Handle file uploads and create SubDocuments
  const files = formData.getAll("files") as File[];
  const fileTypes = formData.getAll("fileTypes") as string[];

  if (files.length > 0) {
    const supabase = await createClient();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const docType = (fileTypes[i] || "OTHER") as SubDocType;

      try {
        // Generate unique filename
        const ext = file.name.split(".").pop();
        const timestamp = Date.now();
        const randomStr = crypto.randomBytes(8).toString("hex");
        const fileName = `${session.currentOrganization.id}/${document.id}/${timestamp}-${randomStr}.${ext}`;

        // Calculate checksum
        const arrayBuffer = await file.arrayBuffer();
        const checksum = crypto
          .createHash("md5")
          .update(Buffer.from(arrayBuffer))
          .digest("hex");

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(fileName, file, {
            contentType: file.type,
            cacheControl: "3600",
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("documents")
          .getPublicUrl(fileName);

        // Check if SubDocument for this type already exists
        let subDocument = await prisma.subDocument.findFirst({
          where: {
            documentId: document.id,
            docType,
          },
        });

        // Create SubDocument if not exists
        if (!subDocument) {
          subDocument = await prisma.subDocument.create({
            data: {
              documentId: document.id,
              docType,
            },
          });
        }

        // Create SubDocumentFile
        await prisma.subDocumentFile.create({
          data: {
            subDocumentId: subDocument.id,
            fileName: file.name,
            fileUrl: urlData.publicUrl,
            fileSize: file.size,
            mimeType: file.type,
            checksum,
            pageOrder: i,
            isPrimary: i === 0,
          },
        });
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
  }

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

  // Notify accounting team
  await notifyAccountingTeam(
    session.currentOrganization.id,
    "DOCUMENT_SUBMITTED",
    "เอกสารใหม่รอตรวจ",
    `${document.docNumber} ถูกส่งเข้ามาใหม่`,
    { documentId }
  );

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

  // Notify document owner
  const notificationTypes = {
    approve: "DOCUMENT_APPROVED" as const,
    reject: "DOCUMENT_REJECTED" as const,
    need_info: "DOCUMENT_NEED_INFO" as const,
  };
  const notificationMessages = {
    approve: `เอกสาร ${document.docNumber} ได้รับการอนุมัติแล้ว`,
    reject: `เอกสาร ${document.docNumber} ถูกปฏิเสธ${comment ? `: ${comment}` : ""}`,
    need_info: `เอกสาร ${document.docNumber} ต้องการข้อมูลเพิ่มเติม${comment ? `: ${comment}` : ""}`,
  };

  await createNotification(
    session.currentOrganization.id,
    document.submittedById,
    notificationTypes[action],
    action === "approve" ? "เอกสารอนุมัติแล้ว" : action === "reject" ? "เอกสารถูกปฏิเสธ" : "ขอข้อมูลเพิ่ม",
    notificationMessages[action],
    { documentId }
  );

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
        subDocuments: {
          include: {
            files: { orderBy: { pageOrder: "asc" } },
          },
          orderBy: { createdAt: "asc" },
        },
        whtTrackings: {
          include: {
            contact: true,
          },
        },
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
          select: { files: true, subDocuments: true, comments: true },
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
      subDocuments: {
        include: {
          files: { orderBy: { pageOrder: "asc" } },
        },
        orderBy: { createdAt: "asc" },
      },
      whtTrackings: {
        include: {
          contact: true,
        },
      },
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

// Update document checklist status
export async function updateDocumentChecklist(
  documentId: string,
  updates: Partial<{
    isPaid: boolean;
    hasPaymentProof: boolean;
    hasTaxInvoice: boolean;
    hasInvoice: boolean;
    whtIssued: boolean;
    whtSent: boolean;
    whtReceived: boolean;
  }>
): Promise<ApiResponse> {
  const session = await requireOrganization();

  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      organizationId: session.currentOrganization.id,
    },
    include: {
      subDocuments: true,
    },
  });

  if (!document) {
    return { success: false, error: "ไม่พบเอกสาร" };
  }

  // Calculate new completion percent
  const hasVat = document.hasValidVat || Number(document.vatAmount) > 0;
  const hasWht = document.hasWht;
  const isExpense = document.transactionType === "EXPENSE";
  const uploadedDocTypes = new Set(document.subDocuments.map((d) => d.docType));

  // Merge updates with existing values
  const newChecklist = {
    isPaid: updates.isPaid ?? document.isPaid,
    hasPaymentProof: updates.hasPaymentProof ?? document.hasPaymentProof ?? uploadedDocTypes.has("SLIP"),
    hasTaxInvoice: updates.hasTaxInvoice ?? document.hasTaxInvoice ?? uploadedDocTypes.has("TAX_INVOICE"),
    hasInvoice: updates.hasInvoice ?? document.hasInvoice ?? uploadedDocTypes.has("INVOICE"),
    whtIssued: updates.whtIssued ?? document.whtIssued ?? uploadedDocTypes.has("WHT_CERT_SENT"),
    whtSent: updates.whtSent ?? document.whtSent,
    whtReceived: updates.whtReceived ?? document.whtReceived ?? uploadedDocTypes.has("WHT_CERT_RECEIVED"),
  };

  // Calculate completion
  let requiredCount = 0;
  let completedCount = 0;

  if (isExpense) {
    // EXPENSE checklist
    requiredCount += 2; // isPaid + hasPaymentProof
    if (newChecklist.isPaid) completedCount++;
    if (newChecklist.hasPaymentProof || uploadedDocTypes.has("SLIP")) completedCount++;

    if (hasVat) {
      requiredCount++;
      if (newChecklist.hasTaxInvoice || uploadedDocTypes.has("TAX_INVOICE")) completedCount++;
    }

    if (hasWht) {
      requiredCount += 2; // whtIssued + whtSent
      if (newChecklist.whtIssued || uploadedDocTypes.has("WHT_CERT_SENT")) completedCount++;
      if (newChecklist.whtSent) completedCount++;
    }
  } else {
    // INCOME checklist
    requiredCount += 2; // hasInvoice + isPaid
    if (newChecklist.hasInvoice || uploadedDocTypes.has("INVOICE")) completedCount++;
    if (newChecklist.isPaid) completedCount++;

    if (hasVat) {
      requiredCount++;
      if (newChecklist.hasTaxInvoice || uploadedDocTypes.has("TAX_INVOICE")) completedCount++;
    }

    if (hasWht) {
      requiredCount++;
      if (newChecklist.whtReceived || uploadedDocTypes.has("WHT_CERT_RECEIVED")) completedCount++;
    }
  }

  const completionPercent = requiredCount > 0 ? Math.round((completedCount / requiredCount) * 100) : 100;
  const isComplete = completionPercent === 100;
  const newStatus = isComplete ? "COMPLETE" : "IN_PROGRESS";

  await prisma.document.update({
    where: { id: documentId },
    data: {
      ...newChecklist,
      completionPercent,
      isComplete,
      status: newStatus as DocumentStatus,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      documentId,
      userId: session.id,
      action: "checklist_updated",
      details: {
        updates,
        completionPercent,
      },
    },
  });

  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/documents");

  return { success: true, message: "อัปเดทเรียบร้อย" };
}

// Recalculate document checklist (call after file upload)
export async function recalculateDocumentChecklist(documentId: string): Promise<void> {
  const document = await prisma.document.findFirst({
    where: { id: documentId },
    include: { subDocuments: true },
  });

  if (!document) return;

  const hasVat = document.hasValidVat || Number(document.vatAmount) > 0;
  const hasWht = document.hasWht;
  const isExpense = document.transactionType === "EXPENSE";
  const uploadedDocTypes = new Set(document.subDocuments.map((d) => d.docType));

  // Auto-update checklist based on uploaded docs
  const autoUpdates: Record<string, boolean> = {};

  if (uploadedDocTypes.has("SLIP")) autoUpdates.hasPaymentProof = true;
  if (uploadedDocTypes.has("TAX_INVOICE")) autoUpdates.hasTaxInvoice = true;
  if (uploadedDocTypes.has("INVOICE")) autoUpdates.hasInvoice = true;
  if (uploadedDocTypes.has("WHT_CERT_SENT")) autoUpdates.whtIssued = true;
  if (uploadedDocTypes.has("WHT_CERT_RECEIVED")) autoUpdates.whtReceived = true;

  // Calculate completion
  let requiredCount = 0;
  let completedCount = 0;

  const checklist = {
    isPaid: document.isPaid,
    hasPaymentProof: autoUpdates.hasPaymentProof ?? document.hasPaymentProof,
    hasTaxInvoice: autoUpdates.hasTaxInvoice ?? document.hasTaxInvoice,
    hasInvoice: autoUpdates.hasInvoice ?? document.hasInvoice,
    whtIssued: autoUpdates.whtIssued ?? document.whtIssued,
    whtSent: document.whtSent,
    whtReceived: autoUpdates.whtReceived ?? document.whtReceived,
  };

  if (isExpense) {
    requiredCount += 2;
    if (checklist.isPaid) completedCount++;
    if (checklist.hasPaymentProof) completedCount++;

    if (hasVat) {
      requiredCount++;
      if (checklist.hasTaxInvoice) completedCount++;
    }

    if (hasWht) {
      requiredCount += 2;
      if (checklist.whtIssued) completedCount++;
      if (checklist.whtSent) completedCount++;
    }
  } else {
    requiredCount += 2;
    if (checklist.hasInvoice) completedCount++;
    if (checklist.isPaid) completedCount++;

    if (hasVat) {
      requiredCount++;
      if (checklist.hasTaxInvoice) completedCount++;
    }

    if (hasWht) {
      requiredCount++;
      if (checklist.whtReceived) completedCount++;
    }
  }

  const completionPercent = requiredCount > 0 ? Math.round((completedCount / requiredCount) * 100) : 100;
  const isComplete = completionPercent === 100;

  await prisma.document.update({
    where: { id: documentId },
    data: {
      ...autoUpdates,
      completionPercent,
      isComplete,
      status: isComplete ? "COMPLETE" : "IN_PROGRESS",
    },
  });
}
