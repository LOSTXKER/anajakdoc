"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/types";
import { VatDocStatus } from "@prisma/client";

/**
 * Update VAT document status
 */
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
