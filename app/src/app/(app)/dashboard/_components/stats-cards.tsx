"use client";

import Link from "next/link";
import { 
  Clock, 
  FileQuestion, 
  TrendingUp, 
  TrendingDown,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  pendingCount: number;
  pendingAmount: number;
  needDocsCount: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

// Format money inside client component
const formatMoney = (amount: number) => 
  amount.toLocaleString("th-TH", { minimumFractionDigits: 2 });

export function StatsCards({ 
  pendingCount,
  pendingAmount,
  needDocsCount,
  monthlyIncome,
  monthlyExpense,
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Pending - รอดำเนินการ */}
      <Link
        href="/documents?tab=pending"
        className={cn(
          "group relative rounded-xl border p-5 transition-all hover:shadow-md",
          "bg-gradient-to-br from-sky-50 to-white dark:from-sky-950/50 dark:to-background",
          "border-sky-200 dark:border-sky-800 hover:border-sky-300 dark:hover:border-sky-700"
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-sky-700 dark:text-sky-300">รอดำเนินการ</p>
            <p className="text-3xl font-bold text-sky-900 dark:text-sky-100 mt-1">
              {pendingCount}
            </p>
            <p className="text-sm text-sky-600 dark:text-sky-400 mt-1">
              ฿{formatMoney(pendingAmount)}
            </p>
          </div>
          <div className="rounded-lg bg-sky-100 dark:bg-sky-900 p-2.5">
            <Clock className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          </div>
        </div>
        <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>

      {/* Need Docs - ขาดเอกสาร */}
      <Link
        href="/documents?tab=tracking"
        className={cn(
          "group relative rounded-xl border p-5 transition-all hover:shadow-md",
          needDocsCount > 0
            ? "bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/50 dark:to-background border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700"
            : "bg-card border-border hover:border-muted-foreground"
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className={cn(
              "text-sm font-medium",
              needDocsCount > 0 ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"
            )}>
              ขาดเอกสาร
            </p>
            <p className={cn(
              "text-3xl font-bold mt-1",
              needDocsCount > 0 ? "text-amber-900 dark:text-amber-100" : "text-foreground"
            )}>
              {needDocsCount}
            </p>
            <p className={cn(
              "text-sm mt-1",
              needDocsCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
            )}>
              รายการ
            </p>
          </div>
          <div className={cn(
            "rounded-lg p-2.5",
            needDocsCount > 0 ? "bg-amber-100 dark:bg-amber-900" : "bg-muted"
          )}>
            <FileQuestion className={cn(
              "h-5 w-5",
              needDocsCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
            )} />
          </div>
        </div>
        <ArrowRight className={cn(
          "absolute bottom-4 right-4 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity",
          needDocsCount > 0 ? "text-amber-400" : "text-muted-foreground"
        )} />
      </Link>

      {/* Monthly Income - รายรับเดือนนี้ */}
      <div className={cn(
        "rounded-xl border p-5",
        "bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/50 dark:to-background",
        "border-emerald-200 dark:border-emerald-800"
      )}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">รายรับเดือนนี้</p>
            <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">
              ฿{formatMoney(monthlyIncome)}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              {new Date().toLocaleDateString("th-TH", { month: "long" })}
            </p>
          </div>
          <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900 p-2.5">
            <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Monthly Expense - รายจ่ายเดือนนี้ */}
      <div className={cn(
        "rounded-xl border p-5",
        "bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/50 dark:to-background",
        "border-rose-200 dark:border-rose-800"
      )}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-rose-700 dark:text-rose-300">รายจ่ายเดือนนี้</p>
            <p className="text-2xl font-bold text-rose-900 dark:text-rose-100 mt-1">
              ฿{formatMoney(monthlyExpense)}
            </p>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
              {new Date().toLocaleDateString("th-TH", { month: "long" })}
            </p>
          </div>
          <div className="rounded-lg bg-rose-100 dark:bg-rose-900 p-2.5">
            <TrendingDown className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
