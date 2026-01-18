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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";

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

const CHART_COLORS = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#a855f7", "#ec4899", "#6366f1", "#f97316"];

export function ReportsDashboard({ data }: ReportsDashboardProps) {
  const netProfit = data.totals.incomeTotal - data.totals.expenseTotal;
  const totalCategoryAmount = data.categoryBreakdown.reduce((sum, c) => sum + c.amount, 0);

  // Transform monthly data for Recharts
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthData = data.monthlyData.find((m) => m.month === month) || {
      expense: 0,
      income: 0,
    };
    return {
      name: monthNames[i],
      expense: monthData.expense,
      income: monthData.income,
    };
  });

  // Transform category data for pie chart
  const pieData = data.categoryBreakdown.slice(0, 8).map((cat, index) => ({
    name: cat.name,
    value: cat.amount,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

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
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value) => [`฿${(value as number)?.toLocaleString() ?? 0}`, ""]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="expense" 
                  name="รายจ่าย" 
                  fill="#ef4444" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="income" 
                  name="รายรับ" 
                  fill="#22c55e" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Breakdown - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              ค่าใช้จ่ายตามหมวดหมู่
            </CardTitle>
            <CardDescription>Top 8 หมวดหมู่</CardDescription>
          </CardHeader>
          <CardContent>
            {data.categoryBreakdown.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">ไม่มีข้อมูล</p>
            ) : (
              <div className="space-y-4">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`฿${(value as number)?.toLocaleString() ?? 0}`, ""]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {pieData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full shrink-0" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Center Breakdown - List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
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
                          <div 
                            className="h-3 w-3 rounded" 
                            style={{ backgroundColor: CHART_COLORS[(index + 4) % CHART_COLORS.length] }}
                          />
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
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: CHART_COLORS[(index + 4) % CHART_COLORS.length]
                          }}
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
