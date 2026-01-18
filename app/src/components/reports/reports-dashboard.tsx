"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  FileText,
  Receipt,
  Percent,
  BarChart3,
  PieChart,
} from "lucide-react";

interface ReportData {
  monthlyData: { month: number; expense: number; income: number }[];
  categoryBreakdown: { name: string; amount: number; count: number }[];
  costCenterBreakdown: { name: string; amount: number; count: number }[];
  totals: {
    totalAmount: number;
    vatAmount: number;
    whtAmount: number;
    documentCount: number;
    expenseTotal: number;
    incomeTotal: number;
  };
  year: number;
}

interface ReportsDashboardProps {
  data: ReportData;
}

const monthNames = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

const colors = [
  "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-red-500",
  "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-orange-500",
];

export function ReportsDashboard({ data }: ReportsDashboardProps) {
  const netProfit = data.totals.incomeTotal - data.totals.expenseTotal;
  const maxMonthlyValue = Math.max(
    ...data.monthlyData.flatMap((m) => [m.expense, m.income]),
    1
  );
  const maxCategoryAmount = Math.max(...data.categoryBreakdown.map((c) => c.amount), 1);
  const totalCategoryAmount = data.categoryBreakdown.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายจ่ายรวม</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ฿{data.totals.expenseTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              ปี {data.year + 543}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายรับรวม</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ฿{data.totals.incomeTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              ปี {data.year + 543}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">กำไร/ขาดทุน</CardTitle>
            {netProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              ฿{Math.abs(netProfit).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {netProfit >= 0 ? "กำไร" : "ขาดทุน"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เอกสารทั้งหมด</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totals.documentCount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              รายการ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* VAT & WHT Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ภาษีมูลค่าเพิ่ม (VAT)</CardTitle>
            <Percent className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              ฿{data.totals.vatAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">หัก ณ ที่จ่าย (WHT)</CardTitle>
            <Receipt className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              ฿{data.totals.whtAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            รายรับ-รายจ่ายรายเดือน
          </CardTitle>
          <CardDescription>ปี {data.year + 543}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Legend */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-red-500" />
                <span>รายจ่าย</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-green-500" />
                <span>รายรับ</span>
              </div>
            </div>

            {/* Chart */}
            <div className="space-y-3">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                const monthData = data.monthlyData.find((m) => m.month === month) || {
                  month,
                  expense: 0,
                  income: 0,
                };
                const expenseWidth = (monthData.expense / maxMonthlyValue) * 100;
                const incomeWidth = (monthData.income / maxMonthlyValue) * 100;

                return (
                  <div key={month} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="w-12 text-muted-foreground">{monthNames[month - 1]}</span>
                      <div className="flex-1 mx-4 space-y-1">
                        <div className="h-4 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500 rounded-full transition-all"
                            style={{ width: `${expenseWidth}%` }}
                          />
                        </div>
                        <div className="h-4 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${incomeWidth}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-32 text-right text-xs space-y-1">
                        <p className="text-red-600">฿{monthData.expense.toLocaleString()}</p>
                        <p className="text-green-600">฿{monthData.income.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              ค่าใช้จ่ายตามหมวดหมู่
            </CardTitle>
            <CardDescription>Top 10 หมวดหมู่</CardDescription>
          </CardHeader>
          <CardContent>
            {data.categoryBreakdown.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">ไม่มีข้อมูล</p>
            ) : (
              <div className="space-y-4">
                {data.categoryBreakdown.slice(0, 10).map((cat, index) => {
                  const percentage = totalCategoryAmount > 0
                    ? (cat.amount / totalCategoryAmount) * 100
                    : 0;
                  
                  return (
                    <div key={cat.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded ${colors[index % colors.length]}`} />
                          <span className="truncate max-w-[150px]">{cat.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {cat.count}
                          </Badge>
                        </div>
                        <span className="font-medium">
                          ฿{cat.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${colors[index % colors.length]}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Center Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              ค่าใช้จ่ายตามศูนย์ต้นทุน
            </CardTitle>
            <CardDescription>Top 10 ศูนย์ต้นทุน</CardDescription>
          </CardHeader>
          <CardContent>
            {data.costCenterBreakdown.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">ไม่มีข้อมูล</p>
            ) : (
              <div className="space-y-4">
                {data.costCenterBreakdown.slice(0, 10).map((cc, index) => {
                  const totalCCAmount = data.costCenterBreakdown.reduce((sum, c) => sum + c.amount, 0);
                  const percentage = totalCCAmount > 0
                    ? (cc.amount / totalCCAmount) * 100
                    : 0;
                  
                  return (
                    <div key={cc.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded ${colors[(index + 4) % colors.length]}`} />
                          <span className="truncate max-w-[150px]">{cc.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {cc.count}
                          </Badge>
                        </div>
                        <span className="font-medium">
                          ฿{cc.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${colors[(index + 4) % colors.length]}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
