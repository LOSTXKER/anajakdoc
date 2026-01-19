"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

export type DocumentClassification = {
  type: "SLIP" | "TAX_INVOICE" | "INVOICE" | "RECEIPT" | "WHT_CERT_SENT" | "WHT_CERT_RECEIVED" | "QUOTATION" | "OTHER";
  confidence: number;
  reason: string;
};

export type ExtractedDocumentData = {
  type: DocumentClassification["type"];
  confidence: number;
  reason: string;
  // Extracted fields
  description?: string;      // รายละเอียด/รายการ
  amount?: number;           // ยอดเงิน
  contactName?: string;      // ชื่อผู้ขาย/ผู้รับ
  documentDate?: string;     // วันที่เอกสาร (YYYY-MM-DD)
  documentNumber?: string;   // เลขที่เอกสาร
  taxId?: string;           // เลขประจำตัวผู้เสียภาษี
  vatAmount?: number;       // ยอด VAT (ถ้ามี)
  items?: string[];         // รายการสินค้า/บริการ
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const DOCUMENT_TYPES = {
  SLIP: "สลิปโอนเงิน/หลักฐานการชำระเงิน",
  TAX_INVOICE: "ใบกำกับภาษี",
  INVOICE: "ใบแจ้งหนี้/Invoice",
  RECEIPT: "ใบเสร็จรับเงิน",
  WHT_CERT_SENT: "หนังสือรับรองหัก ณ ที่จ่าย (50 ทวิ)",
  WHT_CERT_RECEIVED: "หนังสือรับรองหัก ณ ที่จ่าย (50 ทวิ)",
  QUOTATION: "ใบเสนอราคา",
  OTHER: "เอกสารอื่นๆ",
};

// Simple classification only
export async function classifyDocument(
  base64Data: string,
  mimeType: string
): Promise<{ success: boolean; data?: DocumentClassification; error?: string }> {
  if (!process.env.GEMINI_API_KEY) {
    return { success: false, error: "Gemini API key not configured" };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `คุณเป็น AI ที่เชี่ยวชาญในการจำแนกประเภทเอกสารทางบัญชีของไทย

วิเคราะห์รูปภาพเอกสารนี้และระบุว่าเป็นเอกสารประเภทใด:

1. SLIP - สลิปโอนเงิน/หลักฐานการชำระเงิน (มักมีข้อความ "โอนเงินสำเร็จ", "Transfer", แสดงยอดเงิน, วันที่ทำรายการ)
2. TAX_INVOICE - ใบกำกับภาษี (ต้องมีคำว่า "ใบกำกับภาษี" หรือ "Tax Invoice", มีเลขประจำตัวผู้เสียภาษี, มียอด VAT แยก)
3. INVOICE - ใบแจ้งหนี้ (มีคำว่า "ใบแจ้งหนี้" หรือ "Invoice", รายการสินค้า/บริการ, ยอดเงินที่ต้องชำระ)
4. RECEIPT - ใบเสร็จรับเงิน (มีคำว่า "ใบเสร็จรับเงิน" หรือ "Receipt", ยืนยันการรับเงินแล้ว)
5. WHT_CERT_SENT - หนังสือรับรองหัก ณ ที่จ่าย (มีคำว่า "หนังสือรับรองการหักภาษี ณ ที่จ่าย", "50 ทวิ", แบบฟอร์มภาษี)
6. QUOTATION - ใบเสนอราคา (มีคำว่า "ใบเสนอราคา" หรือ "Quotation")
7. OTHER - เอกสารอื่นๆ ที่ไม่ใช่ข้างต้น

ตอบเป็น JSON format เท่านั้น:
{
  "type": "SLIP|TAX_INVOICE|INVOICE|RECEIPT|WHT_CERT_SENT|QUOTATION|OTHER",
  "confidence": 0.0-1.0,
  "reason": "เหตุผลสั้นๆ ภาษาไทย"
}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: "ไม่สามารถวิเคราะห์เอกสารได้" };
    }

    const parsed = JSON.parse(jsonMatch[0]) as DocumentClassification;
    
    // Validate the type
    if (!Object.keys(DOCUMENT_TYPES).includes(parsed.type)) {
      parsed.type = "OTHER";
    }

    return { success: true, data: parsed };
  } catch (error) {
    console.error("Error classifying document:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการวิเคราะห์เอกสาร" };
  }
}

// Full extraction - classify AND extract data
export async function extractDocumentData(
  base64Data: string,
  mimeType: string
): Promise<{ success: boolean; data?: ExtractedDocumentData; error?: string }> {
  if (!process.env.GEMINI_API_KEY) {
    return { success: false, error: "Gemini API key not configured" };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `คุณเป็น AI ที่เชี่ยวชาญในการอ่านและดึงข้อมูลจากเอกสารทางบัญชีของไทย

วิเคราะห์รูปภาพเอกสารนี้และดึงข้อมูลให้ครบถ้วน:

## ประเภทเอกสาร (type):
1. SLIP - สลิปโอนเงิน/หลักฐานการชำระเงิน
2. TAX_INVOICE - ใบกำกับภาษี (มีคำว่า "ใบกำกับภาษี", มี VAT แยก)
3. INVOICE - ใบแจ้งหนี้
4. RECEIPT - ใบเสร็จรับเงิน
5. WHT_CERT_SENT - หนังสือรับรองหัก ณ ที่จ่าย (50 ทวิ)
6. QUOTATION - ใบเสนอราคา
7. OTHER - เอกสารอื่นๆ

## ข้อมูลที่ต้องดึง:
- description: รายละเอียด/รายการหลักที่ซื้อ (สรุปสั้นๆ เช่น "ค่าโฆษณา Facebook", "ค่าอาหาร", "ค่าเช่าออฟฟิศ")
- amount: ยอดเงินรวมสุทธิที่ต้องจ่าย (ตัวเลขเท่านั้น ไม่ใส่ comma หรือ บาท)
- contactName: ชื่อบริษัท/ร้านค้า/ผู้รับเงิน (ถ้าเป็นสลิปดูชื่อบัญชีปลายทาง)
- documentDate: วันที่ในเอกสาร (format: YYYY-MM-DD)
- documentNumber: เลขที่เอกสาร/เลขที่ใบกำกับ/เลขที่รายการ
- taxId: เลขประจำตัวผู้เสียภาษี 13 หลัก (ถ้ามี)
- vatAmount: ยอด VAT (ตัวเลขเท่านั้น ถ้ามี)
- items: รายการสินค้า/บริการ (array of strings สูงสุด 5 รายการ)

## กฎสำคัญ:
- ถ้าไม่เห็นข้อมูลชัดเจน ให้ใส่ null
- amount ต้องเป็นตัวเลขเท่านั้น (เช่น 1500.50)
- วันที่ต้อง format YYYY-MM-DD (เช่น 2026-01-19)
- description ควรสั้นกระชับ ไม่เกิน 50 ตัวอักษร

ตอบเป็น JSON format เท่านั้น:
{
  "type": "SLIP|TAX_INVOICE|INVOICE|RECEIPT|WHT_CERT_SENT|QUOTATION|OTHER",
  "confidence": 0.0-1.0,
  "reason": "เหตุผลสั้นๆ ที่จำแนกเป็นประเภทนี้",
  "description": "รายละเอียดการซื้อ/จ่าย",
  "amount": 1234.56,
  "contactName": "ชื่อบริษัท/ร้านค้า",
  "documentDate": "2026-01-19",
  "documentNumber": "INV-001",
  "taxId": "0105XXXXXXXXX",
  "vatAmount": 100.00,
  "items": ["รายการ 1", "รายการ 2"]
}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: "ไม่สามารถวิเคราะห์เอกสารได้" };
    }

    const parsed = JSON.parse(jsonMatch[0]) as ExtractedDocumentData;
    
    // Validate the type
    if (!Object.keys(DOCUMENT_TYPES).includes(parsed.type)) {
      parsed.type = "OTHER";
    }

    // Clean up amount - ensure it's a number
    if (parsed.amount && typeof parsed.amount === "string") {
      parsed.amount = parseFloat(String(parsed.amount).replace(/[,฿บาท\s]/g, ""));
    }
    if (parsed.vatAmount && typeof parsed.vatAmount === "string") {
      parsed.vatAmount = parseFloat(String(parsed.vatAmount).replace(/[,฿บาท\s]/g, ""));
    }

    return { success: true, data: parsed };
  } catch (error) {
    console.error("Error extracting document data:", error);
    // Return more specific error message
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", errorMessage);
    return { success: false, error: `เกิดข้อผิดพลาด: ${errorMessage}` };
  }
}

