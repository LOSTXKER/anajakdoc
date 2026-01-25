// Export types and constants

export type ExportProfile = "GENERIC" | "PEAK" | "FLOWACCOUNT" | "EXPRESS";

// Column mapping for each profile (Section 11.1)
export const PROFILE_COLUMNS: Record<ExportProfile, Record<string, string>> = {
  GENERIC: {
    boxNumber: "เลขที่กล่อง",
    boxDate: "วันที่",
    boxType: "ประเภท",
    vendorName: "คู่ค้า",
    vendorTaxId: "เลขผู้เสียภาษี",
    categoryName: "หมวดหมู่",
    title: "ชื่อ",
    description: "รายละเอียด",
    amountBeforeVat: "ยอดก่อน VAT",
    vatAmount: "VAT",
    whtAmount: "หัก ณ ที่จ่าย",
    totalAmount: "ยอดรวม",
    hasVat: "มี VAT",
    vatDocStatus: "สถานะ VAT",
    hasWht: "มี WHT",
    whtDocStatus: "สถานะ WHT",
    paymentMode: "รูปแบบจ่าย",
    status: "สถานะ",
    docStatus: "สถานะเอกสาร",
    notes: "หมายเหตุ",
    createdBy: "ผู้สร้าง",
    documentCount: "จำนวนเอกสาร",
  },
  PEAK: {
    boxDate: "วันที่",
    externalRef: "เลขที่เอกสาร",
    vendorTaxId: "รหัสผู้ติดต่อ",
    vendorName: "ชื่อผู้ติดต่อ",
    accountCode: "รหัสบัญชี",
    description: "คำอธิบาย",
    amountBeforeVat: "จำนวนเงิน",
    vatAmount: "ภาษีมูลค่าเพิ่ม",
    whtAmount: "ภาษีหัก ณ ที่จ่าย",
    totalAmount: "ยอดสุทธิ",
    costCenterCode: "ศูนย์ต้นทุน",
  },
  FLOWACCOUNT: {
    boxDate: "วันที่",
    vendorName: "ชื่อผู้ขาย",
    vendorTaxId: "เลขประจำตัวผู้เสียภาษี",
    description: "รายละเอียด",
    amountBeforeVat: "มูลค่าก่อนภาษี",
    vatAmount: "ภาษีมูลค่าเพิ่ม",
    whtAmount: "หัก ณ ที่จ่าย",
    totalAmount: "ยอดรวม",
    categoryName: "หมวดหมู่",
  },
  EXPRESS: {
    boxDate: "วันที่",
    externalRef: "เลขที่เอกสาร",
    vendorName: "ผู้ขาย/ผู้รับเงิน",
    description: "รายการ",
    amountBeforeVat: "จำนวนเงิน",
    vatAmount: "VAT",
    whtAmount: "WHT",
    totalAmount: "รวม",
  },
};

// Type for box with export includes (simplified for export operations)
export type BoxForExport = {
  boxNumber: string;
  boxDate: Date;
  boxType: string;
  expenseType: string | null;
  title: string | null;
  description: string | null;
  externalRef: string | null;
  notes: string | null;
  status: string;
  docStatus: string;
  totalAmount: { toNumber: () => number };
  vatAmount: { toNumber: () => number };
  whtAmount: { toNumber: () => number };
  paidAmount: { toNumber: () => number };
  hasVat: boolean;
  hasWht: boolean;
  vatDocStatus: string;
  whtDocStatus: string;
  paymentMode: string;
  contact: { name: string; taxId: string | null } | null;
  category: { name: string; peakAccountCode: string | null } | null;
  costCenter: { code: string; name: string } | null;
  createdBy: { name: string | null; email: string } | null;
  documents?: Array<{ docType: string; files: Array<{ fileUrl?: string; storageUrl?: string }> }>;
};

export const EXPORT_PROFILE_MAP: Record<string, ExportProfile> = {
  EXCEL_GENERIC: "GENERIC",
  EXCEL_PEAK: "PEAK",
  EXCEL_FLOWACCOUNT: "FLOWACCOUNT",
  EXCEL_EXPRESS: "EXPRESS",
};
