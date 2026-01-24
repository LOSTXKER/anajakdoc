"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/types";
import { WhtDocStatus } from "@prisma/client";

/**
 * Update WHT document status
 */
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