// Helper to convert File to base64
export async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Types for matching
export type DocumentBoxMatch = {
  documentId: string;
  docNumber: string;
  contactName?: string;
  amount?: number;
  matchScore: number;
  matchReasons: string[];
};

export type MatchResult = {
  hasMatch: boolean;
  matches: DocumentBoxMatch[];
  suggestedAction: "add_to_existing" | "create_new";
  reason: string;
};

// Match extracted data against existing document boxes
export async function findMatchingDocumentBox(
  extractedData: ExtractedDocumentData,
  existingBoxes: Array<{
    id: string;
    docNumber: string;
    description?: string | null;
    totalAmount: number;
    docDate: Date;
    contactId?: string | null;
    contactName?: string | null;
    contactTaxId?: string | null;
    hasSlip: boolean;
    hasTaxInvoice: boolean;
  }>
): Promise<MatchResult> {
  if (!existingBoxes.length) {
    return {
      hasMatch: false,
      matches: [],
      suggestedAction: "create_new",
      reason: "ไม่มีกล่องเอกสารที่รอเอกสาร",
    };
  }

  const matches: DocumentBoxMatch[] = [];

  for (const box of existingBoxes) {
    const reasons: string[] = [];
    let score = 0;

    // 1. Match by Tax ID (strongest signal)
    if (extractedData.taxId && box.contactTaxId) {
      const extractedTaxId = extractedData.taxId.replace(/\D/g, "");
      const boxTaxId = box.contactTaxId.replace(/\D/g, "");
      if (extractedTaxId === boxTaxId) {
        score += 50;
        reasons.push("เลขประจำตัวผู้เสียภาษีตรงกัน");
      }
    }

    // 2. Match by contact name (fuzzy)
    if (extractedData.contactName && box.contactName) {
      const similarity = calculateNameSimilarity(
        extractedData.contactName,
        box.contactName
      );
      if (similarity >= 0.7) {
        score += 30;
        reasons.push(`ชื่อผู้ติดต่อคล้ายกัน (${Math.round(similarity * 100)}%)`);
      }
    }

    // 3. Match by amount (if box doesn't have amount yet, or matches)
    if (extractedData.amount && box.totalAmount > 0) {
      const diff = Math.abs(extractedData.amount - box.totalAmount);
      const percentDiff = diff / box.totalAmount;
      
      if (percentDiff <= 0.01) { // Within 1%
        score += 25;
        reasons.push("ยอดเงินตรงกัน");
      } else if (percentDiff <= 0.05) { // Within 5%
        score += 15;
        reasons.push("ยอดเงินใกล้เคียง");
      }
    } else if (extractedData.amount && box.totalAmount === 0) {
      // Box has no amount yet (slip-only case) - this is a good candidate
      score += 20;
      reasons.push("กล่องยังไม่มียอดเงิน (รอใบกำกับ)");
    }

    // 4. Match by date (within 7 days)
    if (extractedData.documentDate) {
      const extractedDate = new Date(extractedData.documentDate);
      const boxDate = new Date(box.docDate);
      const daysDiff = Math.abs(
        (extractedDate.getTime() - boxDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysDiff <= 1) {
        score += 15;
        reasons.push("วันที่ตรงกัน");
      } else if (daysDiff <= 7) {
        score += 10;
        reasons.push("วันที่ใกล้เคียง");
      }
    }

    // 5. Check if box needs this document type
    const docType = extractedData.type;
    if (docType === "TAX_INVOICE" && !box.hasTaxInvoice) {
      score += 20;
      reasons.push("กล่องยังไม่มีใบกำกับภาษี");
    } else if (docType === "SLIP" && !box.hasSlip) {
      score += 15;
      reasons.push("กล่องยังไม่มีสลิป");
    } else if (docType === "TAX_INVOICE" && box.hasTaxInvoice) {
      // Already has tax invoice - less likely to match
      score -= 30;
    }

    // Only include if score is positive and above threshold
    if (score >= 30 && reasons.length > 0) {
      matches.push({
        documentId: box.id,
        docNumber: box.docNumber,
        contactName: box.contactName || undefined,
        amount: box.totalAmount,
        matchScore: Math.min(score, 100),
        matchReasons: reasons,
      });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.matchScore - a.matchScore);

  // Determine suggested action
  const topMatch = matches[0];
  if (topMatch && topMatch.matchScore >= 60) {
    return {
      hasMatch: true,
      matches: matches.slice(0, 3), // Return top 3
      suggestedAction: "add_to_existing",
      reason: `แนะนำให้เพิ่มเข้ากล่อง ${topMatch.docNumber}`,
    };
  } else if (matches.length > 0) {
    return {
      hasMatch: true,
      matches: matches.slice(0, 3),
      suggestedAction: "create_new",
      reason: "พบกล่องที่อาจตรงกัน แต่ไม่แน่ใจ",
    };
  }

  return {
    hasMatch: false,
    matches: [],
    suggestedAction: "create_new",
    reason: "ไม่พบกล่องที่ตรงกัน แนะนำสร้างใหม่",
  };
}

// Simple name similarity using Jaccard index
function calculateNameSimilarity(name1: string, name2: string): number {
  // Normalize names
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/บริษัท|จำกัด|มหาชน|ltd|co\.|inc\.|corp\./gi, "")
      .replace(/[^\u0E00-\u0E7Fa-z0-9]/gi, " ")
      .split(/\s+/)
      .filter((x) => x.length > 1);

  const set1 = new Set(normalize(name1));
  const set2 = new Set(normalize(name2));

  if (set1.size === 0 || set2.size === 0) return 0;

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}
