"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Loader2,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Edit2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/formatters";
import { getSubDocTypeConfig } from "@/lib/document-config";
import type { SubDocType } from "@/types";
import type { ExtractedDocumentData } from "@/server/actions/ai-classify";

export type ExtractionStatus = "pending" | "analyzing" | "done" | "error";

export interface ExtractedFile {
  id: string;
  file: File;
  preview: string;
  status: ExtractionStatus;
  extractedData?: ExtractedDocumentData;
  error?: string;
}

interface DocumentFileCardProps {
  extractedFile: ExtractedFile;
  onRemove?: () => void;
  onReanalyze?: () => void;
  onEdit?: () => void;
  isEditable?: boolean;
  compact?: boolean;
}

export function DocumentFileCard({
  extractedFile,
  onRemove,
  onReanalyze,
  onEdit,
  isEditable = true,
  compact = false,
}: DocumentFileCardProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const { file, preview, status, extractedData, error } = extractedFile;

  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";

  // Get doc type config
  const docType = extractedData?.type as SubDocType | undefined;
  const docTypeConfig = docType ? getSubDocTypeConfig(docType) : null;
  const confidence = extractedData?.confidence ?? 0;

  // Status indicators
  const isAnalyzing = status === "analyzing";
  const isDone = status === "done";
  const hasError = status === "error";
  const isPending = status === "pending";

  return (
    <div
      className={cn(
        "rounded-lg border bg-white overflow-hidden transition-all",
        isAnalyzing && "border-primary/50 bg-primary/5",
        hasError && "border-red-300 bg-red-50",
        isDone && "border-green-200"
      )}
    >
      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
          {isImage ? (
            <Image
              src={preview}
              alt={file.name}
              fill
              className="object-cover"
            />
          ) : isPdf ? (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-red-500" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          
          {/* Status Overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
          {hasError && (
            <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Top row: Doc type + confidence */}
          <div className="flex items-center gap-2 mb-1">
            {isAnalyzing ? (
              <span className="text-sm text-primary font-medium flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                กำลังวิเคราะห์...
              </span>
            ) : isPending ? (
              <span className="text-sm text-muted-foreground">รอวิเคราะห์</span>
            ) : hasError ? (
              <span className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error || "วิเคราะห์ไม่สำเร็จ"}
              </span>
            ) : docTypeConfig ? (
              <div className="flex items-center gap-2">
                <Badge className={cn("text-xs", docTypeConfig.colorClass)}>
                  {docTypeConfig.label}
                </Badge>
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
              <span className="text-sm text-muted-foreground">ไม่ทราบประเภท</span>
            )}
          </div>

          {/* File name */}
          <p className="text-xs text-muted-foreground truncate">{file.name}</p>

          {/* Extracted data preview (when done and collapsed) */}
          {isDone && extractedData && !isExpanded && (
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
          {isDone && extractedData && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
          
          {isEditable && (
            <>
              {(hasError || isDone) && onReanalyze && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onReanalyze}
                  disabled={isAnalyzing}
                >
                  <RefreshCw className={cn("h-4 w-4", isAnalyzing && "animate-spin")} />
                </Button>
              )}
              
              {onRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={onRemove}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {isDone && extractedData && isExpanded && (
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

          {/* Edit button */}
          {isEditable && onEdit && (
            <div className="mt-3 flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onEdit}
              >
                <Edit2 className="h-3 w-3 mr-1" />
                แก้ไข
              </Button>
            </div>
          )}

          {/* AI confidence note */}
          {confidence > 0 && confidence < 0.7 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
              <AlertCircle className="h-3 w-3" />
              <span>ความมั่นใจต่ำ - กรุณาตรวจสอบข้อมูล</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Skeleton loading state
export function DocumentFileCardSkeleton() {
  return (
    <div className="rounded-lg border bg-white overflow-hidden animate-pulse">
      <div className="flex gap-3 p-3">
        <div className="w-16 h-16 rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-3 bg-muted rounded w-32" />
        </div>
      </div>
    </div>
  );
}
