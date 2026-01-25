"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  MoreVertical,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
  OPEN: { label: "เปิด", color: "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800", icon: Unlock },
  CLOSING: { label: "กำลังปิด", color: "bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800", icon: AlertTriangle },
  CLOSED: { label: "ปิดแล้ว", color: "bg-muted text-muted-foreground", icon: Lock },
};

const months = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const shortMonths = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
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
            <Button size="sm">
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
        <div className="rounded-xl border bg-card p-6">
          <EmptyState
            icon={Calendar}
            title="ยังไม่มีงวดบัญชี"
            description="สร้างงวดบัญชีเพื่อจัดการเอกสารตามรอบเดือน"
          />
        </div>
      ) : (
        Object.entries(periodsByYear)
          .sort(([a], [b]) => parseInt(b) - parseInt(a))
          .map(([year, yearPeriods]) => (
            <div key={year} className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">ปี พ.ศ. {parseInt(year) + 543}</h3>
                <span className="text-sm text-muted-foreground">({yearPeriods.length} งวด)</span>
              </div>
              
              <div className="rounded-xl border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>เดือน</TableHead>
                      <TableHead>ช่วงเวลา</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead className="text-center">เอกสาร</TableHead>
                      <TableHead className="text-right">ยอดรวม</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {yearPeriods
                      .sort((a, b) => b.month - a.month)
                      .map((period) => {
                        const status = statusConfig[period.status];
                        const StatusIcon = status.icon;

                        return (
                          <TableRow key={period.id} className="group">
                            <TableCell>
                              <span className="font-medium">{months[period.month - 1]}</span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(period.startDate).getDate()} {shortMonths[period.month - 1]} - {new Date(period.endDate).getDate()} {shortMonths[period.month - 1]}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("text-xs gap-1", status.color)}>
                                <StatusIcon className="h-3 w-3" />
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="text-xs">
                                {period.documentCount}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ฿{period.totalAmount.toLocaleString("th-TH", {
                                minimumFractionDigits: 0,
                              })}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreVertical className="h-4 w-4" />
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
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))
      )}
    </div>
  );
}
