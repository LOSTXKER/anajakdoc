/**
 * Centralized document configuration
 * Box types, Document types, Status, WHT, VAT, Payment methods
 */

import {
  Receipt,
  FileCheck,
  FileText,
  FileWarning,
  File,
  TrendingUp,
  TrendingDown,
  Repeat,
  CreditCard,
  Banknote,
  Building2,
  Plane,
  Ship,
  Zap,
  Building,
  Users,
  FileX,
  type LucideIcon,
} from "lucide-react";
import type { BoxType, ExpenseType, DocType, BoxStatus, DocStatus, PaymentStatus } from "@/types";

// ==================== Box Type Config ====================

export interface BoxTypeConfig {
  label: string;
  icon: LucideIcon;
  colorClass: string;
  badgeClass: string;
  iconColor: string;
  bgLight: string;
  amountColor: string;
}

export const BOX_TYPE_CONFIG: Record<BoxType, BoxTypeConfig> = {
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
    colorClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    badgeClass: "bg-emerald-100 text-emerald-700",
    iconColor: "text-emerald-500",
    bgLight: "bg-emerald-50",
    amountColor: "text-emerald-600",
  },
  ADJUSTMENT: {
    label: "ปรับปรุง",
    icon: Repeat,
    colorClass: "bg-purple-100 text-purple-700 border-purple-200",
    badgeClass: "bg-purple-100 text-purple-700",
    iconColor: "text-purple-500",
    bgLight: "bg-purple-50",
    amountColor: "text-purple-600",
  },
};

export function getBoxTypeConfig(type: BoxType): BoxTypeConfig {
  return BOX_TYPE_CONFIG[type];
}

export function getBoxTypeLabel(type: BoxType): string {
  return BOX_TYPE_CONFIG[type].label;
}

// ==================== Expense Type Config ====================

export interface ExpenseTypeConfig {
  label: string;
  description: string;
  icon: LucideIcon;
  colorClass: string;
  requiredDocs: DocType[];
  optionalDocs: DocType[];
}

export const EXPENSE_TYPE_CONFIG: Record<ExpenseType, ExpenseTypeConfig> = {
  STANDARD: {
    label: "มีใบกำกับภาษี",
    description: "ขอคืน VAT ได้",
    icon: FileCheck,
    colorClass: "bg-emerald-100 text-emerald-700",
    requiredDocs: ["SLIP_TRANSFER", "TAX_INVOICE"],
    optionalDocs: ["WHT_SENT"],
  },
  NO_VAT: {
    label: "ไม่มีใบกำกับภาษี",
    description: "บิลเงินสด / ร้านไม่จด VAT",
    icon: Receipt,
    colorClass: "bg-slate-100 text-slate-700",
    requiredDocs: ["SLIP_TRANSFER"],
    optionalDocs: ["CASH_RECEIPT", "RECEIPT"],
  },
  PETTY_CASH: {
    label: "เบิกเงินสดย่อย",
    description: "ค่าใช้จ่ายเล็กน้อย",
    icon: Banknote,
    colorClass: "bg-amber-100 text-amber-700",
    requiredDocs: [],
    optionalDocs: ["PETTY_CASH_VOUCHER", "CASH_RECEIPT"],
  },
  FOREIGN: {
    label: "จ่ายต่างประเทศ",
    description: "สกุลเงินอื่น เช่น USD",
    icon: Plane,
    colorClass: "bg-indigo-100 text-indigo-700",
    requiredDocs: ["SLIP_TRANSFER", "FOREIGN_INVOICE"],
    optionalDocs: ["BANK_STATEMENT"],
  },
};

export function getExpenseTypeConfig(type: ExpenseType): ExpenseTypeConfig {
  return EXPENSE_TYPE_CONFIG[type];
}

export function getExpenseTypeLabel(type: ExpenseType): string {
  return EXPENSE_TYPE_CONFIG[type].label;
}

// ==================== Document Type Config ====================

export interface DocTypeConfig {
  label: string;
  labelShort: string;
  icon: LucideIcon;
  colorClass: string;
  hasVat: boolean;
  category: "payment" | "expense" | "adjustment" | "wht" | "tax" | "other";
}

