import { requireOrganization } from "@/server/auth";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";
import prisma from "@/lib/prisma";

async function getReportData(orgId: string) {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31);

  // Get monthly data for current year
  const monthlyData = await prisma.$queryRaw<
    { month: number; expense: number; income: number }[]
  >`
    SELECT 
      EXTRACT(MONTH FROM doc_date) as month,
      SUM(CASE WHEN transaction_type = 'EXPENSE' THEN total_amount ELSE 0 END) as expense,
      SUM(CASE WHEN transaction_type = 'INCOME' THEN total_amount ELSE 0 END) as income
    FROM documents
    WHERE organization_id = ${orgId}
      AND doc_date >= ${startOfYear}
      AND doc_date <= ${endOfYear}
      AND status NOT IN ('VOID', 'REJECTED')
    GROUP BY EXTRACT(MONTH FROM doc_date)
    ORDER BY month
  `;

  // Get category breakdown
  const categoryData = await prisma.document.groupBy({
    by: ["categoryId"],
    where: {
      organizationId: orgId,
      transactionType: "EXPENSE",
      status: { notIn: ["VOID", "REJECTED"] },
      docDate: { gte: startOfYear, lte: endOfYear },
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
  const costCenterData = await prisma.document.groupBy({
    by: ["costCenterId"],
    where: {
      organizationId: orgId,
      transactionType: "EXPENSE",
      status: { notIn: ["VOID", "REJECTED"] },
      docDate: { gte: startOfYear, lte: endOfYear },
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
  const totals = await prisma.document.aggregate({
    where: {
      organizationId: orgId,
      status: { notIn: ["VOID", "REJECTED"] },
      docDate: { gte: startOfYear, lte: endOfYear },
    },
    _sum: { totalAmount: true, vatAmount: true, whtAmount: true },
    _count: true,
  });

  const expenseTotal = await prisma.document.aggregate({
    where: {
      organizationId: orgId,
      transactionType: "EXPENSE",
      status: { notIn: ["VOID", "REJECTED"] },
      docDate: { gte: startOfYear, lte: endOfYear },
    },
    _sum: { totalAmount: true },
  });

  const incomeTotal = await prisma.document.aggregate({
    where: {
      organizationId: orgId,
      transactionType: "INCOME",
      status: { notIn: ["VOID", "REJECTED"] },
      docDate: { gte: startOfYear, lte: endOfYear },
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
      documentCount: totals._count,
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

  const reportData = await getReportData(session.currentOrganization.id);

  return (
    <>
      <AppHeader 
        title="รายงาน" 
        description={`ภาพรวมปี ${reportData.year + 543}`}
        showCreateButton={false}
      />
      
      <div className="p-6">
        <ReportsDashboard data={reportData} />
      </div>
    </>
  );
}
