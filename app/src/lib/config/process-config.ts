/**
 * Process Timeline Configuration
 * Defines workflow steps for each box type and expense type
 */

import {
  Plus,
  FileText,
  CreditCard,
  FileCheck,
  Send,
  Eye,
  BookOpen,
  Archive,
  Receipt,
  Banknote,
  Plane,
  FileWarning,
  type LucideIcon,
} from "lucide-react";
import type { BoxStatus, BoxType, ExpenseType, DocType } from "@/types";
import type { ChecklistItem } from "../checklist";

// ==================== Types ====================

export type ProcessStepStatus = "completed" | "current" | "pending" | "skipped";

export interface ProcessStep {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  // Function to determine if this step is completed
  isComplete: (context: ProcessContext) => boolean;
  // Function to determine if this step is the current active step
  isCurrent: (context: ProcessContext) => boolean;
  // Optional: Skip this step if condition is met
  skipIf?: (context: ProcessContext) => boolean;
}

export interface ProcessContext {
  boxStatus: BoxStatus;
  docStatus: string;
  paymentStatus: string;
  hasVat: boolean;
  hasWht: boolean;
  whtSent: boolean;
  expenseType: ExpenseType | null;
  uploadedDocTypes: Set<DocType>;
  checklistItems: ChecklistItem[];
  isPaid: boolean;
  hasTaxInvoice: boolean;
  whtIssued: boolean;
  submittedAt: string | null;
  bookedAt: string | null;
  archivedAt: string | null;
}

export interface ProcessTimelineConfig {
  boxType: BoxType;
  expenseType?: ExpenseType;
  steps: ProcessStep[];
}

// ==================== Helper Functions ====================

function isChecklistItemComplete(items: ChecklistItem[], itemId: string): boolean {
  const item = items.find((i) => i.id === itemId);
  return item?.completed ?? false;
}

function hasUploadedDoc(uploadedDocs: Set<DocType>, ...docTypes: DocType[]): boolean {
  return docTypes.some((doc) => uploadedDocs.has(doc));
}

// Status checks (simplified for 4 statuses: DRAFT, PENDING, NEED_DOCS, COMPLETED)
const isSubmitted = (ctx: ProcessContext) => 
  ctx.boxStatus !== "DRAFT";

const isPending = (ctx: ProcessContext) =>
  ctx.boxStatus === "PENDING" || ctx.boxStatus === "NEED_DOCS";

const isCompleted = (ctx: ProcessContext) =>
  ctx.boxStatus === "COMPLETED";

// ==================== Simplified Phase Steps ====================
// 4 statuses: DRAFT → PENDING → COMPLETED (with NEED_DOCS as side branch)

// === EXPENSE Phases ===
const EXPENSE_PHASE_CREATE: ProcessStep = {
  id: "create",
  label: "สร้างกล่อง",
  description: "ระบุข้อมูลพื้นฐาน",
  icon: Plus,
  isComplete: () => true, // Always complete if box exists
  isCurrent: () => false,
};

const EXPENSE_PHASE_PREPARE: ProcessStep = {
  id: "prepare",
  label: "เตรียมเอกสาร",
  description: "อัปโหลดใบกำกับ/สลิป",
  icon: FileText,
  isComplete: (ctx) => isSubmitted(ctx),
  isCurrent: (ctx) => ctx.boxStatus === "DRAFT",
};

const EXPENSE_PHASE_SUBMIT: ProcessStep = {
  id: "submit",
  label: "ส่งบัญชี",
  description: "ส่งให้บัญชีตรวจสอบ",
  icon: Send,
  isComplete: (ctx) => isSubmitted(ctx),
  isCurrent: () => false, // Transition step
};

const EXPENSE_PHASE_REVIEW: ProcessStep = {
  id: "review",
  label: "ตรวจสอบ",
  description: "บัญชีกำลังตรวจสอบ",
  icon: Eye,
  isComplete: (ctx) => isCompleted(ctx),
  isCurrent: (ctx) => isPending(ctx),
};

