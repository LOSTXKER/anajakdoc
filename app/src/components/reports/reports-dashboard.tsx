"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  FileText,
  Receipt,
  Percent,
  BarChart3,
  PieChart,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Building2,
  Target,
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
import { cn } from "@/lib/utils";

interface ReportData {
  monthlyData: { month: number; expense: number; income: number }[];
  categoryBreakdown: { name: string; amount: number; count: number }[];
  costCenterBreakdown: { name: string; amount: number; count: number }[];
  totals: {
    totalAmount: number;
    vatAmount: number;
    whtAmount: number;
    boxCount: number;
    expenseTotal: number;
    incomeTotal: number;
  };
  year: number;
}

interface KpiData {
  avgProcessingDays: number;
  firstPassRate: number;
  whtComplianceRate: number;
  boxesPerDay: number;
  boxesProcessedThisMonth: number;
  topVendors: { name: string; count: number; amount: number; avgDays: number | null }[];
  pendingByStatus: { status: string; count: number }[];
}

interface ReportsDashboardProps {
  data: ReportData;
  kpiData?: KpiData;
}

const monthNames = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

const CHART_COLORS = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#a855f7", "#ec4899", "#6366f1", "#f97316"];

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "ฉบับร่าง",
  SUBMITTED: "รอตรวจ",
  IN_REVIEW: "กำลังตรวจ",
  NEED_MORE_DOCS: "ขอเอกสาร",
  READY_TO_BOOK: "พร้อมลง",
  WHT_PENDING: "รอ WHT",
};

export function ReportsDashboard({ data, kpiData }: ReportsDashboardProps) {
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
              {data.totals.boxCount.toLocaleString()}
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

      {/* KPI/SLA Section (Section 25) */}
      {kpiData && (
        <>
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              KPI & SLA (30 วันล่าสุด)
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Average Processing Time */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">เวลาประมวลผลเฉลี่ย</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {kpiData.avgProcessingDays}
                  <span className="text-sm font-normal text-muted-foreground ml-1">วัน</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  จาก SUBMITTED ถึง BOOKED
                </p>
              </CardContent>
            </Card>

            {/* First-Pass Completion Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">First-Pass Rate</CardTitle>
                <CheckCircle2 className={cn(
                  "h-4 w-4",
                  kpiData.firstPassRate >= 80 ? "text-green-500" : 
                  kpiData.firstPassRate >= 60 ? "text-amber-500" : "text-red-500"
                )} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {kpiData.firstPassRate}%
                </div>
                <Progress 
                  value={kpiData.firstPassRate} 
                  className={cn(
                    "mt-2 h-2",
                    kpiData.firstPassRate >= 80 ? "[&>div]:bg-green-500" :
                    kpiData.firstPassRate >= 60 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"
                  )}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ไม่ต้องขอเอกสารเพิ่ม
                </p>
              </CardContent>
            </Card>

            {/* WHT Compliance Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">WHT Compliance</CardTitle>
                <Percent className={cn(
                  "h-4 w-4",
                  kpiData.whtComplianceRate >= 90 ? "text-green-500" : 
                  kpiData.whtComplianceRate >= 70 ? "text-amber-500" : "text-red-500"
                )} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {kpiData.whtComplianceRate}%
                </div>
                <Progress 
                  value={kpiData.whtComplianceRate} 
                  className={cn(
                    "mt-2 h-2",
                    kpiData.whtComplianceRate >= 90 ? "[&>div]:bg-green-500" :
                    kpiData.whtComplianceRate >= 70 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"
                  )}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ได้รับ WHT ตรงเวลา
                </p>
              </CardContent>
            </Card>

            {/* Processing Efficiency */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ประสิทธิภาพ</CardTitle>
                <Zap className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {kpiData.boxesPerDay}
                  <span className="text-sm font-normal text-muted-foreground ml-1">กล่อง/วัน</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {kpiData.boxesProcessedThisMonth} กล่องเดือนนี้
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Vendors & Pending Status */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Vendors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  ผู้ขายหลัก (30 วัน)
                </CardTitle>
                <CardDescription>Top 5 โดยจำนวนรายการ</CardDescription>
              </CardHeader>
              <CardContent>
                {kpiData.topVendors.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">ไม่มีข้อมูล</p>
                ) : (
                  <div className="space-y-4">
                    {kpiData.topVendors.map((vendor, index) => (
                      <div key={vendor.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium",
                            index === 0 ? "bg-amber-100 text-amber-700" :
                            index === 1 ? "bg-gray-100 text-gray-600" :
                            index === 2 ? "bg-orange-100 text-orange-700" :
                            "bg-gray-50 text-gray-500"
                          )}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium truncate max-w-[150px]">{vendor.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {vendor.count} รายการ • ฿{vendor.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {vendor.avgDays && (
                          <Badge variant="secondary" className="text-xs">
                            ~{vendor.avgDays.toFixed(1)} วัน
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending by Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  งานค้างตามสถานะ
                </CardTitle>
                <CardDescription>รายการที่ยังไม่เสร็จ</CardDescription>
              </CardHeader>
              <CardContent>
                {kpiData.pendingByStatus.length === 0 ? (
                  <div className="flex flex-col items-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                    <p className="text-muted-foreground">ไม่มีงานค้าง</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {kpiData.pendingByStatus.map((item) => {
                      const total = kpiData.pendingByStatus.reduce((sum, p) => sum + p.count, 0);
                      const percentage = total > 0 ? (item.count / total) * 100 : 0;
                      return (
                        <div key={item.status} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {STATUS_LABELS[item.status] || item.status}
                            </span>
                            <span className="font-medium">{item.count}</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

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
