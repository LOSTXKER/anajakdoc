"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import { createNotification, notifyAccountingTeam } from "../notification";
import type { ApiResponse } from "@/types";
import { BoxStatus } from "@prisma/client";

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
