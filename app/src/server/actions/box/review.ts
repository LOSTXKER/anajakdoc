"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import { createNotification, notifyAccountingTeam } from "../notification";
import type { ApiResponse, MemberRole } from "@/types";
import { BoxStatus, NotificationType } from "@prisma/client";

// ==================== Status Transition Rules (Simplified 4-status system) ====================
// Using: DRAFT → PENDING → NEED_DOCS / COMPLETED
// Import from status-transitions.ts for the canonical config

type TransitionRule = {
  from: BoxStatus[];
  to: BoxStatus;
  allowedRoles: MemberRole[];
  action: string;
  notificationType?: NotificationType;
  notificationTitle?: string;
};

// Using existing NotificationType values (BOX_SUBMITTED, BOX_NEED_MORE_DOCS, BOX_BOOKED)
const TRANSITIONS: TransitionRule[] = [
  // Draft → Pending (ส่งตรวจ)
  {
    from: [BoxStatus.DRAFT],
    to: BoxStatus.PENDING,
    allowedRoles: ["STAFF", "ACCOUNTING", "ADMIN", "OWNER"],
    action: "SUBMIT",
    notificationType: NotificationType.BOX_SUBMITTED,
    notificationTitle: "กล่องเอกสารใหม่รอตรวจ",
  },
  // Pending → Need Docs (ขอเอกสารเพิ่ม)
  {
    from: [BoxStatus.PENDING],
    to: BoxStatus.NEED_DOCS,
    allowedRoles: ["ACCOUNTING", "ADMIN", "OWNER"],
    action: "REQUEST_DOCS",
    notificationType: NotificationType.BOX_NEED_MORE_DOCS,
    notificationTitle: "ขาดเอกสาร",
  },
  // Need Docs → Pending (ส่งใหม่)
  {
    from: [BoxStatus.NEED_DOCS],
    to: BoxStatus.PENDING,
    allowedRoles: ["STAFF", "ACCOUNTING", "ADMIN", "OWNER"],
    action: "RESUBMIT",
    notificationType: NotificationType.BOX_SUBMITTED,
    notificationTitle: "กล่องเอกสารถูกส่งใหม่",
  },
  // Pending → Completed (อนุมัติ/ลงบัญชี)
  {
    from: [BoxStatus.PENDING],
    to: BoxStatus.COMPLETED,
    allowedRoles: ["ACCOUNTING", "ADMIN", "OWNER"],
    action: "APPROVE",
    notificationType: NotificationType.BOX_BOOKED,
    notificationTitle: "เสร็จสิ้น",
  },
  // Need Docs → Completed (อนุมัติ/ลงบัญชี - กรณีแก้ไขแล้ว)
  {
    from: [BoxStatus.NEED_DOCS],
    to: BoxStatus.COMPLETED,
    allowedRoles: ["ACCOUNTING", "ADMIN", "OWNER"],
    action: "APPROVE",
    notificationType: NotificationType.BOX_BOOKED,
    notificationTitle: "เสร็จสิ้น",
  },
  // Revert: Completed → Pending (กรณีต้องแก้ไข)
  {
    from: [BoxStatus.COMPLETED],
    to: BoxStatus.PENDING,
    allowedRoles: ["ADMIN", "OWNER"],
    action: "REVERT",
    notificationType: NotificationType.BOX_SUBMITTED,
    notificationTitle: "กล่องถูกเปิดใหม่เพื่อแก้ไข",
  },
];

// Find valid transition
function findTransition(
  from: BoxStatus,
  to: BoxStatus,
  role: MemberRole
): TransitionRule | null {
  return TRANSITIONS.find(
    (t) =>
      t.from.includes(from) &&
      t.to === to &&
      t.allowedRoles.includes(role)
  ) || null;
}

// Get available next statuses for a role
export async function getAvailableTransitions(
  from: BoxStatus,
  role: MemberRole
): Promise<{ to: BoxStatus; action: string; label: string }[]> {
  // Using new 4-status system
  const statusLabels: Record<BoxStatus, string> = {
    DRAFT: "แบบร่าง",
    PENDING: "รอตรวจ",
    NEED_DOCS: "ขาดเอกสาร",
    COMPLETED: "เสร็จสิ้น",
  };

  return TRANSITIONS
    .filter((t) => t.from.includes(from) && t.allowedRoles.includes(role))
    .map((t) => ({
      to: t.to,
      action: t.action,
      label: statusLabels[t.to],
    }));
}

// ==================== Submit Box ====================

