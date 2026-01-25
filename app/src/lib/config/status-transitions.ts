/**
 * Status Transitions Configuration
 * Defines valid status transitions for boxes
 */

import type { BoxStatus } from "@/types";

// ==================== Types ====================

export interface StatusTransition {
  to: BoxStatus;
  label: string;
  description?: string;
  requiresReason?: boolean;
}

export interface StatusConfig {
  label: string;
  description: string;
  advance: StatusTransition[];  // Forward transitions
  revert: StatusTransition[];   // Backward transitions (requires reason)
}

// ==================== Configuration ====================
// Simplified to 4 statuses: DRAFT → PENDING → COMPLETED
//                                    ↓ ↑
//                               NEED_DOCS

export const STATUS_TRANSITIONS: Record<BoxStatus, StatusConfig> = {
  DRAFT: {
    label: "แบบร่าง",
    description: "กำลังสร้าง/แก้ไข",
    advance: [
      { to: "PENDING", label: "ส่งบัญชี", description: "ส่งให้บัญชีตรวจสอบ" },
    ],
    revert: [],
  },
  PENDING: {
    label: "รอตรวจ",
    description: "รอบัญชีตรวจสอบ",
    advance: [
      { to: "COMPLETED", label: "เสร็จสิ้น", description: "ลงบัญชีเรียบร้อย" },
      { to: "NEED_DOCS", label: "ขาดเอกสาร", description: "ต้องการเอกสารเพิ่ม" },
    ],
    revert: [
      { to: "DRAFT", label: "ย้อนกลับ", requiresReason: true },
    ],
  },
  NEED_DOCS: {
    label: "ขาดเอกสาร",
    description: "รอเอกสารเพิ่ม",
    advance: [
      { to: "PENDING", label: "ส่งใหม่", description: "ส่งให้บัญชีตรวจอีกครั้ง" },
    ],
    revert: [],
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    description: "ลงบัญชีเรียบร้อย",
    advance: [],
    revert: [
      { to: "PENDING", label: "เปิดใหม่", requiresReason: true },
    ],
  },
};

// ==================== Helper Functions ====================

/**
 * Get status configuration
 */
export function getStatusConfig(status: BoxStatus): StatusConfig {
  return STATUS_TRANSITIONS[status];
}

/**
 * Get all valid advance transitions for a status
 */
export function getAdvanceTransitions(status: BoxStatus): StatusTransition[] {
  return STATUS_TRANSITIONS[status]?.advance || [];
}

/**
 * Get all valid revert transitions for a status
 */
export function getRevertTransitions(status: BoxStatus): StatusTransition[] {
  return STATUS_TRANSITIONS[status]?.revert || [];
}

/**
 * Check if can advance to a specific status
 */
export function canAdvanceTo(currentStatus: BoxStatus, targetStatus: BoxStatus): boolean {
  const transitions = getAdvanceTransitions(currentStatus);
  return transitions.some((t) => t.to === targetStatus);
}

/**
 * Check if can revert to a specific status
 */
export function canRevertTo(currentStatus: BoxStatus, targetStatus: BoxStatus): boolean {
  const transitions = getRevertTransitions(currentStatus);
  return transitions.some((t) => t.to === targetStatus);
}

/**
 * Check if a transition is valid (either advance or revert)
 */
export function isValidTransition(currentStatus: BoxStatus, targetStatus: BoxStatus): boolean {
  return canAdvanceTo(currentStatus, targetStatus) || canRevertTo(currentStatus, targetStatus);
}

/**
 * Check if a transition requires a reason
 */
export function requiresReason(currentStatus: BoxStatus, targetStatus: BoxStatus): boolean {
  const revertTransitions = getRevertTransitions(currentStatus);
  const transition = revertTransitions.find((t) => t.to === targetStatus);
  return transition?.requiresReason || false;
}

/**
 * Get the primary advance transition (first one)
 */
export function getPrimaryAdvance(status: BoxStatus): StatusTransition | null {
  const transitions = getAdvanceTransitions(status);
  return transitions.length > 0 ? transitions[0] : null;
}

/**
 * Get the primary revert transition (first one)
 */
export function getPrimaryRevert(status: BoxStatus): StatusTransition | null {
  const transitions = getRevertTransitions(status);
  return transitions.length > 0 ? transitions[0] : null;
}

/**
 * Get status label
 */
export function getStatusLabel(status: BoxStatus): string {
  return STATUS_TRANSITIONS[status]?.label || status;
}
