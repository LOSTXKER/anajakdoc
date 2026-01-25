/**
 * Revalidation helpers for cache invalidation
 */

import { revalidatePath } from "next/cache";

// ==================== Box Paths ====================

export function revalidateBoxPaths(boxId: string): void {
  revalidatePath(`/documents/${boxId}`);
  revalidatePath("/documents");
  revalidatePath("/dashboard");
}

export function revalidateAllBoxPaths(): void {
  revalidatePath("/documents");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}

// ==================== Organization Paths ====================

export function revalidateOrganizationPaths(): void {
  revalidatePath("/settings");
  revalidatePath("/settings/members");
  revalidatePath("/dashboard");
}

// ==================== Firm Paths ====================

export function revalidateFirmPaths(): void {
  revalidatePath("/firm/dashboard");
  revalidatePath("/firm/clients");
  revalidatePath("/firm/team");
}

export function revalidateFirmClientPaths(clientId?: string): void {
  revalidatePath("/firm/clients");
  if (clientId) {
    revalidatePath(`/firm/clients/${clientId}`);
  }
}

// ==================== Settings Paths ====================

export function revalidateSettingsPaths(): void {
  revalidatePath("/settings");
  revalidatePath("/settings/categories");
  revalidatePath("/settings/contacts");
  revalidatePath("/settings/fiscal-periods");
  revalidatePath("/settings/integrations");
  revalidatePath("/settings/members");
}

export function revalidateContactPaths(): void {
  revalidatePath("/settings/contacts");
  revalidatePath("/documents/new");
}

export function revalidateCategoryPaths(): void {
  revalidatePath("/settings/categories");
  revalidatePath("/documents/new");
}

// ==================== Reimbursement Paths ====================

export function revalidateReimbursementPaths(): void {
  revalidatePath("/reimbursements");
  revalidatePath("/dashboard");
}

// ==================== WHT Tracking Paths ====================

export function revalidateWhtPaths(): void {
  revalidatePath("/wht-tracking");
  revalidatePath("/documents");
}

// ==================== All Paths ====================

export function revalidateAllPaths(): void {
  revalidatePath("/", "layout");
}

// ==================== Helper: Revalidation Wrapper ====================

/**
 * Wrap a function with automatic revalidation
 * Useful for reducing boilerplate in server actions
 */
export async function withRevalidation<T>(
  paths: string[],
  fn: () => Promise<T>
): Promise<T> {
  const result = await fn();
  paths.forEach(path => revalidatePath(path));
  return result;
}

/**
 * Wrap a function with automatic revalidation for box paths
 */
export async function withBoxRevalidation<T>(
  boxId: string,
  fn: () => Promise<T>
): Promise<T> {
  const result = await fn();
  revalidateBoxPaths(boxId);
  return result;
}