export async function submitBox(boxId: string): Promise<ApiResponse> {
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

  // Check valid transition (DRAFT → PENDING)
  const transition = findTransition(
    box.status,
    BoxStatus.PENDING,
    session.currentOrganization.role
  );

  if (!transition) {
    return {
      success: false,
      error: "ไม่สามารถส่งกล่องจากสถานะปัจจุบันได้",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.box.update({
      where: { id: boxId },
      data: {
        status: BoxStatus.PENDING,
        submittedAt: new Date(),
      },
    });

    await tx.activityLog.create({
      data: {
        boxId,
        userId: session.id,
        action: transition.action,
        details: { fromStatus: box.status },
      },
    });
  });

  // Notify accounting team
  await notifyAccountingTeam(
    session.currentOrganization.id,
    transition.notificationType || NotificationType.BOX_SUBMITTED,
    transition.notificationTitle || "กล่องเอกสารใหม่รอตรวจ",
    `${box.boxNumber} ${box.status === BoxStatus.NEED_DOCS ? "ถูกส่งใหม่" : "ถูกส่งเข้ามาใหม่"}`,
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

// ==================== Change Box Status ====================

export async function changeBoxStatus(
  boxId: string,
  newStatus: BoxStatus,
  comment?: string
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

  // Check valid transition
  const transition = findTransition(
    box.status,
    newStatus,
    session.currentOrganization.role
  );

  if (!transition) {
    return {
      success: false,
      error: `ไม่สามารถเปลี่ยนสถานะจาก ${box.status} เป็น ${newStatus} ได้`,
    };
  }

  // Build update data based on new status (using new 4-status system)
  const updateData: Record<string, unknown> = { status: newStatus };
  
  switch (newStatus) {
    case BoxStatus.PENDING:
      updateData.submittedAt = new Date();
      break;
    case BoxStatus.COMPLETED:
      updateData.bookedAt = new Date();
      updateData.reviewedAt = new Date();
      break;
  }

  await prisma.$transaction(async (tx) => {
    await tx.box.update({
      where: { id: boxId },
      data: updateData,
    });

    // Add comment if provided
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

    // Log activity
    await tx.activityLog.create({
      data: {
        boxId,
        userId: session.id,
        action: transition.action,
        details: { 
          fromStatus: box.status, 
          toStatus: newStatus,
          comment 
        },
      },
    });
  });

  // Send notification
  if (transition.notificationType) {
    const notificationMessage = comment 
      ? `${box.boxNumber}: ${comment}`
      : `กล่อง ${box.boxNumber} เปลี่ยนสถานะเป็น ${transition.notificationTitle}`;

    await createNotification(
      session.currentOrganization.id,
      box.createdById,
      transition.notificationType,
      transition.notificationTitle || "สถานะกล่องเปลี่ยน",
      notificationMessage,
      { boxId }
    );
  }

  revalidatePath(`/documents/${boxId}`);
  revalidatePath("/documents");
  revalidatePath("/inbox");
  
  return {
    success: true,
    message: `เปลี่ยนสถานะเป็น ${transition.notificationTitle || newStatus} เรียบร้อยแล้ว`,
  };
}

// ==================== Review Box (Simplified for new 4-status system) ====================

export async function reviewBox(
  boxId: string,
  action: "approve" | "reject" | "need_info" | "ready" | "wht_pending" | "book",
  comment?: string
): Promise<ApiResponse> {
  // Map old actions to new 4-status system
  const actionToStatus: Record<string, BoxStatus> = {
    approve: BoxStatus.COMPLETED,
    reject: BoxStatus.DRAFT, // Revert to draft instead of cancel
    need_info: BoxStatus.NEED_DOCS,
    ready: BoxStatus.COMPLETED,
    wht_pending: BoxStatus.PENDING, // No separate WHT_PENDING, stays in PENDING
    book: BoxStatus.COMPLETED,
  };

  const newStatus = actionToStatus[action];
  if (!newStatus) {
    return {
      success: false,
      error: "Invalid action",
    };
  }

  // Just change status directly in new 4-status system
  return changeBoxStatus(boxId, newStatus, comment);
}

// ==================== Quick Actions (Simplified for 4-status system) ====================

export async function requestMoreDocs(boxId: string, comment?: string): Promise<ApiResponse> {
  return changeBoxStatus(boxId, BoxStatus.NEED_DOCS, comment);
}

export async function approveBox(boxId: string): Promise<ApiResponse> {
  return changeBoxStatus(boxId, BoxStatus.COMPLETED);
}

export async function revertToEdit(boxId: string, reason?: string): Promise<ApiResponse> {
  return changeBoxStatus(boxId, BoxStatus.PENDING, reason);
}

// Legacy aliases for backward compatibility
export const startReview = approveBox;
export const markReadyToBook = approveBox;
export const bookBox = approveBox;
export const archiveBox = approveBox;

// ==================== Batch Status Change ====================

export async function batchChangeStatus(
  boxIds: string[],
  newStatus: BoxStatus,
  comment?: string
): Promise<ApiResponse<{ succeeded: string[]; failed: string[] }>> {
  const succeeded: string[] = [];
  const failed: string[] = [];

  for (const boxId of boxIds) {
    const result = await changeBoxStatus(boxId, newStatus, comment);
    if (result.success) {
      succeeded.push(boxId);
    } else {
      failed.push(boxId);
    }
  }

  return {
    success: failed.length === 0,
    data: { succeeded, failed },
    message: `เปลี่ยนสถานะสำเร็จ ${succeeded.length}/${boxIds.length} กล่อง`,
  };
}
