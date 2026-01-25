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

// Dashboard stats query - using new 4-status system: DRAFT, PENDING, NEED_DOCS, COMPLETED
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
    
    // Owner Dashboard Stats
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
    
    // Accountant Dashboard Stats (using new status system)
    draftCount,
    pendingCount,
    needDocsCount,
    completedCount,
    vatMissingCount,
    whtMissingCount,
    overdueTasksCount,
  ] = await Promise.all([
    // Monthly stats - include all non-draft boxes
    prisma.box.aggregate({
      where: {
        organizationId: orgId,
        boxType: "EXPENSE",
        boxDate: { gte: startOfMonth, lte: endOfMonth },
        status: { notIn: ["DRAFT"] },
      },
      _sum: { totalAmount: true },
    }),
    prisma.box.aggregate({
      where: {
        organizationId: orgId,
        boxType: "INCOME",
        boxDate: { gte: startOfMonth, lte: endOfMonth },
        status: { notIn: ["DRAFT"] },
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
    
    // Owner: Pending boxes (not completed)
    prisma.box.count({
      where: {
        organizationId: orgId,
        status: { notIn: ["COMPLETED"] },
      },
    }),
    // Owner: Total pending amount (not completed)
    prisma.box.aggregate({
      where: {
        organizationId: orgId,
        status: { notIn: ["COMPLETED"] },
      },
      _sum: { totalAmount: true },
    }),
    // Owner: WHT outstanding
    prisma.box.aggregate({
      where: {
        organizationId: orgId,
        hasWht: true,
        whtDocStatus: { in: ["MISSING", "REQUEST_SENT"] },
      },
      _sum: { whtAmount: true },
    }),
    // Owner: WHT overdue count
    prisma.box.count({
      where: {
        organizationId: orgId,
        hasWht: true,
        whtOverdue: true,
      },
    }),
    // Owner: Possible duplicates
    prisma.box.count({
      where: {
        organizationId: orgId,
        possibleDuplicate: true,
        status: { notIn: ["COMPLETED"] },
      },
    }),
    // Owner: Reimbursement pending
    prisma.box.aggregate({
      where: {
        organizationId: orgId,
        paymentMode: "EMPLOYEE_ADVANCE",
        reimbursementStatus: "PENDING",
      },
      _sum: { totalAmount: true },
    }),
    
    // Aging buckets (not completed)
    prisma.box.count({
      where: {
        organizationId: orgId,
        status: { notIn: ["COMPLETED"] },
        createdAt: { gte: threeDaysAgo },
      },
    }),
    prisma.box.count({
      where: {
        organizationId: orgId,
        status: { notIn: ["COMPLETED"] },
        createdAt: { lt: threeDaysAgo, gte: sevenDaysAgo },
      },
    }),
    prisma.box.count({
      where: {
        organizationId: orgId,
        status: { notIn: ["COMPLETED"] },
        createdAt: { lt: sevenDaysAgo, gte: fourteenDaysAgo },
      },
    }),
    prisma.box.count({
      where: {
        organizationId: orgId,
        status: { notIn: ["COMPLETED"] },
        createdAt: { lt: fourteenDaysAgo },
      },
    }),
    
    // Accountant stats - using new status system
    prisma.box.count({ where: { organizationId: orgId, status: "DRAFT" } }),
    prisma.box.count({ where: { organizationId: orgId, status: "PENDING" } }),
    prisma.box.count({ where: { organizationId: orgId, status: "NEED_DOCS" } }),
    prisma.box.count({ where: { organizationId: orgId, status: "COMPLETED" } }),
    // VAT missing count
    prisma.box.count({ 
      where: { 
        organizationId: orgId, 
        hasVat: true,
        vatDocStatus: "MISSING",
        status: { notIn: ["COMPLETED"] },
      } 
    }),
    // WHT missing count
    prisma.box.count({ 
      where: { 
        organizationId: orgId, 
        hasWht: true,
        whtDocStatus: { in: ["MISSING", "REQUEST_SENT"] },
        status: { notIn: ["COMPLETED"] },
      } 
    }),
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
    
    // Accountant stats - new status system
    accountant: {
      draft: draftCount,
      pending: pendingCount,
      needDocs: needDocsCount,
      completed: completedCount,
      vatMissing: vatMissingCount,
      whtMissing: whtMissingCount,
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
