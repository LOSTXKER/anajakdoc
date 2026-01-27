/**
 * Box Requirements Configuration
 * 
 * Logic สำหรับคำนวณ requirements ที่ต้องทำ/ขาดสำหรับแต่ละกล่อง
 * Uses centralized config from box-type-config.ts
 */

import type { 
  BoxType, 
  PaymentStatus, 
  VatDocStatus, 
  WhtDocStatus,
  BoxStatus,
} from "@/types";
import { 
  Receipt, 
  FileText, 
  CreditCard, 
  Upload,
  CheckCircle2,
} from "lucide-react";
import { getBoxTypeLabels } from "./box-type-config";

// ==================== Types ====================

export type RequirementStatus = "completed" | "pending" | "warning" | "na";

export interface BoxRequirement {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  status: RequirementStatus;
  icon: React.ComponentType<{ className?: string }>;
  actionLabel?: string;
  actionType?: "upload" | "mark" | "issue" | "link";
}

export interface BoxRequirementsInput {
  boxType: BoxType;
  status: BoxStatus;
  hasVat: boolean;
  hasWht: boolean;
  vatDocStatus: VatDocStatus;
  whtDocStatus: WhtDocStatus;
  paymentStatus: PaymentStatus;
  documentsCount: number;
}

// ==================== Requirement Calculation ====================

/**
 * คำนวณ requirements ทั้งหมดของกล่อง
 */
export function getBoxRequirements(input: BoxRequirementsInput): BoxRequirement[] {
  const requirements: BoxRequirement[] = [];
  const { boxType, hasVat, hasWht, vatDocStatus, whtDocStatus, paymentStatus, documentsCount, status } = input;
  
  // Get labels from centralized config
  const labels = getBoxTypeLabels(boxType);
  const isExpense = boxType === "EXPENSE";

  // 1. เอกสาร (ทุกกล่องต้องมี)
  const hasDocuments = documentsCount > 0;
  requirements.push({
    id: "documents",
    label: "อัปโหลดเอกสาร",
    shortLabel: "เอกสาร",
    description: hasDocuments ? `อัปโหลดแล้ว ${documentsCount} ไฟล์` : "ยังไม่มีเอกสาร",
    status: hasDocuments ? "completed" : "pending",
    icon: hasDocuments ? CheckCircle2 : Upload,
    actionLabel: hasDocuments ? undefined : "อัปโหลด",
    actionType: "upload",
  });

  // 2. การชำระเงิน
  const isPaid = paymentStatus === "PAID" || paymentStatus === "OVERPAID";
  const isPartialPaid = paymentStatus === "PARTIAL";
  requirements.push({
    id: "payment",
    label: labels.paymentAction,
    shortLabel: isExpense ? "ชำระ" : "รับเงิน",
    description: isPaid 
      ? labels.paid
      : isPartialPaid 
        ? labels.partialPaid 
        : labels.unpaid,
    status: isPaid ? "completed" : isPartialPaid ? "warning" : "pending",
    icon: isPaid ? CheckCircle2 : CreditCard,
    actionLabel: isPaid ? undefined : "บันทึก",
    actionType: "link",
  });

  // 3. VAT (ถ้ามี)
  if (hasVat) {
    const vatReceived = vatDocStatus === "RECEIVED";
    
    requirements.push({
      id: "vat",
      label: labels.vat,
      shortLabel: "VAT",
      description: vatReceived ? labels.vatReceived : labels.vatPending,
      status: vatReceived ? "completed" : (status === "SUBMITTED" || status === "COMPLETED") ? "warning" : "pending",
      icon: vatReceived ? CheckCircle2 : Receipt,
      actionLabel: vatReceived ? undefined : "ทำเครื่องหมาย",
      actionType: "mark",
    });
  }

  // 4. WHT (ถ้ามี)
  if (hasWht) {
    const whtReceived = whtDocStatus === "RECEIVED";
    const whtSent = whtDocStatus === "REQUEST_SENT";
    
    let whtDescription: string;
    let whtStatus: RequirementStatus;
    
    if (whtReceived) {
      whtDescription = labels.whtCompleted;
      whtStatus = "completed";
    } else if (whtSent) {
      whtDescription = labels.whtInProgress;
      whtStatus = "warning";
    } else {
      whtDescription = labels.whtPending;
      whtStatus = (status === "SUBMITTED" || status === "COMPLETED") ? "warning" : "pending";
    }

    requirements.push({
      id: "wht",
      label: labels.wht,
      shortLabel: labels.whtShort,
      description: whtDescription,
      status: whtStatus,
      icon: whtReceived ? CheckCircle2 : FileText,
      actionLabel: whtReceived ? undefined : labels.whtAction,
      actionType: isExpense ? "issue" : "mark",
    });
  }

  return requirements;
}

/**
 * คำนวณ requirements ที่ขาด (สำหรับแสดง badges)
 */
export function getMissingRequirements(input: BoxRequirementsInput): BoxRequirement[] {
  const allRequirements = getBoxRequirements(input);
  return allRequirements.filter(r => r.status === "pending" || r.status === "warning");
}

/**
 * ตรวจสอบว่ากล่องมี requirements ครบหรือยัง
 */
export function isBoxComplete(input: BoxRequirementsInput): boolean {
  const missing = getMissingRequirements(input);
  return missing.length === 0;
}

/**
 * นับจำนวน requirements ที่เสร็จแล้ว
 */
export function getCompletedCount(input: BoxRequirementsInput): { completed: number; total: number } {
  const allRequirements = getBoxRequirements(input);
  const completed = allRequirements.filter(r => r.status === "completed").length;
  return { completed, total: allRequirements.length };
}

// ==================== Badge Helpers ====================

export type MissingBadge = {
  id: string;
  label: string;
  type: "warning" | "pending";
};

/**
 * สร้าง badges สำหรับแสดงใน list view
 */
export function getMissingBadges(input: BoxRequirementsInput): MissingBadge[] {
  const badges: MissingBadge[] = [];
  const { hasVat, hasWht, vatDocStatus, whtDocStatus, paymentStatus, status } = input;

  // ไม่แสดง badges ถ้ายังเป็น DRAFT หรือ PREPARING
  if (status === "DRAFT" || status === "PREPARING") {
    return badges;
  }

  // VAT missing
  if (hasVat && vatDocStatus !== "RECEIVED") {
    badges.push({
      id: "vat",
      label: "VAT",
      type: vatDocStatus === "MISSING" ? "warning" : "pending",
    });
  }

  // WHT missing
  if (hasWht && whtDocStatus !== "RECEIVED") {
    badges.push({
      id: "wht",
      label: "WHT",
      type: whtDocStatus === "MISSING" ? "warning" : "pending",
    });
  }

  // Payment missing (only for SUBMITTED or beyond)
  if (paymentStatus === "UNPAID") {
    badges.push({
      id: "payment",
      label: "รอชำระ",
      type: "pending",
    });
  } else if (paymentStatus === "PARTIAL") {
    badges.push({
      id: "payment",
      label: "ชำระบางส่วน",
      type: "warning",
    });
  }

  return badges;
}
