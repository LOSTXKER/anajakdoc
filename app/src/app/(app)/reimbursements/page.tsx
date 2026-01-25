import { Suspense } from "react";
import { requireOrganization } from "@/server/auth";
import { AppHeader } from "@/components/layout/app-header";
import { ReimbursementList } from "@/components/reimbursements/ReimbursementList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle2, Wallet } from "lucide-react";
import {
  getReimbursements,
  getReimbursementSummary,
} from "@/server/actions/reimbursement";

async function ReimbursementsContent() {
  const [items, summary] = await Promise.all([
    getReimbursements("all"),
    getReimbursementSummary(),
  ]);

  const formatMoney = (amount: number) => {
    return amount.toLocaleString("th-TH", { minimumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">รอคืนเงิน</p>
                <p className="text-xl font-bold">{summary.pendingCount} รายการ</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ยอดรอคืน</p>
                <p className="text-xl font-bold">฿{formatMoney(summary.pendingAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">คืนแล้ว</p>
                <p className="text-xl font-bold">{summary.completedCount} รายการ</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            รอคืนเงิน
            {summary.pendingCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {summary.pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">คืนแล้ว</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <ReimbursementList items={items} showCompleted={false} />
        </TabsContent>

        <TabsContent value="completed">
          <ReimbursementList items={items} showCompleted={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default async function ReimbursementsPage() {
  await requireOrganization();

  return (
    <>
      <AppHeader
        title="คืนเงินสมาชิก"
        description="จัดการการคืนเงินให้สมาชิกที่สำรองจ่าย"
        showCreateButton={false}
      />

      <div className="p-6">
        <Suspense
          fallback={
            <div className="animate-pulse space-y-4">
              <div className="h-24 bg-muted rounded-xl" />
              <div className="h-64 bg-muted rounded-xl" />
            </div>
          }
        >
          <ReimbursementsContent />
        </Suspense>
      </div>
    </>
  );
}
