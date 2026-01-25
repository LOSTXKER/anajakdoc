"use server";

/**
 * Thai-specific OCR Actions
 * 
 * Features:
 * - PromptPay slip extraction
 * - e-Tax Invoice parsing
 * - Thai ID card OCR
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { PROMPTPAY_EXTRACTION_PROMPT, type PromptPaySlipData } from "@/lib/ocr/promptpay";
import type { ApiResponse } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// ============================================
// PROMPTPAY SLIP EXTRACTION
// ============================================

export async function extractPromptPaySlip(
  base64Data: string,
  mimeType: string
): Promise<ApiResponse<PromptPaySlipData>> {
  if (!process.env.GEMINI_API_KEY) {
    return { success: false, error: "Gemini API key not configured" };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      PROMPTPAY_EXTRACTION_PROMPT,
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
      return { success: false, error: "ไม่สามารถอ่านข้อมูลจากสลิปได้" };
    }

    const parsed = JSON.parse(jsonMatch[0]) as PromptPaySlipData;

    // Validate required fields
    if (!parsed.amount || !parsed.referenceNumber) {
      return { success: false, error: "ไม่พบข้อมูลจำเป็น (ยอดเงิน/เลขที่รายการ)" };
    }

    return { success: true, data: parsed };
  } catch (error) {
    console.error("Error extracting PromptPay slip:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการอ่านสลิป" };
  }
}

// ============================================
// E-TAX INVOICE IMPORT
// ============================================

export interface EtaxInvoiceData {
  invoiceNumber: string;
  invoiceDate: string;        // YYYY-MM-DD
  // Seller info
  sellerName: string;
  sellerTaxId: string;
  sellerAddress?: string;
  sellerBranch?: string;
  // Buyer info
  buyerName?: string;
  buyerTaxId?: string;
  buyerAddress?: string;
  // Amounts
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  vatRate: number;            // 7 or 0
  // Items
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  // e-Tax specific
  isEtax: boolean;
  etaxId?: string;            // e-Tax Invoice ID
}

const ETAX_EXTRACTION_PROMPT = `คุณเป็น AI ที่เชี่ยวชาญในการอ่าน e-Tax Invoice (ใบกำกับภาษีอิเล็กทรอนิกส์) ของไทย

วิเคราะห์รูปภาพใบกำกับภาษีนี้และดึงข้อมูลให้ครบถ้วน:

## ข้อมูลที่ต้องดึง:

### ข้อมูลเอกสาร:
- invoiceNumber: เลขที่ใบกำกับภาษี
- invoiceDate: วันที่ออกใบกำกับ (format: YYYY-MM-DD)
- isEtax: เป็น e-Tax Invoice หรือไม่ (มี QR Code หรือมีคำว่า "ใบกำกับภาษีอิเล็กทรอนิกส์")
- etaxId: เลข e-Tax Invoice (ถ้ามี)

### ข้อมูลผู้ขาย:
- sellerName: ชื่อบริษัท/ร้านค้าผู้ขาย
- sellerTaxId: เลขประจำตัวผู้เสียภาษี 13 หลัก
- sellerAddress: ที่อยู่ (ถ้ามี)
- sellerBranch: สาขา (เช่น "สำนักงานใหญ่" หรือ "สาขา 00001")

### ข้อมูลผู้ซื้อ:
- buyerName: ชื่อบริษัท/บุคคลผู้ซื้อ
- buyerTaxId: เลขประจำตัวผู้เสียภาษีผู้ซื้อ (ถ้ามี)
- buyerAddress: ที่อยู่ผู้ซื้อ (ถ้ามี)

### ยอดเงิน:
- subtotal: ยอดรวมก่อน VAT
- vatAmount: ยอด VAT
- totalAmount: ยอดรวมสุทธิ
- vatRate: อัตรา VAT (7 หรือ 0)

### รายการสินค้า/บริการ (items):
Array of objects with:
- description: รายละเอียดสินค้า/บริการ
- quantity: จำนวน
- unitPrice: ราคาต่อหน่วย
- amount: ยอดเงินของรายการนี้

## กฎ:
- ถ้าไม่เห็นข้อมูลชัดเจน ให้ใส่ null
- ยอดเงินต้องเป็นตัวเลขเท่านั้น
- วันที่ใช้ปี ค.ศ. ถ้าเห็นปี พ.ศ. ให้แปลงเป็น ค.ศ.
- items จำกัด 10 รายการแรก

ตอบเป็น JSON format เท่านั้น:
{
  "invoiceNumber": "IV2026010001",
  "invoiceDate": "2026-01-25",
  "isEtax": true,
  "etaxId": "ETAX123456789",
  "sellerName": "บริษัท ABC จำกัด",
  "sellerTaxId": "0105XXXXXXXXX",
  "sellerAddress": "123 ถนน...",
  "sellerBranch": "สำนักงานใหญ่",
  "buyerName": "บริษัท XYZ จำกัด",
  "buyerTaxId": "0105YYYYYYYYY",
  "subtotal": 10000.00,
  "vatAmount": 700.00,
  "totalAmount": 10700.00,
  "vatRate": 7,
  "items": [
    { "description": "บริการโฆษณา", "quantity": 1, "unitPrice": 10000, "amount": 10000 }
  ]
}`;

export async function extractEtaxInvoice(
  base64Data: string,
  mimeType: string
): Promise<ApiResponse<EtaxInvoiceData>> {
  if (!process.env.GEMINI_API_KEY) {
    return { success: false, error: "Gemini API key not configured" };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      ETAX_EXTRACTION_PROMPT,
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
      return { success: false, error: "ไม่สามารถอ่านข้อมูลจากใบกำกับภาษีได้" };
    }

    const parsed = JSON.parse(jsonMatch[0]) as EtaxInvoiceData;

    // Validate required fields
    if (!parsed.sellerTaxId || !parsed.totalAmount) {
      return { success: false, error: "ไม่พบข้อมูลจำเป็น (เลขประจำตัวผู้เสียภาษี/ยอดรวม)" };
    }

    return { success: true, data: parsed };
  } catch (error) {
    console.error("Error extracting e-Tax invoice:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการอ่านใบกำกับภาษี" };
  }
}

// ============================================
// THAI ID CARD OCR
// ============================================

export interface ThaiIdCardData {
  idNumber: string;           // เลขบัตรประชาชน 13 หลัก
  titleTh: string;            // คำนำหน้า (นาย/นาง/นางสาว)
  firstNameTh: string;        // ชื่อ
  lastNameTh: string;         // นามสกุล
  titleEn?: string;           // Title in English
  firstNameEn?: string;       // First name in English
  lastNameEn?: string;        // Last name in English
  dateOfBirth: string;        // YYYY-MM-DD
  address?: string;           // ที่อยู่ตามบัตร
  issueDate?: string;         // วันออกบัตร YYYY-MM-DD
  expiryDate?: string;        // วันหมดอายุ YYYY-MM-DD
}

const THAI_ID_CARD_PROMPT = `คุณเป็น AI ที่เชี่ยวชาญในการอ่านบัตรประชาชนไทย

วิเคราะห์รูปภาพบัตรประชาชนนี้และดึงข้อมูลให้ครบถ้วน:

## ข้อมูลที่ต้องดึง:
- idNumber: เลขบัตรประชาชน 13 หลัก (ตัวเลขเท่านั้น ไม่มีขีด)
- titleTh: คำนำหน้าภาษาไทย (นาย/นาง/นางสาว/ด.ช./ด.ญ.)
- firstNameTh: ชื่อภาษาไทย
- lastNameTh: นามสกุลภาษาไทย
- titleEn: คำนำหน้าภาษาอังกฤษ (Mr./Mrs./Miss)
- firstNameEn: ชื่อภาษาอังกฤษ
- lastNameEn: นามสกุลภาษาอังกฤษ
- dateOfBirth: วันเกิด (format: YYYY-MM-DD ใช้ปี ค.ศ.)
- address: ที่อยู่ตามบัตร (ถ้าอ่านได้)
- issueDate: วันออกบัตร (format: YYYY-MM-DD)
- expiryDate: วันหมดอายุ (format: YYYY-MM-DD)

## กฎสำคัญ:
- idNumber ต้องเป็นตัวเลข 13 หลัก ไม่มีขีดคั่น
- วันที่ต้องแปลงจาก พ.ศ. เป็น ค.ศ. (ลบ 543)
- ถ้าอ่านไม่ชัด ให้ใส่ null

ตอบเป็น JSON format เท่านั้น:
{
  "idNumber": "1234567890123",
  "titleTh": "นาย",
  "firstNameTh": "สมชาย",
  "lastNameTh": "ใจดี",
  "titleEn": "Mr.",
  "firstNameEn": "Somchai",
  "lastNameEn": "Jaidee",
  "dateOfBirth": "1990-01-15",
  "address": "123 ซอย... ถนน... เขต... กรุงเทพฯ",
  "issueDate": "2020-01-01",
  "expiryDate": "2030-01-01"
}`;

export async function extractThaiIdCard(
  base64Data: string,
  mimeType: string
): Promise<ApiResponse<ThaiIdCardData>> {
  if (!process.env.GEMINI_API_KEY) {
    return { success: false, error: "Gemini API key not configured" };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      THAI_ID_CARD_PROMPT,
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
      return { success: false, error: "ไม่สามารถอ่านข้อมูลจากบัตรประชาชนได้" };
    }

    const parsed = JSON.parse(jsonMatch[0]) as ThaiIdCardData;

    // Validate ID number
    const cleanId = parsed.idNumber?.replace(/\D/g, "");
    if (!cleanId || cleanId.length !== 13) {
      return { success: false, error: "เลขบัตรประชาชนไม่ถูกต้อง" };
    }

    // Validate checksum
    if (!validateThaiIdChecksum(cleanId)) {
      return { success: false, error: "เลขบัตรประชาชนไม่ผ่านการตรวจสอบ checksum" };
    }

    return {
      success: true,
      data: {
        ...parsed,
        idNumber: cleanId,
      },
    };
  } catch (error) {
    console.error("Error extracting Thai ID card:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการอ่านบัตรประชาชน" };
  }
}

// Validate Thai ID card checksum (Luhn-like algorithm)
function validateThaiIdChecksum(id: string): boolean {
  if (id.length !== 13) return false;

  const digits = id.split("").map(Number);
  let sum = 0;

  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (13 - i);
  }

  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === digits[12];
}