export const DOC_TYPE_CONFIG: Record<DocType, DocTypeConfig> = {
  // === หลักฐานจ่ายเงิน ===
  SLIP_TRANSFER: {
    label: "สลิปโอนเงิน",
    labelShort: "สลิปโอน",
    icon: Receipt,
    colorClass: "bg-blue-100 text-blue-700",
    hasVat: false,
    category: "payment",
  },
  SLIP_CHEQUE: {
    label: "สำเนาเช็ค",
    labelShort: "เช็ค",
    icon: CreditCard,
    colorClass: "bg-blue-100 text-blue-700",
    hasVat: false,
    category: "payment",
  },
  BANK_STATEMENT: {
    label: "Statement ธนาคาร",
    labelShort: "Statement",
    icon: FileText,
    colorClass: "bg-blue-100 text-blue-700",
    hasVat: false,
    category: "payment",
  },
  CREDIT_CARD_STATEMENT: {
    label: "Statement บัตรเครดิต",
    labelShort: "บัตรเครดิต",
    icon: CreditCard,
    colorClass: "bg-blue-100 text-blue-700",
    hasVat: false,
    category: "payment",
  },
  ONLINE_RECEIPT: {
    label: "Paypal/Stripe Receipt",
    labelShort: "Online",
    icon: Receipt,
    colorClass: "bg-blue-100 text-blue-700",
    hasVat: false,
    category: "payment",
  },
  PETTY_CASH_VOUCHER: {
    label: "ใบสำคัญจ่ายเงินสด",
    labelShort: "Petty Cash",
    icon: Banknote,
    colorClass: "bg-green-100 text-green-700",
    hasVat: false,
    category: "payment",
  },

  // === หลักฐานรายจ่าย ===
  TAX_INVOICE: {
    label: "ใบกำกับภาษี",
    labelShort: "ใบกำกับ",
    icon: FileCheck,
    colorClass: "bg-emerald-100 text-emerald-700",
    hasVat: true,
    category: "expense",
  },
  TAX_INVOICE_ABB: {
    label: "ใบกำกับภาษีอย่างย่อ",
    labelShort: "ใบกำกับย่อ",
    icon: FileCheck,
    colorClass: "bg-emerald-100 text-emerald-700",
    hasVat: true,
    category: "expense",
  },
  RECEIPT: {
    label: "ใบเสร็จรับเงิน",
    labelShort: "ใบเสร็จ",
    icon: Receipt,
    colorClass: "bg-cyan-100 text-cyan-700",
    hasVat: false,
    category: "expense",
  },
  CASH_RECEIPT: {
    label: "บิลเงินสด",
    labelShort: "บิลเงินสด",
    icon: Receipt,
    colorClass: "bg-slate-100 text-slate-700",
    hasVat: false,
    category: "expense",
  },
  INVOICE: {
    label: "ใบแจ้งหนี้",
    labelShort: "Invoice",
    icon: FileText,
    colorClass: "bg-purple-100 text-purple-700",
    hasVat: false,
    category: "expense",
  },
  FOREIGN_INVOICE: {
    label: "Invoice ต่างประเทศ",
    labelShort: "Foreign Invoice",
    icon: FileText,
    colorClass: "bg-indigo-100 text-indigo-700",
    hasVat: false,
    category: "expense",
  },
  CUSTOMS_FORM: {
    label: "ใบขนสินค้า",
    labelShort: "ใบขน",
    icon: Ship,
    colorClass: "bg-cyan-100 text-cyan-700",
    hasVat: true,
    category: "expense",
  },
  DELIVERY_NOTE: {
    label: "ใบส่งของ",
    labelShort: "ใบส่งของ",
    icon: FileText,
    colorClass: "bg-slate-100 text-slate-700",
    hasVat: false,
    category: "expense",
  },

  // === เอกสารปรับปรุง ===
  CREDIT_NOTE: {
    label: "ใบลดหนี้",
    labelShort: "CN",
    icon: FileText,
    colorClass: "bg-orange-100 text-orange-700",
    hasVat: true,
    category: "adjustment",
  },
  DEBIT_NOTE: {
    label: "ใบเพิ่มหนี้",
    labelShort: "DN",
    icon: FileText,
    colorClass: "bg-orange-100 text-orange-700",
    hasVat: true,
    category: "adjustment",
  },
  REFUND_RECEIPT: {
    label: "หลักฐานคืนเงิน",
    labelShort: "Refund",
    icon: Receipt,
    colorClass: "bg-orange-100 text-orange-700",
    hasVat: false,
    category: "adjustment",
  },

  // === WHT ===
  WHT_SENT: {
    label: "หัก ณ ที่จ่าย (ออก)",
    labelShort: "WHT ออก",
    icon: FileWarning,
    colorClass: "bg-amber-100 text-amber-700",
    hasVat: false,
    category: "wht",
  },
  WHT_RECEIVED: {
    label: "หัก ณ ที่จ่าย (รับกลับ)",
    labelShort: "WHT รับ",
    icon: FileWarning,
    colorClass: "bg-amber-100 text-amber-700",
    hasVat: false,
    category: "wht",
  },
  WHT_INCOMING: {
    label: "หัก ณ ที่จ่าย (เขาหักเรา)",
    labelShort: "WHT เขาหัก",
    icon: FileWarning,
    colorClass: "bg-amber-100 text-amber-700",
    hasVat: false,
    category: "wht",
  },

  // === ภาษี/ราชการ ===
  TAX_PAYMENT_SLIP: {
    label: "ใบนำส่งภาษี",
    labelShort: "ใบนำส่ง",
    icon: Building2,
    colorClass: "bg-red-100 text-red-700",
    hasVat: false,
    category: "tax",
  },
  TAX_RECEIPT_GOVT: {
    label: "ใบเสร็จจากสรรพากร",
    labelShort: "ใบเสร็จภาษี",
    icon: Building2,
    colorClass: "bg-red-100 text-red-700",
    hasVat: false,
    category: "tax",
  },
  SSO_PAYMENT: {
    label: "ประกันสังคม",
    labelShort: "สปส.",
    icon: Users,
    colorClass: "bg-red-100 text-red-700",
    hasVat: false,
    category: "tax",
  },
  GOVT_RECEIPT: {
    label: "ใบเสร็จราชการ",
    labelShort: "ใบเสร็จราชการ",
    icon: Building2,
    colorClass: "bg-red-100 text-red-700",
    hasVat: false,
    category: "tax",
  },

  // === อื่นๆ ===
  CONTRACT: {
    label: "สัญญา",
    labelShort: "สัญญา",
    icon: File,
    colorClass: "bg-gray-100 text-gray-700",
    hasVat: false,
    category: "other",
  },
  QUOTATION: {
    label: "ใบเสนอราคา",
    labelShort: "ใบเสนอราคา",
    icon: FileText,
    colorClass: "bg-gray-100 text-gray-700",
    hasVat: false,
    category: "other",
  },
  PURCHASE_ORDER: {
    label: "ใบสั่งซื้อ",
    labelShort: "PO",
    icon: FileText,
    colorClass: "bg-gray-100 text-gray-700",
    hasVat: false,
    category: "other",
  },
  CLAIM_FORM: {
    label: "ใบเบิกเงิน",
    labelShort: "ใบเบิก",
    icon: Users,
    colorClass: "bg-pink-100 text-pink-700",
    hasVat: false,
    category: "other",
  },
  OTHER: {
    label: "อื่นๆ",
    labelShort: "อื่นๆ",
    icon: File,
    colorClass: "bg-gray-100 text-gray-700",
    hasVat: false,
    category: "other",
  },
};

