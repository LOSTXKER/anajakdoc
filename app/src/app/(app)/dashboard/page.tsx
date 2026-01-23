import { requireOrganization } from "@/server/auth";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  FileText, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CalendarClock,
  Plus,
  FileCheck,
  AlertCircle,
  Percent,
  Copy,
  Hourglass,
  Users,
  Eye,
  Send,
  BookOpen,
  FileQuestion,
} from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getBoxTypeConfig, getBoxStatusConfig, AGING_BUCKET_CONFIG } from "@/lib/document-config";
import { cn } from "@/lib/utils";

// Dashboard stats query following Plan V3 Section 14
async function getDashboardStats(orgId: string, role: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Calculate aging dates
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    // Basic stats
    totalBoxes,
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
    // Basic
    prisma.box.count({ where: { organizationId: orgId } }),
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
        category: true,
        contact: true,
        createdBy: { select: { name: true } },
        documents: { select: { docType: true } },
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
    totalBoxes,
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
  const stats = await getDashboardStats(
    session.currentOrganization.id,
    session.currentOrganization.role
  );

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
          <>
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Pending Boxes */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">กล่องค้าง</span>
                  <Hourglass className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold text-foreground">{stats.owner.pendingBoxes}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  ฿{formatMoney(stats.owner.pendingAmount)}
                </p>
              </div>

              {/* WHT Outstanding */}
              <div className={cn(
                "rounded-xl border p-4",
                stats.owner.whtOverdueCount > 0 
                  ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950" 
                  : "border-border bg-card"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">WHT ค้าง</span>
                  <Percent className={cn(
                    "h-4 w-4",
                    stats.owner.whtOverdueCount > 0 ? "text-red-500" : "text-muted-foreground"
                  )} />
                </div>
                <p className={cn(
                  "text-3xl font-bold",
                  stats.owner.whtOverdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-foreground"
                )}>
                  ฿{formatMoney(stats.owner.whtOutstanding)}
                </p>
                {stats.owner.whtOverdueCount > 0 && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    <AlertTriangle className="inline h-3 w-3 mr-1" />
                    {stats.owner.whtOverdueCount} เกินกำหนด
                  </p>
                )}
              </div>

              {/* Possible Duplicates */}
              {stats.owner.duplicateCount > 0 && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-amber-700 dark:text-amber-300">อาจซ้ำ</span>
                    <Copy className="h-4 w-4 text-amber-500" />
                  </div>
                  <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">{stats.owner.duplicateCount}</p>
                  <Link href="/documents?duplicate=true" className="text-sm text-amber-600 dark:text-amber-400 hover:underline mt-1 inline-block">
                    ตรวจสอบ →
                  </Link>
                </div>
              )}

              {/* Reimbursement Pending */}
              {stats.owner.reimbursementPending > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">รอคืนเงินพนักงาน</span>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    ฿{formatMoney(stats.owner.reimbursementPending)}
                  </p>
                </div>
              )}
            </div>

            {/* Aging Buckets */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-medium text-foreground mb-3">อายุกล่องค้าง</h3>
              <div className="grid grid-cols-4 gap-2">
                {(Object.entries(stats.owner.agingBuckets) as [keyof typeof AGING_BUCKET_CONFIG, number][]).map(([bucket, count]) => {
                  const config = AGING_BUCKET_CONFIG[bucket];
                  return (
                    <div 
                      key={bucket}
                      className={cn(
                        "rounded-lg p-3 text-center",
                        config.className
                      )}
                    >
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs">{config.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Accountant Dashboard (Section 14) */}
        {isAccounting && (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <Link 
              href="/documents?status=SUBMITTED"
              className="rounded-xl border border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950 p-4 hover:border-sky-300 dark:hover:border-sky-700 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <Send className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <span className="text-sm text-sky-700 dark:text-sky-300">Inbox</span>
              </div>
              <p className="text-3xl font-bold text-sky-700 dark:text-sky-300">{stats.accountant.inbox}</p>
            </Link>

            <Link 
              href="/documents?status=IN_REVIEW"
              className="rounded-xl border border-border bg-card p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-muted-foreground">กำลังตรวจ</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.accountant.inReview}</p>
            </Link>

            <Link 
              href="/documents?status=NEED_MORE_DOCS"
              className={cn(
                "rounded-xl border p-4 transition-colors",
                stats.accountant.needMoreDocs > 0 
                  ? "border-amber-200 bg-amber-50 hover:border-amber-300 dark:border-amber-900 dark:bg-amber-950 dark:hover:border-amber-700" 
                  : "border-border bg-card hover:border-muted-foreground"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <FileQuestion className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm text-amber-700 dark:text-amber-300">ขอเอกสาร</span>
              </div>
              <p className={cn(
                "text-3xl font-bold",
                stats.accountant.needMoreDocs > 0 ? "text-amber-700 dark:text-amber-300" : "text-foreground"
              )}>
                {stats.accountant.needMoreDocs}
              </p>
            </Link>

            <Link 
              href="/documents?status=READY_TO_BOOK"
              className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950 p-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm text-emerald-700 dark:text-emerald-300">พร้อมลง</span>
              </div>
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{stats.accountant.readyToBook}</p>
            </Link>

            <Link 
              href="/documents?status=WHT_PENDING"
              className={cn(
                "rounded-xl border p-4 transition-colors",
                stats.accountant.whtPending > 0 
                  ? "border-orange-200 bg-orange-50 hover:border-orange-300 dark:border-orange-900 dark:bg-orange-950 dark:hover:border-orange-700" 
                  : "border-border bg-card hover:border-muted-foreground"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Percent className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <span className="text-sm text-orange-700 dark:text-orange-300">รอ WHT</span>
              </div>
              <p className={cn(
                "text-3xl font-bold",
                stats.accountant.whtPending > 0 ? "text-orange-700 dark:text-orange-300" : "text-foreground"
              )}>
                {stats.accountant.whtPending}
              </p>
            </Link>

            {stats.accountant.overdueTasks > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm text-red-700 dark:text-red-300">งานเลยกำหนด</span>
                </div>
                <p className="text-3xl font-bold text-red-700 dark:text-red-300">{stats.accountant.overdueTasks}</p>
              </div>
            )}
          </div>
        )}

        {/* Monthly Summary */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">รายจ่ายเดือนนี้</span>
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">฿{formatMoney(stats.monthlyExpense)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date().toLocaleDateString("th-TH", { month: "long", year: "numeric" })}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">รายรับเดือนนี้</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">฿{formatMoney(stats.monthlyIncome)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date().toLocaleDateString("th-TH", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Quick Actions & Recent */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-4">สร้างกล่องใหม่</h3>
            <div className="space-y-3">
              <Link
                href="/documents/new?type=expense"
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">รายจ่าย</p>
                  <p className="text-xs text-muted-foreground">ใบเสร็จ, ใบกำกับภาษี</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>

              <Link
                href="/documents/new?type=income"
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">รายรับ</p>
                  <p className="text-xs text-muted-foreground">ใบแจ้งหนี้, ใบเสนอราคา</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          </div>

          {/* Recent Boxes */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">กล่องล่าสุด</h3>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/documents">
                  ดูทั้งหมด
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {stats.recentBoxes.length === 0 ? (
              <div className="flex flex-col items-center py-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Package className="h-7 w-7 text-primary" />
                </div>
                <p className="text-muted-foreground mb-4">ยังไม่มีกล่องเอกสาร</p>
                <Button size="sm" asChild>
                  <Link href="/documents/new">
                    <Plus className="mr-1.5 h-4 w-4" />
                    สร้างกล่องแรก
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.recentBoxes.map((box) => {
                  const config = getBoxTypeConfig(box.boxType);
                  const statusConfig = getBoxStatusConfig(box.status);
                  return (
                    <Link
                      key={box.id}
                      href={`/documents/${box.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted transition-colors"
                    >
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config.bgLight)}>
                        <Package className={cn("h-5 w-5", config.iconColor)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{box.boxNumber}</span>
                          <Badge variant="secondary" className={cn("text-xs", statusConfig.className)}>
                            {statusConfig.labelShort}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {box.contact?.name || "-"} • ฿{box.totalAmount.toNumber().toLocaleString()}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(box.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
