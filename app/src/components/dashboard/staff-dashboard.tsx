"use client";

import Link from "next/link";
import { 
  Upload, 
  FileText, 
  Clock, 
  CheckCircle2,
  Plus,
  Package,
  Wallet,
  Receipt,
  Camera,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface StaffDashboardProps {
  stats: {
    draft: number;
    pending: number;
    done: number;
    reimbursementPending: number;
    reimbursementApproved: number;
  };
  recentBoxes: Array<{
    id: string;
    boxNumber: string;
    status: string;
    totalAmount: number;
    createdAt: Date;
  }>;
}

export function StaffDashboard({ stats, recentBoxes }: StaffDashboardProps) {
  const formatMoney = (amount: number) => 
    amount.toLocaleString("th-TH", { minimumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      {/* Upload Button - Prominent */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-6">
          <Button 
            size="lg" 
            variant="secondary"
            className="w-full text-lg h-14"
            asChild
          >
            <Link href="/documents/new">
              <Upload className="mr-2 h-5 w-5" />
              อัพโหลดเอกสาร
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* My Submissions Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" />
            เอกสารของฉัน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Link 
              href="/documents?tab=mine&status=DRAFT"
              className="rounded-lg border p-4 text-center hover:border-primary/50 hover:bg-muted/50 transition-colors"
            >
              <p className="text-2xl font-bold text-muted-foreground">{stats.draft}</p>
              <p className="text-sm text-muted-foreground">Draft</p>
            </Link>
            <Link 
              href="/documents?tab=mine&status=SUBMITTED,IN_REVIEW"
              className="rounded-lg border border-info/50 bg-info/5 p-4 text-center hover:border-info transition-colors"
            >
              <p className="text-2xl font-bold text-info">{stats.pending}</p>
              <p className="text-sm text-info">รอตรวจ</p>
            </Link>
            <Link 
              href="/documents?tab=mine&status=BOOKED,ARCHIVED"
              className="rounded-lg border border-success/50 bg-success/5 p-4 text-center hover:border-success transition-colors"
            >
              <p className="text-2xl font-bold text-success">{stats.done}</p>
              <p className="text-sm text-success">เสร็จแล้ว</p>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">สร้างกล่องใหม่</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <Link
              href="/documents/new?type=expense"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-error" />
              </div>
              <span className="text-sm font-medium">ค่าใช้จ่าย</span>
            </Link>
            <Link
              href="/documents/new?type=income"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-success" />
              </div>
              <span className="text-sm font-medium">รายรับ</span>
            </Link>
            <Link
              href="/documents/new?scan=true"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium">สแกน</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Reimbursement Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            เบิกคืนของฉัน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Link 
              href="/documents?reimburse=pending"
              className="rounded-lg border p-4 hover:border-warning/50 hover:bg-muted/50 transition-colors"
            >
              <p className="text-sm text-muted-foreground mb-1">รอดำเนินการ</p>
              <p className="text-2xl font-bold text-warning">
                ฿{formatMoney(stats.reimbursementPending)}
              </p>
            </Link>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground mb-1">อนุมัติแล้ว</p>
              <p className="text-2xl font-bold text-success">
                ฿{formatMoney(stats.reimbursementApproved)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5" />
            ส่งล่าสุด
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/documents?tab=mine">ดูทั้งหมด</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentBoxes.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm mb-3">ยังไม่มีเอกสาร</p>
              <Button size="sm" asChild>
                <Link href="/documents/new">
                  <Plus className="mr-1 h-4 w-4" />
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
                  className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <span className="font-medium">{box.boxNumber}</span>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {box.status === "DRAFT" ? "Draft" : 
                       box.status === "SUBMITTED" ? "รอตรวจ" : 
                       box.status === "BOOKED" ? "เสร็จ" : box.status}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ฿{box.totalAmount.toLocaleString()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