const EXPENSE_PHASE_COMPLETE: ProcessStep = {
  id: "complete",
  label: "เสร็จสิ้น",
  description: "ลงบัญชีเรียบร้อย",
  icon: BookOpen,
  isComplete: (ctx) => isCompleted(ctx),
  isCurrent: () => false,
};

// === INCOME Phases ===
const INCOME_PHASE_CREATE: ProcessStep = {
  id: "create",
  label: "สร้างกล่อง",
  description: "ระบุข้อมูลรายรับ",
  icon: Plus,
  isComplete: () => true,
  isCurrent: () => false,
};

const INCOME_PHASE_INVOICE: ProcessStep = {
  id: "invoice",
  label: "ออกใบแจ้งหนี้",
  description: "ออก Invoice/ใบกำกับ",
  icon: FileText,
  isComplete: (ctx) => isSubmitted(ctx),
  isCurrent: (ctx) => ctx.boxStatus === "DRAFT",
};

const INCOME_PHASE_RECEIVE: ProcessStep = {
  id: "receive",
  label: "รับเงิน",
  description: "ยืนยันรับชำระเงิน",
  icon: CreditCard,
  isComplete: (ctx) => isSubmitted(ctx),
  isCurrent: () => false,
};

const INCOME_PHASE_REVIEW: ProcessStep = {
  id: "review",
  label: "ตรวจสอบ",
  description: "บัญชีกำลังตรวจสอบ",
  icon: Eye,
  isComplete: (ctx) => isCompleted(ctx),
  isCurrent: (ctx) => isPending(ctx),
};

const INCOME_PHASE_COMPLETE: ProcessStep = {
  id: "complete",
  label: "เสร็จสิ้น",
  description: "ลงบัญชีเรียบร้อย",
  icon: BookOpen,
  isComplete: (ctx) => isCompleted(ctx),
  isCurrent: () => false,
};

// Backward compatibility aliases
const PHASE_CREATE = EXPENSE_PHASE_CREATE;
const PHASE_PREPARE = EXPENSE_PHASE_PREPARE;
const PHASE_SUBMIT = EXPENSE_PHASE_SUBMIT;
const PHASE_REVIEW = EXPENSE_PHASE_REVIEW;
const PHASE_COMPLETE = EXPENSE_PHASE_COMPLETE;

// ==================== Expense Steps ====================

// STANDARD - มีใบกำกับภาษี
const STEP_TAX_INVOICE: ProcessStep = {
  id: "taxInvoice",
  label: "ใบกำกับภาษี",
  description: "อัปโหลดใบกำกับภาษี",
  icon: FileCheck,
  isComplete: (ctx) => ctx.hasTaxInvoice || hasUploadedDoc(ctx.uploadedDocTypes, "TAX_INVOICE", "TAX_INVOICE_ABB"),
  isCurrent: (ctx) => 
    ctx.boxStatus === "DRAFT" && 
    !ctx.hasTaxInvoice && 
    !hasUploadedDoc(ctx.uploadedDocTypes, "TAX_INVOICE", "TAX_INVOICE_ABB"),
};

const STEP_PAYMENT: ProcessStep = {
  id: "payment",
  label: "ชำระเงิน",
  description: "บันทึกการชำระเงิน",
  icon: CreditCard,
  isComplete: (ctx) => ctx.isPaid || ctx.paymentStatus === "PAID",
  isCurrent: (ctx) => ctx.boxStatus === "DRAFT" && !ctx.isPaid && ctx.paymentStatus !== "PAID",
};

const STEP_WHT: ProcessStep = {
  id: "wht",
  label: "หัก ณ ที่จ่าย",
  description: "ออก + ส่ง WHT",
  icon: FileWarning,
  isComplete: (ctx) => ctx.whtIssued && ctx.whtSent,
  isCurrent: (ctx) => ctx.hasWht && (!ctx.whtIssued || !ctx.whtSent),
  skipIf: (ctx) => !ctx.hasWht,
};

