"use server";

import { requireOrganization } from "@/server/auth";
import type { ApiResponse } from "@/types";

export interface ExtractedDocumentData {
  docType?: string;
  docDate?: string;
  externalRef?: string; // Invoice/receipt number
  vendorName?: string;
  vendorTaxId?: string;
  subtotal?: number;
  vatAmount?: number;
  totalAmount?: number;
  description?: string;
  items?: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    amount?: number;
  }>;
  confidence: number;
  rawText?: string;
}

// OCR using OpenAI Vision API
export async function extractDocumentData(
  imageUrl: string
): Promise<ApiResponse<ExtractedDocumentData>> {
  await requireOrganization();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: "ระบบ OCR ยังไม่ได้ตั้งค่า (OPENAI_API_KEY)",
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert at extracting information from Thai receipts, invoices, and tax invoices.
Extract the following information from the document image and return as JSON:
- docType: "SLIP_TRANSFER" | "RECEIPT" | "TAX_INVOICE" | "INVOICE" | "OTHER" (use SLIP_TRANSFER for bank transfer slips)
- docDate: date in YYYY-MM-DD format
- externalRef: the receipt/invoice number
- vendorName: vendor/store name
- vendorTaxId: 13-digit tax ID if present
- subtotal: amount before VAT (number)
- vatAmount: VAT amount (number, usually 7%)
- totalAmount: total amount including VAT (number)
- description: brief description of the purchase
- items: array of line items with description, quantity, unitPrice, amount
- confidence: your confidence in the extraction (0-1)

If a field is not found, omit it. Return only valid JSON.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract document information from this image:",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 1500,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI API error:", errorData);
      return {
        success: false,
        error: `OCR API error: ${response.status}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return {
        success: false,
        error: "ไม่สามารถอ่านข้อมูลจากเอกสารได้",
      };
    }

    // Parse JSON from response
    let extractedData: ExtractedDocumentData;
    try {
      // Remove markdown code blocks if present
      const jsonStr = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      extractedData = JSON.parse(jsonStr);
    } catch {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        return {
          success: false,
          error: "ไม่สามารถแปลผลลัพธ์จาก OCR ได้",
        };
      }
    }

    // Map docType to correct enum values
    let docType = extractedData.docType;
    if (docType === "SLIP") {
      docType = "SLIP_TRANSFER";
    }

    return {
      success: true,
      data: {
        ...extractedData,
        docType,
        confidence: extractedData.confidence || 0.8,
      },
    };
  } catch (error) {
    console.error("OCR error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการอ่านเอกสาร",
    };
  }
}

// Alternative: Local OCR using Tesseract (fallback, less accurate for Thai)
export async function extractWithTesseract(
  imageUrl: string
): Promise<ApiResponse<{ rawText: string }>> {
  await requireOrganization();

  // Note: This would require tesseract.js installed
  // For now, return a placeholder
  return {
    success: false,
    error: "Tesseract OCR ยังไม่พร้อมใช้งาน กรุณาใช้ OpenAI Vision แทน",
  };
}
