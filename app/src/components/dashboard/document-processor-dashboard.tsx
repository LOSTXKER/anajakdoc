"use client";

import Link from "next/link";
import { 
  Send, 
  Eye, 
  FileQuestion, 
  CheckCircle2, 
  Percent, 
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DocumentProcessorDashboardProps {
  stats: {
    inbox: number;
    inReview: number;
    needMoreDocs: number;
    readyToBook: number;
    whtPending: number;
    overdueTasks: number;
  };
}

export function DocumentProcessorDashboard({ stats }: DocumentProcessorDashboardProps) {
  const statusCards = [
    {
      href: "/documents?status=PENDING",
      icon: Send,
      label: "รอตรวจ",
      count: stats.inbox,
      color: "text-info",
      bgColor: "bg-info/10",
      borderColor: "border-info",
      highlight: true,
    },
    {
      href: "/documents?status=PENDING",
      icon: Eye,
      label: "กำลังตรวจ",
      count: stats.inReview,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary",
      highlight: false,
    },
    {
      href: "/documents?status=NEED_MORE_DOCS",
      icon: FileQuestion,
      label: "ขอเอกสารเพิ่ม",
      count: stats.needMoreDocs,
      color: "text-warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning",
      highlight: stats.needMoreDocs > 0,
    },
    {
      href: "/documents?status=PENDING",
      icon: CheckCircle2,
      label: "พร้อมส่งบัญชี",
      count: stats.readyToBook,
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success",
      highlight: true,
    },
    {
      href: "/documents?status=WHT_PENDING",
      icon: Percent,
      label: "รอ WHT",
      count: stats.whtPending,
      color: "text-warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning",
      highlight: stats.whtPending > 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {statusCards.map((card) => (
          <Link 
            key={card.href}
            href={card.href}
            className={cn(
              "rounded-xl border p-4 hover:shadow-md transition-all",
              card.highlight ? `${card.borderColor} ${card.bgColor}` : "bg-card hover:border-primary/50"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={cn("h-4 w-4", card.color)} />
              <span className={cn("text-sm", card.highlight ? card.color : "text-muted-foreground")}>
                {card.label}
              </span>
            </div>
            <p className={cn(
              "text-3xl font-bold",
              card.highlight ? card.color : ""
            )}>
              {card.count}
            </p>
          </Link>
        ))}
      </div>

      {/* Overdue Alert */}
      {stats.overdueTasks > 0 && (
        <Card className="border-error bg-error/5">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <AlertTriangle className="h-5 w-5 text-error" />
            <CardTitle className="text-base text-error">งานเลยกำหนด</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-error">{stats.overdueTasks}</p>
            <Link href="/documents?overdue=true" className="text-sm text-error hover:underline mt-2 inline-block">
              ดูงานที่เลยกำหนด →
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Today's Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5" />
            งานวันนี้
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.inbox > 0 && (
              <Link 
                href="/documents?status=SUBMITTED"
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <span>ตรวจเอกสารใหม่</span>
                <span className="text-info font-medium">{stats.inbox} รายการ</span>
              </Link>
            )}
            {stats.readyToBook > 0 && (
              <Link 
                href="/documents?status=PENDING"
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <span>ส่งเข้าบัญชี</span>
                <span className="text-success font-medium">{stats.readyToBook} รายการ</span>
              </Link>
            )}
            {stats.whtPending > 0 && (
              <Link 
                href="/documents?status=WHT_PENDING"
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <span>ติดตาม WHT</span>
                <span className="text-warning font-medium">{stats.whtPending} รายการ</span>
              </Link>
            )}
            {stats.inbox === 0 && stats.readyToBook === 0 && stats.whtPending === 0 && (
              <p className="text-center text-muted-foreground py-4">
                ไม่มีงานค้าง 🎉
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
