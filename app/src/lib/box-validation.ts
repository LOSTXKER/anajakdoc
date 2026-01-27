/**
 * Box Validation Service
 * ตรวจสอบความถูกต้องของข้อมูลในกล่องเอกสาร
 */

import type { SerializedBox, DocType } from "@/types";

// Types
export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  code: string;
  message: string;
  suggestion?: string;
  field?: string;
  canDismiss?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  hasWarnings: boolean;
  issues: ValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

// Validation Rules
interface ValidationContext {
  box: SerializedBox;
  documents: {
    docType: DocType;
    amount?: number | null;
    vatAmount?: number | null;
    docNumber?: string | null;
    aiExtracted?: {
      amount?: number;
      vatAmount?: number;
      taxId?: string;
      vendorName?: string;
    } | null;
  }[];
}

// ==================== Validation Functions ====================

/**
 * ตรวจสอบยอดเงินระหว่างเอกสาร
 */
function validateAmountConsistency(ctx: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // หาเอกสารหลัก (ใบกำกับ/Invoice)
  const primaryDoc = ctx.documents.find(d => 
    ["TAX_INVOICE", "INVOICE", "FOREIGN_INVOICE"].includes(d.docType)
  );
  
  // หาสลิป
  const slipDoc = ctx.documents.find(d => 
    ["SLIP_TRANSFER", "SLIP_CHEQUE"].includes(d.docType)
  );
  
  if (primaryDoc?.amount && slipDoc) {
    const primaryAmount = Number(primaryDoc.amount);
    const boxAmount = Number(ctx.box.totalAmount);
    const whtAmount = Number(ctx.box.whtAmount || 0);
    
    // ตรวจว่ายอดสลิปควรเท่ากับ ยอดใบกำกับ - WHT
    const expectedSlipAmount = boxAmount - whtAmount;
    const aiSlipAmount = slipDoc.aiExtracted?.amount;
    
    if (aiSlipAmount && Math.abs(aiSlipAmount - expectedSlipAmount) > 1) {
      // ต่างกันเกิน 1 บาท
      if (ctx.box.hasWht && whtAmount === 0) {
        issues.push({
          id: "amount-wht-mismatch",
          severity: "warning",
          code: "AMOUNT_WHT_MISMATCH",
          message: `ยอดสลิป (฿${aiSlipAmount.toLocaleString()}) ไม่ตรงกับยอดใบกำกับ (฿${boxAmount.toLocaleString()})`,
          suggestion: "อาจเป็นเพราะหัก ณ ที่จ่าย กรุณาตรวจสอบและกรอก WHT rate",
          canDismiss: true,
        });
      } else if (!ctx.box.hasWht) {
        issues.push({
          id: "amount-general-mismatch",
          severity: "warning",
          code: "AMOUNT_MISMATCH",
          message: `ยอดสลิป (฿${aiSlipAmount.toLocaleString()}) ไม่ตรงกับยอดรวม (฿${boxAmount.toLocaleString()})`,
          suggestion: "อาจจ่ายหลายงวด หรือมีส่วนลด กรุณาตรวจสอบ",
          canDismiss: true,
        });
      }
    }
  }
  
  return issues;
}

/**
 * ตรวจสอบ VAT ถูกต้อง
 */
function validateVat(ctx: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // ตรวจเฉพาะกล่องที่มี VAT (STANDARD expense type)
  if (ctx.box.expenseType !== "STANDARD") return issues;
  
  const totalAmount = Number(ctx.box.totalAmount);
  const vatAmount = Number(ctx.box.vatAmount);
  
  if (totalAmount > 0 && vatAmount > 0) {
    // คำนวณ VAT rate จากยอด
    const baseAmount = totalAmount - vatAmount;
    const calculatedRate = (vatAmount / baseAmount) * 100;
    
    // ตรวจว่า VAT rate ใกล้เคียง 7%
    if (Math.abs(calculatedRate - 7) > 0.5) {
      issues.push({
        id: "vat-rate-unusual",
        severity: "warning",
        code: "VAT_RATE_UNUSUAL",
        message: `VAT rate คำนวณได้ ${calculatedRate.toFixed(2)}% (ปกติควรเป็น 7%)`,
        suggestion: "กรุณาตรวจสอบยอดก่อน VAT และยอด VAT",
        field: "vatAmount",
        canDismiss: true,
      });
    }
  } else if (totalAmount > 0 && vatAmount === 0) {
    // มียอดแต่ไม่มี VAT
    issues.push({
      id: "vat-missing",
      severity: "info",
      code: "VAT_MISSING",
      message: "ยังไม่ได้กรอก VAT",
      suggestion: "บัญชีควรตรวจสอบและกรอก VAT จากใบกำกับภาษี",
      field: "vatAmount",
      canDismiss: false,
    });
  }
  
  return issues;
}

