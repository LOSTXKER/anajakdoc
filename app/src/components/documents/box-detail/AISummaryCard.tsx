"use client";

import { useState, useEffect, useTransition } from "react";
import { 
  Sparkles, 
  Loader2, 
  RefreshCw,
  Building2,
  Calendar,
  FileText,
  AlertCircle,
  Check,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { readBoxDocuments, type AIReadResult } from "@/server/actions/box/ai-read";
import { formatMoney } from "@/lib/formatters";

interface AISummaryCardProps {
  boxId: string;
  hasFiles: boolean;
  // Existing box data for fallback display
  totalAmount?: number;
  vatAmount?: number;
  whtAmount?: number;
  whtRate?: number | null;
  contactName?: string | null;
  boxDate?: string;
  description?: string | null;
}

export function AISummaryCard({
  boxId,
  hasFiles,
  totalAmount: boxTotalAmount,
  vatAmount: boxVatAmount,
  whtAmount: boxWhtAmount,
  whtRate: boxWhtRate,
  contactName: boxContactName,
  boxDate,
  description: boxDescription,
}: AISummaryCardProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AIReadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasReadOnce, setHasReadOnce] = useState(false);

  // Auto-read on mount if there are files
  useEffect(() => {
    if (hasFiles && !hasReadOnce) {
      handleReadDocuments();
    }
  }, [hasFiles, hasReadOnce]);

  const handleReadDocuments = () => {
    setError(null);
    startTransition(async () => {
      const response = await readBoxDocuments(boxId);
      if (response.success && response.data) {
        setResult(response.data);
        setHasReadOnce(true);
      } else {
        setError(response.error || "เกิดข้อผิดพลาด");
        setHasReadOnce(true);
      }
    });
  };

  // Use AI result if available, otherwise fall back to box data
  const totalAmount = result?.totalAmount ?? boxTotalAmount ?? 0;
  const vatAmount = result?.vatAmount ?? boxVatAmount ?? 0;
  const contactName = result?.contactName ?? boxContactName;
  const documentDate = result?.documentDate ?? boxDate?.split("T")[0];
  const description = result?.description ?? boxDescription;

  // File results for display
  const successCount = result?.files.filter(f => !f.error).length ?? 0;
  const totalFiles = result?.files.length ?? 0;

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-violet-50 to-indigo-50 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-200">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">สรุปข้อมูลเอกสาร</h3>
            <p className="text-xs text-gray-500">
              {isPending ? (
                "กำลังอ่านเอกสาร..."
              ) : result ? (
                `AI อ่านสำเร็จ ${successCount}/${totalFiles} ไฟล์`
              ) : hasFiles ? (
                "รอ AI อ่านเอกสาร"
              ) : (
                "ยังไม่มีเอกสาร"
              )}
            </p>
          </div>
        </div>
        
        {/* Re-read button */}
        {hasFiles && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReadDocuments}
            disabled={isPending}
            className="gap-1.5"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">อ่านอีกครั้ง</span>
          </Button>
        )}
      </div>

      {/* Loading State */}
      {isPending && !result && (
        <div className="p-8 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-violet-500 animate-spin mb-3" />
          <p className="text-sm text-gray-500">AI กำลังอ่านเอกสาร...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isPending && (
        <div className="p-5">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">{error}</p>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={handleReadDocuments}
                className="p-0 h-auto text-red-600"
              >
                ลองอีกครั้ง
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Content */}
      {!isPending && !error && (hasReadOnce || boxTotalAmount) && (
        <div className="p-5 space-y-4">
          {/* Amount Card - Prominent */}
          <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">ยอดรวม</p>
                <p className="text-3xl font-bold mt-1">฿{formatMoney(totalAmount)}</p>
              </div>
              {vatAmount > 0 && (
                <div className="text-right">
                  <p className="text-emerald-100 text-sm">VAT 7%</p>
                  <p className="text-xl font-semibold">฿{formatMoney(vatAmount)}</p>
                </div>
              )}
            </div>
            
            {/* WHT info */}
            {boxWhtAmount && boxWhtAmount > 0 && (
              <div className="mt-3 pt-3 border-t border-emerald-400/30">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-100 text-sm">หัก ณ ที่จ่าย ({boxWhtRate}%)</span>
                  <span className="text-lg font-semibold">฿{formatMoney(boxWhtAmount)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Contact */}
            {contactName && (
              <div className="col-span-2 flex items-center gap-3 p-3 rounded-xl bg-slate-50 border">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">ร้านค้า/ผู้ติดต่อ</p>
                  <p className="font-semibold text-slate-900 truncate">{contactName}</p>
                  {result?.taxId && (
                    <p className="text-xs text-slate-500 mt-0.5">เลขผู้เสียภาษี: {result.taxId}</p>
                  )}
                </div>
              </div>
            )}

            {/* Date */}
            {documentDate && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">วันที่</p>
                  <p className="font-semibold text-slate-900">{documentDate}</p>
                </div>
              </div>
            )}

            {/* Description */}
            {description && (
              <div className={cn(
                "p-3 rounded-xl bg-slate-50 border",
                !documentDate && "col-span-2"
              )}>
                <p className="text-xs text-slate-500 mb-1">รายละเอียด</p>
                <p className="text-sm text-slate-700 line-clamp-2">{description}</p>
              </div>
            )}
          </div>

          {/* File Results - Compact */}
          {result && result.files.length > 0 && (
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700">ไฟล์ที่วิเคราะห์</p>
                <span className="text-xs text-slate-500">{totalFiles} ไฟล์</span>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {result.files.map((file) => (
                  <div 
                    key={file.fileId}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                      file.error ? "bg-red-50 border border-red-100" : "bg-slate-50"
                    )}
                  >
                    {file.error ? (
                      <Receipt className="h-4 w-4 shrink-0 text-red-400" />
                    ) : (
                      <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                    )}
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
          )}
        </div>
      )}

      {/* Empty State */}
      {!hasFiles && !isPending && (
        <div className="p-8 text-center">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">อัปโหลดเอกสารเพื่อให้ AI อ่านข้อมูล</p>
        </div>
      )}
    </div>
  );
}
