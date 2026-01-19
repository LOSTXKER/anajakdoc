/**
 * Centralized document configuration
 * รวม document types, status, WHT, VAT, payment methods ไว้ที่เดียว
 */

import {
  Receipt,
  FileCheck,
  FileText,
  FileWarning,
  File,
  TrendingUp,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";
import type { SubDocType, DocType, DocumentStatus, TransactionType } from "@/types";

// ==================== Transaction Type Config ====================

export interface TransactionTypeConfig {
  label: string;
  icon: LucideIcon;
  colorClass: string;
  badgeClass: string;
  iconColor: string;
  bgLight: string;
  amountColor: string;
}

export const TRANSACTION_TYPE_CONFIG: Record<TransactionType, TransactionTypeConfig> = {
  EXPENSE: {
    label: "รายจ่าย",
    icon: TrendingDown,
    colorClass: "bg-rose-100 text-rose-700 border-rose-200",
    badgeClass: "bg-rose-100 text-rose-700",
    iconColor: "text-rose-500",
    bgLight: "bg-rose-50",
    amountColor: "text-rose-600",
  },
  INCOME: {
    label: "รายรับ",
    icon: TrendingUp,
    colorClass: "bg-primary/10 text-primary border-primary/20",
    badgeClass: "bg-primary/10 text-primary",
    iconColor: "text-primary",
    bgLight: "bg-primary/5",
    amountColor: "text-primary",
  },
};

/**
 * Get transaction type config
 */
export function getTransactionTypeConfig(type: TransactionType): TransactionTypeConfig {
  return TRANSACTION_TYPE_CONFIG[type];
}

/**
 * Get transaction type label
 */
export function getTransactionTypeLabel(type: TransactionType): string {
  return TRANSACTION_TYPE_CONFIG[type].label;
}

// ==================== Document Type Labels ====================

/**
 * Labels for document types (DocType enum)
 */
export const DOC_TYPE_LABELS: Record<string, string> = {
  SLIP: "สลิปโอนเงิน",
  RECEIPT: "ใบเสร็จรับเงิน",
  TAX_INVOICE: "ใบกำกับภาษี",
  INVOICE: "ใบแจ้งหนี้",
  QUOTATION: "ใบเสนอราคา",
  PURCHASE_ORDER: "ใบสั่งซื้อ",
  DELIVERY_NOTE: "ใบส่งของ",
  CONTRACT: "สัญญา/ใบสั่งซื้อ",
  WHT_CERT_SENT: "หัก ณ ที่จ่าย (ออก)",
  WHT_CERT_RECEIVED: "หัก ณ ที่จ่าย (รับ)",
  OTHER: "อื่นๆ",
};

/**
 * Get label for document type
 */
export function getDocTypeLabel(docType: string | null | undefined): string {
  if (!docType) return "-";
  return DOC_TYPE_LABELS[docType] || docType;
}

// ==================== Sub-Document Type Config ====================

export interface SubDocTypeConfig {
  label: string;
  icon: LucideIcon;
  colorClass: string;
}

export const SUB_DOC_TYPE_CONFIG: Record<SubDocType, SubDocTypeConfig> = {
  SLIP: {
    label: "สลิปโอนเงิน",
    icon: Receipt,
    colorClass: "bg-blue-100 text-blue-700",
  },
  TAX_INVOICE: {
    label: "ใบกำกับภาษี",
    icon: FileCheck,
    colorClass: "bg-green-100 text-green-700",
  },
  INVOICE: {
    label: "ใบแจ้งหนี้",
    icon: FileText,
    colorClass: "bg-purple-100 text-purple-700",
  },
  RECEIPT: {
    label: "ใบเสร็จรับเงิน",
    icon: Receipt,
    colorClass: "bg-cyan-100 text-cyan-700",
  },
  WHT_CERT_SENT: {
    label: "หัก ณ ที่จ่าย (ออก)",
    icon: FileWarning,
    colorClass: "bg-orange-100 text-orange-700",
  },
  WHT_CERT_RECEIVED: {
    label: "หัก ณ ที่จ่าย (รับ)",
    icon: FileWarning,
    colorClass: "bg-amber-100 text-amber-700",
  },
  QUOTATION: {
    label: "ใบเสนอราคา",
    icon: FileText,
    colorClass: "bg-indigo-100 text-indigo-700",
  },
  CONTRACT: {
    label: "สัญญา/ใบสั่งซื้อ",
    icon: File,
    colorClass: "bg-slate-100 text-slate-700",
  },
  OTHER: {
    label: "อื่นๆ",
    icon: File,
    colorClass: "bg-gray-100 text-gray-700",
  },
};

/**
 * Get sub-document type config
 */
export function getSubDocTypeConfig(docType: SubDocType): SubDocTypeConfig {
  return SUB_DOC_TYPE_CONFIG[docType] || SUB_DOC_TYPE_CONFIG.OTHER;
}

// ==================== Document Types for Forms ====================

export type DocTypeOption = {
  type: SubDocType | "OTHER";
  label: string;
  icon: LucideIcon;
};

/**
 * Document types for EXPENSE transactions
 */
export const EXPENSE_DOC_TYPES: DocTypeOption[] = [
  { type: "SLIP", label: "สลิปโอนเงิน", icon: Receipt },
  { type: "TAX_INVOICE", label: "ใบกำกับภาษี", icon: FileCheck },
  { type: "INVOICE", label: "ใบแจ้งหนี้", icon: FileText },
  { type: "OTHER", label: "อื่นๆ", icon: FileText },
];

/**
 * Document types for INCOME transactions
 */
export const INCOME_DOC_TYPES: DocTypeOption[] = [
  { type: "INVOICE", label: "ใบแจ้งหนี้", icon: FileText },
  { type: "RECEIPT", label: "ใบเสร็จรับเงิน", icon: Receipt },
  { type: "TAX_INVOICE", label: "ใบกำกับภาษี", icon: FileCheck },
  { type: "OTHER", label: "อื่นๆ", icon: FileText },
];

/**
 * Get document types based on transaction type
 */
export function getDocTypesForTransaction(
  transactionType: TransactionType
): DocTypeOption[] {
  return transactionType === "EXPENSE" ? EXPENSE_DOC_TYPES : INCOME_DOC_TYPES;
}

// ==================== Status Configuration ====================

export interface StatusConfig {
  label: string;
  className: string;
}

export const STATUS_CONFIG: Record<DocumentStatus | string, StatusConfig> = {
  DRAFT: {
    label: "ร่าง",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  PENDING_REVIEW: {
    label: "รอตรวจ",
    className: "bg-sky-100 text-sky-700 border-sky-200",
  },
  NEED_INFO: {
    label: "ขอข้อมูลเพิ่ม",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  READY_TO_EXPORT: {
    label: "พร้อม Export",
    className: "bg-violet-100 text-violet-700 border-violet-200",
  },
  EXPORTED: {
    label: "Export แล้ว",
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  BOOKED: {
    label: "เสร็จแล้ว",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  REJECTED: {
    label: "ปฏิเสธ",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  VOID: {
    label: "ยกเลิก",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  // Fallback statuses
  IN_PROGRESS: {
    label: "กำลังดำเนินการ",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  COMPLETE: {
    label: "เสร็จสิ้น",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
};

/**
 * Get status configuration
 */
export function getStatusConfig(status: string): StatusConfig {
  return (
    STATUS_CONFIG[status] || {
      label: status,
      className: "bg-gray-100 text-gray-700 border-gray-200",
    }
  );
}

/**
 * Get status label
 */
export function getStatusLabel(status: string): string {
  return getStatusConfig(status).label;
}

// ==================== WHT (Withholding Tax) ====================

export interface WHTOption {
  value: string;
  rate: number;
  label: string;
}

export const WHT_TYPES: WHTOption[] = [
  { value: "1", rate: 1, label: "1% - ค่าขนส่ง" },
  { value: "2", rate: 2, label: "2% - ค่าโฆษณา" },
  { value: "3", rate: 3, label: "3% - ค่าบริการ/จ้างทำของ" },
  { value: "5", rate: 5, label: "5% - ค่าเช่า" },
];

/**
 * Get WHT label by rate
 */
export function getWHTLabel(rate: number): string {
  const wht = WHT_TYPES.find((w) => w.rate === rate);
  return wht?.label || `${rate}%`;
}

// ==================== VAT Options ====================

export interface VATOption {
  value: string;
  rate: number;
  label: string;
  isInclusive?: boolean;
}

export const VAT_OPTIONS: VATOption[] = [
  { value: "none", rate: 0, label: "ไม่มี VAT" },
  { value: "vat7", rate: 7, label: "VAT 7%" },
  { value: "vat7_inclusive", rate: 7, label: "VAT 7% (รวมใน)", isInclusive: true },
];

// ==================== Payment Methods ====================

export interface PaymentMethodOption {
  value: string;
  label: string;
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  { value: "TRANSFER", label: "โอนเงิน" },
  { value: "CASH", label: "เงินสด" },
  { value: "CREDIT_CARD", label: "บัตรเครดิต" },
  { value: "CHEQUE", label: "เช็ค" },
  { value: "OTHER", label: "อื่นๆ" },
];

/**
 * Get payment method label
 */
export function getPaymentMethodLabel(method: string): string {
  const found = PAYMENT_METHODS.find((m) => m.value === method);
  return found?.label || method;
}

// ==================== Role/Permission Helpers ====================

/**
 * Check if user has accounting permissions
 */
export function isAccountingRole(role: string): boolean {
  return ["ACCOUNTING", "ADMIN", "OWNER"].includes(role);
}

/**
 * Check if user is admin/owner
 */
export function isAdminRole(role: string): boolean {
  return ["ADMIN", "OWNER"].includes(role);
}

/**
 * Statuses that allow editing
 */
export const EDITABLE_STATUSES: DocumentStatus[] = [
  "DRAFT",
  "NEED_INFO",
  "PENDING_REVIEW",
  "READY_TO_EXPORT",
];

/**
 * Statuses that can be reviewed
 */
export const REVIEWABLE_STATUSES: DocumentStatus[] = [
  "PENDING_REVIEW",
  "NEED_INFO",
];

/**
 * Check if document can be edited
 */
export function canEditDocument(status: DocumentStatus): boolean {
  return EDITABLE_STATUSES.includes(status);
}

/**
 * Check if document can be reviewed
 */
export function canReviewDocument(status: DocumentStatus): boolean {
  return REVIEWABLE_STATUSES.includes(status);
}
