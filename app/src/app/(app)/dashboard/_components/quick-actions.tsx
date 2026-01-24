import Link from "next/link";
import { TrendingDown, TrendingUp, ArrowRight } from "lucide-react";

export function QuickActions() {
  return (
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
  );
}