/**
 * ตรวจสอบ WHT ถูกต้อง
 */
function validateWht(ctx: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  if (!ctx.box.hasWht) return issues;
  
  const whtRate = Number(ctx.box.whtRate || 0);
  const whtAmount = Number(ctx.box.whtAmount || 0);
  const baseAmount = Number(ctx.box.totalAmount) - Number(ctx.box.vatAmount);
  
  // ตรวจว่ามี WHT flag แต่ยังไม่มี rate
  if (whtRate === 0 && whtAmount === 0) {
    issues.push({
      id: "wht-rate-missing",
      severity: "warning",
      code: "WHT_RATE_MISSING",
      message: "เลือกว่ามีหัก ณ ที่จ่าย แต่ยังไม่ได้กำหนด rate",
      suggestion: "บัญชีควรกำหนดอัตราหัก ณ ที่จ่าย (1%, 2%, 3%, 5%)",
      field: "whtRate",
      canDismiss: false,
    });
  }
  
  // ตรวจว่า WHT คำนวณถูกต้อง
  if (whtRate > 0 && whtAmount > 0) {
    const expectedWht = baseAmount * (whtRate / 100);
    if (Math.abs(expectedWht - whtAmount) > 1) {
      issues.push({
        id: "wht-amount-mismatch",
        severity: "warning",
        code: "WHT_AMOUNT_MISMATCH",
        message: `WHT ${whtRate}% ควรเป็น ฿${expectedWht.toFixed(2)} แต่กรอก ฿${whtAmount.toFixed(2)}`,
        suggestion: "กรุณาตรวจสอบยอดหัก ณ ที่จ่าย",
        field: "whtAmount",
        canDismiss: true,
      });
    }
  }
  
  return issues;
}

/**
 * ตรวจสอบคู่ค้า Tax ID
 */
function validateContact(ctx: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // หา Tax ID จากเอกสาร AI
  const docWithTaxId = ctx.documents.find(d => d.aiExtracted?.taxId);
  const aiTaxId = docWithTaxId?.aiExtracted?.taxId;
  
  // ถ้ากล่องมีคู่ค้าที่มี Tax ID
  const boxTaxId = ctx.box.contact?.taxId;
  
  if (aiTaxId && boxTaxId && aiTaxId !== boxTaxId) {
    issues.push({
      id: "taxid-mismatch",
      severity: "warning",
      code: "TAXID_MISMATCH",
      message: `Tax ID ในเอกสาร (${aiTaxId}) ไม่ตรงกับคู่ค้าที่เลือก (${boxTaxId})`,
      suggestion: "กรุณาตรวจสอบว่าเลือกคู่ค้าถูกต้อง",
      canDismiss: true,
    });
  }
  
  // ตรวจว่ากล่องมี VAT แต่ไม่มีคู่ค้าที่มี Tax ID
  if (ctx.box.expenseType === "STANDARD" && ctx.box.vatAmount > 0 && !boxTaxId) {
    issues.push({
      id: "contact-taxid-required",
      severity: "info",
      code: "CONTACT_TAXID_MISSING",
      message: "คู่ค้าไม่มี Tax ID (จำเป็นสำหรับการขอคืน VAT)",
      suggestion: "เพิ่ม Tax ID ให้คู่ค้า หรือเลือกคู่ค้าที่มี Tax ID แล้ว",
      canDismiss: true,
    });
  }
  
  return issues;
}

/**
 * ตรวจสอบเอกสารครบ
 */
