"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { generateTimestamp } from "@/lib/utils";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import type { ApiResponse } from "@/types";
import { transformBoxToRow } from "./transformers";
import { hasAccountingPermission } from "@/lib/permissions-utils";

/**
 * Export boxes to ZIP bundle with files (Section 11.2)
 */
export async function exportBoxesToZip(
  boxIds: string[],
  options?: {
    includeJson?: boolean;
    groupByMonth?: boolean;
  }
): Promise<ApiResponse<{ fileName: string; data: string }>> {
  const session = await requireOrganization();

  if (!hasAccountingPermission(session.currentOrganization.role)) {
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
        if (process.env.NODE_ENV === "development") {
          console.error(`Error fetching file:`, result.reason);
        }
      }
    }
  }

  // Generate ZIP
  const zipBuffer = await zip.generateAsync({ type: "base64" });
  
  const timestamp = generateTimestamp(now);
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