// NO_VAT - ไม่มีใบกำกับภาษี
const STEP_CASH_RECEIPT: ProcessStep = {
  id: "cashReceipt",
  label: "บิลเงินสด",
  description: "อัปโหลดบิลเงินสด/ใบเสร็จ",
  icon: Receipt,
  isComplete: (ctx) => 
    hasUploadedDoc(ctx.uploadedDocTypes, "CASH_RECEIPT", "RECEIPT", "OTHER") ||
    isChecklistItemComplete(ctx.checklistItems, "hasCashReceipt"),
  isCurrent: (ctx) => 
    ctx.boxStatus === "DRAFT" && 
    !hasUploadedDoc(ctx.uploadedDocTypes, "CASH_RECEIPT", "RECEIPT", "OTHER"),
};

// PETTY_CASH - เบิกเงินสดย่อย
const STEP_PETTY_CASH_CONFIRM: ProcessStep = {
  id: "pettyCashConfirm",
  label: "ยืนยันจ่ายเงินสด",
  description: "ยืนยันว่าจ่ายเงินสดแล้ว",
  icon: Banknote,
  isComplete: (ctx) => ctx.isPaid,
  isCurrent: (ctx) => ctx.boxStatus === "DRAFT" && !ctx.isPaid,
};

const STEP_PETTY_CASH_DOC: ProcessStep = {
  id: "pettyCashDoc",
  label: "บิล/ใบสำคัญจ่าย",
  description: "อัปโหลดเอกสาร (ถ้ามี)",
  icon: Receipt,
  isComplete: (ctx) => 
    hasUploadedDoc(ctx.uploadedDocTypes, "PETTY_CASH_VOUCHER", "CASH_RECEIPT"),
  isCurrent: () => false, // Optional step, never "current"
  skipIf: () => false, // Always show, just optional
};

// FOREIGN - จ่ายต่างประเทศ
const STEP_FOREIGN_INVOICE: ProcessStep = {
  id: "foreignInvoice",
  label: "Invoice ต่างประเทศ",
  description: "อัปโหลด Foreign Invoice",
  icon: Plane,
  isComplete: (ctx) => hasUploadedDoc(ctx.uploadedDocTypes, "FOREIGN_INVOICE"),
  isCurrent: (ctx) => 
    ctx.boxStatus === "DRAFT" && 
    !hasUploadedDoc(ctx.uploadedDocTypes, "FOREIGN_INVOICE"),
};

// ==================== Income Steps ====================

const STEP_ISSUE_INVOICE: ProcessStep = {
  id: "issueInvoice",
  label: "ออกใบแจ้งหนี้",
  description: "ออกใบแจ้งหนี้ให้ลูกค้า",
  icon: FileText,
  isComplete: (ctx) => hasUploadedDoc(ctx.uploadedDocTypes, "INVOICE"),
  isCurrent: (ctx) => 
    ctx.boxStatus === "DRAFT" && 
    !hasUploadedDoc(ctx.uploadedDocTypes, "INVOICE"),
};

const STEP_ISSUE_TAX_INVOICE: ProcessStep = {
  id: "issueTaxInvoice",
  label: "ออกใบกำกับภาษี",
  description: "ออกใบกำกับภาษีให้ลูกค้า",
  icon: FileCheck,
  isComplete: (ctx) => hasUploadedDoc(ctx.uploadedDocTypes, "TAX_INVOICE"),
  isCurrent: (ctx) => 
    ctx.boxStatus === "DRAFT" && 
    ctx.hasVat &&
    hasUploadedDoc(ctx.uploadedDocTypes, "INVOICE") &&
    !hasUploadedDoc(ctx.uploadedDocTypes, "TAX_INVOICE"),
  skipIf: (ctx) => !ctx.hasVat,
};

const STEP_RECEIVE_PAYMENT: ProcessStep = {
  id: "receivePayment",
  label: "รับเงิน",
  description: "ยืนยันการรับเงิน",
  icon: CreditCard,
  isComplete: (ctx) => ctx.isPaid || ctx.paymentStatus === "PAID",
  isCurrent: (ctx) => ctx.boxStatus === "DRAFT" && !ctx.isPaid,
};

