import { FirmRole } from ".prisma/client";
import type { SessionUser } from "@/types";

/**
 * Firm Role Permissions
 * 
 * OWNER: Full access to everything
 * ADMIN: Can manage clients and team
 * ACCOUNTANT: Can work on assigned clients
 * STAFF: Limited access
 */

export type FirmPermission = 
  | "firm:settings:read"
  | "firm:settings:write"
  | "firm:members:read"
  | "firm:members:write"
  | "firm:clients:read"
  | "firm:clients:write"
  | "firm:clients:assign"
  | "firm:dashboard:full"
  | "firm:reports:read";

const ROLE_PERMISSIONS: Record<FirmRole, FirmPermission[]> = {
  OWNER: [
    "firm:settings:read",
    "firm:settings:write",
    "firm:members:read",
    "firm:members:write",
    "firm:clients:read",
    "firm:clients:write",
    "firm:clients:assign",
    "firm:dashboard:full",
    "firm:reports:read",
  ],
  ADMIN: [
    "firm:settings:read",
    "firm:members:read",
    "firm:members:write",
    "firm:clients:read",
    "firm:clients:write",
    "firm:clients:assign",
    "firm:dashboard:full",
    "firm:reports:read",
  ],
  ACCOUNTANT: [
    "firm:clients:read",
    "firm:clients:write",
    "firm:reports:read",
  ],
  STAFF: [
    "firm:clients:read",
  ],
};

/**
 * Check if user has a specific permission
 */
export function hasFirmPermission(
  session: SessionUser | null,
  permission: FirmPermission
): boolean {
  if (!session?.firmMembership) return false;
  
  const role = session.firmMembership.role as FirmRole;
  const permissions = ROLE_PERMISSIONS[role] || [];
  
  return permissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyFirmPermission(
  session: SessionUser | null,
  permissions: FirmPermission[]
): boolean {
  return permissions.some(p => hasFirmPermission(session, p));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllFirmPermissions(
  session: SessionUser | null,
  permissions: FirmPermission[]
): boolean {
  return permissions.every(p => hasFirmPermission(session, p));
}

/**
 * Check if user is a firm owner
 */
export function isFirmOwner(session: SessionUser | null): boolean {
  return session?.firmMembership?.role === "OWNER";
}

/**
 * Check if user is a firm admin or above
 */
export function isFirmManager(session: SessionUser | null): boolean {
  const role = session?.firmMembership?.role;
  return role === "OWNER" || role === "ADMIN";
}

/**
 * Check if user can manage firm settings
 */
export function canManageFirmSettings(session: SessionUser | null): boolean {
  return hasFirmPermission(session, "firm:settings:write");
}

/**
 * Check if user can manage firm members
 */
export function canManageFirmMembers(session: SessionUser | null): boolean {
  return hasFirmPermission(session, "firm:members:write");
}

/**
 * Check if user can assign clients
 */
export function canAssignClients(session: SessionUser | null): boolean {
  return hasFirmPermission(session, "firm:clients:assign");
}

/**
 * Get role display name in Thai
 */
export function getFirmRoleDisplayName(role: FirmRole): string {
  const names: Record<FirmRole, string> = {
    OWNER: "เจ้าของสำนักบัญชี",
    ADMIN: "ผู้ดูแล",
    ACCOUNTANT: "นักบัญชี",
    STAFF: "พนักงาน",
  };
  return names[role] || role;
}

/**
 * Get role badge color
 */
export function getFirmRoleBadgeColor(role: FirmRole): string {
  const colors: Record<FirmRole, string> = {
    OWNER: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    ADMIN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    ACCOUNTANT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    STAFF: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };
  return colors[role] || "bg-gray-100 text-gray-700";
}
