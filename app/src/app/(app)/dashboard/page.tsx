import { requireOrganization } from "@/server/auth";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
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
} from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";

async function getDashboardStats(orgId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const dueSoon = new Date();
  dueSoon.setDate(dueSoon.getDate() + 7);

  const [
    totalDocs,
    draftDocs,
    pendingDocs,
    approvedDocs,
    recentDocs,
    monthlyExpense,
    monthlyIncome,
    overdueDocs,
    dueSoonDocs,
  ] = await Promise.all([
    prisma.document.count({ where: { organizationId: orgId } }),
    prisma.document.count({ where: { organizationId: orgId, status: "DRAFT" } }),
    prisma.document.count({ where: { organizationId: orgId, status: "PENDING_REVIEW" } }),
    prisma.document.count({ where: { organizationId: orgId, status: { in: ["READY_TO_EXPORT", "EXPORTED", "BOOKED"] } } }),
    prisma.document.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        category: true,
        contact: true,
        submittedBy: { select: { name: true } },
      },
    }),
    prisma.document.aggregate({
      where: {
        organizationId: orgId,
        transactionType: "EXPENSE",
        docDate: { gte: startOfMonth, lte: endOfMonth },
        status: { notIn: ["VOID", "REJECTED"] },
      },
      _sum: { totalAmount: true },
    }),
    prisma.document.aggregate({
      where: {
        organizationId: orgId,
        transactionType: "INCOME",
        docDate: { gte: startOfMonth, lte: endOfMonth },
        status: { notIn: ["VOID", "REJECTED"] },
      },
      _sum: { totalAmount: true },
    }),
    prisma.document.findMany({
      where: {
        organizationId: orgId,
        dueDate: { lt: now },
        status: { notIn: ["BOOKED", "VOID", "REJECTED", "EXPORTED"] },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      include: { contact: { select: { name: true } } },
    }),
    prisma.document.findMany({
      where: {
        organizationId: orgId,
        dueDate: { gte: now, lte: dueSoon },
        status: { notIn: ["BOOKED", "VOID", "REJECTED", "EXPORTED"] },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      include: { contact: { select: { name: true } } },
    }),
  ]);

  return {
    totalDocs,
    draftDocs,
    pendingDocs,
    approvedDocs,
    recentDocs,
    monthlyExpense: monthlyExpense._sum.totalAmount?.toNumber() || 0,
    monthlyIncome: monthlyIncome._sum.totalAmount?.toNumber() || 0,
    overdueDocs,
    dueSoonDocs,
  };
}

export default async function DashboardPage() {
  const session = await requireOrganization();
  const stats = await getDashboardStats(session.currentOrganization.id);

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
        {/* Monthly Summary */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">รายจ่ายเดือนนี้</span>
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">฿{formatMoney(stats.monthlyExpense)}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date().toLocaleDateString("th-TH", { month: "long", year: "numeric" })}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">รายรับเดือนนี้</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">฿{formatMoney(stats.monthlyIncome)}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date().toLocaleDateString("th-TH", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Link href="/documents" className="rounded-xl border bg-white p-4 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDocs}</p>
                <p className="text-sm text-gray-500">ทั้งหมด</p>
              </div>
            </div>
          </Link>

          <Link href="/documents" className="rounded-xl border bg-white p-4 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.draftDocs}</p>
                <p className="text-sm text-gray-500">ร่าง</p>
              </div>
            </div>
          </Link>

          <Link href="/documents" className="rounded-xl border border-sky-200 bg-sky-50/50 p-4 hover:border-sky-300 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                <Package className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-sky-700">{stats.pendingDocs}</p>
                <p className="text-sm text-sky-600">รอตรวจ</p>
              </div>
            </div>
          </Link>

          <Link href="/documents" className="rounded-xl border bg-white p-4 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.approvedDocs}</p>
                <p className="text-sm text-gray-500">อนุมัติแล้ว</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Alerts */}
        {(stats.overdueDocs.length > 0 || stats.dueSoonDocs.length > 0) && (
          <div className="grid gap-4 md:grid-cols-2">
            {stats.overdueDocs.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-700">เกินกำหนดชำระ ({stats.overdueDocs.length})</span>
                </div>
                <div className="space-y-2">
                  {stats.overdueDocs.map((doc) => {
                    const days = Math.floor((Date.now() - new Date(doc.dueDate!).getTime()) / 86400000);
                    return (
                      <Link
                        key={doc.id}
                        href={`/documents/${doc.id}`}
                        className="flex items-center justify-between p-3 rounded-lg bg-white border border-red-100 hover:border-red-200 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm text-gray-900">{doc.docNumber}</p>
                          <p className="text-xs text-gray-500">{doc.contact?.name || "-"}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm text-red-600">
                            ฿{doc.totalAmount.toNumber().toLocaleString()}
                          </p>
                          <p className="text-xs text-red-500">เกิน {days} วัน</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {stats.dueSoonDocs.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarClock className="h-5 w-5 text-amber-600" />
                  <span className="font-medium text-amber-700">ใกล้ครบกำหนด ({stats.dueSoonDocs.length})</span>
                </div>
                <div className="space-y-2">
                  {stats.dueSoonDocs.map((doc) => {
                    const days = Math.ceil((new Date(doc.dueDate!).getTime() - Date.now()) / 86400000);
                    return (
                      <Link
                        key={doc.id}
                        href={`/documents/${doc.id}`}
                        className="flex items-center justify-between p-3 rounded-lg bg-white border border-gray-100 hover:border-primary/30 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm text-gray-900">{doc.docNumber}</p>
                          <p className="text-xs text-gray-500">{doc.contact?.name || "-"}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm text-gray-900">
                            ฿{doc.totalAmount.toNumber().toLocaleString()}
                          </p>
                          <p className="text-xs text-amber-600">
                            {days === 0 ? "วันนี้" : `อีก ${days} วัน`}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions & Recent */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <div className="rounded-xl border bg-white p-5">
            <h3 className="font-semibold text-gray-900 mb-4">สร้างกล่องใหม่</h3>
            <div className="space-y-3">
              <Link
                href="/documents/new?type=expense"
                className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">รายจ่าย</p>
                  <p className="text-xs text-gray-500">ใบเสร็จ, ใบกำกับภาษี</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>

              <Link
                href="/documents/new?type=income"
                className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">รายรับ</p>
                  <p className="text-xs text-gray-500">ใบแจ้งหนี้, ใบเสนอราคา</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Recent Documents */}
          <div className="lg:col-span-2 rounded-xl border bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">เอกสารล่าสุด</h3>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/documents">
                  ดูทั้งหมด
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {stats.recentDocs.length === 0 ? (
              <div className="flex flex-col items-center py-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Package className="h-7 w-7 text-primary" />
                </div>
                <p className="text-gray-500 mb-4">ยังไม่มีเอกสาร</p>
                <Button size="sm" asChild>
                  <Link href="/documents/new">
                    <Plus className="mr-1.5 h-4 w-4" />
                    สร้างกล่องแรก
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.recentDocs.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/documents/${doc.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{doc.docNumber}</span>
                        <StatusBadge status={doc.status} />
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {doc.contact?.name || "-"} • ฿{doc.totalAmount.toNumber().toLocaleString()}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {new Date(doc.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
