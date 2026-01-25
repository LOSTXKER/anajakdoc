// Data transformation utilities for export

import type { BoxForExport, ExportProfile } from "./types";
import { PROFILE_COLUMNS } from "./types";

/**
 * Transform box data to export row based on profile
 */
export function transformBoxToRow(box: BoxForExport, profile: ExportProfile): Record<string, unknown> {
  const columns = PROFILE_COLUMNS[profile];
  const row: Record<string, unknown> = {};
  
  const fieldGetters: Record<string, () => unknown> = {
    boxNumber: () => box.boxNumber,
    boxDate: () => new Date(box.boxDate).toLocaleDateString("th-TH"),
    boxType: () => box.boxType === "EXPENSE" ? "รายจ่าย" : box.boxType === "INCOME" ? "รายรับ" : "ปรับปรุง",
    vendorName: () => box.contact?.name || "-",
    vendorTaxId: () => box.contact?.taxId || "",
    categoryName: () => box.category?.name || "-",
    accountCode: () => box.category?.peakAccountCode || "",
    costCenterCode: () => box.costCenter?.code || "",
    title: () => box.title || "-",
    description: () => box.description || box.title || box.category?.name || "",
    externalRef: () => box.externalRef || box.boxNumber,
    amountBeforeVat: () => box.totalAmount.toNumber() - box.vatAmount.toNumber(),
    vatAmount: () => box.vatAmount.toNumber(),
    whtAmount: () => box.whtAmount.toNumber(),
    totalAmount: () => box.totalAmount.toNumber(),
    hasVat: () => box.hasVat ? "ใช่" : "ไม่",
    vatDocStatus: () => {
      const map: Record<string, string> = {
        MISSING: "ยังไม่ได้รับ",
        RECEIVED: "ได้รับแล้ว",
        VERIFIED: "ตรวจแล้ว",
        NA: "ไม่ต้องมี",
      };
      return map[box.vatDocStatus] || box.vatDocStatus;
    },
    hasWht: () => box.hasWht ? "ใช่" : "ไม่",
    whtDocStatus: () => {
      const map: Record<string, string> = {
        MISSING: "ยังไม่ได้รับ",
        REQUEST_SENT: "ส่งคำขอแล้ว",
        RECEIVED: "ได้รับแล้ว",
        VERIFIED: "ตรวจแล้ว",
        NA: "ไม่ต้องมี",
      };
      return map[box.whtDocStatus] || box.whtDocStatus;
    },
    paymentMode: () => box.paymentMode === "COMPANY_PAID" ? "บริษัทจ่าย" : "พนักงานสำรองจ่าย",
    status: () => {
      const map: Record<string, string> = {
        DRAFT: "ร่าง",
        PENDING: "รอตรวจ",
        NEED_DOCS: "ขาดเอกสาร",
        COMPLETED: "เสร็จสิ้น",
      };
      return map[box.status] || box.status;
    },
    docStatus: () => {
      const map: Record<string, string> = {
        INCOMPLETE: "ไม่ครบ",
        COMPLETE: "ครบ",
        NA: "ไม่ต้องมี",
      };
      return map[box.docStatus] || box.docStatus;
    },
    notes: () => box.notes || "",
    createdBy: () => box.createdBy?.name || box.createdBy?.email || "-",
    documentCount: () => box.documents?.length || 0,
  };
  
  for (const [field, label] of Object.entries(columns)) {
    row[label] = fieldGetters[field]?.() ?? "";
  }
  
  return row;
}
