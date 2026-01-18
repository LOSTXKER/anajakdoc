import { requireOrganization } from "@/server/auth";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  Wallet,
  CalendarClock,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";

async function getDashboardStats(orgId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Due date tracking: 7 days from now
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
        submittedBy: {
          select: { name: true, avatarUrl: true },
        },
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
    // Overdue documents
    prisma.document.findMany({
      where: {
        organizationId: orgId,
        dueDate: { lt: now },
        status: { notIn: ["BOOKED", "VOID", "REJECTED", "EXPORTED"] },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      include: {
        contact: { select: { name: true } },
      },
    }),
    // Due within 7 days
    prisma.document.findMany({
      where: {
        organizationId: orgId,
        dueDate: { gte: now, lte: dueSoon },
        status: { notIn: ["BOOKED", "VOID", "REJECTED", "EXPORTED"] },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      include: {
        contact: { select: { name: true } },
      },
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

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "แบบร่าง", variant: "secondary" },
  PENDING_REVIEW: { label: "รอตรวจ", variant: "default" },
  NEED_INFO: { label: "ขอข้อมูลเพิ่ม", variant: "destructive" },
  READY_TO_EXPORT: { label: "พร้อม Export", variant: "outline" },
  EXPORTED: { label: "Export แล้ว", variant: "outline" },
  BOOKED: { label: "บันทึกแล้ว", variant: "outline" },
};

export default async function DashboardPage() {
  const session = await requireOrganization();
  const stats = await getDashboardStats(session.currentOrganization.id);

  return (
    <>
      <AppHeader 
        title="Dashboard" 
        description={`ยินดีต้อนรับ, ${session.name || "ผู้ใช้"}!`}
      />
      
      <div className="p-6 space-y-6">
        {/* Monthly Summary */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700">รายจ่ายเดือนนี้</CardTitle>
              <TrendingDown className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                ฿{stats.monthlyExpense.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-red-600/70 mt-1">
                {new Date().toLocaleDateString("th-TH", { month: "long", year: "numeric" })}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">รายรับเดือนนี้</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ฿{stats.monthlyIncome.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-green-600/70 mt-1">
                {new Date().toLocaleDateString("th-TH", { month: "long", year: "numeric" })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">เอกสารทั้งหมด</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDocs}</div>
              <p className="text-xs text-muted-foreground">
                รายการในระบบ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">แบบร่าง</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.draftDocs}</div>
              <p className="text-xs text-muted-foreground">
                รอดำเนินการ
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รอตรวจสอบ</CardTitle>
              <AlertCircle className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.pendingDocs}</div>
              <p className="text-xs text-muted-foreground">
                ต้องการความสนใจ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">อนุมัติแล้ว</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approvedDocs}</div>
              <p className="text-xs text-muted-foreground">
                พร้อม Export
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Due Date Alerts */}
        {(stats.overdueDocs.length > 0 || stats.dueSoonDocs.length > 0) && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Overdue Documents */}
            {stats.overdueDocs.length > 0 && (
              <Card className="border-red-200 bg-red-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                    เกินกำหนดชำระ ({stats.overdueDocs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {stats.overdueDocs.map((doc) => {
                    const daysOverdue = Math.floor((new Date().getTime() - new Date(doc.dueDate!).getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <Link
                        key={doc.id}
                        href={`/documents/${doc.id}`}
                        className="flex items-center justify-between p-2 rounded-md bg-white/80 border border-red-200 hover:bg-white transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm">{doc.docNumber}</p>
                          <p className="text-xs text-muted-foreground">{doc.contact?.name || "ไม่ระบุ"}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm text-red-600">
                            ฿{doc.totalAmount.toNumber().toLocaleString()}
                          </p>
                          <p className="text-xs text-red-500">เกิน {daysOverdue} วัน</p>
                        </div>
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Due Soon Documents */}
            {stats.dueSoonDocs.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                    <CalendarClock className="h-5 w-5" />
                    ใกล้ครบกำหนด ({stats.dueSoonDocs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {stats.dueSoonDocs.map((doc) => {
                    const daysUntilDue = Math.ceil((new Date(doc.dueDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <Link
                        key={doc.id}
                        href={`/documents/${doc.id}`}
                        className="flex items-center justify-between p-2 rounded-md bg-white/80 border border-amber-200 hover:bg-white transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm">{doc.docNumber}</p>
                          <p className="text-xs text-muted-foreground">{doc.contact?.name || "ไม่ระบุ"}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">
                            ฿{doc.totalAmount.toNumber().toLocaleString()}
                          </p>
                          <p className="text-xs text-amber-600">
                            {daysUntilDue === 0 ? "วันนี้" : `อีก ${daysUntilDue} วัน`}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">เริ่มต้นใช้งาน</CardTitle>
              <CardDescription>สร้างกล่องเอกสารใหม่</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start h-auto py-4" variant="outline" asChild>
                <Link href="/documents/new?type=expense">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">รายจ่าย</p>
                      <p className="text-xs text-muted-foreground">ใบเสร็จ, ใบกำกับภาษี</p>
                    </div>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>

              <Button className="w-full justify-start h-auto py-4" variant="outline" asChild>
                <Link href="/documents/new?type=income">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">รายรับ</p>
                      <p className="text-xs text-muted-foreground">ใบแจ้งหนี้, ใบเสนอราคา</p>
                    </div>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">เอกสารล่าสุด</CardTitle>
                <CardDescription>เอกสารที่เพิ่งสร้างหรืออัปเดต</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/documents">
                  ดูทั้งหมด
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {stats.recentDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">ยังไม่มีเอกสาร</p>
                  <Button className="mt-4" asChild>
                    <Link href="/documents/new">
                      <Package className="mr-2 h-4 w-4" />
                      สร้างกล่องแรก
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recentDocs.map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/documents/${doc.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.docNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.category?.name || "ไม่ระบุหมวด"} • ฿{doc.totalAmount.toNumber().toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusConfig[doc.status]?.variant || "secondary"}>
                          {statusConfig[doc.status]?.label || doc.status}
                        </Badge>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="mr-1 h-3 w-3" />
                          {new Date(doc.createdAt).toLocaleDateString("th-TH", { 
                            day: "numeric", 
                            month: "short" 
                          })}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
