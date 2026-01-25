"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";

/**
 * Get export history for current organization
 */
export async function getExportHistory() {
  const session = await requireOrganization();

  return prisma.exportHistory.findMany({
    where: { organizationId: session.currentOrganization.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

/**
 * Get available export profiles
 */
export async function getExportProfiles() {
  return [
    { value: "GENERIC", label: "Generic Excel", description: "รูปแบบมาตรฐาน" },
    { value: "PEAK", label: "PEAK Import", description: "สำหรับ PEAK Accounting" },
    { value: "FLOWACCOUNT", label: "FlowAccount Import", description: "สำหรับ FlowAccount" },
    { value: "EXPRESS", label: "Express Import", description: "สำหรับ Express Accounting" },
    { value: "ZIP", label: "ZIP Bundle", description: "รวมไฟล์เอกสารทั้งหมด" },
  ];
}
