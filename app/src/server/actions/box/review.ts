"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import { createNotification, notifyAccountingTeam } from "../notification";
import type { ApiResponse, MemberRole } from "@/types";
import { BoxStatus, NotificationType } from "@prisma/client";

// ==================== Status Transition Rules (Section 5.3) ====================

type TransitionRule = {
  from: BoxStatus[];
  to: BoxStatus;
  allowedRoles: MemberRole[];
  action: string;
  notificationType?: NotificationType;
  notificationTitle?: string;
};

const TRANSITIONS: TransitionRule[] = [
  // Draft → Submitted
  {
    from: [BoxStatus.DRAFT],
    to: BoxStatus.SUBMITTED,
    allowedRoles: ["STAFF", "ACCOUNTING", "ADMIN", "OWNER"],
    action: "SUBMIT",
    notificationType: NotificationType.BOX_SUBMITTED,
    notificationTitle: "กล่องเอกสารใหม่รอตรวจ",
  },
  // Submitted → In Review
  {
    from: [BoxStatus.SUBMITTED],
    to: BoxStatus.IN_REVIEW,
    allowedRoles: ["ACCOUNTING", "ADMIN", "OWNER"],
    action: "START_REVIEW",
    notificationType: NotificationType.BOX_IN_REVIEW,
    notificationTitle: "กำลังตรวจสอบกล่องเอกสาร",
  },
  // In Review → Need More Docs
  {
    from: [BoxStatus.IN_REVIEW],
    to: BoxStatus.NEED_MORE_DOCS,
    allowedRoles: ["ACCOUNTING", "ADMIN", "OWNER"],
    action: "REQUEST_DOCS",
    notificationType: NotificationType.BOX_NEED_MORE_DOCS,
    notificationTitle: "ขอเอกสารเพิ่ม",
  },
  // Need More Docs → Submitted (resubmit)
  {
    from: [BoxStatus.NEED_MORE_DOCS],
    to: BoxStatus.SUBMITTED,
    allowedRoles: ["STAFF", "ACCOUNTING", "ADMIN", "OWNER"],
    action: "RESUBMIT",
    notificationType: NotificationType.BOX_SUBMITTED,
    notificationTitle: "กล่องเอกสารถูกส่งใหม่",
  },
  // In Review → Ready to Book
  {
    from: [BoxStatus.IN_REVIEW],
    to: BoxStatus.READY_TO_BOOK,
    allowedRoles: ["ACCOUNTING", "ADMIN", "OWNER"],
    action: "MARK_READY",
    notificationType: NotificationType.BOX_READY_TO_BOOK,
    notificationTitle: "พร้อมลงบัญชี",
  },
  // In Review → WHT Pending (Bookable but WHT pending)
  {
    from: [BoxStatus.IN_REVIEW],
    to: BoxStatus.WHT_PENDING,
    allowedRoles: ["ACCOUNTING", "ADMIN", "OWNER"],
    action: "MARK_WHT_PENDING",
    notificationType: NotificationType.WHT_PENDING,
    notificationTitle: "รอ WHT",
  },
  // Ready to Book → Booked
  {
    from: [BoxStatus.READY_TO_BOOK, BoxStatus.WHT_PENDING],
    to: BoxStatus.BOOKED,
    allowedRoles: ["ACCOUNTING", "ADMIN", "OWNER"],
    action: "BOOK",
    notificationType: NotificationType.BOX_BOOKED,
    notificationTitle: "ลงบัญชีแล้ว",
  },
  // Booked → Archived
  {
    from: [BoxStatus.BOOKED],
    to: BoxStatus.ARCHIVED,
    allowedRoles: ["ACCOUNTING", "ADMIN", "OWNER"],
    action: "ARCHIVE",
    notificationType: NotificationType.BOX_ARCHIVED,
    notificationTitle: "เก็บเข้าคลังแล้ว",
  },
  // Archived → Locked
  {
    from: [BoxStatus.ARCHIVED],
    to: BoxStatus.LOCKED,
    allowedRoles: ["ADMIN", "OWNER"],
    action: "LOCK",
  },
  // Cancel transitions
  {
    from: [BoxStatus.DRAFT],
    to: BoxStatus.CANCELLED,
    allowedRoles: ["STAFF", "ACCOUNTING", "ADMIN", "OWNER"],
    action: "CANCEL",
    notificationType: NotificationType.BOX_CANCELLED,
    notificationTitle: "ยกเลิกกล่องเอกสาร",
  },
  {
    from: [BoxStatus.SUBMITTED, BoxStatus.IN_REVIEW, BoxStatus.NEED_MORE_DOCS],
    to: BoxStatus.CANCELLED,
    allowedRoles: ["ACCOUNTING", "ADMIN", "OWNER"],
    action: "CANCEL",
    notificationType: NotificationType.BOX_CANCELLED,
    notificationTitle: "ยกเลิกกล่องเอกสาร",
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
  const statusLabels: Record<BoxStatus, string> = {
    DRAFT: "แบบร่าง",
    SUBMITTED: "ส่งตรวจ",
    IN_REVIEW: "เริ่มตรวจ",
    NEED_MORE_DOCS: "ขอเอกสารเพิ่ม",
    READY_TO_BOOK: "พร้อมลงบัญชี",
    WHT_PENDING: "รอ WHT",
    BOOKED: "ลงบัญชี",
    ARCHIVED: "เก็บเข้าคลัง",
    LOCKED: "ล็อค",
    CANCELLED: "ยกเลิก",
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

  // Check valid transition
  const transition = findTransition(
    box.status,
    BoxStatus.SUBMITTED,
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
        status: BoxStatus.SUBMITTED,
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
    `${box.boxNumber} ${box.status === BoxStatus.NEED_MORE_DOCS ? "ถูกส่งใหม่" : "ถูกส่งเข้ามาใหม่"}`,
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

  // Build update data based on new status
  const updateData: Record<string, unknown> = { status: newStatus };
  
  switch (newStatus) {
    case BoxStatus.SUBMITTED:
      updateData.submittedAt = new Date();
      break;
    case BoxStatus.IN_REVIEW:
      updateData.reviewedAt = new Date();
      break;
    case BoxStatus.BOOKED:
      updateData.bookedAt = new Date();
      break;
    case BoxStatus.ARCHIVED:
      updateData.archivedAt = new Date();
      break;
    case BoxStatus.LOCKED:
      updateData.lockedAt = new Date();
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

// ==================== Review Box (Legacy wrapper) ====================

export async function reviewBox(
  boxId: string,
  action: "approve" | "reject" | "need_info" | "ready" | "wht_pending" | "book",
  comment?: string
): Promise<ApiResponse> {
  const actionToStatus: Record<string, BoxStatus> = {
    approve: BoxStatus.READY_TO_BOOK,
    reject: BoxStatus.CANCELLED,
    need_info: BoxStatus.NEED_MORE_DOCS,
    ready: BoxStatus.READY_TO_BOOK,
    wht_pending: BoxStatus.WHT_PENDING,
    book: BoxStatus.BOOKED,
  };

  const newStatus = actionToStatus[action];
  if (!newStatus) {
    return {
      success: false,
      error: "Invalid action",
    };
  }

  // First, if current status is SUBMITTED, move to IN_REVIEW
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

  // Auto-transition to IN_REVIEW if needed
  if (box.status === BoxStatus.SUBMITTED && newStatus !== BoxStatus.SUBMITTED) {
    await prisma.box.update({
      where: { id: boxId },
      data: { 
        status: BoxStatus.IN_REVIEW,
        reviewedAt: new Date(),
      },
    });
  }

  return changeBoxStatus(boxId, newStatus, comment);
}

// ==================== Quick Actions ====================

export async function startReview(boxId: string): Promise<ApiResponse> {
  return changeBoxStatus(boxId, BoxStatus.IN_REVIEW);
}

export async function requestMoreDocs(boxId: string, comment?: string): Promise<ApiResponse> {
  return changeBoxStatus(boxId, BoxStatus.NEED_MORE_DOCS, comment);
}

export async function markReadyToBook(boxId: string): Promise<ApiResponse> {
  return changeBoxStatus(boxId, BoxStatus.READY_TO_BOOK);
}

export async function markWhtPending(boxId: string): Promise<ApiResponse> {
  return changeBoxStatus(boxId, BoxStatus.WHT_PENDING);
}

export async function bookBox(boxId: string): Promise<ApiResponse> {
  return changeBoxStatus(boxId, BoxStatus.BOOKED);
}

export async function archiveBox(boxId: string): Promise<ApiResponse> {
  return changeBoxStatus(boxId, BoxStatus.ARCHIVED);
}

export async function lockBox(boxId: string): Promise<ApiResponse> {
  return changeBoxStatus(boxId, BoxStatus.LOCKED);
}

export async function cancelBox(boxId: string, reason?: string): Promise<ApiResponse> {
  return changeBoxStatus(boxId, BoxStatus.CANCELLED, reason);
}

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
