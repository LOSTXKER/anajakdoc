"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  FileSpreadsheet,
  FolderArchive,
  Download,
  Loader2,
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { exportDocuments } from "@/server/actions/export";
import type { Document, Category, CostCenter, Contact, ExportHistory } from ".prisma/client";

interface DocumentWithRelations extends Document {
  category: Category | null;
  costCenter: CostCenter | null;
  contact: Contact | null;
  submittedBy: { name: string | null };
}

interface ExportPanelProps {
  documents: DocumentWithRelations[];
  history: ExportHistory[];
}

const formatOptions = [
  { value: "EXCEL_GENERIC", label: "Excel (ทั่วไป)", icon: FileSpreadsheet },
  { value: "EXCEL_PEAK", label: "Excel (PEAK)", icon: FileSpreadsheet },
  { value: "ZIP", label: "ZIP (รวมไฟล์)", icon: FolderArchive },
];

export function ExportPanel({ documents, history }: ExportPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [format, setFormat] = useState<string>("EXCEL_GENERIC");

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === documents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(documents.map((d) => d.id));
    }
  };

  const handleExport = () => {
    if (selectedIds.length === 0) {
      toast.error("กรุณาเลือกเอกสารที่ต้องการ Export");
      return;
    }

    startTransition(async () => {
      const result = await exportDocuments(selectedIds, format as "EXCEL_GENERIC" | "EXCEL_PEAK" | "ZIP");
      if (result.success) {
        toast.success(`Export สำเร็จ ${selectedIds.length} รายการ`);
        setSelectedIds([]);
        // Download file
        if (result.data?.downloadUrl) {
          window.open(result.data.downloadUrl, "_blank");
        }
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export เอกสาร</CardTitle>
          <CardDescription>
            เลือกเอกสารที่ต้องการและรูปแบบการ Export
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">รูปแบบ</p>
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
        </CardContent>
      </Card>

      {/* Document Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>เอกสารพร้อม Export ({documents.length})</span>
            {documents.length > 0 && (
              <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                {selectedIds.length === documents.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>ไม่มีเอกสารที่พร้อม Export</p>
              <p className="text-sm">เอกสารจะปรากฏที่นี่เมื่อได้รับการอนุมัติแล้ว</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>เลขที่เอกสาร</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>หมวดหมู่</TableHead>
                  <TableHead>ผู้ติดต่อ</TableHead>
                  <TableHead className="text-right">ยอดเงิน</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow 
                    key={doc.id}
                    className={selectedIds.includes(doc.id) ? "bg-primary/5" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(doc.id)}
                        onCheckedChange={() => toggleSelect(doc.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {doc.docNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(doc.docDate).toLocaleDateString("th-TH")}
                    </TableCell>
                    <TableCell>
                      {doc.category?.name || "-"}
                    </TableCell>
                    <TableCell>
                      {doc.contact?.name || "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ฿{doc.totalAmount.toNumber().toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Export History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>ประวัติการ Export</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      {item.exportType === "ZIP" ? (
                        <FolderArchive className="h-5 w-5" />
                      ) : (
                        <FileSpreadsheet className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{item.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.documentCount} เอกสาร • {new Date(item.createdAt).toLocaleString("th-TH")}
                      </p>
                    </div>
                  </div>
                  {item.fileUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={item.fileUrl} download>
                        <Download className="mr-2 h-4 w-4" />
                        ดาวน์โหลด
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
