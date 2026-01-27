"use server";

import prisma from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import type { ApiResponse } from "@/types";

export type ClientOverview = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  pendingBoxes: number;
  pendingAmount: number;
  whtOutstanding: number;
  whtOverdueCount: number;
  needMoreDocsCount: number;
  readyToBookCount: number;
  overdueTasksCount: number;
  avgAgingDays: number;
  completionRate: number;
  healthScore: number;
};

export type FirmDashboardStats = {
  firmName: string;
  totalClients: number;
  totalPendingBoxes: number;
  totalPendingAmount: number;
  totalWhtOutstanding: number;
  totalWhtOverdue: number;
  clients: ClientOverview[];
};

export async function getFirmDashboard(): Promise<ApiResponse<FirmDashboardStats>> {
  const user = await requireUser();

  const firmMember = await prisma.firmMember.findFirst({
    where: { userId: user.id, isActive: true },
    include: { firm: { include: { clients: true } } },
  });

  if (!firmMember) {
    return { success: false, error: "คุณไม่ได้เป็นสมาชิกของสำนักงานบัญชี" };
  }

  const firm = firmMember.firm;
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const clientIds = firm.clients.map(c => c.id);
  
  if (clientIds.length === 0) {
    return {
      success: true,
      data: {
        firmName: firm.name,
        totalClients: 0,
        totalPendingBoxes: 0,
        totalPendingAmount: 0,
        totalWhtOutstanding: 0,
        totalWhtOverdue: 0,
        clients: [],
      },
    };
  }

  const [allBoxes, pendingAmounts, whtOutstandingAmounts, whtOverdueCounts, taskCounts] = await Promise.all([
    prisma.box.findMany({
      where: { organizationId: { in: clientIds } },
      select: { id: true, organizationId: true, status: true, totalAmount: true, whtAmount: true, hasWht: true, whtDocStatus: true, whtOverdue: true, createdAt: true },
    }),
    prisma.box.groupBy({
      by: ['organizationId'],
      where: { organizationId: { in: clientIds }, status: { notIn: ["COMPLETED"] } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.box.groupBy({
      by: ['organizationId'],
      where: { organizationId: { in: clientIds }, hasWht: true, whtDocStatus: { in: ["MISSING", "REQUEST_SENT"] } },
      _sum: { whtAmount: true },
    }),
    prisma.box.groupBy({
      by: ['organizationId'],
      where: { organizationId: { in: clientIds }, hasWht: true, whtOverdue: true },
      _count: true,
    }),
    prisma.task.groupBy({
      by: ['organizationId'],
      where: { organizationId: { in: clientIds }, status: { in: ["OPEN", "IN_PROGRESS"] }, dueDate: { lt: now } },
      _count: true,
    }),
  ]);

  const pendingAmountMap = new Map(pendingAmounts.map(p => [p.organizationId, { count: p._count, amount: p._sum.totalAmount?.toNumber() || 0 }]));
  const whtOutstandingMap = new Map(whtOutstandingAmounts.map(w => [w.organizationId, w._sum.whtAmount?.toNumber() || 0]));
  const whtOverdueMap = new Map(whtOverdueCounts.map(w => [w.organizationId, w._count]));
  const taskCountMap = new Map(taskCounts.map(t => [t.organizationId, t._count]));

  const boxesByOrg = new Map<string, typeof allBoxes>();
  for (const box of allBoxes) {
    if (!boxesByOrg.has(box.organizationId)) boxesByOrg.set(box.organizationId, []);
    boxesByOrg.get(box.organizationId)!.push(box);
  }

  const clientsWithStats: ClientOverview[] = firm.clients.map((client) => {
    const boxes = boxesByOrg.get(client.id) || [];
    const pendingBoxes = boxes.filter(b => b.status !== "COMPLETED").length;
    const needMoreDocsCount = boxes.filter(b => b.status === "NEED_DOCS").length;
    const readyToBookCount = boxes.filter(b => b.status === "SUBMITTED").length;
    const totalBoxes = boxes.filter(b => b.status !== "DRAFT").length;
    const completedBoxes = boxes.filter(b => b.status === "COMPLETED").length;
    
    const aging0to3 = boxes.filter(b => b.status !== "COMPLETED" && b.createdAt >= threeDaysAgo).length;
    const aging4to7 = boxes.filter(b => b.status !== "COMPLETED" && b.createdAt < threeDaysAgo && b.createdAt >= sevenDaysAgo).length;
    const aging8to14 = boxes.filter(b => b.status !== "COMPLETED" && b.createdAt < sevenDaysAgo && b.createdAt >= fourteenDaysAgo).length;
    const aging15plus = boxes.filter(b => b.status !== "COMPLETED" && b.createdAt < fourteenDaysAgo).length;

    const totalAging = aging0to3 * 1.5 + aging4to7 * 5.5 + aging8to14 * 11 + aging15plus * 21;
    const avgAgingDays = pendingBoxes > 0 ? totalAging / pendingBoxes : 0;
    const completionRate = totalBoxes > 0 ? Math.round((completedBoxes / totalBoxes) * 100) : 100;

    const pendingAmount = pendingAmountMap.get(client.id)?.amount || 0;
    const whtOutstanding = whtOutstandingMap.get(client.id) || 0;
    const whtOverdueCount = whtOverdueMap.get(client.id) || 0;
    const overdueTasksCount = taskCountMap.get(client.id) || 0;

    let healthScore = 100;
    healthScore -= Math.min(30, whtOverdueCount * 10);
    healthScore -= Math.min(20, needMoreDocsCount * 5);
    healthScore -= Math.min(20, overdueTasksCount * 5);
    healthScore -= Math.max(0, 30 - completionRate) * 0.5;
    healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

    return {
      id: client.id,
      name: client.name,
      slug: client.slug,
      logo: client.logo,
      pendingBoxes,
      pendingAmount,
      whtOutstanding,
      whtOverdueCount,
      needMoreDocsCount,
      readyToBookCount,
      overdueTasksCount,
      avgAgingDays: Math.round(avgAgingDays * 10) / 10,
      completionRate,
      healthScore,
    };
  });

  const totals = clientsWithStats.reduce((acc, client) => ({
    totalPendingBoxes: acc.totalPendingBoxes + client.pendingBoxes,
    totalPendingAmount: acc.totalPendingAmount + client.pendingAmount,
    totalWhtOutstanding: acc.totalWhtOutstanding + client.whtOutstanding,
    totalWhtOverdue: acc.totalWhtOverdue + client.whtOverdueCount,
  }), {
    totalPendingBoxes: 0,
    totalPendingAmount: 0,
    totalWhtOutstanding: 0,
    totalWhtOverdue: 0,
  });

  const sortedClients = clientsWithStats.sort((a, b) => {
    if (a.healthScore !== b.healthScore) return a.healthScore - b.healthScore;
    return b.pendingBoxes - a.pendingBoxes;
  });

  return {
    success: true,
    data: {
      firmName: firm.name,
      totalClients: firm.clients.length,
      ...totals,
      clients: sortedClients,
    },
  };
}
