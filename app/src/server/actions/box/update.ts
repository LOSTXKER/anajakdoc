"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import type { ApiResponse, UpdateBoxInput } from "@/types";
import { BoxStatus, VatDocStatus, WhtDocStatus } from "@prisma/client";

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

  // Check if box can be edited
  const editableStatuses: BoxStatus[] = [
    BoxStatus.DRAFT,
    BoxStatus.NEED_MORE_DOCS,
    BoxStatus.SUBMITTED,
  ];
  
  if (!editableStatuses.includes(box.status) && 
      !["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    return {
      success: false,
      error: "กล่องนี้ไม่สามารถแก้ไขได้ในสถานะปัจจุบัน",
    };
  }

  const updateData: Record<string, unknown> = {};
  
  // Build update data from form
  const stringFields = [
    "boxType", "expenseType", "title", "description", "notes", 
    "externalRef", "noReceiptReason", "foreignCurrency",
    "contactId", "categoryId", "costCenterId", "linkedBoxId",
    "duplicateReason"
  ];

  const booleanFields = [
    "isVatInclusive", "hasVat", "hasWht", "whtSent",
    "possibleDuplicate", "isLateDocs", "whtOverdue"
  ];

  const decimalFields = [
    "totalAmount", "vatAmount", "whtAmount", "vatRate", "whtRate",
    "foreignAmount", "exchangeRate", "paidAmount"
  ];

  const dateFields = [
    "boxDate", "dueDate", "whtDueDate"
  ];

  const enumFields: Record<string, Record<string, string>> = {
    vatDocStatus: VatDocStatus,
    whtDocStatus: WhtDocStatus,
    paymentMode: { COMPANY_PAID: "COMPANY_PAID", EMPLOYEE_ADVANCE: "EMPLOYEE_ADVANCE" },
    reimbursementStatus: { NONE: "NONE", PENDING: "PENDING", REIMBURSED: "REIMBURSED" },
  };

  // Process string fields
  for (const field of stringFields) {
    const value = formData.get(field);
    if (value !== null) {
      updateData[field] = value || null;
    }
  }

  // Process boolean fields
  for (const field of booleanFields) {
    const value = formData.get(field);
    if (value !== null) {
      updateData[field] = value === "true";
    }
  }

  // Process decimal fields
  for (const field of decimalFields) {
    const value = formData.get(field);
    if (value !== null) {
      updateData[field] = value ? parseFloat(value as string) : null;
    }
  }

  // Process date fields
  for (const field of dateFields) {
    const value = formData.get(field);
    if (value !== null) {
      updateData[field] = value ? new Date(value as string) : null;
    }
  }

  // Process enum fields
  for (const [field, enumObj] of Object.entries(enumFields)) {
    const value = formData.get(field);
    if (value !== null && value in enumObj) {
      updateData[field] = value;
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

// ==================== Update Box with Object Input ====================

export async function updateBoxData(
  boxId: string,
  data: UpdateBoxInput
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

  // Check if box can be edited
  const editableStatuses: BoxStatus[] = [
    BoxStatus.DRAFT,
    BoxStatus.NEED_MORE_DOCS,
    BoxStatus.SUBMITTED,
  ];
  
  if (!editableStatuses.includes(box.status) && 
      !["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    return {
      success: false,
      error: "กล่องนี้ไม่สามารถแก้ไขได้ในสถานะปัจจุบัน",
    };
  }

  await prisma.box.update({
    where: { id: boxId },
    data,
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      boxId,
      userId: session.id,
      action: "UPDATED",
      details: { fields: Object.keys(data) },
    },
  });

  revalidatePath(`/documents/${boxId}`);
  revalidatePath("/documents");
  
  return {
    success: true,
    message: "อัปเดตกล่องเอกสารเรียบร้อยแล้ว",
  };
}

// ==================== Update VAT Status ====================

export async function updateVatStatus(
  boxId: string,
  vatDocStatus: VatDocStatus
): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  if (!["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    return {
      success: false,
      error: "คุณไม่มีสิทธิ์อัปเดตสถานะ VAT",
    };
  }

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

  const updateData: Record<string, unknown> = { vatDocStatus };
  
  // If verified, set verified timestamp and user
  if (vatDocStatus === VatDocStatus.VERIFIED) {
    updateData.vatVerifiedAt = new Date();
    updateData.vatVerifiedById = session.id;
  }

  await prisma.$transaction(async (tx) => {
    await tx.box.update({
      where: { id: boxId },
      data: updateData,
    });

    await tx.activityLog.create({
      data: {
        boxId,
        userId: session.id,
        action: "VAT_STATUS_UPDATED",
        details: { vatDocStatus },
      },
    });
  });

  revalidatePath(`/documents/${boxId}`);
  
  return {
    success: true,
    message: "อัปเดตสถานะ VAT เรียบร้อยแล้ว",
  };
}

// ==================== Update WHT Status ====================

export async function updateWhtStatus(
  boxId: string,
  whtDocStatus: WhtDocStatus
): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  if (!["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    return {
      success: false,
      error: "คุณไม่มีสิทธิ์อัปเดตสถานะ WHT",
    };
  }

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

  await prisma.$transaction(async (tx) => {
    await tx.box.update({
      where: { id: boxId },
      data: { whtDocStatus },
    });

    await tx.activityLog.create({
      data: {
        boxId,
        userId: session.id,
        action: "WHT_STATUS_UPDATED",
        details: { whtDocStatus },
      },
    });
  });

  revalidatePath(`/documents/${boxId}`);
  
  return {
    success: true,
    message: "อัปเดตสถานะ WHT เรียบร้อยแล้ว",
  };
}

// ==================== Mark Duplicate ====================

export async function markDuplicate(
  boxId: string,
  isDuplicate: boolean,
  reason?: string
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

  await prisma.$transaction(async (tx) => {
    await tx.box.update({
      where: { id: boxId },
      data: {
        possibleDuplicate: isDuplicate,
        duplicateReason: isDuplicate ? reason : null,
      },
    });

    await tx.activityLog.create({
      data: {
        boxId,
        userId: session.id,
        action: isDuplicate ? "MARKED_DUPLICATE" : "UNMARKED_DUPLICATE",
        details: { reason },
      },
    });
  });

  revalidatePath(`/documents/${boxId}`);
  
  return {
    success: true,
    message: isDuplicate 
      ? "ทำเครื่องหมายว่าอาจซ้ำเรียบร้อยแล้ว"
      : "นำเครื่องหมายซ้ำออกเรียบร้อยแล้ว",
  };
}

// ==================== Update Reimbursement Status ====================

export async function updateReimbursementStatus(
  boxId: string,
  status: "NONE" | "PENDING" | "REIMBURSED"
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

  await prisma.$transaction(async (tx) => {
    await tx.box.update({
      where: { id: boxId },
      data: { reimbursementStatus: status },
    });

    await tx.activityLog.create({
      data: {
        boxId,
        userId: session.id,
        action: "REIMBURSEMENT_STATUS_UPDATED",
        details: { status },
      },
    });
  });

  revalidatePath(`/documents/${boxId}`);
  
  return {
    success: true,
    message: "อัปเดตสถานะเบิกคืนเรียบร้อยแล้ว",
  };
}