export function getDocTypeConfig(docType: DocType): DocTypeConfig {
  return DOC_TYPE_CONFIG[docType] || DOC_TYPE_CONFIG.OTHER;
}

export function getDocTypeLabel(docType: DocType | string | null | undefined): string {
  if (!docType) return "-";
  return DOC_TYPE_CONFIG[docType as DocType]?.label || docType;
}

// ==================== Document Types for Forms ====================

export type DocTypeOption = {
  type: DocType;
  label: string;
  icon: LucideIcon;
};

// Common payment documents
export const PAYMENT_DOC_TYPES: DocTypeOption[] = [
  { type: "SLIP_TRANSFER", label: "สลิปโอนเงิน", icon: Receipt },
  { type: "SLIP_CHEQUE", label: "สำเนาเช็ค", icon: CreditCard },
  { type: "BANK_STATEMENT", label: "Statement ธนาคาร", icon: FileText },
  { type: "CREDIT_CARD_STATEMENT", label: "Statement บัตรเครดิต", icon: CreditCard },
  { type: "PETTY_CASH_VOUCHER", label: "ใบสำคัญจ่ายเงินสด", icon: Banknote },
];

// Common expense documents
export const EXPENSE_DOC_TYPES: DocTypeOption[] = [
  { type: "TAX_INVOICE", label: "ใบกำกับภาษี", icon: FileCheck },
  { type: "TAX_INVOICE_ABB", label: "ใบกำกับภาษีอย่างย่อ", icon: FileCheck },
  { type: "RECEIPT", label: "ใบเสร็จรับเงิน", icon: Receipt },
  { type: "CASH_RECEIPT", label: "บิลเงินสด", icon: Receipt },
  { type: "INVOICE", label: "ใบแจ้งหนี้", icon: FileText },
  { type: "FOREIGN_INVOICE", label: "Invoice ต่างประเทศ", icon: FileText },
];

// Income documents
export const INCOME_DOC_TYPES: DocTypeOption[] = [
  { type: "INVOICE", label: "ใบแจ้งหนี้", icon: FileText },
  { type: "RECEIPT", label: "ใบเสร็จรับเงิน", icon: Receipt },
  { type: "TAX_INVOICE", label: "ใบกำกับภาษี", icon: FileCheck },
  { type: "QUOTATION", label: "ใบเสนอราคา", icon: FileText },
];

