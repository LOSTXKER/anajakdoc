"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import type { ApiResponse, UpdateBoxInput } from "@/types";
import { BoxStatus, VatDocStatus, WhtDocStatus } from "@prisma/client";

/**
 * Update box with form data
 */
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
    include: {
      fiscalPeriod: true,
    },
  });

  if (!box) {
    return {
      success: false,
      error: "ไม่พบกล่องเอกสาร",
    };
  }

  // Check period lock (Section 12)
  if (box.fiscalPeriod?.status === "CLOSED") {
    // Only allow late doc additions if admin/owner
    if (!["ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
      return {
        success: false,
        error: "งวดบัญชีปิดแล้ว ไม่สามารถแก้ไขได้",
      };
    }
    // For admin/owner, allow but mark as late doc
  }

  // Check if box can be edited
  // Using new 4-status system
  const editableStatuses: BoxStatus[] = [
    BoxStatus.DRAFT,
    BoxStatus.NEED_DOCS,
    BoxStatus.PENDING,
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
    if (value !== null && typeof value === "string" && value in enumObj) {
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

/**
 * Update box with object input
 */
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
  // Using new 4-status system
  const editableStatuses: BoxStatus[] = [
    BoxStatus.DRAFT,
    BoxStatus.NEED_DOCS,
    BoxStatus.PENDING,
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
