/**
 * Expense Type Configuration
 */

import {
  Receipt,
  FileCheck,
  Banknote,
  Plane,
  type LucideIcon,
} from "lucide-react";
import type { ExpenseType, DocType } from "@/types";

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

export const EXPENSE_TYPE_OPTIONS = Object.entries(EXPENSE_TYPE_CONFIG).map(([value, config]) => ({
  value: value as ExpenseType,
  label: config.label,
  description: config.description,
  icon: config.icon,
}));