const STEP_RECEIVE_WHT: ProcessStep = {
  id: "receiveWht",
  label: "รับ WHT",
  description: "ได้รับหนังสือหัก ณ ที่จ่าย",
  icon: FileWarning,
  isComplete: (ctx) => 
    hasUploadedDoc(ctx.uploadedDocTypes, "WHT_INCOMING", "WHT_RECEIVED") ||
    isChecklistItemComplete(ctx.checklistItems, "whtReceived"),
  isCurrent: (ctx) => 
    ctx.hasWht && 
    !hasUploadedDoc(ctx.uploadedDocTypes, "WHT_INCOMING", "WHT_RECEIVED"),
  skipIf: (ctx) => !ctx.hasWht,
};

// ==================== Adjustment Steps ====================

const STEP_ADJUSTMENT_DOC: ProcessStep = {
  id: "adjustmentDoc",
  label: "เอกสารประกอบ",
  description: "CN/DN หรือหลักฐานการคืนเงิน",
  icon: FileText,
  isComplete: (ctx) => ctx.uploadedDocTypes.size > 0,
  isCurrent: (ctx) => ctx.boxStatus === "DRAFT" && ctx.uploadedDocTypes.size === 0,
};

// ==================== Dynamic Steps based on VAT/WHT ====================

// VAT Step for Expense (ได้รับใบกำกับภาษี)
const STEP_VAT_RECEIVED: ProcessStep = {
  id: "vatReceived",
  label: "ใบกำกับภาษี",
  description: "ได้รับใบกำกับภาษีแล้ว",
  icon: FileCheck,
  isComplete: (ctx) => 
    hasUploadedDoc(ctx.uploadedDocTypes, "TAX_INVOICE", "TAX_INVOICE_ABB") ||
    isChecklistItemComplete(ctx.checklistItems, "hasTaxInvoice"),
  isCurrent: (ctx) => 
    ctx.boxStatus !== "DRAFT" && 
    ctx.hasVat && 
    !hasUploadedDoc(ctx.uploadedDocTypes, "TAX_INVOICE", "TAX_INVOICE_ABB"),
  skipIf: (ctx) => !ctx.hasVat,
};

// WHT Step for Expense (ออก WHT และส่งให้คู่ค้า)
const STEP_WHT_SENT: ProcessStep = {
  id: "whtSent",
  label: "ส่ง WHT",
  description: "ออกและส่งหนังสือหัก ณ ที่จ่าย",
  icon: Send,
  isComplete: (ctx) => ctx.whtSent || hasUploadedDoc(ctx.uploadedDocTypes, "WHT_SENT"),
  isCurrent: (ctx) => 
    ctx.boxStatus !== "DRAFT" && 
    ctx.hasWht && 
    !ctx.whtSent && 
    !hasUploadedDoc(ctx.uploadedDocTypes, "WHT_SENT"),
  skipIf: (ctx) => !ctx.hasWht,
};

// WHT Received Step for Income (ได้รับ WHT จากลูกค้า)
const STEP_WHT_RECEIVED: ProcessStep = {
  id: "whtReceived",
  label: "รับ WHT",
  description: "ได้รับหนังสือหัก ณ ที่จ่าย",
  icon: FileWarning,
  isComplete: (ctx) => 
    hasUploadedDoc(ctx.uploadedDocTypes, "WHT_INCOMING", "WHT_RECEIVED") ||
    isChecklistItemComplete(ctx.checklistItems, "whtReceived"),
  isCurrent: (ctx) => 
    ctx.boxStatus !== "DRAFT" && 
    ctx.hasWht && 
    !hasUploadedDoc(ctx.uploadedDocTypes, "WHT_INCOMING", "WHT_RECEIVED"),
  skipIf: (ctx) => !ctx.hasWht,
};

// ==================== Main Function ====================

/**
 * Get process steps for a box based on its type, expense type, and VAT/WHT flags
 * This creates a dynamic flow that includes VAT/WHT steps when applicable
 */
