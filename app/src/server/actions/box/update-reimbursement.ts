"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/types";

/**
 * Update reimbursement status for employee advance payments
 */
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
