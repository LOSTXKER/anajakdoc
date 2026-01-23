"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileSpreadsheet,
  FolderArchive,
  Download,
  Loader2,
  Package,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { exportBoxes } from "@/server/actions/export";
import type { Category, CostCenter, Contact, ExportType } from ".prisma/client";

interface SerializedBox {
  id: string;
  organizationId: string;
  boxNumber: string;
  boxType: string;
  expenseType: string | null;
  boxDate: string;
  dueDate: string | null;
  totalAmount: number;
  vatAmount: number;
  whtAmount: number;
  paidAmount: number;
  vatRate: number | null;
  whtRate: number | null;
  status: string;
  docStatus: string;
  title: string | null;
  description: string | null;
  category: Category | null;
  costCenter: CostCenter | null;
  contact: Contact | null;
  createdBy: { name: string | null };
  documents: { docType: string }[];
}

interface SerializedExportHistory {
  id: string;
  organizationId: string;
  exportType: ExportType;
  fileName: string;
  fileUrl: string | null;
  boxIds: string[];
  boxCount: number;
  exportedById: string;
  createdAt: string;
}

interface ExportPanelProps {
  boxes: SerializedBox[];
  history: SerializedExportHistory[];
}

const formatOptions = [
  { value: "EXCEL_GENERIC", label: "Excel (ทั่วไป)", icon: FileSpreadsheet },
  { value: "EXCEL_PEAK", label: "Excel (PEAK)", icon: FileSpreadsheet },
  { value: "EXCEL_FLOWACCOUNT", label: "Excel (FlowAccount)", icon: FileSpreadsheet },
  { value: "EXCEL_EXPRESS", label: "Excel (Express)", icon: FileSpreadsheet },
  { value: "ZIP", label: "ZIP (รวมไฟล์)", icon: FolderArchive },
];

export function ExportPanel({ boxes, history }: ExportPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [format, setFormat] = useState<string>("EXCEL_GENERIC");

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === boxes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(boxes.map((b) => b.id));
    }
  };

  const handleExport = () => {
    if (selectedIds.length === 0) {
      toast.error("กรุณาเลือกกล่องที่ต้องการ Export");
      return;
    }

    startTransition(async () => {
      const result = await exportBoxes(selectedIds, format as "EXCEL_GENERIC" | "EXCEL_PEAK" | "EXCEL_FLOWACCOUNT" | "EXCEL_EXPRESS" | "ZIP");
      if (result.success) {
        toast.success(`Export สำเร็จ ${selectedIds.length} รายการ`);
        setSelectedIds([]);
        if (result.data?.downloadUrl) {
          const link = document.createElement("a");
          link.href = result.data.downloadUrl;
          link.download = format === "ZIP" 
            ? `export_${new Date().toISOString().slice(0,10)}.zip`
            : `export_${new Date().toISOString().slice(0,10)}.xlsx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Export Options */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold text-foreground mb-4">Export กล่องเอกสาร</h3>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">รูปแบบ</p>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <opt.icon className="h-4 w-4" />
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1" />
          
          <Button
            onClick={handleExport}
            disabled={isPending || selectedIds.length === 0}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export ({selectedIds.length})
          </Button>
        </div>
      </div>

      {/* Box Selection */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">
            กล่องพร้อม Export 
            <span className="text-muted-foreground font-normal ml-2">({boxes.length})</span>
          </h3>
          {boxes.length > 0 && (
            <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
              {selectedIds.length === boxes.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
            </Button>
          )}
        </div>

        {boxes.length === 0 ? (
          <EmptyState
            icon={Package}
            title="ไม่มีกล่องที่พร้อม Export"
            description="กล่องจะปรากฏที่นี่เมื่อได้รับการอนุมัติแล้ว"
          />
        ) : (
          <div className="space-y-2">
            {boxes.map((box) => (
              <div
                key={box.id}
                onClick={() => toggleSelect(box.id)}
                className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedIds.includes(box.id) 
                    ? "border-primary bg-primary/5" 
                    : "hover:bg-muted"
                }`}
              >
                <Checkbox
                  checked={selectedIds.includes(box.id)}
                  onCheckedChange={() => toggleSelect(box.id)}
                />
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{box.boxNumber}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {box.title || "-"} • {box.contact?.name || "-"} • {box.category?.name || "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {box.documents.length} เอกสาร
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-foreground">
                    ฿{box.totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(box.boxDate).toLocaleDateString("th-TH")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export History */}
      {history.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-4">ประวัติการ Export</h3>
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 rounded-lg border"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  {item.exportType === "ZIP" ? (
                    <FolderArchive className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{item.fileName}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{item.boxCount} กล่อง</span>
                    <span className="text-border">•</span>
                    <Clock className="h-3 w-3" />
                    <span>{new Date(item.createdAt).toLocaleString("th-TH")}</span>
                  </div>
                </div>
                {item.fileUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={item.fileUrl} download>
                      <Download className="mr-1.5 h-4 w-4" />
                      ดาวน์โหลด
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
