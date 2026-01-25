"use server";

/**
 * Advanced Analytics Actions
 * 
 * Features:
 * - Processing time breakdown
 * - Bottleneck detection
 * - Period comparison
 */

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";

type ApiResponse<T> = { success: true; data: T } | { success: false; error: string };

// ============================================
// TYPES
// ============================================

export interface ProcessingStageMetrics {
  stage: string;
  label: string;
  avgDays: number;
  boxCount: number;
  pendingCount: number;
}

export interface BottleneckData {
  stages: ProcessingStageMetrics[];
  bottleneck: {
    stage: string;
    label: string;
    avgDays: number;
    suggestion: string;
  } | null;
  overallAvgDays: number;
  totalProcessed: number;
}

export interface TrendComparison {
  current: {
    period: string;
    boxCount: number;
    totalAmount: number;
    avgProcessingDays: number;
  };
  previous: {
    period: string;
    boxCount: number;
    totalAmount: number;
    avgProcessingDays: number;
  };
  changes: {
    boxCountChange: number;
    amountChange: number;
    processingChange: number;
  };
}

// ============================================
// GET BOTTLENECK DATA
// ============================================

export async function getBottleneckAnalytics(): Promise<ApiResponse<BottleneckData>> {
  const session = await requireOrganization();
  const orgId = session.currentOrganization.id;

  // Get boxes from last 90 days that have been processed
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const boxes = await prisma.box.findMany({
    where: {
      organizationId: orgId,
      createdAt: { gte: ninetyDaysAgo },
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      submittedAt: true,
      reviewedAt: true,
      bookedAt: true,
    },
  });

  // Calculate stage metrics
  const stages: ProcessingStageMetrics[] = [];

  // Stage 1: DRAFT → SUBMITTED
  const draftToSubmitted = boxes.filter((b) => b.submittedAt);
  const draftDays = draftToSubmitted.map((b) =>
    Math.ceil((b.submittedAt!.getTime() - b.createdAt.getTime()) / (1000 * 60 * 60 * 24))
  );
  const avgDraftDays = draftDays.length > 0
    ? draftDays.reduce((a, b) => a + b, 0) / draftDays.length
    : 0;

  stages.push({
    stage: "DRAFT_TO_PENDING",
    label: "สร้าง → ส่งตรวจ",
    avgDays: Math.round(avgDraftDays * 10) / 10,
    boxCount: draftToSubmitted.length,
    pendingCount: boxes.filter((b) => b.status === "DRAFT").length,
  });

  // Stage 2: PENDING → Review complete
  const submittedToReviewed = boxes.filter((b) => b.submittedAt && b.reviewedAt);
  const reviewDays = submittedToReviewed.map((b) =>
    Math.ceil((b.reviewedAt!.getTime() - b.submittedAt!.getTime()) / (1000 * 60 * 60 * 24))
  );
  const avgReviewDays = reviewDays.length > 0
    ? reviewDays.reduce((a, b) => a + b, 0) / reviewDays.length
    : 0;

  stages.push({
    stage: "PENDING_TO_REVIEWED",
    label: "ส่งตรวจ → ตรวจเสร็จ",
    avgDays: Math.round(avgReviewDays * 10) / 10,
    boxCount: submittedToReviewed.length,
    pendingCount: boxes.filter((b) => ["PENDING", "NEED_DOCS"].includes(b.status)).length,
  });

  // Stage 3: REVIEWED → COMPLETED
  const reviewedToBooked = boxes.filter((b) => b.reviewedAt && b.bookedAt);
  const bookDays = reviewedToBooked.map((b) =>
    Math.ceil((b.bookedAt!.getTime() - b.reviewedAt!.getTime()) / (1000 * 60 * 60 * 24))
  );
  const avgBookDays = bookDays.length > 0
    ? bookDays.reduce((a, b) => a + b, 0) / bookDays.length
    : 0;

  stages.push({
    stage: "REVIEWED_TO_COMPLETED",
    label: "ตรวจเสร็จ → เสร็จสิ้น",
    avgDays: Math.round(avgBookDays * 10) / 10,
    boxCount: reviewedToBooked.length,
    pendingCount: boxes.filter((b) => b.status === "PENDING").length,
  });

  // Find bottleneck (stage with highest avg days)
  const sortedStages = [...stages].sort((a, b) => b.avgDays - a.avgDays);
  const bottleneckStage = sortedStages[0];

  let bottleneck: BottleneckData["bottleneck"] = null;
  if (bottleneckStage && bottleneckStage.avgDays > 1) {
    let suggestion = "";
    switch (bottleneckStage.stage) {
      case "DRAFT_TO_PENDING":
        suggestion = "พิจารณาเตือนผู้ใช้ให้ส่งเอกสารเร็วขึ้น หรือตั้งค่า auto-submit";
        break;
      case "PENDING_TO_REVIEWED":
        suggestion = "เพิ่มจำนวนผู้ตรวจสอบ หรือใช้ AI ช่วยจัดลำดับเอกสารด่วน";
        break;
      case "REVIEWED_TO_COMPLETED":
        suggestion = "ตรวจสอบว่ามีเอกสารค้างรอลงบัญชีหรือไม่ อาจต้องเร่งส่งออก";
        break;
    }

    bottleneck = {
      stage: bottleneckStage.stage,
      label: bottleneckStage.label,
      avgDays: bottleneckStage.avgDays,
      suggestion,
    };
  }

  // Calculate overall average
  const completedBoxes = boxes.filter((b) => b.bookedAt);
  const overallDays = completedBoxes.map((b) =>
    Math.ceil((b.bookedAt!.getTime() - b.createdAt.getTime()) / (1000 * 60 * 60 * 24))
  );
  const overallAvgDays = overallDays.length > 0
    ? Math.round((overallDays.reduce((a, b) => a + b, 0) / overallDays.length) * 10) / 10
    : 0;

  return {
    success: true,
    data: {
      stages,
      bottleneck,
      overallAvgDays,
      totalProcessed: completedBoxes.length,
    },
  };
}

