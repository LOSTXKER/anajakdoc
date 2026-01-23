/**
 * Centralized document configuration (V3)
 * Box types, Document types, Status, WHT, VAT, Payment methods
 * Updated for Case-based Accounting Workflow
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
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Archive,
  Lock,
  Send,
  Eye,
  FileQuestion,
  BookOpen,
  Hourglass,
  type LucideIcon,
} from "lucide-react";
import type { 
  BoxType, 
  ExpenseType, 
  DocType, 
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
    badgeClass: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300",
    iconColor: "text-emerald-500",
    bgLight: "bg-emerald-50 dark:bg-emerald-950",
    amountColor: "text-emerald-600",
  },
  ADJUSTMENT: {
    label: "ปรับปรุง",
    icon: Repeat,
    colorClass: "bg-purple-100 text-purple-700 border-purple-200",
    badgeClass: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
    iconColor: "text-purple-500",
    bgLight: "bg-purple-50 dark:bg-purple-950",
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
    colorClass: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300",
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
    colorClass: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
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
    colorClass: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
    hasVat: false,
    category: "payment",
  },
  SLIP_CHEQUE: {
    label: "สำเนาเช็ค",
    labelShort: "เช็ค",
    icon: CreditCard,
    colorClass: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
    hasVat: false,
    category: "payment",
  },
  BANK_STATEMENT: {
    label: "Statement ธนาคาร",
    labelShort: "Statement",
    icon: FileText,
    colorClass: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
    hasVat: false,
    category: "payment",
  },
  CREDIT_CARD_STATEMENT: {
    label: "Statement บัตรเครดิต",
    labelShort: "บัตรเครดิต",
    icon: CreditCard,
    colorClass: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
    hasVat: false,
    category: "payment",
  },
  ONLINE_RECEIPT: {
    label: "Paypal/Stripe Receipt",
    labelShort: "Online",
    icon: Receipt,
    colorClass: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
    hasVat: false,
    category: "payment",
  },
  PETTY_CASH_VOUCHER: {
    label: "ใบสำคัญจ่ายเงินสด",
    labelShort: "Petty Cash",
    icon: Banknote,
    colorClass: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
    hasVat: false,
    category: "payment",
  },

  // === หลักฐานรายจ่าย ===
  TAX_INVOICE: {
    label: "ใบกำกับภาษี",
    labelShort: "ใบกำกับ",
    icon: FileCheck,
    colorClass: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300",
    hasVat: true,
    category: "expense",
  },
  TAX_INVOICE_ABB: {
    label: "ใบกำกับภาษีอย่างย่อ",
    labelShort: "ใบกำกับย่อ",
    icon: FileCheck,
    colorClass: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300",
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
    colorClass: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
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
    colorClass: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300",
    hasVat: true,
    category: "adjustment",
  },
  DEBIT_NOTE: {
    label: "ใบเพิ่มหนี้",
    labelShort: "DN",
    icon: FileText,
    colorClass: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300",
    hasVat: true,
    category: "adjustment",
  },
  REFUND_RECEIPT: {
    label: "หลักฐานคืนเงิน",
    labelShort: "Refund",
    icon: Receipt,
    colorClass: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300",
    hasVat: false,
    category: "adjustment",
  },

  // === WHT ===
  WHT_SENT: {
    label: "หัก ณ ที่จ่าย (ออก)",
    labelShort: "WHT ออก",
    icon: FileWarning,
    colorClass: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
    hasVat: false,
    category: "wht",
  },
  WHT_RECEIVED: {
    label: "หัก ณ ที่จ่าย (รับกลับ)",
    labelShort: "WHT รับ",
    icon: FileWarning,
    colorClass: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
    hasVat: false,
    category: "wht",
  },
  WHT_INCOMING: {
    label: "หัก ณ ที่จ่าย (เขาหักเรา)",
    labelShort: "WHT เขาหัก",
    icon: FileWarning,
    colorClass: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
    hasVat: false,
    category: "wht",
  },

  // === ภาษี/ราชการ ===
  TAX_PAYMENT_SLIP: {
    label: "ใบนำส่งภาษี",
    labelShort: "ใบนำส่ง",
    icon: Building2,
    colorClass: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
    hasVat: false,
    category: "tax",
  },
  TAX_RECEIPT_GOVT: {
    label: "ใบเสร็จจากสรรพากร",
    labelShort: "ใบเสร็จภาษี",
    icon: Building2,
    colorClass: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
    hasVat: false,
    category: "tax",
  },
  SSO_PAYMENT: {
    label: "ประกันสังคม",
    labelShort: "สปส.",
    icon: Users,
    colorClass: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
    hasVat: false,
    category: "tax",
  },
  GOVT_RECEIPT: {
    label: "ใบเสร็จราชการ",
    labelShort: "ใบเสร็จราชการ",
    icon: Building2,
    colorClass: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
    hasVat: false,
    category: "tax",
  },

  // === อื่นๆ ===
  CONTRACT: {
    label: "สัญญา",
    labelShort: "สัญญา",
    icon: File,
    colorClass: "bg-muted text-foreground",
    hasVat: false,
    category: "other",
  },
  QUOTATION: {
    label: "ใบเสนอราคา",
    labelShort: "ใบเสนอราคา",
    icon: FileText,
    colorClass: "bg-muted text-foreground",
    hasVat: false,
    category: "other",
  },
  PURCHASE_ORDER: {
    label: "ใบสั่งซื้อ",
    labelShort: "PO",
    icon: FileText,
    colorClass: "bg-muted text-foreground",
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
    colorClass: "bg-muted text-foreground",
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

// ==================== Status Configuration (Section 5.1) ====================

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

export const BOX_STATUS_CONFIG: Record<BoxStatus, StatusConfig> = {
  DRAFT: {
    label: "แบบร่าง",
    labelShort: "ร่าง",
    description: "สร้างไว้ยังไม่ส่ง",
    icon: FileText,
    className: "bg-slate-100 text-slate-700 border-slate-200",
    bgClass: "bg-slate-100",
    textClass: "text-slate-700",
    borderClass: "border-slate-200",
  },
  SUBMITTED: {
    label: "ส่งแล้ว",
    labelShort: "ส่งแล้ว",
    description: "ส่งเข้าคิวบัญชีแล้ว",
    icon: Send,
    className: "bg-sky-100 text-sky-700 border-sky-200",
    bgClass: "bg-sky-100",
    textClass: "text-sky-700",
    borderClass: "border-sky-200",
  },
  IN_REVIEW: {
    label: "กำลังตรวจ",
    labelShort: "กำลังตรวจ",
    description: "บัญชีกำลังตรวจ",
    icon: Eye,
    className: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    bgClass: "bg-blue-100 dark:bg-blue-900",
    textClass: "text-blue-700",
    borderClass: "border-blue-200",
  },
  NEED_MORE_DOCS: {
    label: "ขอเอกสารเพิ่ม",
    labelShort: "ขอเอกสาร",
    description: "ขาดเอกสาร/ข้อมูล",
    icon: FileQuestion,
    className: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    bgClass: "bg-amber-100 dark:bg-amber-900",
    textClass: "text-amber-700",
    borderClass: "border-amber-200",
  },
  READY_TO_BOOK: {
    label: "พร้อมลงบัญชี",
    labelShort: "พร้อมลง",
    description: "ครบเงื่อนไขพร้อมลงบัญชี",
    icon: CheckCircle,
    className: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    bgClass: "bg-emerald-100 dark:bg-emerald-900",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-200",
  },
  WHT_PENDING: {
    label: "รอ WHT",
    labelShort: "รอ WHT",
    description: "ลงบัญชีได้ แต่ WHT ตามต่อ",
    icon: Hourglass,
    className: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    bgClass: "bg-orange-100 dark:bg-orange-900",
    textClass: "text-orange-700",
    borderClass: "border-orange-200",
  },
  BOOKED: {
    label: "ลงบัญชีแล้ว",
    labelShort: "ลงแล้ว",
    description: "ลงบัญชีแล้ว",
    icon: BookOpen,
    className: "bg-teal-100 text-teal-700 border-teal-200",
    bgClass: "bg-teal-100",
    textClass: "text-teal-700",
    borderClass: "border-teal-200",
  },
  ARCHIVED: {
    label: "เก็บแล้ว",
    labelShort: "เก็บแล้ว",
    description: "ปิดงาน/เก็บ",
    icon: Archive,
    className: "bg-muted text-foreground border",
    bgClass: "bg-muted",
    textClass: "text-foreground",
    borderClass: "border",
  },
  LOCKED: {
    label: "ล็อคแล้ว",
    labelShort: "ล็อค",
    description: "งวดปิดแล้ว ห้ามแก้",
    icon: Lock,
    className: "bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
    bgClass: "bg-violet-100 dark:bg-violet-900",
    textClass: "text-violet-700",
    borderClass: "border-violet-200",
  },
  CANCELLED: {
    label: "ยกเลิก",
    labelShort: "ยกเลิก",
    description: "ยกเลิกแล้ว",
    icon: XCircle,
    className: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
    bgClass: "bg-red-100 dark:bg-red-900",
    textClass: "text-red-700",
    borderClass: "border-red-200",
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

// ==================== VAT/WHT Document Status (Section 5.2) ====================

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

// ==================== Task Status/Type Config (Section 6) ====================

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

// ==================== Payment Mode / Reimbursement (Section 19) ====================

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
  "NEED_MORE_DOCS",
  "SUBMITTED",
];

// Statuses that can be reviewed
export const REVIEWABLE_STATUSES: BoxStatus[] = [
  "SUBMITTED",
  "IN_REVIEW",
  "NEED_MORE_DOCS",
];

// Statuses that can be booked
export const BOOKABLE_STATUSES: BoxStatus[] = [
  "READY_TO_BOOK",
  "WHT_PENDING",
];

// Statuses that are final (no further changes)
export const FINAL_STATUSES: BoxStatus[] = [
  "ARCHIVED",
  "LOCKED",
  "CANCELLED",
];

export function canEditBox(status: BoxStatus): boolean {
  return EDITABLE_STATUSES.includes(status);
}

export function canReviewBox(status: BoxStatus): boolean {
  return REVIEWABLE_STATUSES.includes(status);
}

export function canBookBox(status: BoxStatus): boolean {
  return BOOKABLE_STATUSES.includes(status);
}

export function isFinalStatus(status: BoxStatus): boolean {
  return FINAL_STATUSES.includes(status);
}

// ==================== Status Transition Helpers ====================

export function getNextStatuses(currentStatus: BoxStatus, role: MemberRole): BoxStatus[] {
  const transitions: Record<BoxStatus, { to: BoxStatus; roles: MemberRole[] }[]> = {
    DRAFT: [
      { to: "SUBMITTED", roles: ["STAFF", "ACCOUNTING", "ADMIN", "OWNER"] },
      { to: "CANCELLED", roles: ["STAFF", "ACCOUNTING", "ADMIN", "OWNER"] },
    ],
    SUBMITTED: [
      { to: "IN_REVIEW", roles: ["ACCOUNTING", "ADMIN", "OWNER"] },
      { to: "CANCELLED", roles: ["ACCOUNTING", "ADMIN", "OWNER"] },
    ],
    IN_REVIEW: [
      { to: "NEED_MORE_DOCS", roles: ["ACCOUNTING", "ADMIN", "OWNER"] },
      { to: "READY_TO_BOOK", roles: ["ACCOUNTING", "ADMIN", "OWNER"] },
      { to: "WHT_PENDING", roles: ["ACCOUNTING", "ADMIN", "OWNER"] },
      { to: "CANCELLED", roles: ["ACCOUNTING", "ADMIN", "OWNER"] },
    ],
    NEED_MORE_DOCS: [
      { to: "SUBMITTED", roles: ["STAFF", "ACCOUNTING", "ADMIN", "OWNER"] },
      { to: "CANCELLED", roles: ["ACCOUNTING", "ADMIN", "OWNER"] },
    ],
    READY_TO_BOOK: [
      { to: "BOOKED", roles: ["ACCOUNTING", "ADMIN", "OWNER"] },
    ],
    WHT_PENDING: [
      { to: "BOOKED", roles: ["ACCOUNTING", "ADMIN", "OWNER"] },
    ],
    BOOKED: [
      { to: "ARCHIVED", roles: ["ACCOUNTING", "ADMIN", "OWNER"] },
    ],
    ARCHIVED: [
      { to: "LOCKED", roles: ["ADMIN", "OWNER"] },
    ],
    LOCKED: [],
    CANCELLED: [],
  };

  const possibleTransitions = transitions[currentStatus] || [];
  return possibleTransitions
    .filter((t) => t.roles.includes(role))
    .map((t) => t.to);
}

// ==================== Expense Type Options for Forms ====================

export const EXPENSE_TYPE_OPTIONS = Object.entries(EXPENSE_TYPE_CONFIG).map(([value, config]) => ({
  value: value as ExpenseType,
  label: config.label,
  description: config.description,
  icon: config.icon,
}));

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
