/**
 * Document Type Configuration
 */

import {
  Receipt,
  FileCheck,
  FileText,
  FileWarning,
  File,
  CreditCard,
  Banknote,
  Building2,
  Plane,
  Ship,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { BoxType, DocType } from "@/types";

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