// ============================================
// GET TREND COMPARISON
// ============================================

export async function getTrendComparison(): Promise<ApiResponse<TrendComparison>> {
  const session = await requireOrganization();
  const orgId = session.currentOrganization.id;

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(currentMonthStart.getTime() - 1);

  // Current month boxes
  const currentBoxes = await prisma.box.findMany({
    where: {
      organizationId: orgId,
      createdAt: { gte: currentMonthStart },
    },
    select: {
      totalAmount: true,
      createdAt: true,
      bookedAt: true,
    },
  });

  // Previous month boxes
  const previousBoxes = await prisma.box.findMany({
    where: {
      organizationId: orgId,
      createdAt: {
        gte: previousMonthStart,
        lte: previousMonthEnd,
      },
    },
    select: {
      totalAmount: true,
      createdAt: true,
      bookedAt: true,
    },
  });

  // Calculate metrics
  const currentTotal = currentBoxes.reduce((sum, b) => sum + Number(b.totalAmount), 0);
  const previousTotal = previousBoxes.reduce((sum, b) => sum + Number(b.totalAmount), 0);

  const currentCompleted = currentBoxes.filter((b) => b.bookedAt);
  const previousCompleted = previousBoxes.filter((b) => b.bookedAt);

  const currentAvgDays = currentCompleted.length > 0
    ? currentCompleted.reduce((sum, b) =>
        sum + Math.ceil((b.bookedAt!.getTime() - b.createdAt.getTime()) / (1000 * 60 * 60 * 24)), 0
      ) / currentCompleted.length
    : 0;

  const previousAvgDays = previousCompleted.length > 0
    ? previousCompleted.reduce((sum, b) =>
        sum + Math.ceil((b.bookedAt!.getTime() - b.createdAt.getTime()) / (1000 * 60 * 60 * 24)), 0
      ) / previousCompleted.length
    : 0;

  // Format month names
  const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const currentPeriod = `${monthNames[now.getMonth()]} ${now.getFullYear() + 543}`;
  const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const previousPeriod = `${monthNames[prevMonth]} ${prevYear + 543}`;

  // Calculate changes
  const boxCountChange = previousBoxes.length > 0
    ? ((currentBoxes.length - previousBoxes.length) / previousBoxes.length) * 100
    : 0;
  const amountChange = previousTotal > 0
    ? ((currentTotal - previousTotal) / previousTotal) * 100
    : 0;
  const processingChange = previousAvgDays > 0
    ? ((currentAvgDays - previousAvgDays) / previousAvgDays) * 100
    : 0;

  return {
    success: true,
    data: {
      current: {
        period: currentPeriod,
        boxCount: currentBoxes.length,
        totalAmount: currentTotal,
        avgProcessingDays: Math.round(currentAvgDays * 10) / 10,
      },
      previous: {
        period: previousPeriod,
        boxCount: previousBoxes.length,
        totalAmount: previousTotal,
        avgProcessingDays: Math.round(previousAvgDays * 10) / 10,
      },
      changes: {
        boxCountChange: Math.round(boxCountChange * 10) / 10,
        amountChange: Math.round(amountChange * 10) / 10,
        processingChange: Math.round(processingChange * 10) / 10,
      },
    },
  };
}
