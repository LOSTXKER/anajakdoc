"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import type { ApiResponse } from "@/types";
import { ExportType } from "@prisma/client";

// Export profiles (Section 11.1)
export type ExportProfile = "GENERIC" | "PEAK" | "FLOWACCOUNT" | "EXPRESS";

// Column mapping for each profile
const PROFILE_COLUMNS: Record<ExportProfile, Record<string, string>> = {
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
type BoxForExport = {
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

// Transform box data to export row
function transformBoxToRow(box: BoxForExport, profile: ExportProfile) {
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

// ==================== Export to Excel ====================

export async function exportBoxesToExcel(
  boxIds: string[],
  profile: ExportProfile = "GENERIC"
): Promise<ApiResponse<{ fileName: string; data: string }>> {
  const session = await requireOrganization();

  if (!["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    return { success: false, error: "คุณไม่มีสิทธิ์ Export" };
  }

  const boxes = await prisma.box.findMany({
    where: {
      id: { in: boxIds },
      organizationId: session.currentOrganization.id,
    },
    include: {
      category: true,
      costCenter: true,
      contact: true,
      createdBy: { select: { name: true, email: true } },
      documents: { include: { files: true } },
    },
    orderBy: { boxDate: "asc" },
  });

  if (boxes.length === 0) {
    return { success: false, error: "ไม่พบกล่องที่เลือก" };
  }

  // Transform data
  const data = boxes.map((box) => transformBoxToRow(box, profile));

  // Create workbook
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Set column widths
  const cols = Object.keys(PROFILE_COLUMNS[profile]).map(() => ({ wch: 15 }));
  worksheet["!cols"] = cols;
  
  XLSX.utils.book_append_sheet(workbook, worksheet, profile === "GENERIC" ? "กล่องเอกสาร" : `${profile} Import`);

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
  
  const now = new Date();
  const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}_${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}`;
  const fileName = `export_${profile.toLowerCase()}_${timestamp}.xlsx`;

  // Save export history
  const exportTypeMap: Record<ExportProfile, ExportType> = {
    GENERIC: ExportType.EXCEL_GENERIC,
    PEAK: ExportType.EXCEL_PEAK,
    FLOWACCOUNT: ExportType.EXCEL_FLOWACCOUNT,
    EXPRESS: ExportType.EXCEL_EXPRESS,
  };
  
  await prisma.exportHistory.create({
    data: {
      organizationId: session.currentOrganization.id,
      exportType: exportTypeMap[profile],
      exportProfile: profile,
      fileName,
      boxIds: boxIds,
      boxCount: boxes.length,
      exportedById: session.id,
    },
  });

  return {
    success: true,
    data: { fileName, data: buffer },
  };
}

// ==================== Export to ZIP (Section 11.2) ====================

export async function exportBoxesToZip(
  boxIds: string[],
  options?: {
    includeJson?: boolean;
    groupByMonth?: boolean;
  }
): Promise<ApiResponse<{ fileName: string; data: string }>> {
  const session = await requireOrganization();

  if (!["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    return { success: false, error: "คุณไม่มีสิทธิ์ Export" };
  }

  const boxes = await prisma.box.findMany({
    where: {
      id: { in: boxIds },
      organizationId: session.currentOrganization.id,
    },
    include: {
      category: true,
      costCenter: true,
      contact: true,
      createdBy: { select: { name: true, email: true } },
      documents: { include: { files: true } },
      whtTrackings: true,
      payments: true,
    },
    orderBy: { boxDate: "asc" },
  });

  if (boxes.length === 0) {
    return { success: false, error: "ไม่พบกล่องที่เลือก" };
  }

  const zip = new JSZip();
  const now = new Date();
  const { includeJson = true, groupByMonth = true } = options || {};

  // Create Excel summary
  const workbook = XLSX.utils.book_new();
  const summaryData = boxes.map((box) => transformBoxToRow(box, "GENERIC"));
  const worksheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, worksheet, "สรุปกล่องเอกสาร");
  const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  zip.file("summary.xlsx", excelBuffer);

  // Collect all files to fetch (to enable parallel fetching)
  type FileToFetch = {
    url: string;
    fileName: string;
    docType: string;
    folderPath: string;
    fileIndex: number;
  };
  
  const filesToFetch: FileToFetch[] = [];

  // Add files for each box
  for (const box of boxes) {
    // Folder structure: YYYY/MM/BOX_NUMBER_vendor_amount/ (Section 11.2)
    const boxDate = new Date(box.boxDate);
    const year = boxDate.getFullYear().toString();
    const month = (boxDate.getMonth() + 1).toString().padStart(2, "0");
    const vendorName = box.contact?.name?.replace(/[^a-zA-Z0-9ก-๙]/g, "_").slice(0, 20) || "unknown";
    const amount = Math.round(box.totalAmount.toNumber());
    
    const folderPath = groupByMonth 
      ? `${year}/${month}/${box.boxNumber}_${vendorName}_${amount}`
      : `${box.boxNumber}_${vendorName}_${amount}`;

    // Add JSON summary if enabled
    if (includeJson) {
      const jsonSummary = {
        boxNumber: box.boxNumber,
        boxDate: box.boxDate,
        boxType: box.boxType,
        status: box.status,
        vendor: box.contact ? {
          name: box.contact.name,
          taxId: box.contact.taxId,
        } : null,
        category: box.category?.name,
        amounts: {
          total: box.totalAmount.toNumber(),
          vat: box.vatAmount.toNumber(),
          wht: box.whtAmount.toNumber(),
          paid: box.paidAmount.toNumber(),
        },
        vatInfo: {
          hasVat: box.hasVat,
          docStatus: box.vatDocStatus,
          verifiedAt: box.vatVerifiedAt,
        },
        whtInfo: {
          hasWht: box.hasWht,
          docStatus: box.whtDocStatus,
          overdue: box.whtOverdue,
        },
        documents: box.documents.map((doc) => ({
          type: doc.docType,
          number: doc.docNumber,
          date: doc.docDate,
          amount: doc.amount?.toNumber(),
          files: doc.files.map((f) => f.fileName),
        })),
        payments: box.payments.map((p) => ({
          amount: p.amount.toNumber(),
          date: p.paidDate,
          method: p.method,
        })),
        createdAt: box.createdAt,
        createdBy: box.createdBy?.name || box.createdBy?.email,
      };
      zip.file(`${folderPath}/summary.json`, JSON.stringify(jsonSummary, null, 2));
    }

    // Collect document files for parallel fetching
    let fileIndex = 1;
    for (const doc of box.documents) {
      for (const file of doc.files) {
        filesToFetch.push({
          url: file.fileUrl,
          fileName: file.fileName,
          docType: doc.docType,
          folderPath,
          fileIndex: fileIndex++,
        });
      }
    }
  }

  // Fetch all files in parallel (with batching to avoid overwhelming the server)
  const BATCH_SIZE = 10;
  for (let i = 0; i < filesToFetch.length; i += BATCH_SIZE) {
    const batch = filesToFetch.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (fileInfo) => {
        const response = await fetch(fileInfo.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${fileInfo.fileName}: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return { ...fileInfo, arrayBuffer };
      })
    );

    // Add successfully fetched files to ZIP
    for (const result of results) {
      if (result.status === "fulfilled") {
        const { folderPath, fileIndex, docType, fileName, arrayBuffer } = result.value;
        const ext = fileName.split(".").pop() || "bin";
        const numberedFileName = `${fileIndex.toString().padStart(2, "0")}_${docType}.${ext}`;
        zip.file(`${folderPath}/${numberedFileName}`, arrayBuffer);
      } else {
        console.error(`Error fetching file:`, result.reason);
      }
    }
  }

  // Generate ZIP
  const zipBuffer = await zip.generateAsync({ type: "base64" });
  
  const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}_${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}`;
  const fileName = `export_bundle_${timestamp}.zip`;

  // Save export history
  await prisma.exportHistory.create({
    data: {
      organizationId: session.currentOrganization.id,
      exportType: "ZIP",
      fileName,
      boxIds: boxIds,
      boxCount: boxes.length,
      exportedById: session.id,
    },
  });

  return {
    success: true,
    data: { fileName, data: zipBuffer },
  };
}

// ==================== Combined Export Function ====================

export async function exportBoxes(
  boxIds: string[],
  format: "EXCEL_GENERIC" | "EXCEL_PEAK" | "EXCEL_FLOWACCOUNT" | "EXCEL_EXPRESS" | "ZIP",
  options?: { includeJson?: boolean; groupByMonth?: boolean }
): Promise<ApiResponse<{ downloadUrl?: string }>> {
  if (boxIds.length === 0) {
    return { success: false, error: "กรุณาเลือกกล่อง" };
  }

  if (format === "ZIP") {
    const result = await exportBoxesToZip(boxIds, options);
    if (!result.success) return { success: false, error: result.error };
    return {
      success: true,
      data: { downloadUrl: `data:application/zip;base64,${result.data?.data}` },
    };
  }

  // Excel formats
  const profileMap: Record<string, ExportProfile> = {
    EXCEL_GENERIC: "GENERIC",
    EXCEL_PEAK: "PEAK",
    EXCEL_FLOWACCOUNT: "FLOWACCOUNT",
    EXCEL_EXPRESS: "EXPRESS",
  };
  
  const result = await exportBoxesToExcel(boxIds, profileMap[format]);
  if (!result.success) return { success: false, error: result.error };
  
  return {
    success: true,
    data: {
      downloadUrl: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.data?.data}`,
    },
  };
}

// ==================== Get Export History ====================

export async function getExportHistory() {
  const session = await requireOrganization();

  return prisma.exportHistory.findMany({
    where: { organizationId: session.currentOrganization.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

// ==================== Get Available Export Profiles ====================

export async function getExportProfiles() {
  return [
    { value: "GENERIC", label: "Generic Excel", description: "รูปแบบมาตรฐาน" },
    { value: "PEAK", label: "PEAK Import", description: "สำหรับ PEAK Accounting" },
    { value: "FLOWACCOUNT", label: "FlowAccount Import", description: "สำหรับ FlowAccount" },
    { value: "EXPRESS", label: "Express Import", description: "สำหรับ Express Accounting" },
    { value: "ZIP", label: "ZIP Bundle", description: "รวมไฟล์เอกสารทั้งหมด" },
  ];
}
