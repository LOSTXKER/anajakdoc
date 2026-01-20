"use client";

import { useState } from "react";
import Image from "next/image";
import {
  FileText,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/formatters";
import { getDocTypeConfig } from "@/lib/document-config";
import type { DocType, ExpenseType } from "@/types";
import type { ExtractedDocumentData } from "@/server/actions/ai-classify";

export interface ExtractedFile {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "analyzing" | "done" | "error";
  extractedData?: ExtractedDocumentData;
  error?: string;
}

interface FileAnalysisCardProps {
  file: ExtractedFile;
  expenseType?: ExpenseType;
  onRemove: () => void;
  onReanalyze: () => void;
}

export function FileAnalysisCard({ 
  file,
  expenseType = "STANDARD",
  onRemove, 
  onReanalyze 
}: FileAnalysisCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { status, extractedData, error, preview } = file;

  const isImage = file.file.type.startsWith("image/");
  const isPdf = file.file.type === "application/pdf";

  const docType = extractedData?.type as DocType | undefined;
  const docTypeConfig = docType ? getDocTypeConfig(docType) : null;
  const confidence = extractedData?.confidence ?? 0;

  return (
    <div className={cn(
      "rounded-lg border bg-white overflow-hidden transition-all",
      status === "analyzing" && "border-primary/50 bg-primary/5",
      status === "error" && "border-red-300 bg-red-50",
      status === "done" && "border-green-200"
    )}>
      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
          {isImage && preview ? (
            <Image
              src={preview}
              alt={file.file.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className={cn("h-8 w-8", isPdf ? "text-red-500" : "text-muted-foreground")} />
            </div>
          )}
          
          {status === "analyzing" && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {status === "analyzing" ? (
              <span className="text-sm text-primary font-medium flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                AI กำลังอ่าน...
              </span>
            ) : status === "error" ? (
              <span className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {error}
              </span>
            ) : docTypeConfig ? (
              <div className="flex items-center gap-2">
                <span className={cn("text-xs px-2 py-0.5 rounded font-medium", docTypeConfig.colorClass)}>
                  {docTypeConfig.label}
                </span>
                {confidence > 0 && (
                  <span className={cn(
                    "text-xs",
                    confidence >= 0.8 ? "text-green-600" : 
                    confidence >= 0.5 ? "text-amber-600" : "text-red-600"
                  )}>
                    {Math.round(confidence * 100)}%
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">รอวิเคราะห์</span>
            )}
          </div>

          <p className="text-xs text-muted-foreground truncate">{file.file.name}</p>

          {/* Quick preview */}
          {status === "done" && extractedData && !isExpanded && (
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              {extractedData.amount && (
                <span className="font-medium text-foreground">
                  ฿{formatMoney(extractedData.amount)}
                </span>
              )}
              {extractedData.contactName && (
                <span className="truncate max-w-[120px]">
                  {extractedData.contactName}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-start gap-1 shrink-0">
          {status === "done" && extractedData && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
          
          {(status === "error" || status === "done") && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onReanalyze}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Expanded details */}
      {status === "done" && extractedData && isExpanded && (
        <div className="px-3 pb-3 border-t bg-muted/30">
          <div className="grid grid-cols-2 gap-2 pt-3 text-sm">
            {extractedData.amount !== undefined && (
              <div>
                <span className="text-xs text-muted-foreground">ยอดเงิน</span>
                <p className="font-semibold text-primary">
                  ฿{formatMoney(extractedData.amount)}
                </p>
              </div>
            )}
            
            {extractedData.vatAmount !== undefined && extractedData.vatAmount > 0 && (
              <div>
                <span className="text-xs text-muted-foreground">VAT</span>
                <p className="font-medium">฿{formatMoney(extractedData.vatAmount)}</p>
              </div>
            )}
            
            {extractedData.documentDate && (
              <div>
                <span className="text-xs text-muted-foreground">วันที่</span>
                <p className="font-medium">{extractedData.documentDate}</p>
              </div>
            )}
            
            {extractedData.documentNumber && (
              <div>
                <span className="text-xs text-muted-foreground">เลขที่เอกสาร</span>
                <p className="font-medium">{extractedData.documentNumber}</p>
              </div>
            )}
            
            {extractedData.contactName && (
              <div className="col-span-2">
                <span className="text-xs text-muted-foreground">ผู้ขาย/ร้านค้า</span>
                <p className="font-medium">{extractedData.contactName}</p>
              </div>
            )}
            
            {extractedData.taxId && (
              <div className="col-span-2">
                <span className="text-xs text-muted-foreground">เลขประจำตัวผู้เสียภาษี</span>
                <p className="font-medium font-mono text-xs">{extractedData.taxId}</p>
              </div>
            )}
            
            {extractedData.description && (
              <div className="col-span-2">
                <span className="text-xs text-muted-foreground">รายละเอียด</span>
                <p className="font-medium text-xs">{extractedData.description}</p>
              </div>
            )}
          </div>

          {/* Show what we don't know for slips - based on ExpenseType */}
          {(extractedData.type === "SLIP_TRANSFER" || extractedData.type === "SLIP_CHEQUE") && expenseType === "STANDARD" && (
            <div className="mt-3 p-2 rounded bg-amber-50 text-xs text-amber-700">
              <p className="font-medium">⚠️ สลิปไม่มีข้อมูล VAT และหัก ณ ที่จ่าย</p>
              <p>จะรู้เมื่อได้รับใบกำกับภาษี</p>
            </div>
          )}
          {(extractedData.type === "SLIP_TRANSFER" || extractedData.type === "SLIP_CHEQUE") && expenseType === "FOREIGN" && (
            <div className="mt-3 p-2 rounded bg-indigo-50 text-xs text-indigo-700">
              <p className="font-medium">⚠️ รอ Invoice ต่างประเทศ</p>
              <p>เพิ่ม Invoice เพื่อยืนยันรายละเอียด</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
