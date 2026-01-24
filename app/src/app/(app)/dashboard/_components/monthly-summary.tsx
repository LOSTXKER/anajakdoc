import { TrendingDown, TrendingUp } from "lucide-react";

interface MonthlySummaryProps {
  monthlyExpense: number;
  monthlyIncome: number;
  formatMoney: (amount: number) => string;
}

export function MonthlySummary({ monthlyExpense, monthlyIncome, formatMoney }: MonthlySummaryProps) {
  const monthLabel = new Date().toLocaleDateString("th-TH", { month: "long", year: "numeric" });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">รายจ่ายเดือนนี้</span>
          <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center">
            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground">฿{formatMoney(monthlyExpense)}</p>
        <p className="text-xs text-muted-foreground mt-1">{monthLabel}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">รายรับเดือนนี้</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground">฿{formatMoney(monthlyIncome)}</p>
        <p className="text-xs text-muted-foreground mt-1">{monthLabel}</p>
      </div>
    </div>
  );
}
