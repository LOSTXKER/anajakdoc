import type { BoxType, DocType, ExpenseType } from "@/types";
import { EXPENSE_TYPE_CONFIG } from "./document-config";

// Checklist item definition
export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  required: boolean;
  completed: boolean;
  relatedDocType?: DocType;
  canToggle: boolean; // บางอันต้องอัปโหลดเอกสารถึงจะเสร็จ บางอันกดติ๊กได้เลย
}

// Box checklist state (for tracking document completeness)
export interface BoxChecklist {
  isPaid: boolean;           // จ่ายเงิน/รับเงินแล้ว
  hasPaymentProof: boolean;  // มีหลักฐานการจ่าย (สลิป)
  hasTaxInvoice: boolean;    // มีใบกำกับภาษี
  hasInvoice: boolean;       // มีใบแจ้งหนี้ (สำหรับรายรับ)
  whtIssued: boolean;        // ออก WHT แล้ว
  whtSent: boolean;          // ส่ง WHT แล้ว
  whtReceived: boolean;      // ได้รับ WHT แล้ว
}

// ==================== Expense Checklist ====================

/**
 * Get checklist items for EXPENSE box based on ExpenseType
 */
export function getExpenseChecklist(
  expenseType: ExpenseType | null,
  hasVat: boolean,
  hasWht: boolean,
  checklist: BoxChecklist,
  uploadedDocTypes: Set<DocType>,
  noReceiptReason?: string | null
): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  
  // Get required docs from expense type config
  const config = expenseType ? EXPENSE_TYPE_CONFIG[expenseType] : null;
  const requiredDocs = config?.requiredDocs || [];
  
  // Special case: Petty Cash
  if (expenseType === "PETTY_CASH") {
    items.push({
      id: "isPaid",
      label: "จ่ายเงินสดแล้ว",
      description: "ยืนยันว่าได้ชำระเงินสดแล้ว",
      required: true,
      completed: checklist.isPaid,
      canToggle: true,
    });
    
    items.push({
      id: "hasPaymentProof",
      label: "มีใบสำคัญจ่าย/บิล",
      description: "อัปโหลดใบสำคัญจ่ายหรือบิลเงินสด",
      required: false, // optional สำหรับจ่ายสด
      completed: hasPaymentEvidence(uploadedDocTypes) || checklist.hasPaymentProof,
      relatedDocType: "PETTY_CASH_VOUCHER",
      canToggle: false,
    });
    return items;
  }
  
  // Standard flow for other expense types
  
  // Check if has slip uploaded
  const hasSlipUploaded = hasPaymentEvidence(uploadedDocTypes);
  
  // 1. การชำระเงิน (รวม isPaid + hasPaymentProof เป็น 1 item)
  // - มีสลิป → completed (auto จาก payment record)
  // - ไม่มีสลิป แต่ยืนยันจ่ายเงินสด → completed
  // - ยังไม่จ่าย → pending
  const paymentDescription = checklist.isPaid
    ? hasSlipUploaded
      ? "ชำระแล้ว - มีหลักฐานการโอน"
      : "ชำระแล้ว - ยืนยันจ่ายเงินสด"
    : "รอชำระเงิน";
    
  items.push({
    id: "payment",
    label: "การชำระเงิน",
    description: paymentDescription,
    required: true,
    completed: checklist.isPaid,
    relatedDocType: "SLIP_TRANSFER",
    canToggle: true, // สามารถกด "จ่ายเงินสด" หรือ อัปโหลดสลิปได้
  });
  
  // 3. มีใบกำกับภาษี (ถ้าต้องการ VAT)
  const needsTaxInvoice = requiredDocs.includes("TAX_INVOICE") || hasVat;
  if (needsTaxInvoice) {
    items.push({
      id: "hasTaxInvoice",
      label: "มีใบกำกับภาษี",
      description: "อัปโหลดใบกำกับภาษีจากผู้ขาย",
      required: true,
      completed: hasTaxInvoiceEvidence(uploadedDocTypes) || checklist.hasTaxInvoice,
      relatedDocType: "TAX_INVOICE",
      canToggle: false,
    });
  }
  
  // 3b. มีบิลเงินสด (สำหรับ NO_VAT - ไม่มีใบกำกับภาษี)
  // บังคับอัปโหลดบิลเงินสด แต่ถ้าไม่มีก็กดยืนยัน "ไม่มีบิล" ได้
  if (expenseType === "NO_VAT") {
    const hasCashReceipt = uploadedDocTypes.has("CASH_RECEIPT") || 
                           uploadedDocTypes.has("RECEIPT") ||
                           uploadedDocTypes.has("OTHER");
    const noCashReceiptConfirmed = noReceiptReason === "NO_CASH_RECEIPT";
    items.push({
      id: "hasCashReceipt",
      label: "มีบิลเงินสด",
      description: noCashReceiptConfirmed 
        ? "ยืนยันแล้วว่าไม่มีบิลเงินสด" 
        : "อัปโหลดบิลเงินสด หรือกดยืนยันถ้าไม่มีบิล",
      required: true,
      completed: hasCashReceipt || noCashReceiptConfirmed,
      relatedDocType: "CASH_RECEIPT",
      canToggle: true, // กดยืนยัน "ไม่มีบิล" ได้
    });
  }
  
  // 4. Foreign invoice (สำหรับ FOREIGN)
  if (expenseType === "FOREIGN") {
    items.push({
      id: "hasForeignInvoice",
      label: "มี Invoice ต่างประเทศ",
      description: "อัปโหลด Invoice จากต่างประเทศ",
      required: true,
      completed: uploadedDocTypes.has("FOREIGN_INVOICE"),
      relatedDocType: "FOREIGN_INVOICE",
      canToggle: false,
    });
  }
  
  // 6. WHT items (ถ้ามี WHT)
  if (hasWht) {
    items.push({
      id: "whtIssued",
      label: "ออกหนังสือหัก ณ ที่จ่ายแล้ว",
      description: "อัปโหลดหนังสือหัก ณ ที่จ่าย",
      required: true,
      completed: uploadedDocTypes.has("WHT_SENT") || checklist.whtIssued,
      relatedDocType: "WHT_SENT",
      canToggle: false,
    });
    
    items.push({
      id: "whtSent",
      label: "ส่งหนังสือหัก ณ ที่จ่ายแล้ว",
      description: "ยืนยันว่าส่งให้คู่ค้าแล้ว",
      required: true,
      completed: checklist.whtSent,
      canToggle: true, // toggle ได้หลังออก WHT แล้ว
    });
  }
  
  return items;
}

