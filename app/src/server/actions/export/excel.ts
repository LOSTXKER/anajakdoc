"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { generateTimestamp } from "@/lib/utils";
import * as XLSX from "xlsx";
import type { ApiResponse } from "@/types";
import { ExportType } from "@prisma/client";
import type { ExportProfile } from "./types";
import { PROFILE_COLUMNS } from "./types";
import { transformBoxToRow } from "./transformers";

/**
 * Export boxes to Excel with specified profile
 */
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
  
  const timestamp = generateTimestamp();
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
