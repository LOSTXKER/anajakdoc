"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/types";
import { BoxStatus } from "@prisma/client";
import {
  isValidTransition,
  requiresReason,
  getStatusLabel,
} from "@/lib/config/status-transitions";

interface UpdateStatusInput {
  boxId: string;
  newStatus: BoxStatus;
  reason?: string;
}

/**
 * Update box status with validation
 * - Validates transition is allowed
 * - Requires reason for revert transitions
 * - Logs to activity log
 */
export async function updateBoxStatus(
  input: UpdateStatusInput
): Promise<ApiResponse> {
  const { boxId, newStatus, reason } = input;
  const session = await requireOrganization();

  // Find box
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

  // Check if box is completed (can only be reverted by admin/owner)
  if (box.status === BoxStatus.COMPLETED) {
    if (!["ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
      return {
        success: false,
        error: "กล่องนี้เสร็จสิ้นแล้ว ต้องเป็น Admin/Owner เพื่อแก้ไข",
      };
    }
  }

  // Check if fiscal period is closed (except for admin/owner)
  if (box.fiscalPeriod?.status === "CLOSED") {
    if (!["ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
      return {
        success: false,
        error: "งวดบัญชีปิดแล้ว ไม่สามารถเปลี่ยนสถานะได้",
      };
    }
  }

  // Validate transition
  if (!isValidTransition(box.status, newStatus)) {
    return {
      success: false,
      error: `ไม่สามารถเปลี่ยนจาก "${getStatusLabel(box.status)}" เป็น "${getStatusLabel(newStatus)}" ได้`,
    };
  }

  // Check if reason is required (for revert transitions)
  if (requiresReason(box.status, newStatus) && !reason?.trim()) {
    return {
      success: false,
      error: "กรุณาระบุเหตุผลในการย้อนกลับสถานะ",
    };
  }

  // Prepare update data
  const updateData: Record<string, unknown> = {
    status: newStatus,
  };

  // Set timestamps based on new status (using new 4-status system)
  const now = new Date();
  if (newStatus === BoxStatus.SUBMITTED && !box.submittedAt) {
    updateData.submittedAt = now;
  }
  if (newStatus === BoxStatus.COMPLETED && !box.bookedAt) {
    updateData.bookedAt = now;
  }

  // Clear timestamps if reverting
  if (newStatus === BoxStatus.DRAFT) {
    updateData.submittedAt = null;
    updateData.bookedAt = null;
  }
  
  // If reverting from COMPLETED to PENDING/NEED_DOCS
  if (newStatus === BoxStatus.SUBMITTED || newStatus === BoxStatus.NEED_DOCS) {
    updateData.bookedAt = null;
  }

  // Update box
  await prisma.box.update({
    where: { id: boxId },
    data: updateData,
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      boxId,
      userId: session.id,
      action: "STATUS_CHANGED",
      details: {
        from: box.status,
        to: newStatus,
        reason: reason?.trim() || undefined,
      },
    },
  });

  // Revalidate paths
  revalidatePath(`/documents/${boxId}`);
  revalidatePath("/documents");

  return {
    success: true,
    message: `เปลี่ยนสถานะเป็น "${getStatusLabel(newStatus)}" แล้ว`,
  };
}