export function getProcessSteps(
  boxType: BoxType,
  expenseType: ExpenseType | null,
  hasVat?: boolean,
  hasWht?: boolean
): ProcessStep[] {
  if (boxType === "INCOME") {
    // INCOME flow: สร้าง → ออกใบแจ้งหนี้ → รับเงิน → [รับ WHT] → ตรวจสอบ → เสร็จ
    const steps: ProcessStep[] = [
      INCOME_PHASE_CREATE,
      INCOME_PHASE_INVOICE,
      INCOME_PHASE_RECEIVE,
    ];
    
    // Add WHT step if applicable
    if (hasWht) {
      steps.push(STEP_WHT_RECEIVED);
    }
    
    steps.push(INCOME_PHASE_REVIEW, INCOME_PHASE_COMPLETE);
    return steps;
  }
  
  if (boxType === "ADJUSTMENT") {
    // Adjustments use simple expense flow
    return [
      EXPENSE_PHASE_CREATE,
      EXPENSE_PHASE_PREPARE,
      EXPENSE_PHASE_SUBMIT,
      EXPENSE_PHASE_REVIEW,
      EXPENSE_PHASE_COMPLETE,
    ];
  }
  
  // EXPENSE flow: สร้าง → เตรียมเอกสาร → ส่งบัญชี → [VAT] → [WHT] → ตรวจสอบ → เสร็จ
  const steps: ProcessStep[] = [
    EXPENSE_PHASE_CREATE,
    EXPENSE_PHASE_PREPARE,
    EXPENSE_PHASE_SUBMIT,
  ];
  
  // Add VAT step if applicable
  if (hasVat) {
    steps.push(STEP_VAT_RECEIVED);
  }
  
  // Add WHT step if applicable  
  if (hasWht) {
    steps.push(STEP_WHT_SENT);
  }
  
  steps.push(EXPENSE_PHASE_REVIEW, EXPENSE_PHASE_COMPLETE);
  return steps;
}

/**
 * Calculate the status of each step in the process
 */
export function calculateProcessStatus(
  steps: ProcessStep[],
  context: ProcessContext
): { step: ProcessStep; status: ProcessStepStatus }[] {
  const result: { step: ProcessStep; status: ProcessStepStatus }[] = [];
  let foundCurrent = false;
  
  for (const step of steps) {
    // Check if step should be skipped
    if (step.skipIf?.(context)) {
      result.push({ step, status: "skipped" });
      continue;
    }
    
    // Check if step is complete
    if (step.isComplete(context)) {
      result.push({ step, status: "completed" });
      continue;
    }
    
    // Check if this is the current step
    if (!foundCurrent && step.isCurrent(context)) {
      result.push({ step, status: "current" });
      foundCurrent = true;
      continue;
    }
    
    // If we haven't found current yet and this step isn't complete, it's current
    if (!foundCurrent) {
      result.push({ step, status: "current" });
      foundCurrent = true;
      continue;
    }
    
    // Everything else is pending
    result.push({ step, status: "pending" });
  }
  
  return result;
}

/**
 * Get current step information
 */
export function getCurrentStep(
  steps: ProcessStep[],
  context: ProcessContext
): { step: ProcessStep; index: number } | null {
  const processStatus = calculateProcessStatus(steps, context);
  const currentIndex = processStatus.findIndex((s) => s.status === "current");
  
  if (currentIndex === -1) {
    return null;
  }
  
  return {
    step: processStatus[currentIndex].step,
    index: currentIndex,
  };
}

/**
 * Calculate overall progress percentage
 */
export function calculateProgress(
  steps: ProcessStep[],
  context: ProcessContext
): number {
  const processStatus = calculateProcessStatus(steps, context);
  const activeSteps = processStatus.filter((s) => s.status !== "skipped");
  const completedSteps = activeSteps.filter((s) => s.status === "completed");
  
  if (activeSteps.length === 0) return 100;
  
  return Math.round((completedSteps.length / activeSteps.length) * 100);
}