// ==================== Income Checklist ====================

/**
 * Get checklist items for INCOME box
 */
export function getIncomeChecklist(
  hasVat: boolean,
  hasWht: boolean,
  checklist: BoxChecklist,
  uploadedDocTypes: Set<DocType>
): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  
  // 1. ออกใบแจ้งหนี้แล้ว
  items.push({
    id: "hasInvoice",
    label: "ออกใบแจ้งหนี้แล้ว",
    description: "อัปโหลดใบแจ้งหนี้ที่ออกให้ลูกค้า",
    required: true,
    completed: uploadedDocTypes.has("INVOICE") || checklist.hasInvoice,
    relatedDocType: "INVOICE",
    canToggle: false,
  });
  
  // 2. ออกใบกำกับภาษีแล้ว (ถ้ามี VAT)
  if (hasVat) {
    items.push({
      id: "hasTaxInvoice",
      label: "ออกใบกำกับภาษีแล้ว",
      description: "อัปโหลดใบกำกับภาษีที่ออกให้ลูกค้า",
      required: true,
      completed: hasTaxInvoiceEvidence(uploadedDocTypes) || checklist.hasTaxInvoice,
      relatedDocType: "TAX_INVOICE",
      canToggle: false,
    });
  }
  
  // 3. รับเงินแล้ว
  items.push({
    id: "isPaid",
    label: "รับเงินแล้ว",
    description: "ยืนยันว่าได้รับเงินแล้ว",
    required: true,
    completed: checklist.isPaid,
    canToggle: true,
  });
  
  // 4. มีหลักฐานการรับเงิน (optional)
  items.push({
    id: "hasPaymentProof",
    label: "มีหลักฐานการรับเงิน",
    description: "อัปโหลดหลักฐานการรับเงิน",
    required: false,
    completed: hasPaymentEvidence(uploadedDocTypes) || uploadedDocTypes.has("RECEIPT") || checklist.hasPaymentProof,
    relatedDocType: "RECEIPT",
    canToggle: false,
  });
  
  // 5. ได้รับ WHT จากลูกค้า (ถ้าถูกหัก)
  if (hasWht) {
    items.push({
      id: "whtReceived",
      label: "ได้รับหนังสือหัก ณ ที่จ่ายแล้ว",
      description: "อัปโหลดหนังสือหัก ณ ที่จ่ายที่ได้รับจากลูกค้า",
      required: true,
      completed: uploadedDocTypes.has("WHT_INCOMING") || uploadedDocTypes.has("WHT_RECEIVED") || checklist.whtReceived,
      relatedDocType: "WHT_INCOMING",
      canToggle: false,
    });
  }
  
  return items;
}