function validateDocumentCompleteness(ctx: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  const docTypes = ctx.documents.map(d => d.docType);
  const hasSlip = docTypes.some(t => ["SLIP_TRANSFER", "SLIP_CHEQUE"].includes(t));
  const hasTaxInvoice = docTypes.includes("TAX_INVOICE");
  const hasCashReceipt = docTypes.some(t => ["CASH_RECEIPT", "RECEIPT", "OTHER"].includes(t));
  const hasForeignInvoice = docTypes.includes("FOREIGN_INVOICE");
  
  // STANDARD: ต้องมีใบกำกับภาษี
  if (ctx.box.expenseType === "STANDARD" && !hasTaxInvoice) {
    issues.push({
      id: "missing-tax-invoice",
      severity: "error",
      code: "MISSING_TAX_INVOICE",
      message: "ยังไม่มีใบกำกับภาษี",
      suggestion: "อัปโหลดใบกำกับภาษีเพื่อยืนยันยอดและขอคืน VAT",
      canDismiss: false,
    });
  }
  
  // NO_VAT: ต้องมีบิลเงินสดหรือใบเสร็จ
  if (ctx.box.expenseType === "NO_VAT" && !hasCashReceipt && !ctx.box.noReceiptReason) {
    issues.push({
      id: "missing-receipt",
      severity: "warning",
      code: "MISSING_RECEIPT",
      message: "ยังไม่มีบิลเงินสด/ใบเสร็จ",
      suggestion: "อัปโหลดบิลเงินสด หรือกดยืนยันว่าไม่มีบิล",
      canDismiss: false,
    });
  }
  
  // มีจ่ายเงินแต่ไม่มีสลิป
  if (ctx.box.paidAmount > 0 && !hasSlip) {
    issues.push({
      id: "missing-slip",
      severity: "info",
      code: "MISSING_SLIP",
      message: "จ่ายเงินแล้วแต่ยังไม่มีหลักฐานการโอน",
      suggestion: "อัปโหลดสลิปโอนเงินหรือสำเนาเช็ค",
      canDismiss: true,
    });
  }
  
  return issues;
}

// ==================== Main Validation Function ====================

/**
 * Validate a box and return all issues
 */
export function validateBox(box: SerializedBox): ValidationResult {
  // Build validation context
  const ctx: ValidationContext = {
    box,
    documents: box.documents?.map(d => ({
      docType: d.docType,
      amount: d.amount ? Number(d.amount) : null,
      vatAmount: d.vatAmount ? Number(d.vatAmount) : null,
      docNumber: d.docNumber,
      aiExtracted: d.aiExtracted as ValidationContext["documents"][0]["aiExtracted"],
    })) || [],
  };
  
  // Run all validations
  const issues: ValidationIssue[] = [
    ...validateDocumentCompleteness(ctx),
    ...validateAmountConsistency(ctx),
    ...validateVat(ctx),
    ...validateWht(ctx),
    ...validateContact(ctx),
  ];
  
  // Calculate summary
  const summary = {
    errors: issues.filter(i => i.severity === "error").length,
    warnings: issues.filter(i => i.severity === "warning").length,
    info: issues.filter(i => i.severity === "info").length,
  };
  
  return {
    isValid: summary.errors === 0,
    hasWarnings: summary.warnings > 0,
    issues,
    summary,
  };
}

/**
 * Get validation status label
 */
export function getValidationStatusLabel(result: ValidationResult): string {
  if (result.summary.errors > 0) {
    return `${result.summary.errors} ปัญหาที่ต้องแก้`;
  }
  if (result.summary.warnings > 0) {
    return `${result.summary.warnings} รายการควรตรวจสอบ`;
  }
  if (result.summary.info > 0) {
    return `${result.summary.info} แนะนำ`;
  }
  return "ตรวจสอบแล้ว";
}

/**
 * Get severity color class
 */
export function getSeverityColorClass(severity: ValidationSeverity): string {
  switch (severity) {
    case "error":
      return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800";
    case "warning":
      return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800";
    case "info":
      return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800";
    default:
      return "text-muted-foreground bg-muted border";
  }
}

/**
 * Get severity icon name
 */
export function getSeverityIcon(severity: ValidationSeverity): "XCircle" | "AlertTriangle" | "Info" {
  switch (severity) {
    case "error":
      return "XCircle";
    case "warning":
      return "AlertTriangle";
    case "info":
      return "Info";
  }
}
