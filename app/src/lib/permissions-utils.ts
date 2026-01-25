/**
 * Permission utility functions (non-async)
 * These are pure functions that don't need "use server"
 */

import type { BoxStatus } from "@prisma/client";

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
