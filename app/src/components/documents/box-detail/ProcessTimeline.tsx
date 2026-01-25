"use client";

import { useMemo } from "react";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getProcessSteps,
  calculateProcessStatus,
  type ProcessContext,
  type ProcessStepStatus,
} from "@/lib/config/process-config";
import { getBoxChecklist, type ChecklistItem } from "@/lib/checklist";
import type { SerializedBox, DocType } from "@/types";

interface ProcessTimelineProps {
  box: SerializedBox;
  className?: string;
}

export function ProcessTimeline({ box, className }: ProcessTimelineProps) {
  // Build process context from box data
  const context = useMemo<ProcessContext>(() => {
    const uploadedDocTypes = new Set<DocType>(
      box.documents?.map((doc) => doc.docType) || []
    );

    // Get checklist items
    const checklistItems: ChecklistItem[] = getBoxChecklist(
      box.boxType,
      box.expenseType,
      box.hasVat ?? true,
      box.hasWht ?? false,
      {
        isPaid: box.paymentStatus === "PAID" || box.paymentStatus === "OVERPAID",
        hasPaymentProof: uploadedDocTypes.has("SLIP_TRANSFER") || uploadedDocTypes.has("SLIP_CHEQUE"),
        hasTaxInvoice: uploadedDocTypes.has("TAX_INVOICE") || uploadedDocTypes.has("TAX_INVOICE_ABB"),
        hasInvoice: uploadedDocTypes.has("INVOICE"),
        whtIssued: uploadedDocTypes.has("WHT_SENT"),
        whtSent: box.whtSent ?? false,
        whtReceived: uploadedDocTypes.has("WHT_INCOMING") || uploadedDocTypes.has("WHT_RECEIVED"),
      },
      uploadedDocTypes,
      box.noReceiptReason
    );

    return {
      boxStatus: box.status,
      docStatus: box.docStatus,
      paymentStatus: box.paymentStatus,
      hasVat: box.hasVat ?? true,
      hasWht: box.hasWht ?? false,
      whtSent: box.whtSent ?? false,
      expenseType: box.expenseType,
      uploadedDocTypes,
      checklistItems,
      isPaid: box.paymentStatus === "PAID" || box.paymentStatus === "OVERPAID",
      hasTaxInvoice: uploadedDocTypes.has("TAX_INVOICE") || uploadedDocTypes.has("TAX_INVOICE_ABB"),
      whtIssued: uploadedDocTypes.has("WHT_SENT"),
      submittedAt: box.submittedAt,
      bookedAt: box.bookedAt,
      archivedAt: box.archivedAt,
    };
  }, [box]);

  // Get steps and calculate their status
  const steps = useMemo(() => {
    return getProcessSteps(box.boxType, box.expenseType);
  }, [box.boxType, box.expenseType]);

  const processStatus = useMemo(() => {
    return calculateProcessStatus(steps, context);
  }, [steps, context]);

  // Filter out skipped steps for display
  const visibleSteps = processStatus.filter((s) => s.status !== "skipped");

  if (visibleSteps.length === 0) {
    return null;
  }

  return (
    <div className={cn("rounded-2xl border bg-card p-4 sm:p-5", className)}>
      {/* Steps Timeline - Horizontal on desktop, vertical on mobile */}
      <div className="hidden sm:block">
        <HorizontalTimeline steps={visibleSteps} />
      </div>
      <div className="sm:hidden">
        <VerticalTimeline steps={visibleSteps} />
      </div>
    </div>
  );
}

// ==================== Horizontal Timeline (Desktop) ====================

interface TimelineProps {
  steps: { step: { id: string; label: string; description: string; icon: React.ComponentType<{ className?: string }> }; status: ProcessStepStatus }[];
}

function HorizontalTimeline({ steps }: TimelineProps) {
  return (
    <div className="relative px-6">
      {/* Connector Line - connects between first and last icon centers */}
      <div className="absolute top-5 left-10 right-10 h-0.5 bg-muted" />
      
      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map(({ step, status }) => (
          <div
            key={step.id}
            className="flex flex-col items-center text-center"
          >
            {/* Step Icon */}
            <StepIcon status={status} Icon={step.icon} />
            
            {/* Label */}
            <div className="mt-3 max-w-[80px]">
              <p
                className={cn(
                  "text-xs font-medium leading-tight",
                  status === "completed" && "text-primary",
                  status === "current" && "text-foreground",
                  status === "pending" && "text-muted-foreground"
                )}
              >
                {step.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== Vertical Timeline (Mobile) ====================

function VerticalTimeline({ steps }: TimelineProps) {
  return (
    <div className="relative pl-8">
      {/* Connector Line */}
      <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-muted" />
      
      {/* Steps */}
      <div className="space-y-4">
        {steps.map(({ step, status }) => (
          <div key={step.id} className="relative flex items-start gap-3">
            {/* Step Icon - positioned on the line */}
            <div className="absolute -left-8">
              <StepIcon status={status} Icon={step.icon} size="sm" />
            </div>
            
            {/* Content */}
            <div className="pt-0.5">
              <p
                className={cn(
                  "text-sm font-medium",
                  status === "completed" && "text-primary",
                  status === "current" && "text-foreground",
                  status === "pending" && "text-muted-foreground"
                )}
              >
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== Step Icon Component ====================

interface StepIconProps {
  status: ProcessStepStatus;
  Icon: React.ComponentType<{ className?: string }>;
  size?: "sm" | "md";
}

function StepIcon({ status, Icon, size = "md" }: StepIconProps) {
  const sizeClasses = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  if (status === "completed") {
    return (
      <div
        className={cn(
          sizeClasses,
          "rounded-full bg-primary flex items-center justify-center shrink-0"
        )}
      >
        <Check className={cn(iconSize, "text-primary-foreground")} />
      </div>
    );
  }

  if (status === "current") {
    return (
      <div
        className={cn(
          sizeClasses,
          "rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center shrink-0 relative"
        )}
      >
        <Icon className={cn(iconSize, "text-primary")} />
        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-30" />
      </div>
    );
  }

  // Pending
  return (
    <div
      className={cn(
        sizeClasses,
        "rounded-full bg-muted border-2 border-muted-foreground/20 flex items-center justify-center shrink-0"
      )}
    >
      <Circle className={cn(iconSize, "text-muted-foreground/50")} />
    </div>
  );
}
