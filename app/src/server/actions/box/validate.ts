"use server";

import type { Box } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { SessionUser } from "@/types";
import { ERROR_MESSAGES } from "@/lib/error-messages";

export type ValidateBoxResult =
  | { success: true; box: Box }
  | { success: false; error: string };

/**
 * Validate that a box exists and the user has access to it
 */
export async function validateBoxAccess(
  boxId: string,
  session: SessionUser,
  options?: {
    requireEditable?: boolean;
    requireStatus?: string[];
  }
): Promise<ValidateBoxResult> {
  if (!session.currentOrganization) {
    return {
      success: false,
      error: ERROR_MESSAGES.NO_ORGANIZATION,
    };
  }

  // Check if box exists and belongs to user's organization
  const box = await prisma.box.findFirst({
    where: {
      id: boxId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!box) {
    return {
      success: false,
      error: ERROR_MESSAGES.BOX_NOT_FOUND,
    };
  }

  // Check if box is in editable status
  if (options?.requireEditable) {
    const editableStatuses = ["DRAFT", "PREPARING", "NEED_DOCS"];
    if (!editableStatuses.includes(box.status)) {
      return {
        success: false,
        error: "กล่องนี้ไม่สามารถแก้ไขได้ในสถานะปัจจุบัน",
      };
    }
  }

  // Check if box is in required status
  if (options?.requireStatus && !options.requireStatus.includes(box.status)) {
    return {
      success: false,
      error: `กล่องต้องอยู่ในสถานะ ${options.requireStatus.join(", ")}`,
    };
  }

  // Check if fiscal period is closed (except for admin/owner)
  if (box.fiscalPeriodId) {
    const period = await prisma.fiscalPeriod.findUnique({
      where: { id: box.fiscalPeriodId },
      select: { status: true },
    });

    if (period?.status === "CLOSED") {
      const role = session.currentOrganization.role;
      if (!["ADMIN", "OWNER"].includes(role)) {
        return {
          success: false,
          error: ERROR_MESSAGES.FISCAL_PERIOD_CLOSED,
        };
      }
    }
  }

  return { success: true, box };
}

/**
 * Validate that user has permission to edit a box
 */
export function canEditBox(role: string, boxStatus: string): boolean {
  // Admins and owners can edit any box
  if (["ADMIN", "OWNER"].includes(role)) {
    return true;
  }

  // Accountants can edit boxes in certain statuses
  if (role === "ACCOUNTING") {
    return ["DRAFT", "PREPARING", "NEED_DOCS"].includes(boxStatus);
  }

  // Staff can only edit drafts
  if (role === "STAFF") {
    return boxStatus === "DRAFT";
  }

  return false;
}

/**
 * Validate that user can approve/complete a box
 */
export function canApproveBox(role: string): boolean {
  return ["ADMIN", "OWNER", "ACCOUNTING"].includes(role);
}

/**
 * Check if fiscal period is locked
 * Returns error response if locked, null if OK
 */
export async function checkFiscalPeriodLock(
  box: Box,
  session: SessionUser
): Promise<{ success: false; error: string } | null> {
  if (!box.fiscalPeriodId) return null;
  
  if (!session.currentOrganization) {
    return { success: false, error: "ไม่พบข้อมูล Organization" };
  }
  
  const period = await prisma.fiscalPeriod.findUnique({
    where: { id: box.fiscalPeriodId },
    select: { status: true },
  });
  
  if (period?.status === "CLOSED" && 
      !["ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    return { success: false, error: "งวดบัญชีปิดแล้ว ไม่สามารถแก้ไขได้" };
  }
  return null;
}

/**
 * Check if box is in editable status
 * Returns error response if not editable, null if OK
 */
export function checkEditableStatus(
  box: Box,
  session: SessionUser
): { success: false; error: string } | null {
  if (!session.currentOrganization) {
    return { success: false, error: "ไม่พบข้อมูล Organization" };
  }

  const editableStatuses = ["DRAFT", "PREPARING", "NEED_DOCS"];
  if (!editableStatuses.includes(box.status)) {
    return { success: false, error: "ไม่สามารถแก้ไขกล่องในสถานะนี้" };
  }
  return null;
}