// ==================== Main Function ====================

/**
 * Get checklist for any box type
 */
export function getBoxChecklist(
  boxType: BoxType,
  expenseType: ExpenseType | null,
  hasVat: boolean,
  hasWht: boolean,
  checklist: BoxChecklist,
  uploadedDocTypes: Set<DocType>,
  noReceiptReason?: string | null
): ChecklistItem[] {
  if (boxType === "EXPENSE") {
    return getExpenseChecklist(expenseType, hasVat, hasWht, checklist, uploadedDocTypes, noReceiptReason);
  }
  if (boxType === "INCOME") {
    return getIncomeChecklist(hasVat, hasWht, checklist, uploadedDocTypes);
  }
  
  // ADJUSTMENT - minimal checklist
  return [
    {
      id: "hasDocument",
      label: "มีเอกสารประกอบ",
      description: "CN/DN หรือหลักฐานการคืนเงิน",
      required: true,
      completed: uploadedDocTypes.size > 0,
      canToggle: false,
    },
  ];
}

// ==================== Helper Functions ====================

/**
 * Check if has any payment evidence document
 */
function hasPaymentEvidence(uploadedDocTypes: Set<DocType>): boolean {
  const paymentDocs: DocType[] = [
    "SLIP_TRANSFER",
    "SLIP_CHEQUE",
    "BANK_STATEMENT",
    "CREDIT_CARD_STATEMENT",
    "ONLINE_RECEIPT",
    "PETTY_CASH_VOUCHER",
  ];
  return paymentDocs.some((doc) => uploadedDocTypes.has(doc));
}

/**
 * Check if has tax invoice evidence
 */
function hasTaxInvoiceEvidence(uploadedDocTypes: Set<DocType>): boolean {
  return uploadedDocTypes.has("TAX_INVOICE") || uploadedDocTypes.has("TAX_INVOICE_ABB");
}

// ==================== Calculation Functions ====================

/**
 * Calculate completion percentage
 */
export function calculateCompletionPercent(items: ChecklistItem[]): number {
  const requiredItems = items.filter((item) => item.required);
  if (requiredItems.length === 0) return 100;
  
  const completedRequired = requiredItems.filter((item) => item.completed).length;
  return Math.round((completedRequired / requiredItems.length) * 100);
}

/**
 * Check if all required items are completed
 */
