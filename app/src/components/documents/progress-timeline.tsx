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
  const completedCount = steps.filter(s => s.completed).length;
  
  return (
    <div className="space-y-3">
      {/* Simple Progress Info */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          ความคืบหน้า: {completedCount}/{steps.length} ขั้นตอน
        </span>
        <span className="font-medium text-gray-900">{completionPercent}%</span>
      </div>
      
      {/* Progress Bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500 bg-primary"
          style={{ width: `${completionPercent}%` }}
        />
      </div>

      {/* Step Pills */}
      <div className="flex flex-wrap gap-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all",
              step.completed
                ? "bg-primary/10 text-primary"
                : step.current
                ? "bg-gray-100 text-gray-900 ring-1 ring-primary/30"
                : "bg-gray-50 text-gray-400"
            )}
          >
            {step.completed ? (
              <Check className="h-3 w-3" />
            ) : (
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                step.current ? "bg-primary" : "bg-gray-300"
              )} />
            )}
            {step.label}
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
