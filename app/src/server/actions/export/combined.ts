"use server";

import type { ApiResponse } from "@/types";
import { exportBoxesToExcel } from "./excel";
import { exportBoxesToZip } from "./zip";
import { EXPORT_PROFILE_MAP } from "./types";

/**
 * Combined export function (main entry point)
 * This is a convenience function that wraps the individual export functions
 */
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
  const result = await exportBoxesToExcel(boxIds, EXPORT_PROFILE_MAP[format]);
  if (!result.success) return { success: false, error: result.error };
  
  return {
    success: true,
    data: {
      downloadUrl: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.data?.data}`,
    },
  };
}
