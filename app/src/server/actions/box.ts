"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ApiResponse, BoxFilters, PaginatedResponse, BoxWithRelations, DocType } from "@/types";
import { BoxStatus, DocStatus, PaymentStatus, ExpenseType } from "@prisma/client";
import { createNotification, notifyAccountingTeam } from "./notification";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";
import { calculateServerCompletionPercent, getAutoChecklistUpdates, determineDocStatus } from "@/lib/checklist";
import { createAutoPaymentFromSlip, recalculateBoxPaymentStatus } from "./payment-helpers";

// ==================== Box Number Generation ====================

async function generateBoxNumber(orgId: string, type: "EXPENSE" | "INCOME" | "ADJUSTMENT"): Promise<string> {
  const prefix = type === "EXPENSE" ? "EXP" : type === "INCOME" ? "INC" : "ADJ";
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
  
  const count = await prisma.box.count({
    where: {
      organizationId: orgId,
      boxType: type,
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
  });

  const sequence = (count + 1).toString().padStart(4, "0");
  return `${prefix}${year}${month}-${sequence}`;
}

// ==================== Create Box ====================

export async function createBox(formData: FormData): Promise<ApiResponse<{ id: string }>> {
  const session = await requireOrganization();
  
  // Parse form data
  const boxType = (formData.get("boxType") as string) || "EXPENSE";
  const expenseType = formData.get("expenseType") as string || undefined;
  const boxDateStr = formData.get("boxDate") as string;
  const dueDateStr = formData.get("dueDate") as string || undefined;
  const totalAmountStr = formData.get("totalAmount") as string;
  const vatAmountStr = formData.get("vatAmount") as string || "0";
  const whtAmountStr = formData.get("whtAmount") as string || "0";
  const vatRateStr = formData.get("vatRate") as string || undefined;
  const whtRateStr = formData.get("whtRate") as string || undefined;
  
  const totalAmount = totalAmountStr ? parseFloat(totalAmountStr) : 0;
  const vatAmount = parseFloat(vatAmountStr);
  const whtAmount = parseFloat(whtAmountStr);
  
  // Multi-payment support
  const isMultiPayment = formData.get("isMultiPayment") === "true";
  const slipAmountStr = formData.get("slipAmount") as string;
  const slipAmount = slipAmountStr ? parseFloat(slipAmountStr) : null;
  
  const boxNumber = await generateBoxNumber(
    session.currentOrganization.id,
    boxType as "EXPENSE" | "INCOME" | "ADJUSTMENT"
  );

  const box = await prisma.box.create({
    data: {
      organizationId: session.currentOrganization.id,
      boxNumber,
      boxType: boxType as "EXPENSE" | "INCOME" | "ADJUSTMENT",
      expenseType: expenseType ? expenseType as ExpenseType : null,
      boxDate: boxDateStr ? new Date(boxDateStr) : new Date(),
      dueDate: dueDateStr ? new Date(dueDateStr) : null,
      totalAmount,
      vatAmount,
      whtAmount,
      vatRate: vatRateStr ? parseFloat(vatRateStr) : null,
      whtRate: whtRateStr ? parseFloat(whtRateStr) : null,
      isVatInclusive: formData.get("isVatInclusive") === "true",
      hasVat: formData.get("hasVat") === "true",
      hasWht: formData.get("hasWht") === "true",
      foreignCurrency: formData.get("foreignCurrency") as string || null,
      foreignAmount: formData.get("foreignAmount") ? parseFloat(formData.get("foreignAmount") as string) : null,
      exchangeRate: formData.get("exchangeRate") ? parseFloat(formData.get("exchangeRate") as string) : null,
      noReceiptReason: formData.get("noReceiptReason") as string || null,
      title: formData.get("title") as string || null,
      description: formData.get("description") as string || null,
      notes: formData.get("notes") as string || null,
      externalRef: formData.get("externalRef") as string || null,
      contactId: formData.get("contactId") as string || null,
      categoryId: formData.get("categoryId") as string || null,
      costCenterId: formData.get("costCenterId") as string || null,
      linkedBoxId: formData.get("linkedBoxId") as string || null,
      createdById: session.id,
      status: BoxStatus.DRAFT,
      docStatus: DocStatus.INCOMPLETE,
    },
  });

  // Handle file uploads
  await handleFileUploads(formData, box.id, session, isMultiPayment, slipAmount);

  // Auto-create WHT Tracking when hasWht is true
  if (formData.get("hasWht") === "true") {
    const trackingType = boxType === "EXPENSE" ? "OUTGOING" : "INCOMING";
    const whtAmountCalc = whtAmount || totalAmount * 0.03; // Default 3%
    
    await prisma.whtTracking.create({
      data: {
        boxId: box.id,
        type: trackingType,
        amount: whtAmountCalc,
        rate: whtRateStr ? parseFloat(whtRateStr) : 3,
        contactId: formData.get("contactId") as string || null,
        status: "PENDING",
      },
    });
  }

  // Log activity
  await prisma.activityLog.create({
    data: {
      boxId: box.id,
      userId: session.id,
      action: "CREATED",
      details: { boxNumber },
    },
  });

  revalidatePath("/documents");
  revalidatePath("/wht-tracking");
  
  return {
    success: true,
    data: { id: box.id },
  };
}

// ==================== File Upload Handler ====================

async function handleFileUploads(
  formData: FormData,
  boxId: string,
  session: { currentOrganization: { id: string }; id: string },
  isMultiPayment = false,
  slipAmount: number | null = null
) {
  // Support both old format (files[], fileTypes[]) and new format (file_0, file_1, ...)
  let files: File[] = formData.getAll("files") as File[];
  let fileTypes: string[] = formData.getAll("fileTypes") as string[];

  // Check for new format (file_0, file_1, ...)
  if (files.length === 0) {
    let index = 0;
    while (true) {
      const file = formData.get(`file_${index}`);
      // In Server Actions, files might be Blob-like objects, not File instances
      if (!file || typeof file === "string" || !(file as Blob).arrayBuffer) break;
      files.push(file as File);
      const fileType = formData.get(`fileType_${index}`) as string || "OTHER";
      fileTypes.push(fileType);
      index++;
    }
  }

  if (files.length === 0) {
    console.log("[handleFileUploads] No files found in formData");
    return;
  }
  
  console.log(`[handleFileUploads] Processing ${files.length} files for box ${boxId}`);

  const supabase = await createClient();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const docType = (fileTypes[i] || "OTHER") as DocType;
    
    // Get file name - handle both File and Blob-like objects
    const originalFileName = file.name || `file_${i}`;
    console.log(`[handleFileUploads] Processing file ${i}: ${originalFileName}, type: ${file.type}, size: ${file.size}`);

    try {
      // Generate unique filename
      const ext = originalFileName.split(".").pop() || "bin";
      const timestamp = Date.now();
      const randomStr = crypto.randomBytes(8).toString("hex");
      const fileName = `${session.currentOrganization.id}/${boxId}/${timestamp}-${randomStr}.${ext}`;

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
        console.error("[handleFileUploads] Supabase upload error:", uploadError);
        continue;
      }
      
      console.log(`[handleFileUploads] File uploaded to storage: ${fileName}`);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(fileName);

      // Check if Document for this type already exists
      let document = await prisma.document.findFirst({
        where: {
          boxId,
          docType,
        },
      });

      // Create Document if not exists
      if (!document) {
        document = await prisma.document.create({
          data: {
            boxId,
            docType,
          },
        });
      }

      // Create DocumentFile
      const docFile = await prisma.documentFile.create({
        data: {
          documentId: document.id,
          fileName: originalFileName,
          fileUrl: urlData.publicUrl,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
          checksum,
          pageOrder: i,
        },
      });
      
      console.log(`[handleFileUploads] Created DocumentFile: ${docFile.id} for document ${document.id}`);

      // Auto-create payment record when payment slip is uploaded
      const isPaymentSlip = ["SLIP_TRANSFER", "SLIP_CHEQUE"].includes(docType);
      if (isPaymentSlip) {
        await createAutoPaymentFromSlip({
          boxId,
          amount: slipAmount || 0,
          method: docType === "SLIP_TRANSFER" ? "TRANSFER" : "CHEQUE",
          documentId: document.id,
          reference: originalFileName,
          isMultiPayment,
          slipAmount: slipAmount ?? undefined,
        });
      }
    } catch (error) {
      console.error("[handleFileUploads] Error uploading file:", error);
    }
  }

  // Recalculate box checklist
  await recalculateBoxChecklist(boxId);
}