export function isAllRequiredComplete(items: ChecklistItem[]): boolean {
  return items.filter((item) => item.required).every((item) => item.completed);
}

/**
 * Get status label based on completion
 */
export function getStatusLabel(completionPercent: number, isExported: boolean): string {
  if (isExported) return "Export แล้ว";
  if (completionPercent === 100) return "เอกสารครบ";
  return "กำลังดำเนินการ";
}

/**
 * Get status color
 */
export function getStatusColor(completionPercent: number, isExported: boolean): string {
  if (isExported) return "bg-purple-100 text-purple-700";
  if (completionPercent === 100) return "bg-green-100 text-green-700";
  if (completionPercent >= 50) return "bg-yellow-100 text-yellow-700";
  return "bg-orange-100 text-orange-700";
}

// ==================== Server-side Helpers ====================

/**
 * Calculate completion percentage for server-side use
 */
export function calculateServerCompletionPercent(params: {
  boxType: BoxType;
  expenseType: ExpenseType | null;
  hasVat: boolean;
  hasWht: boolean;
  checklist: BoxChecklist;
  uploadedDocTypes: Set<DocType>;
  noReceiptReason?: string | null;
}): { completionPercent: number; isComplete: boolean } {
  const { boxType, expenseType, hasVat, hasWht, checklist, uploadedDocTypes, noReceiptReason } = params;
  
  const items = getBoxChecklist(
    boxType,
    expenseType,
    hasVat,
    hasWht,
    checklist,
    uploadedDocTypes,
    noReceiptReason
  );
  
  const completionPercent = calculateCompletionPercent(items);
  const isComplete = isAllRequiredComplete(items);
  
  return { completionPercent, isComplete };
}

/**
 * Get auto-updates based on uploaded doc types
 * Returns partial checklist updates that should be applied
 */
export function getAutoChecklistUpdates(uploadedDocTypes: Set<DocType>): Partial<BoxChecklist> {
  const updates: Partial<BoxChecklist> = {};
  
  // Payment evidence
  if (hasPaymentEvidence(uploadedDocTypes)) {
    updates.hasPaymentProof = true;
  }
  
  // Tax invoice
  if (hasTaxInvoiceEvidence(uploadedDocTypes)) {
    updates.hasTaxInvoice = true;
  }
  
  // Invoice
  if (uploadedDocTypes.has("INVOICE")) {
    updates.hasInvoice = true;
  }
  
  // WHT sent
  if (uploadedDocTypes.has("WHT_SENT")) {
    updates.whtIssued = true;
  }
  
  // WHT received
  if (uploadedDocTypes.has("WHT_INCOMING") || uploadedDocTypes.has("WHT_RECEIVED")) {
    updates.whtReceived = true;
  }
  
  // Receipt also counts as payment proof
  if (uploadedDocTypes.has("RECEIPT")) {
    updates.hasPaymentProof = true;
  }
  
  return updates;
}

/**
 * Determine DocStatus based on checklist completion
 */
export function determineDocStatus(
  boxType: BoxType,
  expenseType: ExpenseType | null,
  hasVat: boolean,
  hasWht: boolean,
  checklist: BoxChecklist,
  uploadedDocTypes: Set<DocType>,
  noReceiptReason?: string | null
): "INCOMPLETE" | "COMPLETE" | "NA" {
  // If has noReceiptReason that's NOT "NO_CASH_RECEIPT", mark as NA (no documents needed)
  // "NO_CASH_RECEIPT" is a special case that still requires other documents
  if (noReceiptReason && noReceiptReason !== "NO_CASH_RECEIPT") {
    return "NA";
  }
  
  const { isComplete } = calculateServerCompletionPercent({
    boxType,
    expenseType,
    hasVat,
    hasWht,
    checklist,
    uploadedDocTypes,
    noReceiptReason,
  });
  
  return isComplete ? "COMPLETE" : "INCOMPLETE";
}
