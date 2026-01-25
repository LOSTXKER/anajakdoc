/**
 * Permission helpers for role-based access control
 */

import type { OrganizationRole } from "@/types";

// ==================== Box Permissions ====================

export function canEditBox(role: OrganizationRole): boolean {
  return ["ACCOUNTING", "ADMIN", "OWNER"].includes(role);
}

export function canApproveBox(role: OrganizationRole): boolean {
  return ["ADMIN", "OWNER"].includes(role);
}

export function canDeleteBox(role: OrganizationRole): boolean {
  return ["ADMIN", "OWNER"].includes(role);
}

export function canExportBoxes(role: OrganizationRole): boolean {
  return ["ACCOUNTING", "ADMIN", "OWNER"].includes(role);
}

// ==================== Member Management ====================

export function canManageMembers(role: OrganizationRole): boolean {
  return ["ADMIN", "OWNER"].includes(role);
}

export function canInviteMembers(role: OrganizationRole): boolean {
  return ["ADMIN", "OWNER"].includes(role);
}

export function canRemoveMembers(role: OrganizationRole): boolean {
  return ["ADMIN", "OWNER"].includes(role);
}

// ==================== Organization Settings ====================

export function canManageSettings(role: OrganizationRole): boolean {
  return ["ADMIN", "OWNER"].includes(role);
}

export function canManageFirm(role: OrganizationRole): boolean {
  return ["ADMIN", "OWNER"].includes(role);
}

export function canManageCategories(role: OrganizationRole): boolean {
  return ["ACCOUNTING", "ADMIN", "OWNER"].includes(role);
}

export function canManageContacts(role: OrganizationRole): boolean {
  return ["ACCOUNTING", "ADMIN", "OWNER"].includes(role);
}

// ==================== Fiscal Period ====================

export function canManageFiscalPeriods(role: OrganizationRole): boolean {
  return ["ADMIN", "OWNER"].includes(role);
}

export function canCloseFiscalPeriod(role: OrganizationRole): boolean {
  return ["ADMIN", "OWNER"].includes(role);
}

// ==================== Reports & Analytics ====================

export function canViewReports(role: OrganizationRole): boolean {
  return ["ACCOUNTING", "ADMIN", "OWNER"].includes(role);
}

export function canViewAnalytics(role: OrganizationRole): boolean {
  return ["ACCOUNTING", "ADMIN", "OWNER"].includes(role);
}

// ==================== Firm-specific Permissions ====================

export function isFirmOwner(firmRole: string): boolean {
  return firmRole === "OWNER";
}

export function isFirmManager(firmRole: string): boolean {
  return ["OWNER", "MANAGER"].includes(firmRole);
}

export function canManageFirmClients(firmRole: string): boolean {
  return ["OWNER", "MANAGER"].includes(firmRole);
}

export function canManageFirmTeam(firmRole: string): boolean {
  return firmRole === "OWNER";
}

// ==================== Helper: Check multiple permissions ====================

export function hasAnyPermission(
  role: OrganizationRole,
  permissions: ((role: OrganizationRole) => boolean)[]
): boolean {
  return permissions.some((permission) => permission(role));
}

export function hasAllPermissions(
  role: OrganizationRole,
  permissions: ((role: OrganizationRole) => boolean)[]
): boolean {
  return permissions.every((permission) => permission(role));
}
