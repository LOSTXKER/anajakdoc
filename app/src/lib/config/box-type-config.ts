/**
 * Box Type Configuration
 * 
 * Provides styling, display, and business logic configuration for different box types
 * (EXPENSE, INCOME) used throughout the application.
 * 
 * This is the SINGLE SOURCE OF TRUTH for all box type differences.
 * 
 * @module config/box-type-config
 */

import {
  TrendingUp,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";
import type { BoxType } from "@/types";
import type { ContactRole, WhtType } from "@prisma/client";

// ==================== Visual Styling Config ====================

/**
 * Configuration object for a box type's visual styling
 */
export interface BoxTypeVisualConfig {
  /** Thai label for the box type */
  label: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Tailwind classes for colored container */
  colorClass: string;
  /** Tailwind classes for badge styling */
  badgeClass: string;
  /** Tailwind classes for icon color */
  iconColor: string;
  /** Tailwind classes for light background */
  bgLight: string;
  /** Tailwind classes for amount text color */
  amountColor: string;
}

// ==================== Business Logic Config ====================

/**
 * Thai labels for box type specific text
 */
export interface BoxTypeLabels {
  // Payment labels
  payment: string;           // "การชำระเงิน" | "การรับเงิน"
  paymentAction: string;     // "บันทึกการชำระเงิน" | "บันทึกการรับเงิน"
  paid: string;              // "ชำระแล้ว" | "รับเงินแล้ว"
  unpaid: string;            // "ยังไม่ชำระ" | "ยังไม่รับเงิน"
  partialPaid: string;       // "ชำระบางส่วน" | "รับบางส่วน"
  
  // VAT labels
  vat: string;               // "ใบกำกับภาษี" | "ออกใบกำกับภาษี"
  vatReceived: string;       // "ได้รับแล้ว" | "ออกแล้ว"
  vatPending: string;        // "รอรับใบกำกับภาษี" | "ยังไม่ได้ออก"
  
  // WHT labels
  wht: string;               // "ออกหนังสือหัก ณ ที่จ่าย" | "รับหนังสือหัก ณ ที่จ่าย"
  whtShort: string;          // "ออก WHT" | "รับ WHT"
  whtAction: string;         // "ออก WHT" | "ทำเครื่องหมาย"
  whtCompleted: string;      // "ออกและนำส่งแล้ว" | "ได้รับแล้ว"
  whtInProgress: string;     // "ออกแล้ว รอนำส่ง" | "ขอจากลูกค้าแล้ว รอรับ"
  whtPending: string;        // "ยังไม่ได้ออก" | "ยังไม่ได้รับ"
  
  // Contact labels
  contact: string;           // "ผู้ขาย/ร้านค้า" | "ลูกค้า"
  contactShort: string;      // "ผู้ขาย" | "ลูกค้า"
}

/**
 * Business logic configuration for a box type
 */
export interface BoxTypeLogicConfig {
  /** Thai labels for all text */
  labels: BoxTypeLabels;
  /** Contact role for this box type */
  contactRole: ContactRole;
  /** WHT tracking direction */
  whtDirection: WhtType;
  /** Box number prefix */
  prefix: string;
  /** Whether WHT is deducted from net amount */
  whtDeductedFromNet: boolean;
}

/**
 * Combined configuration for a box type
 */
export interface BoxTypeConfig extends BoxTypeVisualConfig, BoxTypeLogicConfig {}

// ==================== Configuration Data ====================

/**
 * Complete configuration map for all box types.
 * 
 * @example
 * const config = BOX_TYPE_CONFIG.EXPENSE;
 * console.log(config.label); // "รายจ่าย"
 * console.log(config.labels.paid); // "ชำระแล้ว"
 */
export const BOX_TYPE_CONFIG: Record<BoxType, BoxTypeConfig> = {
  EXPENSE: {
    // Visual
    label: "รายจ่าย",
    icon: TrendingDown,
    colorClass: "bg-rose-100 text-rose-700 border-rose-200",
    badgeClass: "bg-rose-100 text-rose-700",
    iconColor: "text-rose-500",
    bgLight: "bg-rose-50",
    amountColor: "text-rose-600",
    
    // Business Logic
    labels: {
      payment: "การชำระเงิน",
      paymentAction: "บันทึกการชำระเงิน",
      paid: "ชำระแล้ว",
      unpaid: "ยังไม่ชำระ",
      partialPaid: "ชำระบางส่วน",
      
      vat: "ใบกำกับภาษี",
      vatReceived: "ได้รับแล้ว",
      vatPending: "รอรับใบกำกับภาษี",
      
      wht: "ออกหนังสือหัก ณ ที่จ่าย",
      whtShort: "ออก WHT",
      whtAction: "ออก WHT",
      whtCompleted: "ออกและนำส่งแล้ว",
      whtInProgress: "ออกแล้ว รอนำส่ง",
      whtPending: "ยังไม่ได้ออก",
      
      contact: "ผู้ขาย/ร้านค้า",
      contactShort: "ผู้ขาย",
    },
    contactRole: "VENDOR",
    whtDirection: "OUTGOING",
    prefix: "EXP",
    whtDeductedFromNet: true, // EXPENSE: Net = Total - WHT
  },
  INCOME: {
    // Visual
    label: "รายรับ",
    icon: TrendingUp,
    colorClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    badgeClass: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300",
    iconColor: "text-emerald-500",
    bgLight: "bg-emerald-50 dark:bg-emerald-950",
    amountColor: "text-emerald-600",
    
    // Business Logic
    labels: {
      payment: "การรับเงิน",
      paymentAction: "บันทึกการรับเงิน",
      paid: "รับเงินแล้ว",
      unpaid: "ยังไม่รับเงิน",
      partialPaid: "รับบางส่วน",
      
      vat: "ออกใบกำกับภาษี",
      vatReceived: "ออกแล้ว",
      vatPending: "ยังไม่ได้ออก",
      
      wht: "รับหนังสือหัก ณ ที่จ่าย",
      whtShort: "รับ WHT",
      whtAction: "ทำเครื่องหมาย",
      whtCompleted: "ได้รับแล้ว",
      whtInProgress: "ขอจากลูกค้าแล้ว รอรับ",
      whtPending: "ยังไม่ได้รับ",
      
      contact: "ลูกค้า",
      contactShort: "ลูกค้า",
    },
    contactRole: "CUSTOMER",
    whtDirection: "INCOMING",
    prefix: "INC",
    whtDeductedFromNet: false, // INCOME: Net = Total (WHT already deducted by customer)
  },
};

// ==================== Helper Functions ====================

/**
 * Get complete configuration for a specific box type.
 * 
 * @param type - The box type (EXPENSE or INCOME)
 * @returns BoxTypeConfig object with all properties
 * 
 * @example
 * const config = getBoxTypeConfig("EXPENSE");
 * const Icon = config.icon;
 * return <Icon className={config.iconColor} />;
 */
export function getBoxTypeConfig(type: BoxType): BoxTypeConfig {
  return BOX_TYPE_CONFIG[type] || BOX_TYPE_CONFIG.EXPENSE;
}

/**
 * Get the Thai display label for a box type.
 * 
 * @param type - The box type
 * @returns Thai language label string
 * 
 * @example
 * getBoxTypeLabel("EXPENSE") // "รายจ่าย"
 * getBoxTypeLabel("INCOME")  // "รายรับ"
 */
export function getBoxTypeLabel(type: BoxType): string {
  return BOX_TYPE_CONFIG[type]?.label || type || "ไม่ทราบ";
}

/**
 * Get business logic labels for a box type.
 * 
 * @param type - The box type
 * @returns BoxTypeLabels object with all Thai labels
 * 
 * @example
 * const labels = getBoxTypeLabels("EXPENSE");
 * console.log(labels.paid); // "ชำระแล้ว"
 */
export function getBoxTypeLabels(type: BoxType): BoxTypeLabels {
  return BOX_TYPE_CONFIG[type]?.labels || BOX_TYPE_CONFIG.EXPENSE.labels;
}

/**
 * Calculate net amount based on box type.
 * - EXPENSE: Net = Total - WHT (we deduct WHT when paying)
 * - INCOME: Net = Total (customer already deducted WHT)
 * 
 * @param type - The box type
 * @param totalAmount - Total amount
 * @param whtAmount - WHT amount
 * @returns Net amount
 */
export function calculateNetAmount(type: BoxType, totalAmount: number, whtAmount: number): number {
  const config = BOX_TYPE_CONFIG[type];
  return config?.whtDeductedFromNet ? totalAmount - whtAmount : totalAmount;
}

/**
 * Get the WHT direction for a box type.
 * - EXPENSE: OUTGOING (we issue WHT to vendor)
 * - INCOME: INCOMING (customer issues WHT to us)
 */
export function getWhtDirection(type: BoxType): WhtType {
  return BOX_TYPE_CONFIG[type]?.whtDirection || "OUTGOING";
}

/**
 * Get the contact role for a box type.
 * - EXPENSE: VENDOR
 * - INCOME: CUSTOMER
 */
export function getContactRole(type: BoxType): ContactRole {
  return BOX_TYPE_CONFIG[type]?.contactRole || "VENDOR";
}

/**
 * Get the box number prefix for a box type.
 * - EXPENSE: "EXP"
 * - INCOME: "INC"
 */
export function getBoxPrefix(type: BoxType): string {
  return BOX_TYPE_CONFIG[type]?.prefix || "BOX";
}
