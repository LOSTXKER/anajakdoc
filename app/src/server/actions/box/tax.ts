"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/types";

// ==================== Update Box Tax Info ====================
// For accounting to update VAT/WHT details

interface UpdateBoxTaxData {
  vatAmount?: number | null;
  vatRate?: number | null;
  isVatInclusive?: boolean;
  whtRate?: number | null;
  whtAmount?: number | null;
  hasWht?: boolean;
}

export async function updateBoxTax(
  boxId: string,
  data: UpdateBoxTaxData
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

  // Build update data
  const updateData: Record<string, unknown> = {};
  
  // VAT fields
  if (data.vatAmount !== undefined) {
    updateData.vatAmount = data.vatAmount ?? 0;
  }
  if (data.vatRate !== undefined) {
    updateData.vatRate = data.vatRate;
  }
  if (data.isVatInclusive !== undefined) {
    updateData.isVatInclusive = data.isVatInclusive;
  }
  
  // WHT fields
  if (data.hasWht !== undefined) {
    updateData.hasWht = data.hasWht;
  }
  if (data.whtRate !== undefined) {
    updateData.whtRate = data.whtRate;
    // Auto-calculate whtAmount if rate is provided
    if (data.whtRate !== null && box.totalAmount) {
      const baseAmount = Number(box.totalAmount) - Number(box.vatAmount || 0);
      updateData.whtAmount = baseAmount * (data.whtRate / 100);
    }
  }
  if (data.whtAmount !== undefined) {
    updateData.whtAmount = data.whtAmount ?? 0;
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
      action: "TAX_UPDATED",
      details: { 
        fields: Object.keys(updateData),
      },
    },
  });

  revalidatePath(`/documents/${boxId}`);
  revalidatePath("/documents");
  
  return {
    success: true,
    message: "อัปเดตข้อมูลภาษีเรียบร้อยแล้ว",
  };
}
