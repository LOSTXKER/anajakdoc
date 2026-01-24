import { requireOrganization } from "@/server/auth";
import { AppHeader } from "@/components/layout/app-header";
import prisma from "@/lib/prisma";
import {
  OwnerStats,
  AccountantStats,
  MonthlySummary,
  QuickActions,
  RecentBoxes,
} from "./_components";

// Dashboard stats query following Plan V3 Section 14
async function getDashboardStats(orgId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Calculate aging dates
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    // Basic stats
    monthlyExpense,
    monthlyIncome,
    recentBoxes,
    
    // Owner Dashboard Stats (Section 14)
    pendingBoxes,
    pendingAmount,
    whtOutstanding,
    whtOverdueCount,
    duplicateCount,
    reimbursementPending,
    
    // Aging buckets
    aging0to3,
    aging4to7,
    aging8to14,
    aging15plus,
    
    // Accountant Dashboard Stats (Section 14)
    submittedCount,
    inReviewCount,
    needMoreDocsCount,
    readyToBookCount,
    whtPendingCount,
    overdueTasksCount,
  ] = await Promise.all([
    // Monthly stats
    prisma.box.aggregate({
      where: {
        organizationId: orgId,
        boxType: "EXPENSE",
        boxDate: { gte: startOfMonth, lte: endOfMonth },
        status: { notIn: ["CANCELLED"] },
      },
      _sum: { totalAmount: true },
    }),
    prisma.box.aggregate({
      where: {
        organizationId: orgId,
        boxType: "INCOME",
        boxDate: { gte: startOfMonth, lte: endOfMonth },
        status: { notIn: ["CANCELLED"] },
      },
      _sum: { totalAmount: true },
    }),
    prisma.box.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        contact: { select: { name: true } },
      },
    }),
    
    // Owner: Pending boxes (not booked/archived/locked/cancelled)
    prisma.box.count({
      where: {
        organizationId: orgId,
        status: { notIn: ["BOOKED", "ARCHIVED", "LOCKED", "CANCELLED"] },
      },
    }),
    // Owner: Total pending amount
    prisma.box.aggregate({
      where: {
        organizationId: orgId,
        status: { notIn: ["BOOKED", "ARCHIVED", "LOCKED", "CANCELLED"] },
      },
      _sum: { totalAmount: true },
    }),
    // Owner: WHT outstanding
    prisma.box.aggregate({
      where: {
        organizationId: orgId,
        hasWht: true,
        whtDocStatus: { in: ["MISSING", "REQUEST_SENT"] },
        status: { notIn: ["CANCELLED"] },
      },
      _sum: { whtAmount: true },
    }),
    // Owner: WHT overdue count
    prisma.box.count({
      where: {
        organizationId: orgId,
        hasWht: true,
        whtOverdue: true,
        status: { notIn: ["CANCELLED"] },
      },
    }),
    // Owner: Possible duplicates
    prisma.box.count({
      where: {
        organizationId: orgId,
        possibleDuplicate: true,
        status: { notIn: ["CANCELLED"] },
      },
    }),
    // Owner: Reimbursement pending
    prisma.box.aggregate({
      where: {
        organizationId: orgId,
        paymentMode: "EMPLOYEE_ADVANCE",
        reimbursementStatus: "PENDING",
        status: { notIn: ["CANCELLED"] },
      },
      _sum: { totalAmount: true },
    }),
    
    // Aging buckets
    prisma.box.count({
      where: {
        organizationId: orgId,
        status: { notIn: ["BOOKED", "ARCHIVED", "LOCKED", "CANCELLED"] },
        createdAt: { gte: threeDaysAgo },
      },
    }),
    prisma.box.count({
      where: {
        organizationId: orgId,
        status: { notIn: ["BOOKED", "ARCHIVED", "LOCKED", "CANCELLED"] },
        createdAt: { lt: threeDaysAgo, gte: sevenDaysAgo },
      },
    }),
    prisma.box.count({
      where: {
        organizationId: orgId,
        status: { notIn: ["BOOKED", "ARCHIVED", "LOCKED", "CANCELLED"] },
        createdAt: { lt: sevenDaysAgo, gte: fourteenDaysAgo },
      },
    }),
    prisma.box.count({
      where: {
        organizationId: orgId,
        status: { notIn: ["BOOKED", "ARCHIVED", "LOCKED", "CANCELLED"] },
        createdAt: { lt: fourteenDaysAgo },
      },
    }),
    
    // Accountant stats
    prisma.box.count({ where: { organizationId: orgId, status: "SUBMITTED" } }),
    prisma.box.count({ where: { organizationId: orgId, status: "IN_REVIEW" } }),
    prisma.box.count({ where: { organizationId: orgId, status: "NEED_MORE_DOCS" } }),
    prisma.box.count({ where: { organizationId: orgId, status: "READY_TO_BOOK" } }),
    prisma.box.count({ where: { organizationId: orgId, status: "WHT_PENDING" } }),
    prisma.task.count({
      where: {
        organizationId: orgId,
        status: { in: ["OPEN", "IN_PROGRESS"] },
        dueDate: { lt: now },
      },
    }),
  ]);

  return {
    monthlyExpense: monthlyExpense._sum.totalAmount?.toNumber() || 0,
    monthlyIncome: monthlyIncome._sum.totalAmount?.toNumber() || 0,
    recentBoxes,
    
    // Owner stats
    owner: {
      pendingBoxes,
      pendingAmount: pendingAmount._sum.totalAmount?.toNumber() || 0,
      whtOutstanding: whtOutstanding._sum.whtAmount?.toNumber() || 0,
      whtOverdueCount,
      duplicateCount,
      reimbursementPending: reimbursementPending._sum.totalAmount?.toNumber() || 0,
      agingBuckets: {
        "0-3": aging0to3,
        "4-7": aging4to7,
        "8-14": aging8to14,
        "15+": aging15plus,
      },
    },
    
    // Accountant stats
    accountant: {
      inbox: submittedCount,
      inReview: inReviewCount,
      needMoreDocs: needMoreDocsCount,
      readyToBook: readyToBookCount,
      whtPending: whtPendingCount,
      overdueTasks: overdueTasksCount,
    },
  };
}

export default async function DashboardPage() {
  const session = await requireOrganization();
  const stats = await getDashboardStats(session.currentOrganization.id);

  const isAccounting = ["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role);
  const isOwner = ["ADMIN", "OWNER"].includes(session.currentOrganization.role);

  const formatMoney = (amount: number) => 
    amount.toLocaleString("th-TH", { minimumFractionDigits: 2 });

  return (
    <>
      <AppHeader 
        title="Dashboard" 
        description={`ยินดีต้อนรับ ${session.name || "ผู้ใช้"}`}
        showCreateButton={false}
      />
      
      <div className="p-6 space-y-6">
        {/* Owner Dashboard (Section 14) */}
        {isOwner && (
          <OwnerStats stats={stats.owner} formatMoney={formatMoney} />
        )}

        {/* Accountant Dashboard (Section 14) */}
        {isAccounting && (
          <AccountantStats stats={stats.accountant} />
        )}

        {/* Monthly Summary */}
        <MonthlySummary 
          monthlyExpense={stats.monthlyExpense}
          monthlyIncome={stats.monthlyIncome}
          formatMoney={formatMoney}
        />

        {/* Quick Actions & Recent */}
        <div className="grid gap-6 lg:grid-cols-3">
          <QuickActions />
          <RecentBoxes boxes={stats.recentBoxes} />
        </div>
      </div>
    </>
  );
}
