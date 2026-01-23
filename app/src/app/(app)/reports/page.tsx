import { requireOrganization } from "@/server/auth";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";
import prisma from "@/lib/prisma";

async function getKpiData(orgId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get processing time data (boxes that have been booked)
  const bookedBoxes = await prisma.box.findMany({
    where: {
      organizationId: orgId,
      status: { in: ["BOOKED", "ARCHIVED", "LOCKED"] },
      bookedAt: { not: null },
      submittedAt: { not: null },
      boxDate: { gte: thirtyDaysAgo },
    },
    select: {
      submittedAt: true,
      bookedAt: true,
    },
  });

  // Calculate average processing time (days)
  let avgProcessingDays = 0;
  if (bookedBoxes.length > 0) {
    const totalDays = bookedBoxes.reduce((sum, box) => {
      if (box.submittedAt && box.bookedAt) {
        const days = (box.bookedAt.getTime() - box.submittedAt.getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }
      return sum;
    }, 0);
    avgProcessingDays = Math.round((totalDays / bookedBoxes.length) * 10) / 10;
  }

  // First-pass completion rate (boxes that went directly to READY_TO_BOOK without NEED_MORE_DOCS)
  // We'll check activity logs for this
  const totalCompletedBoxes = await prisma.box.count({
    where: {
      organizationId: orgId,
      status: { in: ["BOOKED", "ARCHIVED", "LOCKED", "READY_TO_BOOK"] },
      boxDate: { gte: thirtyDaysAgo },
    },
  });

  // Count boxes that had NEED_MORE_DOCS status at some point
  const boxesWithNeedMoreDocs = await prisma.activityLog.findMany({
    where: {
      action: "STATUS_CHANGED",
      details: {
        path: ["newStatus"],
        equals: "NEED_MORE_DOCS",
      },
      box: {
        organizationId: orgId,
        boxDate: { gte: thirtyDaysAgo },
      },
    },
    distinct: ["boxId"],
  });

  const firstPassRate = totalCompletedBoxes > 0 
    ? Math.round(((totalCompletedBoxes - boxesWithNeedMoreDocs.length) / totalCompletedBoxes) * 100)
    : 100;

  // WHT compliance (% of WHT tracking that were received on time)
  const whtTotal = await prisma.whtTracking.count({
    where: {
      box: { organizationId: orgId },
      status: { in: ["RECEIVED", "CONFIRMED"] },
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  const whtOverdue = await prisma.whtTracking.count({
    where: {
      box: { organizationId: orgId },
      isOverdue: true,
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  const whtComplianceRate = whtTotal > 0 
    ? Math.round(((whtTotal - whtOverdue) / whtTotal) * 100)
    : 100;

  // Processing efficiency (boxes per day this month)
  const boxesThisMonth = await prisma.box.count({
    where: {
      organizationId: orgId,
      status: { in: ["BOOKED", "ARCHIVED", "LOCKED"] },
      bookedAt: { gte: startOfMonth },
    },
  });

  const daysInMonth = Math.ceil((now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24)) || 1;
  const boxesPerDay = Math.round((boxesThisMonth / daysInMonth) * 10) / 10;

  // Top vendors by volume
  const topVendors = await prisma.box.groupBy({
    by: ["contactId"],
    where: {
      organizationId: orgId,
      boxType: "EXPENSE",
      status: { notIn: ["CANCELLED", "DRAFT"] },
      contactId: { not: null },
      boxDate: { gte: thirtyDaysAgo },
    },
    _count: true,
    _sum: { totalAmount: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });

  // Get contact names
  const contactIds = topVendors.map(v => v.contactId).filter(Boolean) as string[];
  const contacts = await prisma.contact.findMany({
    where: { id: { in: contactIds } },
    select: { id: true, name: true, avgResponseDays: true },
  });

  const topVendorsWithNames = topVendors.map(v => {
    const contact = contacts.find(c => c.id === v.contactId);
    return {
      name: contact?.name || "ไม่ทราบชื่อ",
      count: v._count,
      amount: v._sum.totalAmount?.toNumber() || 0,
      avgDays: contact?.avgResponseDays || null,
    };
  });

  // Pending boxes by status
  const pendingByStatus = await prisma.box.groupBy({
    by: ["status"],
    where: {
      organizationId: orgId,
      status: { notIn: ["BOOKED", "ARCHIVED", "LOCKED", "CANCELLED"] },
    },
    _count: true,
  });

  return {
    avgProcessingDays,
    firstPassRate,
    whtComplianceRate,
    boxesPerDay,
    boxesProcessedThisMonth: boxesThisMonth,
    topVendors: topVendorsWithNames,
    pendingByStatus: pendingByStatus.map(p => ({
      status: p.status,
      count: p._count,
    })),
  };
}

async function getReportData(orgId: string) {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31);

  // Get monthly data for current year
  const monthlyData = await prisma.$queryRaw<
    { month: number; expense: number; income: number }[]
  >`
    SELECT 
      EXTRACT(MONTH FROM box_date) as month,
      SUM(CASE WHEN box_type = 'EXPENSE' THEN total_amount ELSE 0 END) as expense,
      SUM(CASE WHEN box_type = 'INCOME' THEN total_amount ELSE 0 END) as income
    FROM boxes
    WHERE organization_id = ${orgId}
      AND box_date >= ${startOfYear}
      AND box_date <= ${endOfYear}
      AND status NOT IN ('CANCELLED')
    GROUP BY EXTRACT(MONTH FROM box_date)
    ORDER BY month
  `;

  // Get category breakdown
  const categoryData = await prisma.box.groupBy({
    by: ["categoryId"],
    where: {
      organizationId: orgId,
      boxType: "EXPENSE",
      status: { notIn: ["CANCELLED"] },
      boxDate: { gte: startOfYear, lte: endOfYear },
    },
    _sum: { totalAmount: true },
    _count: true,
  });

  const categories = await prisma.category.findMany({
    where: { organizationId: orgId },
  });

  const categoryBreakdown = categoryData.map((item) => {
    const category = categories.find((c) => c.id === item.categoryId);
    return {
      name: category?.name || "ไม่ระบุหมวด",
      amount: item._sum.totalAmount?.toNumber() || 0,
      count: item._count,
    };
  }).sort((a, b) => b.amount - a.amount);

  // Get cost center breakdown
  const costCenterData = await prisma.box.groupBy({
    by: ["costCenterId"],
    where: {
      organizationId: orgId,
      boxType: "EXPENSE",
      status: { notIn: ["CANCELLED"] },
      boxDate: { gte: startOfYear, lte: endOfYear },
    },
    _sum: { totalAmount: true },
    _count: true,
  });

  const costCenters = await prisma.costCenter.findMany({
    where: { organizationId: orgId },
  });

  const costCenterBreakdown = costCenterData.map((item) => {
    const cc = costCenters.find((c) => c.id === item.costCenterId);
    return {
      name: cc?.name || "ไม่ระบุศูนย์ต้นทุน",
      amount: item._sum.totalAmount?.toNumber() || 0,
      count: item._count,
    };
  }).sort((a, b) => b.amount - a.amount);

  // Get totals
  const totals = await prisma.box.aggregate({
    where: {
      organizationId: orgId,
      status: { notIn: ["CANCELLED"] },
      boxDate: { gte: startOfYear, lte: endOfYear },
    },
    _sum: { totalAmount: true, vatAmount: true, whtAmount: true },
    _count: true,
  });

  const expenseTotal = await prisma.box.aggregate({
    where: {
      organizationId: orgId,
      boxType: "EXPENSE",
      status: { notIn: ["CANCELLED"] },
      boxDate: { gte: startOfYear, lte: endOfYear },
    },
    _sum: { totalAmount: true },
  });

  const incomeTotal = await prisma.box.aggregate({
    where: {
      organizationId: orgId,
      boxType: "INCOME",
      status: { notIn: ["CANCELLED"] },
      boxDate: { gte: startOfYear, lte: endOfYear },
    },
    _sum: { totalAmount: true },
  });

  return {
    monthlyData: monthlyData.map((m) => ({
      month: Number(m.month),
      expense: Number(m.expense) || 0,
      income: Number(m.income) || 0,
    })),
    categoryBreakdown,
    costCenterBreakdown,
    totals: {
      totalAmount: totals._sum.totalAmount?.toNumber() || 0,
      vatAmount: totals._sum.vatAmount?.toNumber() || 0,
      whtAmount: totals._sum.whtAmount?.toNumber() || 0,
      boxCount: totals._count,
      expenseTotal: expenseTotal._sum.totalAmount?.toNumber() || 0,
      incomeTotal: incomeTotal._sum.totalAmount?.toNumber() || 0,
    },
    year: now.getFullYear(),
  };
}

export default async function ReportsPage() {
  const session = await requireOrganization();
  
  // Only accounting, admin, owner can view reports
  if (!["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    redirect("/documents");
  }

  const [reportData, kpiData] = await Promise.all([
    getReportData(session.currentOrganization.id),
    getKpiData(session.currentOrganization.id),
  ]);

  return (
    <>
      <AppHeader 
        title="รายงาน" 
        description={`ภาพรวมปี ${reportData.year + 543}`}
        showCreateButton={false}
      />
      
      <div className="p-6">
        <ReportsDashboard data={reportData} kpiData={kpiData} />
      </div>
    </>
  );
}
