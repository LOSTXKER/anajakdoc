"use client";

import { useMemo } from "react";
import { Check, Circle, FileText, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getProcessSteps,
  calculateProcessStatus,
  calculateProgress,
  type ProcessContext,
  type ProcessStepStatus,
} from "@/lib/config/process-config";
import { getBoxChecklist, type ChecklistItem } from "@/lib/checklist";
import type { SerializedBox, DocType } from "@/types";

interface ProcessTimelineProps {
  box: SerializedBox;
  className?: string;
  showProgress?: boolean;
}

export function ProcessTimeline({ box, className, showProgress = true }: ProcessTimelineProps) {
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

  // Get steps with VAT/WHT awareness
  const steps = useMemo(() => {
    return getProcessSteps(
      box.boxType, 
      box.expenseType,
      box.hasVat ?? false,
      box.hasWht ?? false
    );
  }, [box.boxType, box.expenseType, box.hasVat, box.hasWht]);

  const processStatus = useMemo(() => {
    return calculateProcessStatus(steps, context);
  }, [steps, context]);

  // Calculate progress percentage
  const progressPercent = useMemo(() => {
    return calculateProgress(steps, context);
  }, [steps, context]);

  // Filter out skipped steps for display
  const visibleSteps = processStatus.filter((s) => s.status !== "skipped");

  if (visibleSteps.length === 0) {
    return null;
  }

  // Count completed steps
  const completedCount = visibleSteps.filter(s => s.status === "completed").length;
  const totalCount = visibleSteps.length;

  return (
    <div className={cn("rounded-2xl border bg-card p-4 sm:p-5", className)}>
      {/* Header with Progress */}
      {showProgress && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">ความคืบหน้า</span>
              {/* VAT/WHT indicators */}
              {box.hasVat && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  <FileText className="h-3 w-3" />
                  VAT
                </span>
              )}
              {box.hasWht && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                  <Receipt className="h-3 w-3" />
                  WHT
                </span>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {completedCount}/{totalCount} ({progressPercent}%)
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      )}
      
      {/* Steps Timeline - Horizontal on desktop, vertical on mobile */}
      <TooltipProvider>
        <div className="hidden sm:block">
          <HorizontalTimeline steps={visibleSteps} />
        </div>
        <div className="sm:hidden">
          <VerticalTimeline steps={visibleSteps} />
        </div>
      </TooltipProvider>
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
      
      {/* Completed progress line overlay */}
      {steps.length > 1 && (
        <div 
          className="absolute top-5 left-10 h-0.5 bg-primary transition-all duration-500"
          style={{
            width: `calc(${(steps.filter(s => s.status === "completed").length / (steps.length - 1)) * 100}% - 40px)`,
            maxWidth: "calc(100% - 80px)"
          }}
        />
      )}
      
      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map(({ step, status }, index) => (
          <Tooltip key={step.id}>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center text-center cursor-help">
                {/* Step Icon */}
                <StepIcon status={status} Icon={step.icon} stepNumber={index + 1} />
                
                {/* Label */}
                <div className="mt-3 max-w-[90px]">
                  <p
                    className={cn(
                      "text-xs font-medium leading-tight",
                      status === "completed" && "text-primary",
                      status === "current" && "text-foreground font-semibold",
                      status === "pending" && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="font-medium">{step.label}</p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
              <p className="text-xs mt-1">
                {status === "completed" && "✓ เสร็จแล้ว"}
                {status === "current" && "→ กำลังดำเนินการ"}
                {status === "pending" && "○ รอดำเนินการ"}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

// ==================== Vertical Timeline (Mobile) ====================

function VerticalTimeline({ steps }: TimelineProps) {
  const completedCount = steps.filter(s => s.status === "completed").length;
  
  return (
    <div className="relative pl-8">
      {/* Connector Line */}
      <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-muted" />
      
      {/* Completed progress line overlay */}
      {steps.length > 1 && (
        <div 
          className="absolute left-[15px] top-0 w-0.5 bg-primary transition-all duration-500"
          style={{
            height: `calc(${(completedCount / steps.length) * 100}%)`
          }}
        />
      )}
      
      {/* Steps */}
      <div className="space-y-4">
        {steps.map(({ step, status }, index) => (
          <div key={step.id} className="relative flex items-start gap-3">
            {/* Step Icon - positioned on the line */}
            <div className="absolute -left-8">
              <StepIcon status={status} Icon={step.icon} size="sm" stepNumber={index + 1} />
            </div>
            
            {/* Content */}
            <div className="pt-0.5">
              <p
                className={cn(
                  "text-sm font-medium",
                  status === "completed" && "text-primary",
                  status === "current" && "text-foreground font-semibold",
                  status === "pending" && "text-muted-foreground"
                )}
              >
                {step.label}
                {status === "current" && (
                  <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    กำลังดำเนินการ
                  </span>
                )}
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
  stepNumber?: number;
}

function StepIcon({ status, Icon, size = "md", stepNumber }: StepIconProps) {
  const sizeClasses = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  if (status === "completed") {
    return (
      <div
        className={cn(
          sizeClasses,
          "rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm"
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
          "rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center shrink-0 relative shadow-sm"
        )}
      >
        <Icon className={cn(iconSize, "text-primary")} />
        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-30" />
      </div>
    );
  }

  // Pending - show step number or circle
  return (
    <div
      className={cn(
        sizeClasses,
        "rounded-full bg-muted border-2 border-muted-foreground/20 flex items-center justify-center shrink-0"
      )}
    >
      {stepNumber ? (
        <span className="text-xs font-medium text-muted-foreground">{stepNumber}</span>
      ) : (
        <Circle className={cn(iconSize, "text-muted-foreground/50")} />
      )}
    </div>
  );
}
