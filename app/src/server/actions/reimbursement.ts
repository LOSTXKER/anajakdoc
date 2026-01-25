"use server";

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/types";
import { ReimbursementStatus } from "@prisma/client";

// ==================== Types ====================

export interface ReimbursementItem {
  id: string;
  amount: number;
  reimbursementStatus: ReimbursementStatus;
  reimbursedAt: string | null;
  reimbursementNote: string | null;
  createdAt: string;
  box: {
    id: string;
    boxNumber: string;
    title: string | null;
    boxDate: string;
  };
  member: {
    id: string;
    visibleName: string | null;
    bankName: string | null;
    bankAccount: string | null;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  } | null;
}

// ==================== Get Reimbursements ====================

export async function getReimbursements(status: "PENDING" | "REIMBURSED" | "all" = "all"): Promise<ReimbursementItem[]> {
  const session = await requireOrganization();

  const whereClause: Record<string, unknown> = {
    payerType: "MEMBER",
    memberId: { not: null },
    box: {
      organizationId: session.currentOrganization.id,
    },
  };

  if (status !== "all") {
    whereClause.reimbursementStatus = status;
  }

  const reimbursements = await prisma.boxPayer.findMany({
    where: whereClause,
    include: {
      box: {
        select: {
          id: true,
          boxNumber: true,
          title: true,
          boxDate: true,
        },
      },
      member: {
        select: {
          id: true,
          visibleName: true,
          bankName: true,
          bankAccount: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Serialize dates
  return reimbursements.map((r) => ({
    id: r.id,
    amount: r.amount.toNumber(),
    reimbursementStatus: r.reimbursementStatus,
    reimbursedAt: r.reimbursedAt?.toISOString() || null,
    reimbursementNote: r.reimbursementNote,
    createdAt: r.createdAt.toISOString(),
    box: {
      id: r.box.id,
      boxNumber: r.box.boxNumber,
      title: r.box.title,
      boxDate: r.box.boxDate.toISOString(),
    },
    member: r.member
      ? {
          id: r.member.id,
          visibleName: r.member.visibleName,
          bankName: r.member.bankName,
          bankAccount: r.member.bankAccount,
          user: r.member.user,
        }
      : null,
  })) as ReimbursementItem[];
}

// ==================== Get Summary ====================

export async function getReimbursementSummary(): Promise<{
  pendingCount: number;
  pendingAmount: number;
  completedCount: number;
}> {
  const session = await requireOrganization();

  const [pendingCount, pendingAmount, completedCount] = await Promise.all([
    prisma.boxPayer.count({
      where: {
        payerType: "MEMBER",
        memberId: { not: null },
        reimbursementStatus: "PENDING",
        box: { organizationId: session.currentOrganization.id },
      },
    }),
    prisma.boxPayer.aggregate({
      where: {
        payerType: "MEMBER",
        memberId: { not: null },
        reimbursementStatus: "PENDING",
        box: { organizationId: session.currentOrganization.id },
      },
      _sum: { amount: true },
    }),
    prisma.boxPayer.count({
      where: {
        payerType: "MEMBER",
        memberId: { not: null },
        reimbursementStatus: "REIMBURSED",
        box: { organizationId: session.currentOrganization.id },
      },
    }),
  ]);

  return {
    pendingCount,
    pendingAmount: pendingAmount._sum.amount?.toNumber() || 0,
    completedCount,
  };
}

// ==================== Mark as Reimbursed ====================

export async function markAsReimbursed(
  payerIds: string[],
  note?: string
): Promise<ApiResponse> {
  const session = await requireOrganization();

  if (payerIds.length === 0) {
    return { success: false, error: "กรุณาเลือกรายการที่ต้องการคืนเงิน" };
  }

  // Verify all payers belong to this organization
  const payers = await prisma.boxPayer.findMany({
    where: {
      id: { in: payerIds },
      payerType: "MEMBER",
      box: { organizationId: session.currentOrganization.id },
    },
  });

  if (payers.length !== payerIds.length) {
    return { success: false, error: "บางรายการไม่พบหรือไม่มีสิทธิ์" };
  }

  // Update all payers
  await prisma.boxPayer.updateMany({
    where: { id: { in: payerIds } },
    data: {
      reimbursementStatus: "REIMBURSED",
      reimbursedAt: new Date(),
      reimbursementNote: note || null,
    },
  });

  revalidatePath("/reimbursements");

  return {
    success: true,
    message: `คืนเงินเรียบร้อย ${payerIds.length} รายการ`,
  };
}

// ==================== Revert Reimbursement ====================

export async function revertReimbursement(payerId: string): Promise<ApiResponse> {
  const session = await requireOrganization();

  const payer = await prisma.boxPayer.findFirst({
    where: {
      id: payerId,
      payerType: "MEMBER",
      box: { organizationId: session.currentOrganization.id },
    },
  });

  if (!payer) {
    return { success: false, error: "ไม่พบรายการ" };
  }

  await prisma.boxPayer.update({
    where: { id: payerId },
    data: {
      reimbursementStatus: "PENDING",
      reimbursedAt: null,
      reimbursementNote: null,
    },
  });

  revalidatePath("/reimbursements");

  return {
    success: true,
    message: "ยกเลิกการคืนเงินเรียบร้อย",
  };
}