// ==================== Update Box ====================

export async function updateBox(
  boxId: string,
  formData: FormData
): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!box) {
    return {
      success: false,
      error: "ไม่พบกล่องเอกสาร",
    };
  }

  const updateData: Record<string, unknown> = {};
  
  // Build update data from form
  const fields = [
    "boxType", "expenseType", "boxDate", "dueDate", "totalAmount",
    "vatAmount", "whtAmount", "vatRate", "whtRate", "isVatInclusive",
    "hasVat", "hasWht", "foreignCurrency", "foreignAmount", "exchangeRate",
    "noReceiptReason", "title", "description", "notes", "externalRef",
    "contactId", "categoryId", "costCenterId", "status", "linkedBoxId"
  ];

  for (const field of fields) {
    const value = formData.get(field);
    if (value !== null) {
      if (["isVatInclusive", "hasVat", "hasWht"].includes(field)) {
        updateData[field] = value === "true";
      } else if (["totalAmount", "vatAmount", "whtAmount", "vatRate", "whtRate", "foreignAmount", "exchangeRate"].includes(field)) {
        updateData[field] = value ? parseFloat(value as string) : null;
      } else if (["boxDate", "dueDate"].includes(field)) {
        updateData[field] = value ? new Date(value as string) : null;
      } else {
        updateData[field] = value || null;
      }
    }
  }

  await prisma.box.update({
    where: { id: boxId },
    data: updateData,
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      boxId,
      userId: session.id,
      action: "UPDATED",
      details: { fields: Object.keys(updateData) },
    },
  });

  revalidatePath(`/documents/${boxId}`);
  revalidatePath("/documents");
  
  return {
    success: true,
    message: "อัปเดตกล่องเอกสารเรียบร้อยแล้ว",
  };
}

