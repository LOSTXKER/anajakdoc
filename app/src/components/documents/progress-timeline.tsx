"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface TimelineStep {
  id: string;
  label: string;
  completed: boolean;
  current?: boolean;
}

interface ProgressTimelineProps {
  steps: TimelineStep[];
  completionPercent: number;
}

export function ProgressTimeline({ steps, completionPercent }: ProgressTimelineProps) {
  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-500",
              completionPercent === 100 ? "bg-green-500" : 
              completionPercent >= 50 ? "bg-yellow-500" : "bg-orange-500"
            )}
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        <span className={cn(
          "text-sm font-semibold min-w-[3rem] text-right",
          completionPercent === 100 ? "text-green-600" : 
          completionPercent >= 50 ? "text-yellow-600" : "text-orange-600"
        )}>
          {completionPercent}%
        </span>
      </div>

      {/* Timeline Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                  step.completed
                    ? "bg-green-500 text-white"
                    : step.current
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step.completed ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] mt-1 max-w-[60px] text-center leading-tight",
                  step.completed
                    ? "text-green-600 font-medium"
                    : step.current
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 min-w-[20px] mx-1 mt-[-16px]",
                  step.completed ? "bg-green-500" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Get timeline steps for EXPENSE
export function getExpenseTimelineSteps(
  isPaid: boolean,
  hasPaymentProof: boolean,
  hasTaxInvoice: boolean,
  hasVat: boolean,
  hasWht: boolean,
  whtIssued: boolean,
  whtSent: boolean
): TimelineStep[] {
  const steps: TimelineStep[] = [
    { id: "created", label: "สร้างกล่อง", completed: true },
    { id: "paid", label: "จ่ายเงิน", completed: isPaid },
    { id: "proof", label: "มีสลิป", completed: hasPaymentProof },
  ];

  if (hasVat) {
    steps.push({ id: "tax_invoice", label: "รับใบกำกับ", completed: hasTaxInvoice });
  }

  if (hasWht) {
    steps.push({ id: "wht_issued", label: "ออก WHT", completed: whtIssued });
    steps.push({ id: "wht_sent", label: "ส่ง WHT", completed: whtSent });
  }

  // Mark current step
  for (let i = 0; i < steps.length; i++) {
    if (!steps[i].completed) {
      steps[i].current = true;
      break;
    }
  }

  return steps;
}

// Get timeline steps for INCOME
export function getIncomeTimelineSteps(
  hasInvoice: boolean,
  hasTaxInvoice: boolean,
  hasVat: boolean,
  isPaid: boolean,
  hasWht: boolean,
  whtReceived: boolean
): TimelineStep[] {
  const steps: TimelineStep[] = [
    { id: "created", label: "สร้างกล่อง", completed: true },
    { id: "invoice", label: "ออกบิล", completed: hasInvoice },
  ];

  if (hasVat) {
    steps.push({ id: "tax_invoice", label: "ออกใบกำกับ", completed: hasTaxInvoice });
  }

  steps.push({ id: "paid", label: "รับเงิน", completed: isPaid });

  if (hasWht) {
    steps.push({ id: "wht_received", label: "รับ WHT", completed: whtReceived });
  }

  // Mark current step
  for (let i = 0; i < steps.length; i++) {
    if (!steps[i].completed) {
      steps[i].current = true;
      break;
    }
  }

  return steps;
}
