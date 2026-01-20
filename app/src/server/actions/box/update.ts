"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/types";

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
