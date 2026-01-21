"use client";

import { useState, useTransition } from "react";
import { 
  Sparkles, 
  Loader2, 
  Check, 
  X, 
  AlertCircle,
  FileText,
  DollarSign,
  Building2,
  Calendar,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { readBoxDocuments, type AIReadResult } from "@/server/actions/box/ai-read";
import { formatMoney } from "@/lib/formatters";

interface AIReadPanelProps {
  boxId: string;
  canEdit: boolean;
  onApplyData?: (data: AIReadResult) => void;
}

export function AIReadPanel({ boxId, canEdit, onApplyData }: AIReadPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AIReadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleReadDocuments = () => {
    setError(null);
    startTransition(async () => {
      const response = await readBoxDocuments(boxId);
      if (response.success && response.data) {
        setResult(response.data);
        setIsOpen(true);
      } else {
        setError(response.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleApply = () => {
    if (result && onApplyData) {
      onApplyData(result);
      setIsOpen(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setResult(null);
  };

  if (!canEdit) return null;

  return (
    <div className="space-y-3">
      {/* AI Read Button - Modern Card Style */}
      {!isOpen && (
        <div className="rounded-xl border bg-gradient-to-br from-violet-50 via-white to-indigo-50 overflow-hidden">
          <div className="p-5">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-200">
                <Wand2 className="h-6 w-6 text-white" />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900">AI อ่านเอกสาร</h4>
                <p className="text-sm text-gray-500 mt-0.5">
                  วิเคราะห์ไฟล์และดึงยอดเงิน, VAT, ร้านค้าให้อัตโนมัติ
                </p>
                
                {error && (
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
              </div>
              
              {/* Button */}
              <Button
                type="button"
                onClick={handleReadDocuments}
                disabled={isPending}
                className={cn(
                  "shrink-0 gap-2 shadow-md",
                  "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700",
                  "text-white border-0"
                )}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังอ่าน...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    เริ่มวิเคราะห์
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Results Panel - Modern Card Style */}
      {isOpen && result && (
        <div className="rounded-xl border bg-white overflow-hidden shadow-lg">
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">ผลการวิเคราะห์</h3>
                <p className="text-xs text-violet-200">AI อ่านสำเร็จ {result.files.filter(f => !f.error).length}/{result.files.length} ไฟล์</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/20"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Main Data Cards */}
          <div className="p-5 space-y-4">
            {/* Amount Card - Prominent */}
            {result.totalAmount && (
              <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm">ยอดรวม</p>
                    <p className="text-3xl font-bold mt-1">฿{formatMoney(result.totalAmount)}</p>
                  </div>
                  {result.vatAmount && result.vatAmount > 0 && (
                    <div className="text-right">
                      <p className="text-emerald-100 text-sm">VAT 7%</p>
                      <p className="text-xl font-semibold">฿{formatMoney(result.vatAmount)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              {result.contactName && (
                <div className="col-span-2 flex items-center gap-3 p-4 rounded-xl bg-slate-50 border">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">ร้านค้า/ผู้ติดต่อ</p>
                    <p className="font-semibold text-slate-900 truncate">{result.contactName}</p>
                    {result.taxId && (
                      <p className="text-xs text-slate-500 mt-0.5">เลขผู้เสียภาษี: {result.taxId}</p>
                    )}
                  </div>
                </div>
              )}

              {result.documentDate && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">วันที่</p>
                    <p className="font-semibold text-slate-900">{result.documentDate}</p>
                  </div>
                </div>
              )}

              {result.description && (
                <div className={cn(
                  "p-4 rounded-xl bg-slate-50 border",
                  !result.documentDate && "col-span-2"
                )}>
                  <p className="text-xs text-slate-500 mb-1">รายละเอียด</p>
                  <p className="text-sm text-slate-700 line-clamp-2">{result.description}</p>
                </div>
              )}
            </div>

            {/* File Results - Compact */}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700">ไฟล์ที่วิเคราะห์</p>
                <span className="text-xs text-slate-500">{result.files.length} ไฟล์</span>
              </div>
              <div className="space-y-1.5">
                {result.files.map((file) => (
                  <div 
                    key={file.fileId}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                      file.error ? "bg-red-50 border border-red-100" : "bg-slate-50"
                    )}
                  >
                    <FileText className={cn(
                      "h-4 w-4 shrink-0",
                      file.error ? "text-red-400" : "text-slate-400"
                    )} />
                    <span className="flex-1 truncate text-slate-700">{file.fileName}</span>
                    {file.error ? (
                      <span className="flex items-center gap-1 text-red-500 text-xs shrink-0">
                        <AlertCircle className="h-3.5 w-3.5" />
                        ไม่สำเร็จ
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-600 text-xs shrink-0">
                        <Check className="h-3.5 w-3.5" />
                        {file.docType?.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions - Sticky Bottom */}
          <div className="px-5 py-4 bg-slate-50 border-t flex items-center justify-between">
            <p className="text-xs text-slate-500">
              กด &quot;ใช้ข้อมูลนี้&quot; เพื่อ auto-fill ลงฟอร์ม
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleClose}>
                ยกเลิก
              </Button>
              <Button 
                size="sm" 
                onClick={handleApply}
                disabled={!result.totalAmount && !result.contactName}
                className="gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md"
              >
                <Check className="h-4 w-4" />
                ใช้ข้อมูลนี้
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