// ==================== Submit Box ====================

export async function submitBox(boxId: string): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
      status: BoxStatus.DRAFT,
    },
  });

  if (!box) {
    return {
      success: false,
      error: "ไม่พบกล่องเอกสารหรือกล่องไม่อยู่ในสถานะแบบร่าง",
    };
  }

  await prisma.box.update({
    where: { id: boxId },
    data: {
      status: BoxStatus.PENDING_REVIEW,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      boxId,
      userId: session.id,
      action: "SUBMITTED",
    },
  });

  // Notify accounting team
  await notifyAccountingTeam(
    session.currentOrganization.id,
    "BOX_SUBMITTED",
    "กล่องเอกสารใหม่รอตรวจ",
    `${box.boxNumber} ถูกส่งเข้ามาใหม่`,
    { boxId }
  );

  revalidatePath(`/documents/${boxId}`);
  revalidatePath("/documents");
  revalidatePath("/inbox");
  
  return {
    success: true,
    message: "ส่งกล่องเอกสารเรียบร้อยแล้ว",
  };
}

// ==================== Review Box ====================

export async function reviewBox(
  boxId: string,
  action: "approve" | "reject" | "need_info",
  comment?: string
): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  if (!["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    return {
      success: false,
      error: "คุณไม่มีสิทธิ์ตรวจสอบกล่องเอกสาร",
    };
  }

  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
      status: { in: [BoxStatus.PENDING_REVIEW, BoxStatus.NEED_INFO] },
    },
  });

  if (!box) {
    return {
      success: false,
      error: "ไม่พบกล่องเอกสารหรือกล่องไม่อยู่ในสถานะที่สามารถตรวจสอบได้",
    };
  }

  const statusMap = {
    approve: BoxStatus.APPROVED,
    reject: BoxStatus.CANCELLED,
    need_info: BoxStatus.NEED_INFO,
  };

  await prisma.$transaction(async (tx) => {
    await tx.box.update({
      where: { id: boxId },
      data: {
        status: statusMap[action],
      },
    });

    if (comment) {
      await tx.comment.create({
        data: {
          boxId,
          userId: session.id,
          content: comment,
          isInternal: false,
        },
      });
    }

    await tx.activityLog.create({
      data: {
        boxId,
        userId: session.id,
        action: `REVIEWED_${action.toUpperCase()}`,
        details: comment ? { comment } : undefined,
      },
    });
  });

  // Notify box owner
  const notificationTypes = {
    approve: "BOX_APPROVED" as const,
    reject: "BOX_REJECTED" as const,
    need_info: "BOX_NEED_INFO" as const,
  };
  const notificationMessages = {
    approve: `กล่อง ${box.boxNumber} ได้รับการอนุมัติแล้ว`,
    reject: `กล่อง ${box.boxNumber} ถูกปฏิเสธ${comment ? `: ${comment}` : ""}`,
    need_info: `กล่อง ${box.boxNumber} ต้องการข้อมูลเพิ่มเติม${comment ? `: ${comment}` : ""}`,
  };

  await createNotification(
    session.currentOrganization.id,
    box.createdById,
    notificationTypes[action],
    action === "approve" ? "กล่องอนุมัติแล้ว" : action === "reject" ? "กล่องถูกปฏิเสธ" : "ขอข้อมูลเพิ่ม",
    notificationMessages[action],
    { boxId }
  );

  revalidatePath(`/documents/${boxId}`);
  revalidatePath("/documents");
  revalidatePath("/inbox");
  
  return {
    success: true,
    message: action === "approve" 
      ? "อนุมัติกล่องเอกสารเรียบร้อยแล้ว" 
      : action === "reject"
      ? "ปฏิเสธกล่องเอกสารเรียบร้อยแล้ว"
      : "ขอข้อมูลเพิ่มเติมเรียบร้อยแล้ว",
  };
}

