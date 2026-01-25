"use server";

/**
 * Benchmark & Insight Layer (Section 20)
 * 
 * Features:
 * - Calculate organizational KPIs
 * - Compare against market benchmarks (anonymized)
 * - Provide actionable insights
 */

import prisma from "@/lib/prisma";
import { requireOrganization } from "@/server/auth";
import type { ApiResponse } from "@/types";

// ============================================
// TYPES
// ============================================

export type OrganizationMetrics = {
  // Processing metrics
  avgProcessingDays: number;     // Average days from SUBMITTED to BOOKED
  firstPassRate: number;          // % of boxes that go directly to READY_TO_BOOK
  completionRate: number;         // % of boxes that are BOOKED/ARCHIVED
  
  // WHT metrics
  avgWhtAgingDays: number;        // Average days WHT remains pending
  whtComplianceRate: number;      // % of WHT docs received before deadline
  
  // Volume metrics
  totalBoxes30d: number;          // Total boxes in last 30 days
  totalAmount30d: number;         // Total amount in last 30 days
  
  // Efficiency metrics
  needMoreDocsRate: number;       // % of boxes that go to NEED_MORE_DOCS
  duplicateRate: number;          // % of boxes flagged as possible duplicates
};

export type BenchmarkComparison = {
  metric: string;
  label: string;
  yourValue: number;
  marketAvg: number;
  percentile: number;  // Your percentile ranking (0-100)
  trend: "better" | "same" | "worse";
  insight: string;
};

export type InsightReport = {
  generatedAt: string;
  organizationName: string;
  metrics: OrganizationMetrics;
  benchmarks: BenchmarkComparison[];
  summary: string;
  recommendations: string[];
};

// ============================================
// MARKET BENCHMARKS (Simulated)
// In production, these would come from aggregated anonymized data
// ============================================

const MARKET_BENCHMARKS = {
  avgProcessingDays: { mean: 5.2, stdDev: 2.1 },
  firstPassRate: { mean: 68, stdDev: 15 },
  completionRate: { mean: 85, stdDev: 10 },
  avgWhtAgingDays: { mean: 12, stdDev: 5 },
  whtComplianceRate: { mean: 72, stdDev: 18 },
  needMoreDocsRate: { mean: 25, stdDev: 12 },
  duplicateRate: { mean: 3, stdDev: 2 },
};

// ============================================
// GET ORGANIZATION METRICS
// ============================================

/**
 * Calculate organization's performance metrics
 */
