"use client";

import { 
  Upload, 
  FileCheck, 
  FileText, 
  CheckCircle2, 
  Receipt,
  Check,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExpenseType, DocType } from "@/types";

interface ProgressStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: "done" | "current" | "pending";
}

interface FullWidthProgressProps {
  expenseType: ExpenseType | null;
  hasWht: boolean;
  uploadedDocTypes: Set<DocType>;
  isPaid: boolean;
  whtSent: boolean;
}

export function FullWidthProgress({
  expenseType,
  hasWht,
  uploadedDocTypes,
  isPaid,
  whtSent,
}: FullWidthProgressProps) {
  // Check document statuses
  const hasSlip = uploadedDocTypes.has("SLIP_TRANSFER") || uploadedDocTypes.has("SLIP_CHEQUE");
  const hasTaxInvoice = uploadedDocTypes.has("TAX_INVOICE") || uploadedDocTypes.has("TAX_INVOICE_ABB");
  const hasCashReceipt = uploadedDocTypes.has("CASH_RECEIPT") || uploadedDocTypes.has("RECEIPT");
  const hasWhtDoc = uploadedDocTypes.has("WHT_SENT");

  // Build steps based on expense type
  const steps: ProgressStep[] = [];

  // Step 1: Upload (always first)
  const hasAnyDoc = uploadedDocTypes.size > 0;
  steps.push({
    id: "upload",
    label: "อัปโหลดเอกสาร",
    icon: <Upload className="h-4 w-4" />,
    status: hasAnyDoc ? "done" : "current",
  });

  // Step 2: Depends on expense type
  if (expenseType === "STANDARD") {
    steps.push({
      id: "tax_invoice",
      label: "ใบกำกับภาษี",
      icon: <FileCheck className="h-4 w-4" />,
      status: hasTaxInvoice ? "done" : hasAnyDoc ? "current" : "pending",
    });
  } else if (expenseType === "NO_VAT") {
    steps.push({
      id: "cash_receipt",
      label: "บิลเงินสด",
      icon: <Receipt className="h-4 w-4" />,
      status: hasCashReceipt ? "done" : hasAnyDoc ? "current" : "pending",
    });
  }

  // Step 3: Payment
  steps.push({
    id: "payment",
    label: "ชำระเงิน",
    icon: <CreditCard className="h-4 w-4" />,
    status: isPaid ? "done" : (hasTaxInvoice || hasCashReceipt || hasSlip) ? "current" : "pending",
  });

  // Step 4: WHT (only if hasWht)
  if (hasWht) {
    steps.push({
      id: "wht",
      label: "ส่ง WHT",
      icon: <FileText className="h-4 w-4" />,
      status: whtSent ? "done" : hasWhtDoc ? "current" : "pending",
    });
  }

  // Step 5: Complete
  const isAllComplete = steps.every(s => s.status === "done");
  steps.push({
    id: "complete",
    label: "เสร็จสิ้น",
    icon: <CheckCircle2 className="h-4 w-4" />,
    status: isAllComplete ? "done" : "pending",
  });

  // Calculate progress percentage
  const doneCount = steps.filter(s => s.status === "done").length;
  const progressPercent = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="w-full bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        {/* Progress Bar */}
        <div className="relative mb-5">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary via-primary to-teal-400 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            
            return (
              <div 
                key={step.id}
                className="flex items-center flex-1 last:flex-initial"
              >
                <div className="flex items-center gap-2.5">
                  {/* Step Circle */}
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shrink-0",
                    step.status === "done" && "bg-primary text-primary-foreground shadow-md shadow-primary/25",
                    step.status === "current" && "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-lg shadow-primary/30",
                    step.status === "pending" && "bg-muted text-muted-foreground"
                  )}>
                    {step.status === "done" ? (
                      <Check className="h-4 w-4" strokeWidth={3} />
                    ) : (
                      step.icon
                    )}
                  </div>

                  {/* Step Label */}
                  <span className={cn(
                    "text-sm font-medium hidden sm:block whitespace-nowrap",
                    step.status === "done" && "text-primary",
                    step.status === "current" && "text-primary",
                    step.status === "pending" && "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                </div>

                {/* Connector Line */}
                {!isLast && (
                  <div className={cn(
                    "flex-1 h-0.5 mx-4 hidden sm:block transition-colors duration-300",
                    step.status === "done" ? "bg-primary/40" : "bg-muted"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
