"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import type { ApiResponse } from "@/types";

export async function exportBoxesToExcel(
  boxIds: string[],
  format: "generic" | "peak" = "generic"
): Promise<ApiResponse<{ fileName: string; data: string }>> {
  const session = await requireOrganization();

  // Check permission
  if (!["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    return {
      success: false,
      error: "คุณไม่มีสิทธิ์ Export",
    };
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
      createdBy: {
        select: { name: true, email: true },
      },
      documents: {
        include: { files: true },
      },
    },
    orderBy: { boxDate: "asc" },
  });

  if (boxes.length === 0) {
    return {
      success: false,
      error: "ไม่พบกล่องที่เลือก",
    };
  }

  // Create workbook
  const workbook = XLSX.utils.book_new();

  if (format === "generic") {
    // Generic Excel format
    const data = boxes.map((box) => ({
      "เลขที่กล่อง": box.boxNumber,
      "วันที่": new Date(box.boxDate).toLocaleDateString("th-TH"),
      "ประเภท": box.boxType === "EXPENSE" ? "รายจ่าย" : box.boxType === "INCOME" ? "รายรับ" : "ปรับปรุง",
      "ประเภทรายจ่าย": box.expenseType || "-",
      "หมวดหมู่": box.category?.name || "-",
      "ศูนย์ต้นทุน": box.costCenter?.name || "-",
      "คู่ค้า": box.contact?.name || "-",
      "ชื่อกล่อง": box.title || "-",
      "รายละเอียด": box.description || "-",
      "ยอดรวม": box.totalAmount.toNumber(),
      "VAT": box.vatAmount.toNumber(),
      "หัก ณ ที่จ่าย": box.whtAmount.toNumber(),
      "ยอดจ่ายแล้ว": box.paidAmount.toNumber(),
      "สถานะ": box.status,
      "สถานะเอกสาร": box.docStatus,
      "สถานะการจ่าย": box.paymentStatus,
      "ผู้สร้าง": box.createdBy.name || box.createdBy.email,
      "จำนวนเอกสาร": box.documents.length,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "กล่องเอกสาร");
  } else {
    // PEAK format
    const data = boxes.map((box) => ({
      "วันที่": new Date(box.boxDate).toLocaleDateString("th-TH"),
      "เลขที่เอกสาร": box.externalRef || box.boxNumber,
      "รหัสผู้ติดต่อ": box.contact?.taxId || "",
      "ชื่อผู้ติดต่อ": box.contact?.name || "",
      "รหัสบัญชี": box.category?.peakAccountCode || "",
      "คำอธิบาย": box.description || box.title || box.category?.name || "",
      "จำนวนเงิน": (box.totalAmount.toNumber() - box.vatAmount.toNumber()),
      "ภาษีมูลค่าเพิ่ม": box.vatAmount.toNumber(),
      "ภาษีหัก ณ ที่จ่าย": box.whtAmount.toNumber(),
      "ยอดสุทธิ": box.totalAmount.toNumber(),
      "ศูนย์ต้นทุน": box.costCenter?.code || "",
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
      boxIds: boxIds,
      boxCount: boxes.length,
      exportedById: session.id,
    },
  });

  // Update box status if needed
  await prisma.box.updateMany({
    where: {
      id: { in: boxIds },
      status: "APPROVED",
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

export async function exportBoxes(
  boxIds: string[],
  format: "EXCEL_GENERIC" | "EXCEL_PEAK" | "ZIP"
): Promise<ApiResponse<{ downloadUrl?: string }>> {
  const session = await requireOrganization();

  // Check permission
  if (!["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    return {
      success: false,
      error: "คุณไม่มีสิทธิ์ Export",
    };
  }

  if (boxIds.length === 0) {
    return {
      success: false,
      error: "กรุณาเลือกกล่อง",
    };
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
      documents: {
        include: {
          files: true,
        },
      },
      createdBy: {
        select: { name: true, email: true },
      },
    },
    orderBy: { boxDate: "asc" },
  });

  if (boxes.length === 0) {
    return {
      success: false,
      error: "ไม่พบกล่องที่เลือก",
    };
  }

  const now = new Date();
  const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}_${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}`;
  
  let fileName: string;

  if (format === "EXCEL_GENERIC" || format === "EXCEL_PEAK") {
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    const data = boxes.map((box) => ({
      "เลขที่กล่อง": box.boxNumber,
      "วันที่": new Date(box.boxDate).toLocaleDateString("th-TH"),
      "ประเภท": box.boxType === "EXPENSE" ? "รายจ่าย" : box.boxType === "INCOME" ? "รายรับ" : "ปรับปรุง",
      "ประเภทรายจ่าย": box.expenseType || "-",
      "หมวดหมู่": box.category?.name || "-",
      "รหัสบัญชี": box.category?.peakAccountCode || "-",
      "ศูนย์ต้นทุน": box.costCenter?.name || "-",
      "คู่ค้า": box.contact?.name || "-",
      "เลขประจำตัวผู้เสียภาษี": box.contact?.taxId || "-",
      "ชื่อกล่อง": box.title || "-",
      "รายละเอียด": box.description || "-",
      "ยอดก่อน VAT": (box.totalAmount.toNumber() - box.vatAmount.toNumber()),
      "VAT": box.vatAmount.toNumber(),
      "หัก ณ ที่จ่าย": box.whtAmount.toNumber(),
      "ยอดรวม": box.totalAmount.toNumber(),
      "ยอดจ่ายแล้ว": box.paidAmount.toNumber(),
      "สถานะ": box.status,
      "สถานะเอกสาร": box.docStatus,
      "สถานะการจ่าย": box.paymentStatus,
      "ผู้สร้าง": box.createdBy.name || box.createdBy.email,
      "จำนวนเอกสาร": box.documents.length,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Set column widths
    worksheet["!cols"] = [
      { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 15 },
      { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 25 },
      { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 12 },
      { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 20 },
      { wch: 10 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "กล่องเอกสาร");
    
    fileName = `export_${timestamp}.xlsx`;

    // Generate buffer for download (base64)
    const buffer = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
    
    // Save export history
    await prisma.exportHistory.create({
      data: {
        organizationId: session.currentOrganization.id,
        exportType: format,
        fileName,
        boxIds: boxIds,
        boxCount: boxes.length,
        exportedById: session.id,
      },
    });

    // Update box status
    await prisma.box.updateMany({
      where: {
        id: { in: boxIds },
        status: "APPROVED",
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
    // ZIP export with files
    fileName = `export_${timestamp}.zip`;
    
    const zip = new JSZip();
    
    // Create Excel summary
    const workbook = XLSX.utils.book_new();
    const summaryData = boxes.map((box) => ({
      "เลขที่กล่อง": box.boxNumber,
      "วันที่": new Date(box.boxDate).toLocaleDateString("th-TH"),
      "ประเภท": box.boxType === "EXPENSE" ? "รายจ่าย" : box.boxType === "INCOME" ? "รายรับ" : "ปรับปรุง",
      "หมวดหมู่": box.category?.name || "-",
      "คู่ค้า": box.contact?.name || "-",
      "ชื่อกล่อง": box.title || "-",
      "รายละเอียด": box.description || "-",
      "ยอดรวม": box.totalAmount.toNumber(),
      "สถานะ": box.status,
      "จำนวนเอกสาร": box.documents.length,
      "จำนวนไฟล์": box.documents.reduce((sum, doc) => sum + doc.files.length, 0),
    }));
    const worksheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "สรุปกล่องเอกสาร");
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    zip.file("summary.xlsx", excelBuffer);
    
    // Add files for each box
    for (const box of boxes) {
      const folderName = `${box.boxNumber}`;
      
      for (const doc of box.documents) {
        for (const file of doc.files) {
          try {
            // Fetch file from URL
            const response = await fetch(file.fileUrl);
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              zip.file(`${folderName}/${doc.docType}_${file.fileName}`, arrayBuffer);
            }
          } catch (error) {
            console.error(`Error fetching file ${file.fileName}:`, error);
          }
        }
      }
    }
    
    // Generate ZIP
    const zipBuffer = await zip.generateAsync({ type: "base64" });
    
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

    // Update box status
    await prisma.box.updateMany({
      where: {
        id: { in: boxIds },
        status: "APPROVED",
      },
      data: {
        status: "EXPORTED",
        exportedAt: new Date(),
      },
    });

    return {
      success: true,
      data: {
        downloadUrl: `data:application/zip;base64,${zipBuffer}`,
      },
    };
  }
}
