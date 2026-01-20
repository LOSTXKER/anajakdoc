"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/types";
import type { PeriodStatus } from ".prisma/client";

export interface FiscalPeriodData {
  id: string;
  name: string;
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
  closedAt: string | null;
  documentCount: number;
  totalAmount: number;
}

export async function getFiscalPeriods(): Promise<FiscalPeriodData[]> {
  const session = await requireOrganization();
  
  const periods = await prisma.fiscalPeriod.findMany({
    where: { organizationId: session.currentOrganization.id },
    include: {
      _count: { select: { boxes: true } },
      boxes: {
        select: { totalAmount: true },
      },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return periods.map(p => ({
    id: p.id,
    name: p.name,
    year: p.year,
    month: p.month,
    startDate: p.startDate.toISOString(),
    endDate: p.endDate.toISOString(),
    status: p.status,
    closedAt: p.closedAt?.toISOString() || null,
    documentCount: p._count.boxes,
    totalAmount: p.boxes.reduce((sum, d) => sum + d.totalAmount.toNumber(), 0),
  }));
}

export async function createFiscalPeriod(
  year: number,
  month: number
): Promise<ApiResponse<FiscalPeriodData>> {
  const session = await requireOrganization();
  
  // Only admin/owner can manage fiscal periods
  if (!["ADMIN", "OWNER", "ACCOUNTING"].includes(session.currentOrganization.role)) {
    return { success: false, error: "ไม่มีสิทธิ์ในการจัดการงวดบัญชี" };
  }

  // Check if period already exists
  const existing = await prisma.fiscalPeriod.findUnique({
    where: {
      organizationId_year_month: {
        organizationId: session.currentOrganization.id,
        year,
        month,
      },
    },
  });

  if (existing) {
    return { success: false, error: "งวดบัญชีนี้มีอยู่แล้ว" };
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of month

  const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  const name = `${thaiMonths[month - 1]} ${year + 543}`;

  const period = await prisma.fiscalPeriod.create({
    data: {
      organizationId: session.currentOrganization.id,
      name,
      year,
      month,
      startDate,
      endDate,
      status: "OPEN",
    },
  });

  revalidatePath("/settings/fiscal-periods");
  
  return {
    success: true,
    data: {
      id: period.id,
      name: period.name,
      year: period.year,
      month: period.month,
      startDate: period.startDate.toISOString(),
      endDate: period.endDate.toISOString(),
      status: period.status,
      closedAt: null,
      documentCount: 0,
      totalAmount: 0,
    },
  };
}

export async function updatePeriodStatus(
  periodId: string,
  status: PeriodStatus
): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  if (!["ADMIN", "OWNER", "ACCOUNTING"].includes(session.currentOrganization.role)) {
    return { success: false, error: "ไม่มีสิทธิ์ในการจัดการงวดบัญชี" };
  }

  const period = await prisma.fiscalPeriod.findFirst({
    where: {
      id: periodId,
      organizationId: session.currentOrganization.id,
    },
  });

  if (!period) {
    return { success: false, error: "ไม่พบงวดบัญชี" };
  }

  // Validation: Can't reopen a CLOSED period without admin override
  if (period.status === "CLOSED" && status === "OPEN") {
    // Could add additional check for OWNER-only here
  }

  await prisma.fiscalPeriod.update({
    where: { id: periodId },
    data: {
      status,
      closedAt: status === "CLOSED" ? new Date() : null,
    },
  });

  revalidatePath("/settings/fiscal-periods");
  
  return { success: true };
}

export async function deleteFiscalPeriod(periodId: string): Promise<ApiResponse> {
  const session = await requireOrganization();
  
  if (!["ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    return { success: false, error: "ไม่มีสิทธิ์ในการลบงวดบัญชี" };
  }

  const period = await prisma.fiscalPeriod.findFirst({
    where: {
      id: periodId,
      organizationId: session.currentOrganization.id,
    },
    include: { _count: { select: { boxes: true } } },
  });

  if (!period) {
    return { success: false, error: "ไม่พบงวดบัญชี" };
  }

  if (period._count.boxes > 0) {
    return { success: false, error: "ไม่สามารถลบงวดที่มีเอกสารได้" };
  }

  await prisma.fiscalPeriod.delete({ where: { id: periodId } });

  revalidatePath("/settings/fiscal-periods");
  
  return { success: true };
}

// Auto-create period for current month if doesn't exist
export async function ensureCurrentPeriod(): Promise<FiscalPeriodData | null> {
  const session = await requireOrganization();
  
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  let period = await prisma.fiscalPeriod.findUnique({
    where: {
      organizationId_year_month: {
        organizationId: session.currentOrganization.id,
        year,
        month,
      },
    },
    include: {
      _count: { select: { boxes: true } },
      boxes: { select: { totalAmount: true } },
    },
  });

  if (!period) {
    const result = await createFiscalPeriod(year, month);
    if (result.success && result.data) {
      return result.data;
    }
    return null;
  }

  return {
    id: period.id,
    name: period.name,
    year: period.year,
    month: period.month,
    startDate: period.startDate.toISOString(),
    endDate: period.endDate.toISOString(),
    status: period.status,
    closedAt: period.closedAt?.toISOString() || null,
    documentCount: period._count.boxes,
    totalAmount: period.boxes.reduce((sum, d) => sum + d.totalAmount.toNumber(), 0),
  };
}
