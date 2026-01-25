/**
 * Status Configuration
 * Box, Document, Payment, VAT, WHT, Task statuses
 */

import {
  FileText,
  FileCheck,
  FileQuestion,
  File,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Archive,
  Lock,
  Send,
  Eye,
  BookOpen,
  Hourglass,
  Repeat,
  FileWarning,
  type LucideIcon,
} from "lucide-react";
import type { 
  BoxStatus, 
  DocStatus, 
  PaymentStatus,
  VatDocStatus,
  WhtDocStatus,
  TaskStatus,
  TaskType,
  PaymentMode,
  ReimbursementStatus,
  MemberRole,
} from "@/types";

export interface StatusConfig {
  label: string;
  labelShort: string;
  description: string;
  icon: LucideIcon;
  className: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

// Simplified to 4 statuses
export const BOX_STATUS_CONFIG: Record<BoxStatus, StatusConfig> = {
  DRAFT: {
    label: "แบบร่าง",
    labelShort: "ร่าง",
    description: "กำลังสร้าง/แก้ไข",
    icon: FileText,
    className: "bg-slate-100 text-slate-700 border-slate-200",
    bgClass: "bg-slate-100",
    textClass: "text-slate-700",
    borderClass: "border-slate-200",
  },
  PENDING: {
    label: "รอตรวจ",
    labelShort: "รอตรวจ",
    description: "ส่งบัญชีแล้ว รอตรวจสอบ",
    icon: Clock,
    className: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    bgClass: "bg-blue-100 dark:bg-blue-900",
    textClass: "text-blue-700",
    borderClass: "border-blue-200",
  },
  NEED_DOCS: {
    label: "ขาดเอกสาร",
    labelShort: "ขาดเอกสาร",
    description: "บัญชีขอเอกสารเพิ่ม",
    icon: FileQuestion,
    className: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    bgClass: "bg-amber-100 dark:bg-amber-900",
    textClass: "text-amber-700",
    borderClass: "border-amber-200",
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    labelShort: "เสร็จ",
    description: "ลงบัญชีเรียบร้อย",
    icon: CheckCircle,
    className: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    bgClass: "bg-emerald-100 dark:bg-emerald-900",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-200",
  },
};

export const DOC_STATUS_CONFIG: Record<DocStatus, StatusConfig> = {
  INCOMPLETE: {
    label: "เอกสารไม่ครบ",
    labelShort: "ไม่ครบ",
    description: "ยังขาดเอกสาร",
    icon: AlertTriangle,
    className: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    bgClass: "bg-amber-100 dark:bg-amber-900",
    textClass: "text-amber-700",
    borderClass: "border-amber-200",
  },
  COMPLETE: {
    label: "เอกสารครบ",
    labelShort: "ครบ",
    description: "เอกสารครบถ้วน",
    icon: CheckCircle,
    className: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    bgClass: "bg-emerald-100 dark:bg-emerald-900",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-200",
  },
  NA: {
    label: "ไม่ต้องมีเอกสาร",
    labelShort: "N/A",
    description: "ไม่ต้องมีเอกสาร",
    icon: File,
    className: "bg-slate-100 text-slate-700 border-slate-200",
    bgClass: "bg-slate-100",
    textClass: "text-slate-700",
    borderClass: "border-slate-200",
  },
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, StatusConfig> = {
  UNPAID: {
    label: "ยังไม่จ่าย",
    labelShort: "ยังไม่จ่าย",
    description: "ยังไม่ได้ชำระเงิน",
    icon: Clock,
    className: "bg-slate-100 text-slate-700 border-slate-200",
    bgClass: "bg-slate-100",
    textClass: "text-slate-700",
    borderClass: "border-slate-200",
  },
  PARTIAL: {
    label: "จ่ายบางส่วน",
    labelShort: "บางส่วน",
    description: "ชำระเงินบางส่วน",
    icon: Clock,
    className: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    bgClass: "bg-amber-100 dark:bg-amber-900",
    textClass: "text-amber-700",
    borderClass: "border-amber-200",
  },
  PAID: {
    label: "จ่ายครบ",
    labelShort: "จ่ายครบ",
    description: "ชำระเงินครบแล้ว",
    icon: CheckCircle,
    className: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    bgClass: "bg-emerald-100 dark:bg-emerald-900",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-200",
  },
  OVERPAID: {
    label: "จ่ายเกิน",
    labelShort: "เกิน",
    description: "ชำระเงินเกินยอด",
    icon: AlertTriangle,
    className: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    bgClass: "bg-orange-100 dark:bg-orange-900",
    textClass: "text-orange-700",
    borderClass: "border-orange-200",
  },
  REFUNDED: {
    label: "ได้คืนแล้ว",
    labelShort: "คืนแล้ว",
    description: "ได้รับเงินคืนแล้ว",
    icon: Repeat,
    className: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    bgClass: "bg-purple-100 dark:bg-purple-900",
    textClass: "text-purple-700",
    borderClass: "border-purple-200",
  },
};

// ==================== VAT/WHT Document Status ====================

export const VAT_DOC_STATUS_CONFIG: Record<VatDocStatus, StatusConfig> = {
  MISSING: {
    label: "ยังไม่ได้รับ",
    labelShort: "ไม่มี",
    description: "ยังไม่ได้รับใบกำกับภาษี",
    icon: FileQuestion,
    className: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    bgClass: "bg-amber-100 dark:bg-amber-900",
    textClass: "text-amber-700",
    borderClass: "border-amber-200",
  },
  RECEIVED: {
    label: "ได้รับแล้ว",
    labelShort: "ได้รับ",
    description: "ได้รับใบกำกับภาษีแล้ว",
    icon: FileCheck,
    className: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    bgClass: "bg-blue-100 dark:bg-blue-900",
    textClass: "text-blue-700",
    borderClass: "border-blue-200",
  },
  VERIFIED: {
    label: "ตรวจสอบแล้ว",
    labelShort: "ตรวจแล้ว",
    description: "ตรวจสอบใบกำกับภาษีแล้ว",
    icon: CheckCircle,
    className: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    bgClass: "bg-emerald-100 dark:bg-emerald-900",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-200",
  },
  NA: {
    label: "ไม่ต้องมี",
    labelShort: "N/A",
    description: "ไม่ต้องมีใบกำกับภาษี",
    icon: File,
    className: "bg-slate-100 text-slate-700 border-slate-200",
    bgClass: "bg-slate-100",
    textClass: "text-slate-700",
    borderClass: "border-slate-200",
  },
};

export const WHT_DOC_STATUS_CONFIG: Record<WhtDocStatus, StatusConfig> = {
  MISSING: {
    label: "ยังไม่ได้รับ",
    labelShort: "ไม่มี",
    description: "ยังไม่ได้รับ WHT",
    icon: FileQuestion,
    className: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    bgClass: "bg-amber-100 dark:bg-amber-900",
    textClass: "text-amber-700",
    borderClass: "border-amber-200",
  },
  REQUEST_SENT: {
    label: "ส่งคำขอแล้ว",
    labelShort: "ส่งคำขอ",
    description: "ส่งคำขอ WHT แล้ว",
    icon: Send,
    className: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    bgClass: "bg-blue-100 dark:bg-blue-900",
    textClass: "text-blue-700",
    borderClass: "border-blue-200",
  },
  RECEIVED: {
    label: "ได้รับแล้ว",
    labelShort: "ได้รับ",
    description: "ได้รับ WHT แล้ว",
    icon: FileCheck,
    className: "bg-teal-100 text-teal-700 border-teal-200",
    bgClass: "bg-teal-100",
    textClass: "text-teal-700",
    borderClass: "border-teal-200",
  },
  VERIFIED: {
    label: "ตรวจสอบแล้ว",
    labelShort: "ตรวจแล้ว",
    description: "ตรวจสอบ WHT แล้ว",
    icon: CheckCircle,
    className: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    bgClass: "bg-emerald-100 dark:bg-emerald-900",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-200",
  },
  NA: {
    label: "ไม่ต้องมี",
    labelShort: "N/A",
    description: "ไม่ต้องมี WHT",
    icon: File,
    className: "bg-slate-100 text-slate-700 border-slate-200",
    bgClass: "bg-slate-100",
    textClass: "text-slate-700",
    borderClass: "border-slate-200",
  },
};

// ==================== Task Status/Type Config ====================

export const TASK_STATUS_CONFIG: Record<TaskStatus, StatusConfig> = {
  OPEN: {
    label: "เปิด",
    labelShort: "เปิด",
    description: "งานยังไม่เริ่ม",
    icon: Clock,
    className: "bg-slate-100 text-slate-700 border-slate-200",
    bgClass: "bg-slate-100",
    textClass: "text-slate-700",
    borderClass: "border-slate-200",
  },
  IN_PROGRESS: {
    label: "กำลังดำเนินการ",
    labelShort: "กำลังทำ",
    description: "กำลังดำเนินการ",
    icon: Clock,
    className: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    bgClass: "bg-blue-100 dark:bg-blue-900",
    textClass: "text-blue-700",
    borderClass: "border-blue-200",
  },
  DONE: {
    label: "เสร็จสิ้น",
    labelShort: "เสร็จ",
    description: "ดำเนินการเสร็จแล้ว",
    icon: CheckCircle,
    className: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    bgClass: "bg-emerald-100 dark:bg-emerald-900",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-200",
  },
  CANCELLED: {
    label: "ยกเลิก",
    labelShort: "ยกเลิก",
    description: "ยกเลิกงาน",
    icon: XCircle,
    className: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
    bgClass: "bg-red-100 dark:bg-red-900",
    textClass: "text-red-700",
    borderClass: "border-red-200",
  },
};

export interface TaskTypeConfig {
  label: string;
  description: string;
  icon: LucideIcon;
  className: string;
}

export const TASK_TYPE_CONFIG: Record<TaskType, TaskTypeConfig> = {
  VAT_INVOICE: {
    label: "ขอใบกำกับภาษี",
    description: "ขอ/รับ/verify ใบกำกับภาษี",
    icon: FileCheck,
    className: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300",
  },
  WHT_CERTIFICATE: {
    label: "ขอหนังสือ WHT",
    description: "ขอ/รับ/verify หนังสือรับรองหัก ณ ที่จ่าย",
    icon: FileWarning,
    className: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
  },
  GENERAL_DOC: {
    label: "ขอเอกสารทั่วไป",
    description: "ขอใบเสร็จ/เอกสารอื่น",
    icon: FileQuestion,
    className: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
  },
  FOLLOW_UP: {
    label: "ติดตามทั่วไป",
    description: "ติดตามงานทั่วไป",
    icon: Clock,
    className: "bg-slate-100 text-slate-700",
  },
};

// ==================== Payment Mode / Reimbursement ====================

export const PAYMENT_MODE_CONFIG: Record<PaymentMode, { label: string; description: string }> = {
  COMPANY_PAID: {
    label: "บริษัทจ่าย",
    description: "บริษัทจ่ายเงินโดยตรง",
  },
  EMPLOYEE_ADVANCE: {
    label: "พนักงานสำรองจ่าย",
    description: "พนักงานสำรองจ่ายก่อน",
  },
};

export const REIMBURSEMENT_STATUS_CONFIG: Record<ReimbursementStatus, StatusConfig> = {
  NONE: {
    label: "ไม่ต้องคืน",
    labelShort: "ไม่คืน",
    description: "ไม่ต้องคืนเงิน",
    icon: File,
    className: "bg-slate-100 text-slate-700 border-slate-200",
    bgClass: "bg-slate-100",
    textClass: "text-slate-700",
    borderClass: "border-slate-200",
  },
  PENDING: {
    label: "รอคืนเงิน",
    labelShort: "รอคืน",
    description: "รอคืนเงินให้พนักงาน",
    icon: Clock,
    className: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    bgClass: "bg-amber-100 dark:bg-amber-900",
    textClass: "text-amber-700",
    borderClass: "border-amber-200",
  },
  REIMBURSED: {
    label: "คืนเงินแล้ว",
    labelShort: "คืนแล้ว",
    description: "คืนเงินให้พนักงานแล้ว",
    icon: CheckCircle,
    className: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    bgClass: "bg-emerald-100 dark:bg-emerald-900",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-200",
  },
};

// ==================== Helper Functions ====================

/**
 * Get configuration for a BoxStatus
 * Uses simplified 4-status system: DRAFT, PENDING, NEED_DOCS, COMPLETED
 */
export function getBoxStatusConfig(status: BoxStatus): StatusConfig {
  return BOX_STATUS_CONFIG[status] || BOX_STATUS_CONFIG.DRAFT;
}

/**
 * Get Thai label for a BoxStatus
 */
export function getBoxStatusLabel(status: BoxStatus): string {
  return BOX_STATUS_CONFIG[status]?.label || "ไม่ทราบ";
}

export function getDocStatusConfig(status: DocStatus): StatusConfig {
  return DOC_STATUS_CONFIG[status];
}

export function getPaymentStatusConfig(status: PaymentStatus): StatusConfig {
  return PAYMENT_STATUS_CONFIG[status];
}

export function getVatDocStatusConfig(status: VatDocStatus): StatusConfig {
  return VAT_DOC_STATUS_CONFIG[status];
}

export function getWhtDocStatusConfig(status: WhtDocStatus): StatusConfig {
  return WHT_DOC_STATUS_CONFIG[status];
}

export function getTaskStatusConfig(status: TaskStatus): StatusConfig {
  return TASK_STATUS_CONFIG[status];
}

export function getTaskTypeConfig(type: TaskType): TaskTypeConfig {
  return TASK_TYPE_CONFIG[type];
}

// ==================== Role/Permission Helpers ====================

export function isAccountingRole(role: string): boolean {
  return ["ACCOUNTING", "ADMIN", "OWNER"].includes(role);
}

export function isAdminRole(role: string): boolean {
  return ["ADMIN", "OWNER"].includes(role);
}

// Statuses that allow editing (simplified)
export const EDITABLE_STATUSES: BoxStatus[] = [
  "DRAFT",
  "PENDING",
  "NEED_DOCS",
];

// Statuses that can be reviewed by accounting
export const REVIEWABLE_STATUSES: BoxStatus[] = [
  "PENDING",
];

// Final status (no further changes)
export const FINAL_STATUSES: BoxStatus[] = [
  "COMPLETED",
];

export function canEditBox(status: BoxStatus): boolean {
  return EDITABLE_STATUSES.includes(status);
}

export function canReviewBox(status: BoxStatus): boolean {
  return REVIEWABLE_STATUSES.includes(status);
}

export function isFinalStatus(status: BoxStatus): boolean {
  return FINAL_STATUSES.includes(status);
}

// ==================== Status Transition Helpers ====================

// Simplified status transitions (4 statuses)
export function getNextStatuses(currentStatus: BoxStatus, role: MemberRole): BoxStatus[] {
  const transitions: Record<BoxStatus, { to: BoxStatus; roles: MemberRole[] }[]> = {
    DRAFT: [
      { to: "PENDING", roles: ["STAFF", "ACCOUNTING", "ADMIN", "OWNER"] },
    ],
    PENDING: [
      { to: "COMPLETED", roles: ["ACCOUNTING", "ADMIN", "OWNER"] },
      { to: "NEED_DOCS", roles: ["ACCOUNTING", "ADMIN", "OWNER"] },
    ],
    NEED_DOCS: [
      { to: "PENDING", roles: ["STAFF", "ACCOUNTING", "ADMIN", "OWNER"] },
    ],
    COMPLETED: [],
  };

  const possibleTransitions = transitions[currentStatus] || [];
  return possibleTransitions
    .filter((t) => t.roles.includes(role))
    .map((t) => t.to);
}

// ==================== Aging Bucket Helpers ====================

export function getAgingBucket(createdAt: Date): "0-3" | "4-7" | "8-14" | "15+" {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 3) return "0-3";
  if (diffDays <= 7) return "4-7";
  if (diffDays <= 14) return "8-14";
  return "15+";
}

export const AGING_BUCKET_CONFIG = {
  "0-3": { label: "0-3 วัน", className: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300" },
  "4-7": { label: "4-7 วัน", className: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300" },
  "8-14": { label: "8-14 วัน", className: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300" },
  "15+": { label: "15+ วัน", className: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300" },
};
