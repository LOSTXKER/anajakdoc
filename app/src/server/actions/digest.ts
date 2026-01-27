"use server";

/**
 * Email Digest Actions
 * 
 * Features:
 * - Generate digest content
 * - Schedule daily/weekly digests
 */

import prisma from "@/lib/prisma";

// ============================================
// TYPES
// ============================================

export interface DigestData {
  organizationName: string;
  period: string;
  stats: {
    pendingBoxes: number;
    inReviewBoxes: number;
    readyToBookBoxes: number;
    completedBoxes: number;
    totalAmount: number;
  };
  urgentItems: Array<{
    type: string;
    title: string;
    description: string;
    link: string;
  }>;
  recentActivity: Array<{
    action: string;
    boxNumber: string;
    userName: string;
    timestamp: string;
  }>;
}

// ============================================
// GENERATE DIGEST
// ============================================

export async function generateDigest(
  organizationId: string,
  period: "daily" | "weekly"
): Promise<DigestData> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true },
  });

  if (!organization) {
    throw new Error("Organization not found");
  }

  // Calculate date range
  const now = new Date();
  const startDate = new Date(now);
  if (period === "daily") {
    startDate.setDate(startDate.getDate() - 1);
  } else {
    startDate.setDate(startDate.getDate() - 7);
  }

  // Get box stats (using new 5-status system)
  const [pendingBoxes, inReviewBoxes, readyToBookBoxes, completedBoxes] = await Promise.all([
    prisma.box.count({
      where: { organizationId, status: "DRAFT" },
    }),
    prisma.box.count({
      where: { organizationId, status: { in: ["SUBMITTED", "NEED_DOCS"] } },
    }),
    prisma.box.count({
      where: { organizationId, status: "SUBMITTED" },
    }),
    prisma.box.count({
      where: {
        organizationId,
        status: "COMPLETED",
        bookedAt: { gte: startDate },
      },
    }),
  ]);

  // Get total amount for completed boxes in period
  const completedAmount = await prisma.box.aggregate({
    where: {
      organizationId,
      status: "COMPLETED",
      bookedAt: { gte: startDate },
    },
    _sum: { totalAmount: true },
  });

  // Get urgent items (overdue WHT, old pending boxes)
  const urgentItems: DigestData["urgentItems"] = [];

  const overdueWht = await prisma.box.findMany({
    where: {
      organizationId,
      hasWht: true,
      whtOverdue: true,
    },
    select: { id: true, boxNumber: true, whtDueDate: true },
    take: 5,
  });

  for (const box of overdueWht) {
    urgentItems.push({
      type: "WHT_OVERDUE",
      title: "WHT เกินกำหนด",
      description: `กล่อง ${box.boxNumber} มี WHT เกินกำหนดส่ง`,
      link: `/documents/${box.id}`,
    });
  }

  const oldPendingBoxes = await prisma.box.findMany({
    where: {
      organizationId,
      status: { in: ["SUBMITTED", "NEED_DOCS"] },
      submittedAt: {
        lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // > 7 days old
      },
    },
    select: { id: true, boxNumber: true, submittedAt: true },
    take: 5,
  });

  for (const box of oldPendingBoxes) {
    urgentItems.push({
      type: "OLD_PENDING",
      title: "เอกสารค้างนาน",
      description: `กล่อง ${box.boxNumber} รอตรวจนานกว่า 7 วัน`,
      link: `/documents/${box.id}`,
    });
  }

  // Get recent activity
  const recentLogs = await prisma.activityLog.findMany({
    where: {
      box: { organizationId },
      createdAt: { gte: startDate },
    },
    include: {
      user: { select: { name: true, email: true } },
      box: { select: { boxNumber: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const recentActivity = recentLogs.map((log) => ({
    action: log.action,
    boxNumber: log.box?.boxNumber || "-",
    userName: log.user.name || log.user.email,
    timestamp: log.createdAt.toISOString(),
  }));

  // Format period string
  const periodStr = period === "daily"
    ? `สรุปประจำวัน ${now.toLocaleDateString("th-TH")}`
    : `สรุปประจำสัปดาห์ ${startDate.toLocaleDateString("th-TH")} - ${now.toLocaleDateString("th-TH")}`;

  return {
    organizationName: organization.name,
    period: periodStr,
    stats: {
      pendingBoxes,
      inReviewBoxes,
      readyToBookBoxes,
      completedBoxes,
      totalAmount: Number(completedAmount._sum.totalAmount || 0),
    },
    urgentItems,
    recentActivity,
  };
}

// ============================================
// GET USERS FOR DIGEST
// ============================================

export async function getUsersForDigest(
  frequency: "DAILY" | "WEEKLY"
): Promise<Array<{
  userId: string;
  email: string;
  organizationId: string;
  organizationName: string;
}>> {
  // For now, return empty array since UserPreference model isn't created yet
  // This would be implemented when the schema is migrated
  return [];
}
