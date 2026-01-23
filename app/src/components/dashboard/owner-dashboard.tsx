"use client";

import Link from "next/link";
import { 
  Hourglass, 
  Percent, 
  AlertTriangle, 
  Copy, 
  Users,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  Plus,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AGING_BUCKET_CONFIG } from "@/lib/document-config";

interface OwnerDashboardProps {
  stats: {
    pendingBoxes: number;
    pendingAmount: number;
    whtOutstanding: number;
    whtOverdueCount: number;
    duplicateCount: number;
    reimbursementPending: number;
    agingBuckets: {
      "0-3": number;
      "4-7": number;
      "8-14": number;
      "15+": number;
    };
  };
  monthlyExpense: number;
  monthlyIncome: number;
  recentBoxes: Array<{
    id: string;
    boxNumber: string;
    status: string;
    totalAmount: number;
    createdAt: Date;
    contact?: { name: string } | null;
  }>;
}

export function OwnerDashboard({ stats, monthlyExpense, monthlyIncome, recentBoxes }: OwnerDashboardProps) {
  const formatMoney = (amount: number) => 
    amount.toLocaleString("th-TH", { minimumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Pending Boxes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              เอกสารค้าง
            </CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingBoxes}</div>
            <p className="text-sm text-muted-foreground mt-1">
              ฿{formatMoney(stats.pendingAmount)}
            </p>
          </CardContent>
        </Card>

        {/* WHT Outstanding */}
        <Card className={stats.whtOverdueCount > 0 ? "border-error bg-error/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              WHT ค้าง
            </CardTitle>
            <Percent className={cn(
              "h-4 w-4",
              stats.whtOverdueCount > 0 ? "text-error" : "text-muted-foreground"
            )} />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-3xl font-bold",
              stats.whtOverdueCount > 0 ? "text-error" : ""
            )}>
              ฿{formatMoney(stats.whtOutstanding)}
            </div>
            {stats.whtOverdueCount > 0 && (
              <p className="text-sm text-error mt-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {stats.whtOverdueCount} เกินกำหนด
              </p>
            )}
          </CardContent>
        </Card>

        {/* Possible Duplicates */}
        {stats.duplicateCount > 0 && (
          <Card className="border-warning bg-warning/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-warning-foreground">
                อาจซ้ำ
              </CardTitle>
              <Copy className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">
                {stats.duplicateCount}
              </div>
              <Link 
                href="/documents?duplicate=true" 
                className="text-sm text-warning hover:underline mt-1 inline-flex items-center gap-1"
              >
                ตรวจสอบ <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Reimbursement Pending */}
        {stats.reimbursementPending > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                รอคืนเงินพนักงาน
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ฿{formatMoney(stats.reimbursementPending)}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Aging Buckets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">อายุเอกสารค้าง</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {(Object.entries(stats.agingBuckets) as [keyof typeof AGING_BUCKET_CONFIG, number][]).map(([bucket, count]) => {
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
        </CardContent>
      </Card>

      {/* Monthly Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              รายจ่ายเดือนนี้
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center">
              <TrendingDown className="h-4 w-4 text-error" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{formatMoney(monthlyExpense)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date().toLocaleDateString("th-TH", { month: "long", year: "numeric" })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              รายรับเดือนนี้
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{formatMoney(monthlyIncome)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date().toLocaleDateString("th-TH", { month: "long", year: "numeric" })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">สร้างกล่องใหม่</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/documents/new?type=expense"
              className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-error" />
              </div>
              <div className="flex-1">
                <p className="font-medium">รายจ่าย</p>
                <p className="text-xs text-muted-foreground">ใบเสร็จ, ใบกำกับภาษี</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>

            <Link
              href="/documents/new?type=income"
              className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1">
                <p className="font-medium">รายรับ</p>
                <p className="text-xs text-muted-foreground">ใบแจ้งหนี้, ใบเสนอราคา</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>

        {/* Recent Boxes */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">กล่องล่าสุด</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/documents">
                ดูทั้งหมด <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentBoxes.length === 0 ? (
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
                {recentBoxes.slice(0, 5).map((box) => (
                  <Link
                    key={box.id}
                    href={`/documents/${box.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{box.boxNumber}</span>
                        <Badge variant="secondary" className="text-xs">
                          {box.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {box.contact?.name || "-"} • ฿{box.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(box.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
