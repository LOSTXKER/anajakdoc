/**
 * Box Update Actions
 * 
 * This file re-exports from modular files for backward compatibility.
 * Each individual file has its own "use server" directive.
 * 
 * For new code, prefer importing directly from specific files:
 * 
 * import { updateBox } from "@/server/actions/box/update-box";
 * import { updateVatStatus } from "@/server/actions/box/update-vat-status";
 */

// Re-export all update functions
export { updateBox, updateBoxData } from "./update-box";
export { updateVatStatus } from "./update-vat-status";
export { updateWhtStatus } from "./update-wht-status";
export { markDuplicate } from "./update-duplicate";
export { updateReimbursementStatus } from "./update-reimbursement";