// ==================== Get Boxes ====================

export async function getBoxes(
  filters?: BoxFilters,
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<BoxWithRelations>> {
  const session = await requireOrganization();
  
  const where: Record<string, unknown> = {
    organizationId: session.currentOrganization.id,
  };

  // Apply filters
  if (filters?.status?.length) {
    where.status = { in: filters.status };
  }
  if (filters?.boxType) {
    where.boxType = filters.boxType;
  }
  if (filters?.expenseType?.length) {
    where.expenseType = { in: filters.expenseType };
  }
  if (filters?.docStatus?.length) {
    where.docStatus = { in: filters.docStatus };
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
    where.boxDate = {};
    if (filters.dateFrom) {
      (where.boxDate as Record<string, Date>).gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      (where.boxDate as Record<string, Date>).lte = filters.dateTo;
    }
  }
  if (filters?.search) {
    where.OR = [
      { boxNumber: { contains: filters.search, mode: "insensitive" } },
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { externalRef: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters?.paymentStatus?.length) {
    where.paymentStatus = { in: filters.paymentStatus };
  }

  // For staff, only show their own boxes
  if (session.currentOrganization.role === "STAFF") {
    where.createdById = session.id;
  }

  const [total, items] = await Promise.all([
    prisma.box.count({ where }),
    prisma.box.findMany({
      where,
      include: {
        documents: {
          include: {
            files: { orderBy: { pageOrder: "asc" } },
          },
          orderBy: { createdAt: "asc" },
        },
        payments: {
          orderBy: { paidDate: "desc" },
        },
        whtTrackings: {
          include: {
            contact: true,
          },
        },
        contact: true,
        costCenter: true,
        category: true,
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        linkedBox: true,
        comments: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { documents: true, payments: true, comments: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: items as unknown as BoxWithRelations[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ==================== Get Single Box ====================

export async function getBox(boxId: string): Promise<BoxWithRelations | null> {
  const session = await requireOrganization();
  
  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
      ...(session.currentOrganization.role === "STAFF" 
        ? { createdById: session.id } 
        : {}),
    },
    include: {
      documents: {
        include: {
          files: { orderBy: { pageOrder: "asc" } },
        },
        orderBy: { createdAt: "asc" },
      },
      payments: {
        orderBy: { paidDate: "desc" },
      },
      whtTrackings: {
        include: {
          contact: true,
        },
      },
      contact: true,
      costCenter: true,
      category: true,
      createdBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      linkedBox: true,
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

  return box as unknown as BoxWithRelations | null;
}

// ==================== Delete Box ====================

export async function deleteBox(boxId: string): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
      status: BoxStatus.DRAFT,
    },
  });

  if (!box) {
    return {
      success: false,
      error: "ไม่พบกล่องเอกสารหรือไม่สามารถลบกล่องนี้ได้",
    };
  }

  // Only allow delete if user is owner or admin, or if it's their own draft
  if (
    session.currentOrganization.role === "STAFF" &&
    box.createdById !== session.id
  ) {
    return {
      success: false,
      error: "คุณไม่มีสิทธิ์ลบกล่องเอกสารนี้",
    };
  }

  await prisma.box.delete({
    where: { id: boxId },
  });

  revalidatePath("/documents");
  redirect("/documents");
}

// ==================== Toggle Checklist Item ====================

export async function toggleChecklistItem(boxId: string, itemId: string): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!box) {
    return {
      success: false,
      error: "ไม่พบกล่องเอกสาร",
    };
  }

  let message = "";

  // Handle different checklist items
  switch (itemId) {
    case "isPaid":
    case "payment": {
      // Toggle payment status: UNPAID <-> PAID
      // "payment" is the new unified item, "isPaid" kept for backward compatibility
      const newStatus = box.paymentStatus === PaymentStatus.PAID 
        ? PaymentStatus.UNPAID 
        : PaymentStatus.PAID;
      
      const paidAmount = newStatus === PaymentStatus.PAID 
        ? box.totalAmount 
        : 0;

      await prisma.box.update({
        where: { id: boxId },
        data: {
          paymentStatus: newStatus,
          paidAmount,
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          boxId,
          userId: session.id,
          action: newStatus === PaymentStatus.PAID ? "MARK_PAID" : "MARK_UNPAID",
          details: newStatus === PaymentStatus.PAID 
            ? "ยืนยันการชำระเงินสด (ไม่มีหลักฐาน)" 
            : "ยกเลิกการยืนยันชำระเงิน",
        },
      });

      message = newStatus === PaymentStatus.PAID 
        ? "ยืนยันการชำระเงินสำเร็จ" 
        : "ยกเลิกการยืนยันสำเร็จ";
      break;
    }
    
    case "whtSent": {
      // Toggle WHT sent status
      const newWhtSent = !box.whtSent;
      
      await prisma.box.update({
        where: { id: boxId },
        data: { whtSent: newWhtSent },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          boxId,
          userId: session.id,
          action: newWhtSent ? "WHT_SENT" : "WHT_UNSENT",
          details: newWhtSent 
            ? "ยืนยันส่งหนังสือหัก ณ ที่จ่ายแล้ว" 
            : "ยกเลิกการยืนยันส่ง WHT",
        },
      });

      message = newWhtSent 
        ? "ยืนยันส่ง WHT สำเร็จ" 
        : "ยกเลิกการยืนยันสำเร็จ";
      break;
    }

    case "hasCashReceipt": {
      // Toggle "ไม่มีบิลเงินสด" status for NO_VAT expense type
      const noCashReceiptConfirmed = box.noReceiptReason === "NO_CASH_RECEIPT";
      const newNoReceiptReason = noCashReceiptConfirmed ? null : "NO_CASH_RECEIPT";
      
      await prisma.box.update({
        where: { id: boxId },
        data: { noReceiptReason: newNoReceiptReason },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          boxId,
          userId: session.id,
          action: newNoReceiptReason ? "NO_CASH_RECEIPT" : "HAS_CASH_RECEIPT",
          details: newNoReceiptReason 
            ? "ยืนยันว่าไม่มีบิลเงินสด" 
            : "ยกเลิกการยืนยันไม่มีบิลเงินสด",
        },
      });

      message = newNoReceiptReason 
        ? "ยืนยันไม่มีบิลเงินสดสำเร็จ" 
        : "ยกเลิกการยืนยันสำเร็จ";
      break;
    }

    default:
      return {
        success: false,
        error: "ไม่รู้จักรายการที่ต้องการ toggle",
      };
  }

  // Recalculate checklist
  await recalculateBoxChecklist(boxId);

  revalidatePath(`/documents/${boxId}`);
  
  return {
    success: true,
    message,
  };
}

// ==================== Recalculate Box Checklist ====================

export async function recalculateBoxChecklist(boxId: string): Promise<void> {
  const box = await prisma.box.findFirst({
    where: { id: boxId },
    include: { documents: true },
  });

  if (!box) return;

  const uploadedDocTypes = new Set(box.documents.map((d) => d.docType));

  // Build checklist state (from box fields if they exist)
  const checklist = {
    isPaid: box.paymentStatus === PaymentStatus.PAID,
    hasPaymentProof: false,
    hasTaxInvoice: false,
    hasInvoice: false,
    whtIssued: false,
    whtSent: box.whtSent,
    whtReceived: false,
  };

  // Get auto-updates from uploaded docs
  const autoUpdates = getAutoChecklistUpdates(uploadedDocTypes);
  Object.assign(checklist, autoUpdates);

  // Determine doc status
  const docStatus = determineDocStatus(
    box.boxType,
    box.expenseType,
    box.hasVat,
    box.hasWht,
    checklist,
    uploadedDocTypes,
    box.noReceiptReason
  );

  await prisma.box.update({
    where: { id: boxId },
    data: {
      docStatus,
    },
  });
}

// ==================== Add File to Box ====================

export async function addFileToBox(
  boxId: string,
  formData: FormData
): Promise<ApiResponse> {
  const session = await requireOrganization();

  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!box) {
    return { success: false, error: "ไม่พบกล่องเอกสาร" };
  }

  const file = formData.get("file") as File | null;
  const docType = (formData.get("docType") as string) || "OTHER";
  const amount = formData.get("amount") as string | null;
  const vatAmount = formData.get("vatAmount") as string | null;

  if (!file || !(file instanceof File)) {
    return { success: false, error: "ไม่พบไฟล์" };
  }

  const supabase = await createClient();

  try {
    // Generate unique filename
    const ext = file.name.split(".").pop();
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(8).toString("hex");
    const fileName = `${session.currentOrganization.id}/${box.id}/${timestamp}-${randomStr}.${ext}`;

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
      return { success: false, error: "อัปโหลดไฟล์ไม่สำเร็จ" };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(fileName);

    // Check if Document for this type already exists
    let document = await prisma.document.findFirst({
      where: {
        boxId: box.id,
        docType: docType as DocType,
      },
    });

    if (document) {
      // Add file to existing Document
      await prisma.documentFile.create({
        data: {
          documentId: document.id,
          fileName: file.name,
          fileUrl: urlData.publicUrl,
          fileSize: file.size,
          mimeType: file.type,
          checksum,
        },
      });
    } else {
      // Create new Document with file
      document = await prisma.document.create({
        data: {
          boxId: box.id,
          docType: docType as DocType,
          files: {
            create: {
              fileName: file.name,
              fileUrl: urlData.publicUrl,
              fileSize: file.size,
              mimeType: file.type,
              checksum,
            },
          },
        },
      });
    }

    // Update box amount if provided (e.g., from tax invoice)
    if (amount && docType === "TAX_INVOICE") {
      const amountNum = parseFloat(amount);
      const vatAmountNum = vatAmount ? parseFloat(vatAmount) : 0;
      
      await prisma.box.update({
        where: { id: box.id },
        data: {
          totalAmount: amountNum,
          vatAmount: vatAmountNum,
        },
      });
    }

    // Auto-create payment record when payment slip is uploaded
    const isPaymentSlip = ["SLIP_TRANSFER", "SLIP_CHEQUE"].includes(docType);
    let paymentResult: { isOverpaid?: boolean; overpaidAmount?: number } = {};
    if (isPaymentSlip) {
      const slipAmountNum = amount ? parseFloat(amount) : 0;
      paymentResult = await createAutoPaymentFromSlip({
        boxId: box.id,
        amount: slipAmountNum,
        method: docType === "SLIP_TRANSFER" ? "TRANSFER" : "CHEQUE",
        documentId: document.id,
        reference: file.name,
        notes: slipAmountNum > 0 
          ? "บันทึกอัตโนมัติจากยอดในสลิป" 
          : "บันทึกอัตโนมัติจากการอัปโหลดสลิป",
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        boxId: box.id,
        userId: session.id,
        action: "FILE_ADDED",
        details: {
          fileName: file.name,
          docType,
        },
      },
    });

    // Recalculate checklist
    await recalculateBoxChecklist(box.id);

    revalidatePath(`/documents/${box.id}`);
    revalidatePath("/documents");

    return { 
      success: true, 
      message: paymentResult.isOverpaid 
        ? `เพิ่มเอกสารสำเร็จ (ชำระเกินยอด ฿${paymentResult.overpaidAmount?.toLocaleString()})` 
        : "เพิ่มเอกสารสำเร็จ",
      data: {
        isOverpaid: paymentResult.isOverpaid,
        overpaidAmount: paymentResult.overpaidAmount,
      },
    };
  } catch (error) {
    console.error("Error adding file:", error);
    return { success: false, error: "เกิดข้อผิดพลาด" };
  }
}

// ==================== Delete File ====================

export async function deleteBoxFile(
  boxId: string,
  fileId: string
): Promise<ApiResponse> {
  const session = await requireOrganization();

  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!box) {
    return { success: false, error: "ไม่พบกล่องเอกสาร" };
  }

  const file = await prisma.documentFile.findFirst({
    where: {
      id: fileId,
      document: {
        boxId: box.id,
      },
    },
    include: {
      document: true,
    },
  });

  if (!file) {
    return { success: false, error: "ไม่พบไฟล์" };
  }

  const supabase = await createClient();

  try {
    // Delete from storage
    if (file.fileUrl) {
      const urlParts = file.fileUrl.split("/documents/");
      if (urlParts.length > 1) {
        const storagePath = urlParts[1];
        await supabase.storage.from("documents").remove([storagePath]);
      }
    }

    // Delete file record
    await prisma.documentFile.delete({
      where: { id: fileId },
    });

    // Check if Document has any files left
    const remainingFiles = await prisma.documentFile.count({
      where: { documentId: file.documentId },
    });

    // If no files left, delete the Document and related payments
    if (remainingFiles === 0) {
      // Check if this document has linked payments (e.g., slip documents)
      const linkedPayments = await prisma.payment.findMany({
        where: { documentId: file.documentId },
      });

      if (linkedPayments.length > 0) {
        // Delete linked payments
        await prisma.payment.deleteMany({
          where: { documentId: file.documentId },
        });
        console.log(`[deleteBoxFile] Deleted ${linkedPayments.length} linked payment(s) for document ${file.documentId}`);

        // Recalculate payment status after deleting payments
        await recalculateBoxPaymentStatus(box.id);
      }

      // Delete the document
      await prisma.document.delete({
        where: { id: file.documentId },
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        boxId: box.id,
        userId: session.id,
        action: "FILE_DELETED",
        details: {
          fileName: file.fileName,
          docType: file.document.docType,
        },
      },
    });

    // Recalculate checklist
    await recalculateBoxChecklist(box.id);

    revalidatePath(`/documents/${box.id}`);
    revalidatePath("/documents");

    return { success: true, message: "ลบไฟล์สำเร็จ" };
  } catch (error) {
    console.error("Error deleting file:", error);
    return { success: false, error: "เกิดข้อผิดพลาด" };
  }
}

// ==================== Search Boxes ====================

export async function searchBoxes(query: string) {
  const session = await requireOrganization();
  
  if (!query.trim()) {
    return [];
  }

  const where: Record<string, unknown> = {
    organizationId: session.currentOrganization.id,
    OR: [
      { boxNumber: { contains: query, mode: "insensitive" } },
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { externalRef: { contains: query, mode: "insensitive" } },
      { notes: { contains: query, mode: "insensitive" } },
      { contact: { name: { contains: query, mode: "insensitive" } } },
    ],
  };

  if (session.currentOrganization.role === "STAFF") {
    where.createdById = session.id;
  }

  const boxes = await prisma.box.findMany({
    where,
    select: {
      id: true,
      boxNumber: true,
      title: true,
      boxDate: true,
      totalAmount: true,
      status: true,
      docStatus: true,
      category: {
        select: { name: true },
      },
      createdBy: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return boxes;
}

// ==================== Get Pending Boxes for AI Matching ====================

export async function getPendingBoxes(boxType: "EXPENSE" | "INCOME"): Promise<ApiResponse<Array<{
  id: string;
  boxNumber: string;
  title: string | null;
  totalAmount: number;
  boxDate: Date;
  contactId: string | null;
  contactName: string | null;
  contactTaxId: string | null;
  hasSlip: boolean;
  hasTaxInvoice: boolean;
}>>> {
  const session = await requireOrganization();

  const boxes = await prisma.box.findMany({
    where: {
      organizationId: session.currentOrganization.id,
      boxType,
      docStatus: DocStatus.INCOMPLETE,
    },
    include: {
      contact: {
        select: {
          id: true,
          name: true,
          taxId: true,
        },
      },
      documents: {
        select: {
          docType: true,
        },
      },
    },
    orderBy: {
      boxDate: "desc",
    },
    take: 50,
  });

  const result = boxes.map(box => {
    const docTypes = box.documents.map(d => d.docType);
    return {
      id: box.id,
      boxNumber: box.boxNumber,
      title: box.title,
      totalAmount: Number(box.totalAmount),
      boxDate: box.boxDate,
      contactId: box.contact?.id || null,
      contactName: box.contact?.name || null,
      contactTaxId: box.contact?.taxId || null,
      hasSlip: docTypes.includes("SLIP_TRANSFER"),
      hasTaxInvoice: docTypes.includes("TAX_INVOICE"),
    };
  });

  return { success: true, data: result };
}
