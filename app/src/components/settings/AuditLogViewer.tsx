"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Download,
  Search,
  FileJson,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Eye,
  Shield,
  Clock,
  User,
  FileText,
  Filter,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  getOrganizationAuditLogs,
  exportAuditLogs,
  type AuditLogEntry,
} from "@/server/actions/audit";

// Action types for filtering (includes historical actions and new status system)
const ACTION_TYPES = [
  { value: "CREATED", label: "สร้างกล่อง" },
  { value: "UPDATED", label: "แก้ไขข้อมูล" },
  { value: "STATUS_CHANGED", label: "เปลี่ยนสถานะ" },
  { value: "SUBMITTED", label: "ส่งตรวจ" },
  { value: "APPROVED", label: "อนุมัติ" },
  { value: "REJECTED", label: "ปฏิเสธ" },
  { value: "NEED_DOCS", label: "ขาดเอกสาร" },
  { value: "NEED_MORE_DOCS", label: "ขอเอกสารเพิ่ม" }, // Historical
  { value: "COMPLETED", label: "เสร็จสิ้น" },
  { value: "BOOKED", label: "ลงบัญชี" }, // Historical
  { value: "ARCHIVED", label: "เก็บถาวร" }, // Historical
  { value: "FILE_UPLOADED", label: "อัปโหลดไฟล์" },
  { value: "FILE_DELETED", label: "ลบไฟล์" },
  { value: "COMMENT_ADDED", label: "เพิ่มความคิดเห็น" },
  { value: "TASK_CREATED", label: "สร้าง Task" },
  { value: "TASK_COMPLETED", label: "Task เสร็จสิ้น" },
  { value: "PAYMENT_ADDED", label: "บันทึกการชำระ" },
];

// Get action badge color
function getActionColor(action: string): "default" | "secondary" | "destructive" | "outline" {
  if (["APPROVED", "BOOKED", "COMPLETED", "TASK_COMPLETED"].includes(action)) return "default";
  if (["REJECTED", "FILE_DELETED"].includes(action)) return "destructive";
  if (["CREATED", "FILE_UPLOADED", "PAYMENT_ADDED"].includes(action)) return "secondary";
  return "outline";
}

// Translate action
function translateAction(action: string): string {
  return ACTION_TYPES.find((a) => a.value === action)?.label || action;
}

interface AuditLogViewerProps {
  initialData: {
    logs: AuditLogEntry[];
    total: number;
    page: number;
    totalPages: number;
  };
}

export function AuditLogViewer({ initialData }: AuditLogViewerProps) {
  const [logs, setLogs] = useState(initialData.logs);
  const [total, setTotal] = useState(initialData.total);
  const [page, setPage] = useState(initialData.page);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const fetchLogs = useCallback(async (newPage: number = 1) => {
    setLoading(true);
    try {
      const result = await getOrganizationAuditLogs({
        page: newPage,
        limit: 50,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        action: actionFilter || undefined,
      });

      if (result.success) {
        setLogs(result.data.logs);
        setTotal(result.data.total);
        setPage(result.data.page);
        setTotalPages(result.data.totalPages);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, actionFilter]);

  const handleExport = async (format: "xlsx" | "json") => {
    setExporting(true);
    try {
      const result = await exportAuditLogs({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        format,
      });

      if (result.success) {
        // Create download link
        const link = document.createElement("a");
        link.href = result.data.downloadUrl;
        link.download = result.data.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(
          `ดาวน์โหลดสำเร็จ (${result.data.recordCount} รายการ)`,
          {
            description: `SHA-256: ${result.data.hash.slice(0, 16)}...`,
          }
        );
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการ Export");
    } finally {
      setExporting(false);
    }
  };

  const handleApplyFilters = () => {
    fetchLogs(1);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setActionFilter("");
    // Reset to initial and refetch
    setTimeout(() => fetchLogs(1), 0);
  };

  const hasFilters = startDate || endDate || actionFilter;

  return (
    <div className="space-y-6">
      {/* Stats and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex items-center gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <div>
                <p className="text-sm text-muted-foreground">ทั้งหมด</p>
                <p className="text-xl font-bold">{total.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={hasFilters ? "border-teal-500" : ""}
          >
            <Filter className="h-4 w-4 mr-2" />
            ตัวกรอง
            {hasFilters && (
              <Badge variant="secondary" className="ml-2">
                กำลังใช้งาน
              </Badge>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => handleExport("xlsx")}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 mr-2" />
            )}
            Excel
          </Button>

          <Button
            variant="outline"
            onClick={() => handleExport("json")}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileJson className="h-4 w-4 mr-2" />
            )}
            JSON
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">ตัวกรอง</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>วันที่เริ่มต้น</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>วันที่สิ้นสุด</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>ประเภทการดำเนินการ</Label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="ทั้งหมด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">ทั้งหมด</SelectItem>
                    {ACTION_TYPES.map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        {action.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleApplyFilters} className="flex-1">
                  <Search className="h-4 w-4 mr-2" />
                  ค้นหา
                </Button>
                {hasFilters && (
                  <Button variant="ghost" onClick={handleClearFilters}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Log Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">วันเวลา</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
                  <TableHead>เลขที่กล่อง</TableHead>
                  <TableHead>ผู้ดำเนินการ</TableHead>
                  <TableHead className="w-[100px]">IP</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      ไม่พบข้อมูล Audit Log
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {new Date(log.timestamp).toLocaleString("th-TH")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionColor(log.action)}>
                          {translateAction(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.boxNumber ? (
                          <span className="font-mono text-sm">{log.boxNumber}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-3 w-3" />
                          </div>
                          <span className="text-sm">{log.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.ipAddress || "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                แสดง {(page - 1) * 50 + 1} - {Math.min(page * 50, total)} จาก {total} รายการ
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchLogs(page - 1)}
                  disabled={page <= 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  หน้า {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchLogs(page + 1)}
                  disabled={page >= totalPages || loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              รายละเอียด Audit Log
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">วันเวลา</Label>
                  <p className="font-mono text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(selectedLog.timestamp).toLocaleString("th-TH")}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">การดำเนินการ</Label>
                  <div className="mt-1">
                    <Badge variant={getActionColor(selectedLog.action)}>
                      {translateAction(selectedLog.action)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">เลขที่กล่อง</Label>
                  <p className="font-mono">{selectedLog.boxNumber || "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">IP Address</Label>
                  <p className="font-mono text-sm">{selectedLog.ipAddress || "-"}</p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">ผู้ดำเนินการ</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedLog.userName}</p>
                    <p className="text-xs text-muted-foreground">{selectedLog.userEmail}</p>
                  </div>
                </div>
              </div>

              {selectedLog.details && (
                <div>
                  <Label className="text-xs text-muted-foreground">รายละเอียด</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">Log ID</Label>
                <p className="font-mono text-xs text-muted-foreground">{selectedLog.id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
