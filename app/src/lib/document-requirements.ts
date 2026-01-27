/**
 * Document Requirements Configuration
 * Defines required documents for different box types and expense types
 * 
 * Uses centralized config from box-type-config.ts for labels
 */

import type { BoxType, ExpenseType, DocType } from "@/types";
import { getBoxTypeLabels } from "./config/box-type-config";

export interface RequiredDocument {
  id: string;
  docType: DocType;
  label: string;
  description: string;
  required: boolean;
  matchingDocTypes: DocType[]; // Doc types that satisfy this requirement
}

/**
 * Get required documents based on box configuration
 */
export function getRequiredDocuments(
  boxType: BoxType,
  expenseType: ExpenseType | null,
  hasVat: boolean,
  hasWht: boolean
): RequiredDocument[] {
  const docs: RequiredDocument[] = [];
  const labels = getBoxTypeLabels(boxType);

  if (boxType === "EXPENSE") {
    switch (expenseType) {
      case "STANDARD":
        docs.push({
          id: "tax_invoice",
          docType: "TAX_INVOICE",
          label: labels.vat,
          description: "เอกสารหลักสำหรับขอคืน VAT",
          required: true,
          matchingDocTypes: ["TAX_INVOICE", "TAX_INVOICE_ABB"],
        });
        docs.push({
          id: "payment_proof",
          docType: "SLIP_TRANSFER",
          label: `หลักฐาน${labels.payment}`,
          description: "สลิปโอนเงิน, เช็ค หรือ Statement",
          required: true,
          matchingDocTypes: ["SLIP_TRANSFER", "SLIP_CHEQUE", "BANK_STATEMENT", "CREDIT_CARD_STATEMENT"],
        });
        break;

      case "NO_VAT":
        docs.push({
          id: "cash_receipt",
          docType: "CASH_RECEIPT",
          label: "บิลเงินสด/ใบเสร็จ",
          description: `บิลเงินสด หรือใบเสร็จจาก${labels.contactShort}`,
          required: true,
          matchingDocTypes: ["CASH_RECEIPT", "RECEIPT", "OTHER"],
        });
        docs.push({
          id: "payment_proof",
          docType: "SLIP_TRANSFER",
          label: `หลักฐาน${labels.payment}`,
          description: "สลิปโอนเงิน หรือยืนยันจ่ายเงินสด",
          required: true,
          matchingDocTypes: ["SLIP_TRANSFER", "SLIP_CHEQUE", "BANK_STATEMENT"],
        });
        break;

      default:
        docs.push({
          id: "expense_doc",
          docType: "TAX_INVOICE",
          label: "เอกสารค่าใช้จ่าย",
          description: "ใบกำกับภาษี, ใบเสร็จ หรือบิล",
          required: true,
          matchingDocTypes: ["TAX_INVOICE", "TAX_INVOICE_ABB", "RECEIPT", "CASH_RECEIPT"],
        });
        docs.push({
          id: "payment_proof",
          docType: "SLIP_TRANSFER",
          label: `หลักฐาน${labels.payment}`,
          description: "สลิปโอนเงิน หรือหลักฐานการจ่าย",
          required: true,
          matchingDocTypes: ["SLIP_TRANSFER", "SLIP_CHEQUE", "BANK_STATEMENT"],
        });
    }

    // EXPENSE WHT: เราออกหนังสือให้ผู้ขาย
    if (hasWht) {
      docs.push({
        id: "wht",
        docType: "WHT_SENT",
        label: "หนังสือหัก ณ ที่จ่าย",
        description: "หนังสือรับรองการหักภาษี ณ ที่จ่าย",
        required: true,
        matchingDocTypes: ["WHT_SENT"],
      });
    }
  } else if (boxType === "INCOME") {
    docs.push({
      id: "invoice",
      docType: "INVOICE",
      label: "ใบแจ้งหนี้",
      description: `ใบแจ้งหนี้ที่ออกให้${labels.contactShort}`,
      required: true,
      matchingDocTypes: ["INVOICE"],
    });

    if (hasVat) {
      docs.push({
        id: "tax_invoice",
        docType: "TAX_INVOICE",
        label: labels.vat,
        description: `ใบกำกับภาษีที่ออกให้${labels.contactShort}`,
        required: true,
        matchingDocTypes: ["TAX_INVOICE"],
      });
    }

    docs.push({
      id: "payment_proof",
      docType: "RECEIPT",
      label: `หลักฐาน${labels.payment}`,
      description: "สลิปโอนเข้า หรือใบเสร็จรับเงิน",
      required: false,
      matchingDocTypes: ["RECEIPT", "SLIP_TRANSFER", "BANK_STATEMENT"],
    });

    // INCOME WHT: เรารับหนังสือจากลูกค้า
    if (hasWht) {
      docs.push({
        id: "wht_incoming",
        docType: "WHT_INCOMING",
        label: "หนังสือหัก ณ ที่จ่าย",
        description: `หนังสือหัก ณ ที่จ่ายจาก${labels.contactShort}`,
        required: true,
        matchingDocTypes: ["WHT_INCOMING", "WHT_RECEIVED"],
      });
    }
  }

  return docs;
}

/**
 * Check if a file satisfies a requirement
 */
export function doesFileMatchRequirement(
  fileDocType: DocType,
  requirement: RequiredDocument
): boolean {
  return requirement.matchingDocTypes.includes(fileDocType);
}

/**
 * Check if all required documents are present
 */
export function checkDocumentCompleteness(
  requirements: RequiredDocument[],
  files: Array<{ docType: DocType }>
): {
  isComplete: boolean;
  missingDocs: RequiredDocument[];
  completedDocs: RequiredDocument[];
} {
  const fileDocTypes = files.map(f => f.docType);
  
  const missingDocs = requirements.filter(req => 
    req.required && !req.matchingDocTypes.some(type => fileDocTypes.includes(type))
  );
  
  const completedDocs = requirements.filter(req =>
    req.matchingDocTypes.some(type => fileDocTypes.includes(type))
  );

  return {
    isComplete: missingDocs.length === 0,
    missingDocs,
    completedDocs,
  };
}