export async function getOrganizationMetrics(): Promise<ApiResponse<OrganizationMetrics>> {
  const session = await requireOrganization();
  const orgId = session.currentOrganization.id;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get all boxes
  const [
    allBoxes,
    bookedBoxes,
    needMoreDocsBoxes,
    duplicateBoxes,
    whtBoxes,
  ] = await Promise.all([
    // All non-draft boxes
    prisma.box.findMany({
      where: {
        organizationId: orgId,
        status: { not: "DRAFT" },
      },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        hasWht: true,
        whtOverdue: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    // Completed boxes (for processing time calculation)
    prisma.box.findMany({
      where: {
        organizationId: orgId,
        status: "COMPLETED",
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    }),
    // Boxes that went to NEED_MORE_DOCS
    prisma.activityLog.findMany({
      where: {
        box: { organizationId: orgId },
        action: "NEED_MORE_DOCS",
      },
      select: { boxId: true },
    }),
    // Possible duplicates
    prisma.box.count({
      where: {
        organizationId: orgId,
        possibleDuplicate: true,
      },
    }),
    // WHT boxes
    prisma.box.findMany({
      where: {
        organizationId: orgId,
        hasWht: true,
      },
      select: {
        whtDocStatus: true,
        whtOverdue: true,
        whtDueDate: true,
        createdAt: true,
      },
    }),
  ]);

  // Calculate metrics
  const totalBoxes = allBoxes.length;
  const completedBoxes = bookedBoxes.length;

  // Avg processing days
  let avgProcessingDays = 0;
  if (bookedBoxes.length > 0) {
    const totalDays = bookedBoxes.reduce((sum, box) => {
      const days = (box.updatedAt.getTime() - box.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    avgProcessingDays = Math.round((totalDays / bookedBoxes.length) * 10) / 10;
  }

  // First pass rate (boxes that never went to NEED_MORE_DOCS)
  const needMoreDocsBoxIds = new Set(needMoreDocsBoxes.map(l => l.boxId));
  const firstPassCount = completedBoxes - [...needMoreDocsBoxIds].filter(id => 
    bookedBoxes.some(b => b.createdAt)
  ).length;
  const firstPassRate = totalBoxes > 0 
    ? Math.round((firstPassCount / totalBoxes) * 100) 
    : 100;

  // Completion rate
  const completionRate = totalBoxes > 0 
    ? Math.round((completedBoxes / totalBoxes) * 100) 
    : 100;

  // WHT metrics
  let avgWhtAgingDays = 0;
  let whtComplianceRate = 100;
  if (whtBoxes.length > 0) {
    const resolvedWht = whtBoxes.filter(b => b.whtDocStatus === "RECEIVED" || b.whtDocStatus === "VERIFIED");
    const totalWhtDays = whtBoxes.reduce((sum, box) => {
      const days = (now.getTime() - box.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return sum + Math.min(days, 90); // Cap at 90 days
    }, 0);
    avgWhtAgingDays = Math.round((totalWhtDays / whtBoxes.length) * 10) / 10;
    
    const onTimeWht = whtBoxes.filter(b => !b.whtOverdue).length;
    whtComplianceRate = Math.round((onTimeWht / whtBoxes.length) * 100);
  }

  // Need more docs rate
  const needMoreDocsRate = totalBoxes > 0 
    ? Math.round((needMoreDocsBoxIds.size / totalBoxes) * 100) 
    : 0;

  // Duplicate rate
  const duplicateRate = totalBoxes > 0 
    ? Math.round((duplicateBoxes / totalBoxes) * 100) 
    : 0;

  // 30-day volume
  const boxes30d = allBoxes.filter(b => b.createdAt >= thirtyDaysAgo);
  const totalBoxes30d = boxes30d.length;
  const totalAmount30d = boxes30d.reduce((sum, b) => sum + Number(b.totalAmount), 0);

  return {
    success: true,
    data: {
      avgProcessingDays,
      firstPassRate,
      completionRate,
      avgWhtAgingDays,
      whtComplianceRate,
      totalBoxes30d,
      totalAmount30d,
      needMoreDocsRate,
      duplicateRate,
    },
  };
}

// ============================================
// BENCHMARK COMPARISON
// ============================================

/**
 * Get full insight report with benchmark comparisons
 */
export async function getInsightReport(): Promise<ApiResponse<InsightReport>> {
  const session = await requireOrganization();
  
  const metricsResult = await getOrganizationMetrics();
  if (!metricsResult.success || !metricsResult.data) {
    return { success: false, error: metricsResult.error || "ไม่พบข้อมูลเมตริก" };
  }

  const metrics = metricsResult.data;
  const benchmarks: BenchmarkComparison[] = [];

  // Calculate percentile and trend for each metric
  const comparisons = [
    {
      metric: "avgProcessingDays",
      label: "ระยะเวลาประมวลผลเฉลี่ย",
      value: metrics.avgProcessingDays,
      benchmark: MARKET_BENCHMARKS.avgProcessingDays,
      lowerIsBetter: true,
    },
    {
      metric: "firstPassRate",
      label: "อัตราผ่านรอบแรก",
      value: metrics.firstPassRate,
      benchmark: MARKET_BENCHMARKS.firstPassRate,
      lowerIsBetter: false,
    },
    {
      metric: "completionRate",
      label: "อัตราความสำเร็จ",
      value: metrics.completionRate,
      benchmark: MARKET_BENCHMARKS.completionRate,
      lowerIsBetter: false,
    },
    {
      metric: "avgWhtAgingDays",
      label: "WHT ค้างเฉลี่ย",
      value: metrics.avgWhtAgingDays,
      benchmark: MARKET_BENCHMARKS.avgWhtAgingDays,
      lowerIsBetter: true,
    },
    {
      metric: "whtComplianceRate",
      label: "อัตรา WHT ทันกำหนด",
      value: metrics.whtComplianceRate,
      benchmark: MARKET_BENCHMARKS.whtComplianceRate,
      lowerIsBetter: false,
    },
    {
      metric: "needMoreDocsRate",
      label: "อัตราขอเอกสารเพิ่ม",
      value: metrics.needMoreDocsRate,
      benchmark: MARKET_BENCHMARKS.needMoreDocsRate,
      lowerIsBetter: true,
    },
  ];

  for (const comp of comparisons) {
    const { mean, stdDev } = comp.benchmark;
    const zScore = (comp.value - mean) / stdDev;
    
    // Convert z-score to percentile
    let percentile = Math.round(normalCDF(comp.lowerIsBetter ? -zScore : zScore) * 100);
    percentile = Math.max(0, Math.min(100, percentile));

    // Determine trend
    let trend: "better" | "same" | "worse";
    if (comp.lowerIsBetter) {
      trend = comp.value < mean * 0.9 ? "better" : comp.value > mean * 1.1 ? "worse" : "same";
    } else {
      trend = comp.value > mean * 1.1 ? "better" : comp.value < mean * 0.9 ? "worse" : "same";
    }

    // Generate insight
    const insight = generateInsight(comp.metric, comp.value, mean, trend);

    benchmarks.push({
      metric: comp.metric,
      label: comp.label,
      yourValue: comp.value,
      marketAvg: mean,
      percentile,
      trend,
      insight,
    });
  }

  // Generate summary
  const betterCount = benchmarks.filter(b => b.trend === "better").length;
  const worseCount = benchmarks.filter(b => b.trend === "worse").length;
  
  let summary: string;
  if (betterCount >= 4) {
    summary = "องค์กรของคุณมีประสิทธิภาพดีกว่าค่าเฉลี่ยตลาดในหลายด้าน!";
  } else if (worseCount >= 4) {
    summary = "มีโอกาสในการปรับปรุงหลายด้าน ดูคำแนะนำด้านล่าง";
  } else {
    summary = "ประสิทธิภาพโดยรวมอยู่ในระดับปานกลาง มีบางด้านที่สามารถปรับปรุงได้";
  }

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (metrics.avgProcessingDays > MARKET_BENCHMARKS.avgProcessingDays.mean * 1.2) {
    recommendations.push("ลดระยะเวลาประมวลผลโดยใช้ Bulk Actions และตั้งค่า Auto-reminders");
  }
  if (metrics.firstPassRate < MARKET_BENCHMARKS.firstPassRate.mean * 0.8) {
    recommendations.push("เพิ่มอัตราผ่านรอบแรกโดยให้พนักงานแนบเอกสารครบก่อนส่ง");
  }
  if (metrics.whtComplianceRate < MARKET_BENCHMARKS.whtComplianceRate.mean * 0.8) {
    recommendations.push("ติดตาม WHT ใกล้ชิดขึ้นด้วย Task และ Reminder");
  }
  if (metrics.needMoreDocsRate > MARKET_BENCHMARKS.needMoreDocsRate.mean * 1.2) {
    recommendations.push("สร้าง Template หรือ Checklist ให้พนักงานรู้ว่าต้องแนบเอกสารอะไรบ้าง");
  }

  if (recommendations.length === 0) {
    recommendations.push("รักษามาตรฐานที่ดีต่อไป และทดลองใช้ฟีเจอร์ใหม่ๆ เพื่อเพิ่มประสิทธิภาพ");
  }

  return {
    success: true,
    data: {
      generatedAt: new Date().toISOString(),
      organizationName: session.currentOrganization.name,
      metrics,
      benchmarks,
      summary,
      recommendations,
    },
  };
}

// ============================================
// HELPERS
// ============================================

/**
 * Cumulative distribution function for standard normal distribution
 */
function normalCDF(x: number): number {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Generate human-readable insight for a metric
 */
function generateInsight(
  metric: string, 
  value: number, 
  marketAvg: number, 
  trend: "better" | "same" | "worse"
): string {
  const diff = Math.abs(value - marketAvg);
  const diffPercent = Math.round((diff / marketAvg) * 100);

  switch (metric) {
    case "avgProcessingDays":
      if (trend === "better") {
        return `เร็วกว่าค่าเฉลี่ย ${diff.toFixed(1)} วัน (${diffPercent}%)`;
      } else if (trend === "worse") {
        return `ช้ากว่าค่าเฉลี่ย ${diff.toFixed(1)} วัน ควรใช้ Bulk Actions`;
      }
      return "อยู่ในเกณฑ์ปกติ";

    case "firstPassRate":
      if (trend === "better") {
        return `สูงกว่าค่าเฉลี่ย ${diffPercent}% แสดงว่าเอกสารครบถ้วน`;
      } else if (trend === "worse") {
        return `ต่ำกว่าค่าเฉลี่ย ${diffPercent}% แนะนำสร้าง Checklist`;
      }
      return "อยู่ในเกณฑ์ปกติ";

    case "whtComplianceRate":
      if (trend === "better") {
        return `ดีกว่าค่าเฉลี่ย ${diffPercent}%`;
      } else if (trend === "worse") {
        return `ต่ำกว่าค่าเฉลี่ย ${diffPercent}% ควรติดตาม WHT ใกล้ชิด`;
      }
      return "อยู่ในเกณฑ์ปกติ";

    default:
      if (trend === "better") {
        return `ดีกว่าค่าเฉลี่ยตลาด ${diffPercent}%`;
      } else if (trend === "worse") {
        return `มีโอกาสปรับปรุง`;
      }
      return "อยู่ในเกณฑ์ปกติ";
  }
}
