"use client";

import {
  Receipt,
  FileText,
  FileCheck,
  Check,
  AlertCircle,
  Plus,
  Sparkles,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatMoney } from "@/lib/formatters";
import { getBoxChecklist, calculateCompletionPercent, isAllRequiredComplete } from "@/lib/checklist";
import type { BoxType, ExpenseType, DocType, PaymentStatus } from "@/types";

interface FileInfo {
  id: string;
  fileName: string;
  docType: DocType;
}

interface DocumentProgressProps {
  boxType: BoxType;
  expenseType: ExpenseType | null;
  hasVat: boolean;
  hasWht: boolean;
  totalAmount: number;
  vatAmount: number;
  uploadedDocTypes: Set<DocType>;
  allFiles: FileInfo[];
  canEdit: boolean;
  paymentStatus?: PaymentStatus;
  whtSent?: boolean;
  noReceiptReason?: string | null;
  onTriggerFileUpload: (docType?: DocType) => void;
  onToggleItem?: (itemId: string) => void;
  isPendingToggle?: string; // itemId that is currently pending
}

export function DocumentProgress({
  boxType,
  expenseType,
  hasVat,
  hasWht,
  totalAmount,
  vatAmount,
  uploadedDocTypes,
  allFiles,
  canEdit,
  paymentStatus,
  whtSent: whtSentProp = false,
  noReceiptReason,
  onTriggerFileUpload,
  onToggleItem,
  isPendingToggle,
}: DocumentProgressProps) {
  // Determine isPaid from paymentStatus
  const isPaid = paymentStatus === "PAID" || paymentStatus === "PARTIAL";
  
  // Build checklist from box state
  const defaultChecklist = {
    isPaid,
    hasPaymentProof: false,
    hasTaxInvoice: false,
    hasInvoice: false,
    whtIssued: false,
    whtSent: whtSentProp,
    whtReceived: false,
  };

  const items = getBoxChecklist(
    boxType,
    expenseType,
    hasVat,
    hasWht,
    defaultChecklist,
    uploadedDocTypes,
    noReceiptReason
  );

  const progressPercent = calculateCompletionPercent(items);
  const isComplete = isAllRequiredComplete(items);

  // Get warning message
  const hasSlip = uploadedDocTypes.has("SLIP_TRANSFER");
  const hasTaxInvoice = uploadedDocTypes.has("TAX_INVOICE") || uploadedDocTypes.has("TAX_INVOICE_ABB");
  
  const warningMessage = hasSlip && !hasTaxInvoice && boxType === "EXPENSE" && hasVat
    ? {
        message: "มีสลิปแล้ว แต่ยังไม่มีใบกำกับภาษี",
        detail: totalAmount === 0 
          ? "เพิ่มใบกำกับเพื่อยืนยันยอดและ VAT" 
          : "เพิ่มใบกำกับเพื่อยืนยันยอดและ VAT",
      }
    : hasWht && !uploadedDocTypes.has("WHT_SENT") && !uploadedDocTypes.has("WHT_RECEIVED") && !uploadedDocTypes.has("WHT_INCOMING")
    ? {
        message: boxType === "EXPENSE" ? "รอส่งหนังสือหัก ณ ที่จ่าย" : "รอรับหนังสือหัก ณ ที่จ่าย",
        detail: "อัปโหลดเมื่อได้รับ/ส่ง 50 ทวิ",
      }
    : null;

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            isComplete ? "bg-green-100" : "bg-amber-100"
          )}>
            {isComplete ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              สถานะเอกสาร
            </h3>
            <p className="text-sm text-gray-500">
              ความครบถ้วน: {progressPercent}%
            </p>
          </div>
        </div>
        <Progress value={progressPercent} className="w-32 h-2" />
      </div>

      <div className="p-5 space-y-3">
        {/* Warning Banner */}
        {warningMessage && (
          <div className="rounded-lg p-3 bg-amber-50 border border-amber-200 flex items-start gap-3 mb-4">
            <Sparkles className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                {warningMessage.message}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                {warningMessage.detail}
              </p>
            </div>
          </div>
        )}

        {/* Checklist Items */}
        {items.map((item) => {
          const file = item.relatedDocType 
            ? allFiles.find(f => f.docType === item.relatedDocType)
            : undefined;

          return (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-all",
                item.completed
                  ? "bg-green-50/50 border-green-200"
                  : item.required
                  ? "bg-amber-50/50 border-amber-200"
                  : "bg-gray-50 border-gray-200"
              )}
            >
              {/* Status Icon */}
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                item.completed ? "bg-green-500 text-white" :
                item.required ? "bg-amber-100 text-amber-600" :
                "bg-gray-200 text-gray-400"
              )}>
                {item.completed ? (
                  <Check className="h-4 w-4" />
                ) : item.relatedDocType ? (
                  <FileText className="h-4 w-4" />
                ) : (
                  <FileCheck className="h-4 w-4" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "font-medium text-sm",
                    item.completed ? "text-green-700" :
                    item.required ? "text-amber-700" :
                    "text-gray-600"
                  )}>
                    {item.label}
                  </p>
                  {item.completed && (
                    <span className="text-xs text-green-600">✓</span>
                  )}
                  {!item.completed && item.required && (
                    <span className="text-xs text-amber-600">จำเป็น</span>
                  )}
                  {!item.completed && !item.required && (
                    <span className="text-xs text-gray-400">optional</span>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-0.5">
                  {item.description}
                </p>

                {/* File info if completed */}
                {item.completed && file && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    └── {file.fileName}
                  </p>
                )}

                {/* VAT info */}
                {item.id === "hasTaxInvoice" && item.completed && vatAmount > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    └── VAT ฿{formatMoney(vatAmount)} → เครม VAT ได้ ✓
                  </p>
                )}
              </div>

              {/* Action - Upload Button */}
              {!item.completed && canEdit && item.relatedDocType && !item.canToggle && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onTriggerFileUpload(item.relatedDocType)}
                  className={cn(
                    "shrink-0",
                    item.required && "border-amber-300 text-amber-700 hover:bg-amber-50"
                  )}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  เพิ่ม
                </Button>
              )}

              {/* Action - Toggle Button (for toggleable items like isPaid, whtSent) */}
              {item.canToggle && canEdit && onToggleItem && (
                <Button
                  type="button"
                  variant={item.completed ? "outline" : "default"}
                  size="sm"
                  onClick={() => onToggleItem(item.id)}
                  disabled={isPendingToggle === item.id}
                  className={cn(
                    "shrink-0",
                    item.completed 
                      ? "border-green-300 text-green-700 hover:bg-green-50" 
                      : "bg-primary hover:bg-primary/90"
                  )}
                >
                  {isPendingToggle === item.id ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : item.completed ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : null}
                  {item.completed ? "ยืนยันแล้ว" : "ยืนยัน"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
