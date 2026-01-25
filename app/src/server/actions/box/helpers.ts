"use server";

import type { Box, BoxStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { SessionUser, ApiResponse } from "@/types";

/**
 * Get box with organization access check
 * Replaces the common pattern found 40+ times across actions
 */
export async function getBoxWithAccess(
  boxId: string,
  session: SessionUser
): Promise<ApiResponse<Box>> {
  if (!session.currentOrganization) {
    return {
      success: false,
      error: "ไม่พบข้อมูล Organization",
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

  return { success: true, data: box };
}

/**
 * Check if user has accounting-level permissions
 * Replaces pattern found 22+ times
 */
export function hasAccountingPermission(role: string): boolean {
  return ["ACCOUNTING", "ADMIN", "OWNER"].includes(role);
}

/**
 * Check if user has admin-level permissions
 */
export function hasAdminPermission(role: string): boolean {
  return ["ADMIN", "OWNER"].includes(role);
}

/**
 * Check if box is in editable status for the given role
 * Replaces pattern found 15+ times
 */
export function isBoxEditable(status: BoxStatus, role: string): boolean {
  const editableStatuses: BoxStatus[] = ["DRAFT", "NEED_DOCS", "PENDING"];
  
  // Admins and owners can edit any box
  if (hasAdminPermission(role)) {
    return true;
  }
  
  // Accountants can edit boxes in certain statuses
  if (role === "ACCOUNTING") {
    return editableStatuses.includes(status);
  }
  
  // Staff can only edit drafts
  if (role === "STAFF") {
    return status === "DRAFT";
  }
  
  return false;
}

/**
 * Check if fiscal period is locked for non-admin users
 * Replaces pattern found 10+ times
 */
export async function checkFiscalPeriodAccess(
  box: Box,
  role: string
): Promise<{ success: false; error: string } | null> {
  if (!box.fiscalPeriodId) {
    return null;
  }

  const period = await prisma.fiscalPeriod.findUnique({
    where: { id: box.fiscalPeriodId },
    select: { status: true },
  });

  if (period?.status === "CLOSED" && !hasAdminPermission(role)) {
    return {
      success: false,
      error: "งวดบัญชีปิดแล้ว ไม่สามารถแก้ไขได้",
    };
  }

  return null;
}

/**
 * Standard error response for box not found
 */
export function boxNotFoundError(): ApiResponse<never> {
  return {
    success: false,
    error: "ไม่พบกล่องเอกสาร",
  };
}

/**
 * Standard error response for permission denied
 */
export function permissionDeniedError(message?: string): ApiResponse<never> {
  return {
    success: false,
    error: message || "คุณไม่มีสิทธิ์ดำเนินการนี้",
  };
}

/**
 * Standard error response for fiscal period locked
 */
export function fiscalPeriodLockedError(): ApiResponse<never> {
  return {
    success: false,
    error: "งวดบัญชีปิดแล้ว ไม่สามารถแก้ไขได้",
  };
}

/**
 * Standard error response for non-editable status
 */
export function nonEditableStatusError(): ApiResponse<never> {
  return {
    success: false,
    error: "กล่องนี้ไม่สามารถแก้ไขได้ในสถานะปัจจุบัน",
  };
}
