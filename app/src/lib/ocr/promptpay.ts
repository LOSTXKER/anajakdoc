/**
 * PromptPay Slip OCR Enhancement
 * 
 * PromptPay slips from Thai banks have a standard format:
 * - PromptPay logo
 * - Transfer amount
 * - Date/Time
 * - Reference number
 * - Sender/Receiver info
 */

// PromptPay slip extracted data
export interface PromptPaySlipData {
  amount: number;
  transferDate: string;        // YYYY-MM-DD
  transferTime: string;        // HH:mm
  referenceNumber: string;
  senderName?: string;
  senderBank?: string;
  senderAccount?: string;
  receiverName?: string;
  receiverBank?: string;
  receiverAccount?: string;
  receiverPromptPayId?: string;
  note?: string;
}

// Thai bank names mapping
export const THAI_BANKS: Record<string, string> = {
  "SCB": "ธนาคารไทยพาณิชย์",
  "KBANK": "ธนาคารกสิกรไทย",
  "BBL": "ธนาคารกรุงเทพ",
  "KTB": "ธนาคารกรุงไทย",
  "TMB": "ทีเอ็มบีธนชาต",
  "TTB": "ทีเอ็มบีธนชาต",
  "BAY": "ธนาคารกรุงศรีอยุธยา",
  "KRUNGSRI": "ธนาคารกรุงศรีอยุธยา",
  "UOB": "ธนาคารยูโอบี",
  "CIMB": "ธนาคารซีไอเอ็มบี",
  "LHBANK": "แลนด์ แอนด์ เฮ้าส์",
  "GSB": "ธนาคารออมสิน",
  "GHB": "ธนาคารอาคารสงเคราะห์",
  "BAAC": "ธ.ก.ส.",
};

// AI prompt for PromptPay slip extraction
export const PROMPTPAY_EXTRACTION_PROMPT = `คุณเป็น AI ที่เชี่ยวชาญในการอ่านสลิปโอนเงิน PromptPay ของธนาคารไทย

วิเคราะห์รูปภาพสลิปโอนเงินนี้และดึงข้อมูลให้ครบถ้วน:

## ข้อมูลที่ต้องดึง:
- amount: ยอดเงินที่โอน (ตัวเลขเท่านั้น ไม่ใส่ comma หรือ บาท)
- transferDate: วันที่โอน (format: YYYY-MM-DD)
- transferTime: เวลาโอน (format: HH:mm)
- referenceNumber: เลขที่รายการ/Reference Number/Ref No.
- senderName: ชื่อบัญชีผู้โอน
- senderBank: ชื่อธนาคารผู้โอน
- senderAccount: เลขบัญชีผู้โอน (ถ้ามี, อาจซ่อนบางหลัก)
- receiverName: ชื่อบัญชีผู้รับ
- receiverBank: ชื่อธนาคารผู้รับ (ถ้ามี)
- receiverAccount: เลขบัญชีผู้รับ (ถ้ามี)
- receiverPromptPayId: หมายเลข PromptPay (เบอร์โทร 10 หลัก หรือ เลขประจำตัว 13 หลัก)
- note: บันทึกช่วยจำ/หมายเหตุ (ถ้ามี)

## ข้อสังเกต:
- สลิปมักแสดง "โอนเงินสำเร็จ" หรือ "Transfer Successful"
- PromptPay มักแสดงหมายเลขโทรศัพท์หรือเลขประจำตัวผู้เสียภาษี
- Reference Number อาจเรียกว่า "รหัสอ้างอิง" หรือ "เลขที่รายการ"

## กฎ:
- ถ้าไม่เห็นข้อมูลชัดเจน ให้ใส่ null
- amount ต้องเป็นตัวเลขเท่านั้น (เช่น 1500.50)
- วันที่ใช้ปี ค.ศ. ถ้าเห็นปี พ.ศ. ให้แปลงเป็น ค.ศ. (ลบ 543)

ตอบเป็น JSON format เท่านั้น:
{
  "amount": 1234.56,
  "transferDate": "2026-01-25",
  "transferTime": "14:30",
  "referenceNumber": "ABC123456",
  "senderName": "นายสมชาย ใจดี",
  "senderBank": "ธนาคารกสิกรไทย",
  "senderAccount": "xxx-x-xxxx-x",
  "receiverName": "บริษัท ABC จำกัด",
  "receiverBank": "ธนาคารไทยพาณิชย์",
  "receiverPromptPayId": "0812345678",
  "note": "ค่าสินค้า"
}`;

// Validate PromptPay ID (phone or tax ID)
export function validatePromptPayId(id: string): { valid: boolean; type: "phone" | "taxId" | "invalid" } {
  const cleaned = id.replace(/[^\d]/g, "");
  
  if (cleaned.length === 10 && cleaned.startsWith("0")) {
    return { valid: true, type: "phone" };
  }
  
  if (cleaned.length === 13) {
    return { valid: true, type: "taxId" };
  }
  
  return { valid: false, type: "invalid" };
}

// Parse Thai date string to ISO date
export function parseThaiDate(dateStr: string): string | null {
  try {
    // Try common Thai date formats
    // Format: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    const slashMatch = dateStr.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
    if (slashMatch) {
      let year = parseInt(slashMatch[3]);
      // Convert Buddhist year to Gregorian if needed
      if (year > 2500) year -= 543;
      
      const month = slashMatch[2].padStart(2, "0");
      const day = slashMatch[1].padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    
    // Format: YYYY-MM-DD (already ISO)
    const isoMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      let year = parseInt(isoMatch[1]);
      if (year > 2500) year -= 543;
      return `${year}-${isoMatch[2]}-${isoMatch[3]}`;
    }
    
    return null;
  } catch {
    return null;
  }
}
