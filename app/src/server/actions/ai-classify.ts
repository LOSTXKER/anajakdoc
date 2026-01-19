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
