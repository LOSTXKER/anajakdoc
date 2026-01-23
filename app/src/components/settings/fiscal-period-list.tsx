"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Loader2,
  Calendar,
  Lock,
  Unlock,
  MoreHorizontal,
  Trash2,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  createFiscalPeriod,
  updatePeriodStatus,
  deleteFiscalPeriod,
  type FiscalPeriodData,
} from "@/server/actions/fiscal-period";
import type { PeriodStatus } from ".prisma/client";

interface FiscalPeriodListProps {
  periods: FiscalPeriodData[];
}

const statusConfig: Record<PeriodStatus, { label: string; color: string; icon: typeof Lock }> = {
  OPEN: { label: "เปิด", color: "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400", icon: Unlock },
  CLOSING: { label: "กำลังปิด", color: "bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400", icon: AlertTriangle },
  CLOSED: { label: "ปิดแล้ว", color: "bg-muted text-muted-foreground", icon: Lock },
};

const months = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

export function FiscalPeriodList({ periods }: FiscalPeriodListProps) {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createFiscalPeriod(selectedYear, selectedMonth);
      if (result.success) {
        toast.success("สร้างงวดบัญชีเรียบร้อย");
        setDialogOpen(false);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleStatusChange = (periodId: string, newStatus: PeriodStatus) => {
    startTransition(async () => {
      const result = await updatePeriodStatus(periodId, newStatus);
      if (result.success) {
        toast.success("อัปเดตสถานะเรียบร้อย");
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleDelete = (periodId: string) => {
    if (!confirm("ต้องการลบงวดบัญชีนี้?")) return;

    startTransition(async () => {
      const result = await deleteFiscalPeriod(periodId);
      if (result.success) {
        toast.success("ลบงวดบัญชีเรียบร้อย");
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  // Group periods by year
  const periodsByYear = periods.reduce((acc, period) => {
    const year = period.year;
    if (!acc[year]) acc[year] = [];
    acc[year].push(period);
    return acc;
  }, {} as Record<number, FiscalPeriodData[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              สร้างงวดใหม่
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>สร้างงวดบัญชี</DialogTitle>
              <DialogDescription>
                เลือกปีและเดือนสำหรับงวดบัญชีใหม่
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">ปี (พ.ศ.)</label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(v) => setSelectedYear(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year + 543}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">เดือน</label>
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(v) => setSelectedMonth(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, idx) => (
                      <SelectItem key={idx + 1} value={(idx + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleCreate} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                สร้างงวด
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {periods.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-foreground">ยังไม่มีงวดบัญชี</p>
            <p className="text-muted-foreground text-center max-w-md mt-1">
              สร้างงวดบัญชีเพื่อจัดการเอกสารตามรอบเดือน
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(periodsByYear)
          .sort(([a], [b]) => parseInt(b) - parseInt(a))
          .map(([year, yearPeriods]) => (
            <div key={year} className="space-y-4">
              <h3 className="text-lg font-semibold">ปี {parseInt(year) + 543}</h3>
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                {yearPeriods
                  .sort((a, b) => b.month - a.month)
                  .map((period) => {
                    const status = statusConfig[period.status];
                    const StatusIcon = status.icon;

                    return (
                      <Card key={period.id} className="relative">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <CardTitle className="text-base">
                                {months[period.month - 1]}
                              </CardTitle>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {period.status === "OPEN" && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(period.id, "CLOSING")}
                                  >
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    เริ่มปิดงวด
                                  </DropdownMenuItem>
                                )}
                                {period.status === "CLOSING" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleStatusChange(period.id, "CLOSED")}
                                    >
                                      <Lock className="mr-2 h-4 w-4" />
                                      ปิดงวด
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleStatusChange(period.id, "OPEN")}
                                    >
                                      <Unlock className="mr-2 h-4 w-4" />
                                      ยกเลิกการปิด
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {period.status === "CLOSED" && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(period.id, "OPEN")}
                                  >
                                    <Unlock className="mr-2 h-4 w-4" />
                                    เปิดงวดอีกครั้ง
                                  </DropdownMenuItem>
                                )}
                                {period.documentCount === 0 && (
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDelete(period.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    ลบงวด
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <CardDescription>
                            {new Date(period.startDate).toLocaleDateString("th-TH")} -{" "}
                            {new Date(period.endDate).toLocaleDateString("th-TH")}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <Badge className={status.color}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {status.label}
                            </Badge>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <FileText className="h-3 w-3" />
                                <span>{period.documentCount} เอกสาร</span>
                              </div>
                              <div className="text-right font-medium">
                                ฿{period.totalAmount.toLocaleString("th-TH", {
                                  minimumFractionDigits: 0,
                                })}
                              </div>
                            </div>

                            {period.closedAt && (
                              <p className="text-xs text-muted-foreground">
                                ปิดเมื่อ:{" "}
                                {new Date(period.closedAt).toLocaleDateString("th-TH")}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          ))
      )}
    </div>
  );
}
