/**
 * Accounting Firm Actions (Section 22 - Multi-tenant & Accounting Firm Mode)
 * 
 * Features:
 * - Multi-company overview
 * - SLA/KPI per client
 * - WHT outstanding per client
 * - Client health score
 */

// Re-export all firm-related functions
export { createAccountingFirm, createFirm } from "./create";
export type { CreateFirmInput } from "./create";

export { getFirmDashboard } from "./dashboard";
export type { FirmDashboardStats, ClientOverview } from "./dashboard";

export { addClientToFirm, removeClientFromFirm, getUserFirmMembership } from "./management";

export { getFirmSettings, updateFirmInfo, updateFirmBranding } from "./settings";
export type { FirmSettings, FirmBranding } from "./settings";
