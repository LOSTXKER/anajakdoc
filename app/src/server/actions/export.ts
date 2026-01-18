"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import * as XLSX from "xlsx";
import type { ApiResponse } from "@/types";

export async function exportDocumentsToExcel(
  documentIds: string[],
  format: "generic" | "peak" = "generic"
): Promise<ApiResponse<{ fileName: string; data: string }>> {
  const session = await requireOrganization();

  // Check permission
  if (!["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    return {
      success: false,
      error: "คุณไม่มีสิทธิ์ Export เอกสาร",
    };
  }

  const documents = await prisma.document.findMany({
    where: {
      id: { in: documentIds },
      organizationId: session.currentOrganization.id,
    },
    include: {
      category: true,
      costCenter: true,
      contact: true,
      submittedBy: {
        select: { name: true, email: true },
      },
    },
    orderBy: { docDate: "asc" },
  });

  if (documents.length === 0) {
    return {
      success: false,
      error: "ไม่พบเอกสารที่เลือก",
    };
  }

  // Create workbook
  const workbook = XLSX.utils.book_new();

  if (format === "generic") {
    // Generic Excel format
    const data = documents.map((doc) => ({
      "เลขที่เอกสาร": doc.docNumber,
      "วันที่": new Date(doc.docDate).toLocaleDateString("th-TH"),
      "ประเภท": doc.transactionType === "EXPENSE" ? "รายจ่าย" : "รายรับ",
      "ประเภทเอกสาร": doc.docType,
      "หมวดหมู่": doc.category?.name || "-",
      "ศูนย์ต้นทุน": doc.costCenter?.name || "-",
      "คู่ค้า": doc.contact?.name || "-",
      "รายละเอียด": doc.description || "-",
      "ยอดก่อน VAT": doc.subtotal.toString(),
      "VAT": doc.vatAmount.toString(),
      "หัก ณ ที่จ่าย": doc.whtAmount.toString(),
      "ยอดรวม": doc.totalAmount.toString(),
      "สถานะ": doc.status,
      "ผู้ส่ง": doc.submittedBy.name || doc.submittedBy.email,
      "เลขที่อ้างอิง": doc.externalRef || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "เอกสาร");
  } else {
    // PEAK format
    const data = documents.map((doc) => ({
      "วันที่": new Date(doc.docDate).toLocaleDateString("th-TH"),
      "เลขที่เอกสาร": doc.externalRef || doc.docNumber,
      "รหัสผู้ติดต่อ": doc.contact?.taxId || "",
      "ชื่อผู้ติดต่อ": doc.contact?.name || "",
      "รหัสบัญชี": doc.category?.peakAccountCode || "",
      "คำอธิบาย": doc.description || doc.category?.name || "",
      "จำนวนเงิน": doc.subtotal.toString(),
      "ภาษีมูลค่าเพิ่ม": doc.vatAmount.toString(),
      "ภาษีหัก ณ ที่จ่าย": doc.whtAmount.toString(),
      "ยอดสุทธิ": doc.totalAmount.toString(),
      "ศูนย์ต้นทุน": doc.costCenter?.code || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "PEAK Import");
  }

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
  
  const now = new Date();
  const fileName = `export_${format}_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}_${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}.xlsx`;

  // Save export history
  await prisma.exportHistory.create({
    data: {
      organizationId: session.currentOrganization.id,
      exportType: format === "generic" ? "EXCEL_GENERIC" : "EXCEL_PEAK",
      fileName,
      documentIds,
      documentCount: documents.length,
      exportedById: session.id,
    },
  });

  // Update document status if needed
  await prisma.document.updateMany({
    where: {
      id: { in: documentIds },
      status: "READY_TO_EXPORT",
    },
    data: {
      status: "EXPORTED",
      exportedAt: new Date(),
    },
  });

  return {
    success: true,
    data: {
      fileName,
      data: buffer,
    },
  };
}

export async function getExportHistory() {
  const session = await requireOrganization();

  return prisma.exportHistory.findMany({
    where: {
      organizationId: session.currentOrganization.id,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function exportDocuments(
  documentIds: string[],
  format: "EXCEL_GENERIC" | "EXCEL_PEAK" | "ZIP"
): Promise<ApiResponse<{ downloadUrl?: string }>> {
  const session = await requireOrganization();

  // Check permission
  if (!["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    return {
      success: false,
      error: "คุณไม่มีสิทธิ์ Export เอกสาร",
    };
  }

  if (documentIds.length === 0) {
    return {
      success: false,
      error: "กรุณาเลือกเอกสาร",
    };
  }

  const documents = await prisma.document.findMany({
    where: {
      id: { in: documentIds },
      organizationId: session.currentOrganization.id,
    },
    include: {
      category: true,
      costCenter: true,
      contact: true,
      files: true,
      submittedBy: {
        select: { name: true, email: true },
      },
    },
    orderBy: { docDate: "asc" },
  });

  if (documents.length === 0) {
    return {
      success: false,
      error: "ไม่พบเอกสารที่เลือก",
    };
  }

  const now = new Date();
  const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}_${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}`;
  
  let fileName: string;

  if (format === "EXCEL_GENERIC" || format === "EXCEL_PEAK") {
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    const data = documents.map((doc) => ({
      "เลขที่เอกสาร": doc.docNumber,
      "วันที่": new Date(doc.docDate).toLocaleDateString("th-TH"),
      "ประเภท": doc.transactionType === "EXPENSE" ? "รายจ่าย" : "รายรับ",
      "ประเภทเอกสาร": doc.docType,
      "หมวดหมู่": doc.category?.name || "-",
      "รหัสบัญชี": doc.category?.peakAccountCode || "-",
      "ศูนย์ต้นทุน": doc.costCenter?.name || "-",
      "คู่ค้า": doc.contact?.name || "-",
      "เลขประจำตัวผู้เสียภาษี": doc.contact?.taxId || "-",
      "รายละเอียด": doc.description || "-",
      "ยอดก่อน VAT": doc.subtotal.toNumber(),
      "VAT": doc.vatAmount.toNumber(),
      "หัก ณ ที่จ่าย": doc.whtAmount.toNumber(),
      "ยอดรวม": doc.totalAmount.toNumber(),
      "วิธีชำระเงิน": doc.paymentMethod || "-",
      "สถานะ": doc.status,
      "ผู้ส่ง": doc.submittedBy.name || doc.submittedBy.email,
      "เลขที่อ้างอิง": doc.externalRef || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Set column widths
    worksheet["!cols"] = [
      { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 15 },
      { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 25 },
      { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 10 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 20 }, { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "เอกสาร");
    
    fileName = `export_${timestamp}.xlsx`;

    // Generate buffer for download (base64)
    const buffer = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
    
    // Save export history
    await prisma.exportHistory.create({
      data: {
        organizationId: session.currentOrganization.id,
        exportType: format,
        fileName,
        documentIds,
        documentCount: documents.length,
        exportedById: session.id,
      },
    });

    // Update document status
    await prisma.document.updateMany({
      where: {
        id: { in: documentIds },
        status: "READY_TO_EXPORT",
      },
      data: {
        status: "EXPORTED",
        exportedAt: new Date(),
      },
    });

    // Return base64 data URL for download
    return {
      success: true,
      data: {
        downloadUrl: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${buffer}`,
      },
    };
  } else {
    // ZIP export - for now just return success
    fileName = `export_${timestamp}.zip`;
    
    await prisma.exportHistory.create({
      data: {
        organizationId: session.currentOrganization.id,
        exportType: "ZIP",
        fileName,
        documentIds,
        documentCount: documents.length,
        exportedById: session.id,
      },
    });

    return {
      success: true,
      message: "ZIP export is not yet implemented",
    };
  }
}
