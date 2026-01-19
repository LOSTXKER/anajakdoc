"use client";

import { useState } from "react";
import {
  Receipt,
  FileText,
  FileCheck,
  Check,
  AlertCircle,
  Plus,
  ChevronDown,
  ChevronUp,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { SubDocType } from "@/types";

interface BoxProgressTrackerProps {
  hasSlip: boolean;
  hasTaxInvoice: boolean;
  hasReceipt: boolean;
  hasWhtCert: boolean;
  hasWht: boolean;
  totalAmount: number;
  transactionType: "EXPENSE" | "INCOME";
  onAddDocument?: (docType: SubDocType) => void;
}

// Document step configuration
const DOC_STEPS = {
  EXPENSE: [
    { 
      id: "slip", 
      label: "สลิปโอนเงิน", 
      docType: "SLIP" as SubDocType,
      icon: Receipt,
      description: "หลักฐานการจ่ายเงิน",
      priority: 1,
    },
    { 
      id: "taxInvoice", 
      label: "ใบกำกับภาษี", 
      docType: "TAX_INVOICE" as SubDocType,
      icon: FileText,
      description: "ใบกำกับภาษี/ใบเสร็จ",
      priority: 2,
    },
    { 
      id: "whtCert", 
      label: "หนังสือหัก ณ ที่จ่าย", 
      docType: "WHT_CERT_SENT" as SubDocType,
      icon: FileCheck,
      description: "50 ทวิ",
      priority: 3,
      conditional: true, // Only show if hasWht
    },
  ],
  INCOME: [
    { 
      id: "invoice", 
      label: "ใบแจ้งหนี้", 
      docType: "INVOICE" as SubDocType,
      icon: FileText,
      description: "ใบแจ้งหนี้ที่ออก",
      priority: 1,
    },
    { 
      id: "slip", 
      label: "หลักฐานรับเงิน", 
      docType: "SLIP" as SubDocType,
      icon: Receipt,
      description: "สลิป/หลักฐานการรับ",
      priority: 2,
    },
    { 
      id: "whtCert", 
      label: "หนังสือหัก ณ ที่จ่าย", 
      docType: "WHT_CERT_RECEIVED" as SubDocType,
      icon: FileCheck,
      description: "50 ทวิ ที่ได้รับ",
      priority: 3,
      conditional: true,
    },
  ],
};

export function BoxProgressTracker({
  hasSlip,
  hasTaxInvoice,
  hasReceipt,
  hasWhtCert,
  hasWht,
  totalAmount,
  transactionType,
  onAddDocument,
}: BoxProgressTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const steps = DOC_STEPS[transactionType].filter(
    (step) => !step.conditional || hasWht
  );

  // Determine completion status for each step
  const getStepStatus = (stepId: string): "completed" | "pending" | "missing" => {
    switch (stepId) {
      case "slip":
        return hasSlip ? "completed" : "missing";
      case "taxInvoice":
        return hasTaxInvoice ? "completed" : totalAmount === 0 ? "missing" : "pending";
      case "receipt":
        return hasReceipt ? "completed" : "pending";
      case "invoice":
        return hasTaxInvoice ? "completed" : "pending"; // Using hasTaxInvoice for invoice slot too
      case "whtCert":
        return hasWhtCert ? "completed" : "pending";
      default:
        return "pending";
    }
  };

  // Calculate progress
  const completedSteps = steps.filter(
    (step) => getStepStatus(step.id) === "completed"
  ).length;
  const progressPercent = (completedSteps / steps.length) * 100;
  const isComplete = completedSteps === steps.length;

  // Get missing documents
  const missingDocs = steps.filter(
    (step) => getStepStatus(step.id) !== "completed"
  );

  // Get warning message
  const getWarningMessage = () => {
    if (hasSlip && !hasTaxInvoice && transactionType === "EXPENSE") {
      return {
        type: "warning",
        message: "มีสลิปแล้ว แต่ยังไม่มีใบกำกับภาษี",
        detail: totalAmount === 0 
          ? "ยอดเงินและ VAT จะรู้เมื่อได้ใบกำกับ" 
          : "เพิ่มใบกำกับเพื่อยืนยันยอดและ VAT",
      };
    }
    if (hasWht && !hasWhtCert) {
      return {
        type: "warning",
        message: transactionType === "EXPENSE" 
          ? "รอส่งหนังสือหัก ณ ที่จ่าย" 
          : "รอรับหนังสือหัก ณ ที่จ่าย",
        detail: "อัปโหลดเมื่อได้รับ/ส่ง 50 ทวิ",
      };
    }
    return null;
  };

  const warning = getWarningMessage();

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
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
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">
              {isComplete ? "เอกสารครบแล้ว" : "เอกสารยังไม่ครบ"}
            </h3>
            <p className="text-sm text-gray-500">
              {completedSteps}/{steps.length} รายการ • {Math.round(progressPercent)}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Progress value={progressPercent} className="w-24 h-2" />
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-4">
          {/* Warning Banner */}
          {warning && (
            <div className={cn(
              "rounded-lg p-3 flex items-start gap-3",
              warning.type === "warning" ? "bg-amber-50 border border-amber-200" : "bg-blue-50 border border-blue-200"
            )}>
              <AlertCircle className={cn(
                "h-5 w-5 shrink-0",
                warning.type === "warning" ? "text-amber-500" : "text-blue-500"
              )} />
              <div>
                <p className={cn(
                  "text-sm font-medium",
                  warning.type === "warning" ? "text-amber-800" : "text-blue-800"
                )}>
                  {warning.message}
                </p>
                <p className={cn(
                  "text-xs mt-0.5",
                  warning.type === "warning" ? "text-amber-600" : "text-blue-600"
                )}>
                  {warning.detail}
                </p>
              </div>
            </div>
          )}

          {/* Steps List */}
          <div className="space-y-2">
            {steps.map((step) => {
              const status = getStepStatus(step.id);
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all",
                    status === "completed"
                      ? "bg-green-50/50 border-green-200"
                      : status === "missing"
                      ? "bg-amber-50/50 border-amber-200"
                      : "bg-gray-50 border-gray-200"
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      status === "completed"
                        ? "bg-green-100"
                        : status === "missing"
                        ? "bg-amber-100"
                        : "bg-gray-100"
                    )}
                  >
                    {status === "completed" ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          status === "missing" ? "text-amber-600" : "text-gray-400"
                        )}
                      />
                    )}
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "font-medium text-sm",
                        status === "completed"
                          ? "text-green-700"
                          : status === "missing"
                          ? "text-amber-700"
                          : "text-gray-600"
                      )}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>

                  {/* Status / Action */}
                  {status === "completed" ? (
                    <span className="text-xs text-green-600 font-medium">มีแล้ว</span>
                  ) : onAddDocument ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onAddDocument(step.docType)}
                      className={cn(
                        status === "missing"
                          ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                          : ""
                      )}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      เพิ่ม
                    </Button>
                  ) : (
                    <span className={cn(
                      "text-xs font-medium",
                      status === "missing" ? "text-amber-600" : "text-gray-400"
                    )}>
                      {status === "missing" ? "ยังไม่มี" : "รอ"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Upload CTA */}
          {!isComplete && onAddDocument && (
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed"
              onClick={() => {
                const firstMissing = missingDocs[0];
                if (firstMissing) {
                  onAddDocument(firstMissing.docType);
                }
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              อัปโหลด{missingDocs[0]?.label || "เอกสาร"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