// WHT documents
export const WHT_DOC_TYPES: DocTypeOption[] = [
  { type: "WHT_SENT", label: "หัก ณ ที่จ่าย (ออก)", icon: FileWarning },
  { type: "WHT_RECEIVED", label: "หัก ณ ที่จ่าย (รับกลับ)", icon: FileWarning },
  { type: "WHT_INCOMING", label: "หัก ณ ที่จ่าย (เขาหักเรา)", icon: FileWarning },
];

export function getDocTypesForBoxType(boxType: BoxType): DocTypeOption[] {
  switch (boxType) {
    case "EXPENSE":
      return [...PAYMENT_DOC_TYPES, ...EXPENSE_DOC_TYPES, ...WHT_DOC_TYPES, { type: "OTHER", label: "อื่นๆ", icon: File }];
    case "INCOME":
      return [...INCOME_DOC_TYPES, ...PAYMENT_DOC_TYPES, ...WHT_DOC_TYPES, { type: "OTHER", label: "อื่นๆ", icon: File }];
    case "ADJUSTMENT":
      return [
        { type: "CREDIT_NOTE", label: "ใบลดหนี้", icon: FileText },
        { type: "DEBIT_NOTE", label: "ใบเพิ่มหนี้", icon: FileText },
        { type: "REFUND_RECEIPT", label: "หลักฐานคืนเงิน", icon: Receipt },
        ...PAYMENT_DOC_TYPES,
        { type: "OTHER", label: "อื่นๆ", icon: File },
      ];
    default:
      return [{ type: "OTHER", label: "อื่นๆ", icon: File }];
  }
}

// ==================== Status Configuration ====================

export interface StatusConfig {
  label: string;
  className: string;
}

export const BOX_STATUS_CONFIG: Record<BoxStatus, StatusConfig> = {
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
  APPROVED: {
    label: "อนุมัติแล้ว",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  EXPORTED: {
    label: "Export แล้ว",
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  CANCELLED: {
    label: "ยกเลิก",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

export const DOC_STATUS_CONFIG: Record<DocStatus, StatusConfig> = {
  INCOMPLETE: {
    label: "เอกสารไม่ครบ",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  COMPLETE: {
    label: "เอกสารครบ",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  NA: {
    label: "ไม่ต้องมีเอกสาร",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, StatusConfig> = {
  UNPAID: {
    label: "ยังไม่จ่าย",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  PARTIAL: {
    label: "จ่ายบางส่วน",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  PAID: {
    label: "จ่ายครบ",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  OVERPAID: {
    label: "จ่ายเกิน",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  REFUNDED: {
    label: "ได้คืนแล้ว",
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
};

export function getBoxStatusConfig(status: BoxStatus): StatusConfig {
  return BOX_STATUS_CONFIG[status];
}

export function getBoxStatusLabel(status: BoxStatus): string {
  return BOX_STATUS_CONFIG[status].label;
}

export function getDocStatusConfig(status: DocStatus): StatusConfig {
  return DOC_STATUS_CONFIG[status];
}

export function getPaymentStatusConfig(status: PaymentStatus): StatusConfig {
  return PAYMENT_STATUS_CONFIG[status];
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
  { value: "ONLINE", label: "Online" },
];

export function getPaymentMethodLabel(method: string): string {
  const found = PAYMENT_METHODS.find((m) => m.value === method);
  return found?.label || method;
}

// ==================== Role/Permission Helpers ====================

export function isAccountingRole(role: string): boolean {
  return ["ACCOUNTING", "ADMIN", "OWNER"].includes(role);
}

export function isAdminRole(role: string): boolean {
  return ["ADMIN", "OWNER"].includes(role);
}

// Statuses that allow editing
export const EDITABLE_STATUSES: BoxStatus[] = [
  "DRAFT",
  "NEED_INFO",
  "PENDING_REVIEW",
];

// Statuses that can be reviewed
export const REVIEWABLE_STATUSES: BoxStatus[] = [
  "PENDING_REVIEW",
  "NEED_INFO",
];

export function canEditBox(status: BoxStatus): boolean {
  return EDITABLE_STATUSES.includes(status);
}

export function canReviewBox(status: BoxStatus): boolean {
  return REVIEWABLE_STATUSES.includes(status);
}

// ==================== Expense Type Options for Forms ====================

export const EXPENSE_TYPE_OPTIONS = Object.entries(EXPENSE_TYPE_CONFIG).map(([value, config]) => ({
  value: value as ExpenseType,
  label: config.label,
  description: config.description,
  icon: config.icon,
}));
