"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/types";

/**
 * Mark or unmark a box as possible duplicate
 */
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
