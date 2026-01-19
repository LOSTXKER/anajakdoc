import type { TransactionType, SubDocType } from ".prisma/client";

// Checklist item definition
export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  required: boolean;
  completed: boolean;
  relatedDocType?: SubDocType;
  canToggle: boolean; // บางอันต้องอัปโหลดเอกสารถึงจะเสร็จ บางอันกดติ๊กได้เลย
}

// Document checklist state
export interface DocumentChecklist {
  isPaid: boolean;
  hasPaymentProof: boolean;
  hasTaxInvoice: boolean;
  hasInvoice: boolean;
  whtIssued: boolean;
  whtSent: boolean;
  whtReceived: boolean;
}

// Get checklist items for EXPENSE
export function getExpenseChecklist(
  hasVat: boolean,
  hasWht: boolean,
  checklist: DocumentChecklist,
  uploadedDocTypes: Set<SubDocType>
): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  // 1. จ่ายเงินแล้ว
  items.push({
    id: "isPaid",
    label: "จ่ายเงินแล้ว",
    description: "ยืนยันว่าได้ชำระเงินแล้ว",
    required: true,
    completed: checklist.isPaid,
    canToggle: true,
  });

  // 2. มีหลักฐานการจ่าย (สลิป)
  items.push({
    id: "hasPaymentProof",
    label: "มีหลักฐานการจ่าย",
    description: "อัปโหลดสลิปโอนเงิน",
    required: true,
    completed: uploadedDocTypes.has("SLIP") || checklist.hasPaymentProof,
    relatedDocType: "SLIP",
    canToggle: false,
  });

  // 3. มีใบกำกับภาษี (ถ้ามี VAT)
  if (hasVat) {
    items.push({
      id: "hasTaxInvoice",
      label: "มีใบกำกับภาษี",
      description: "อัปโหลดใบกำกับภาษีจากผู้ขาย",
      required: true,
      completed: uploadedDocTypes.has("TAX_INVOICE") || checklist.hasTaxInvoice,
      relatedDocType: "TAX_INVOICE",
      canToggle: false,
    });
  }

  // 4. ออกหนังสือหัก ณ ที่จ่ายแล้ว (ถ้ามี WHT)
  if (hasWht) {
    items.push({
      id: "whtIssued",
      label: "ออกหนังสือหัก ณ ที่จ่ายแล้ว",
      description: "อัปโหลดหนังสือหัก ณ ที่จ่าย",
      required: true,
      completed: uploadedDocTypes.has("WHT_CERT_SENT") || checklist.whtIssued,
      relatedDocType: "WHT_CERT_SENT",
      canToggle: false,
    });

    // 5. ส่งหนังสือหัก ณ ที่จ่ายให้คู่ค้าแล้ว
    items.push({
      id: "whtSent",
      label: "ส่งหนังสือหัก ณ ที่จ่ายแล้ว",
      description: "ยืนยันว่าส่งให้คู่ค้าแล้ว",
      required: true,
      completed: checklist.whtSent,
      canToggle: true, // ต้องมีหนังสือก่อนถึงจะติ๊กได้
    });
  }

  return items;
}

// Get checklist items for INCOME
export function getIncomeChecklist(
  hasVat: boolean,
  hasWht: boolean,
  checklist: DocumentChecklist,
  uploadedDocTypes: Set<SubDocType>
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
      completed: uploadedDocTypes.has("TAX_INVOICE") || checklist.hasTaxInvoice,
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

  // 4. มีหลักฐานการรับเงิน
  items.push({
    id: "hasPaymentProof",
    label: "มีหลักฐานการรับเงิน",
    description: "อัปโหลดหลักฐานการรับเงิน",
    required: false,
    completed: uploadedDocTypes.has("RECEIPT") || uploadedDocTypes.has("SLIP") || checklist.hasPaymentProof,
    relatedDocType: "RECEIPT",
    canToggle: false,
  });

  // 5. ได้รับหนังสือหัก ณ ที่จ่ายแล้ว (ถ้าถูกหัก)
  if (hasWht) {
    items.push({
      id: "whtReceived",
      label: "ได้รับหนังสือหัก ณ ที่จ่ายแล้ว",
      description: "อัปโหลดหนังสือหัก ณ ที่จ่ายที่ได้รับจากลูกค้า",
      required: true,
      completed: uploadedDocTypes.has("WHT_CERT_RECEIVED") || checklist.whtReceived,
      relatedDocType: "WHT_CERT_RECEIVED",
      canToggle: false,
    });
  }

  return items;
}

// Get checklist for any transaction type
export function getDocumentChecklist(
  transactionType: TransactionType,
  hasVat: boolean,
  hasWht: boolean,
  checklist: DocumentChecklist,
  uploadedDocTypes: Set<SubDocType>
): ChecklistItem[] {
  if (transactionType === "EXPENSE") {
    return getExpenseChecklist(hasVat, hasWht, checklist, uploadedDocTypes);
  }
  return getIncomeChecklist(hasVat, hasWht, checklist, uploadedDocTypes);
}

// Calculate completion percentage
export function calculateCompletionPercent(items: ChecklistItem[]): number {
  const requiredItems = items.filter((item) => item.required);
  if (requiredItems.length === 0) return 100;

  const completedRequired = requiredItems.filter((item) => item.completed).length;
  return Math.round((completedRequired / requiredItems.length) * 100);
}

// Check if all required items are completed
export function isAllRequiredComplete(items: ChecklistItem[]): boolean {
  return items.filter((item) => item.required).every((item) => item.completed);
}

// Get status label based on completion
export function getStatusLabel(completionPercent: number, isExported: boolean, isBooked: boolean): string {
  if (isBooked) return "บันทึกบัญชีแล้ว";
  if (isExported) return "Export แล้ว";
  if (completionPercent === 100) return "เอกสารครบ";
  return "กำลังดำเนินการ";
}

// Get status color
export function getStatusColor(completionPercent: number, isExported: boolean, isBooked: boolean): string {
  if (isBooked) return "bg-primary/10 text-primary";
  if (isExported) return "bg-purple-100 text-purple-700";
  if (completionPercent === 100) return "bg-green-100 text-green-700";
  if (completionPercent >= 50) return "bg-yellow-100 text-yellow-700";
  return "bg-orange-100 text-orange-700";
}
