"use client";

import { 
  Check, 
  Circle, 
  FileEdit,
  FileCheck,
  Send,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { BoxStatus } from "@prisma/client";

// ==================== Types ====================

type StepStatus = "completed" | "current" | "pending" | "warning";

interface StatusStep {
  id: BoxStatus | "NEED_DOCS_BRANCH";
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: StepStatus;
}

interface ProcessBarProps {
  status: BoxStatus;
  className?: string;
}

// ==================== Status Descriptions ====================

const STATUS_INFO: Record<BoxStatus, { label: string; description: string }> = {
  DRAFT: {
    label: "ร่าง",
    description: "กำลังเตรียมข้อมูลและเอกสาร",
  },
  PREPARING: {
    label: "เตรียมเอกสาร",
    description: "รวบรวมเอกสารให้ครบก่อนส่ง",
  },
  SUBMITTED: {
    label: "ส่งแล้ว",
    description: "ส่งให้บัญชีแล้ว รอตรวจสอบ",
  },
  NEED_DOCS: {
    label: "ต้องเพิ่มเอกสาร",
    description: "บัญชีแจ้งว่าเอกสารไม่ครบ",
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    description: "ตรวจสอบและลงบัญชีเรียบร้อย",
  },
};

// ==================== Main Steps ====================

// Main flow: DRAFT → PREPARING → SUBMITTED → COMPLETED
// NEED_DOCS is a branch/warning state from SUBMITTED

function getStatusSteps(currentStatus: BoxStatus): StatusStep[] {
  const steps: StatusStep[] = [];
  
  // Determine completion state
  const isDraft = currentStatus === "DRAFT";
  const isPreparing = currentStatus === "PREPARING";
  const isSubmitted = currentStatus === "SUBMITTED";
  const isNeedDocs = currentStatus === "NEED_DOCS";
  const isCompleted = currentStatus === "COMPLETED";
  
  // Step 1: ร่าง (DRAFT)
  steps.push({
    id: "DRAFT",
    label: STATUS_INFO.DRAFT.label,
    description: STATUS_INFO.DRAFT.description,
    icon: FileEdit,
    status: isDraft ? "current" : "completed",
  });
  
  // Step 2: เตรียมเอกสาร (PREPARING)
  steps.push({
    id: "PREPARING",
    label: STATUS_INFO.PREPARING.label,
    description: STATUS_INFO.PREPARING.description,
    icon: FileCheck,
    status: isPreparing ? "current" : 
            isDraft ? "pending" : "completed",
  });
  
  // Step 3: ส่งแล้ว (SUBMITTED)
  steps.push({
    id: "SUBMITTED",
    label: STATUS_INFO.SUBMITTED.label,
    description: isNeedDocs ? "ส่งแล้ว แต่เอกสารไม่ครบ" : STATUS_INFO.SUBMITTED.description,
    icon: Send,
    status: isSubmitted ? "current" : 
            isNeedDocs ? "warning" :
            (isDraft || isPreparing) ? "pending" : "completed",
  });
  
  // Step 4: เสร็จสิ้น (COMPLETED)
  steps.push({
    id: "COMPLETED",
    label: STATUS_INFO.COMPLETED.label,
    description: STATUS_INFO.COMPLETED.description,
    icon: CheckCircle2,
    status: isCompleted ? "completed" : "pending",
  });
  
  return steps;
}

// ==================== Main Component ====================

export function ProcessBar({ status, className }: ProcessBarProps) {
  const steps = getStatusSteps(status);
  const isNeedDocs = status === "NEED_DOCS";
  
  // Calculate progress (NEED_DOCS counts as 75% since it's after SUBMITTED)
  const progressMap: Record<BoxStatus, number> = {
    DRAFT: 25,
    PREPARING: 50,
    SUBMITTED: 75,
    NEED_DOCS: 60, // Between PREPARING and SUBMITTED visually
    COMPLETED: 100,
  };
  const progressPercent = progressMap[status];
  
  // Get current status info
  const currentInfo = STATUS_INFO[status];
  
  return (
    <TooltipProvider>
      <div className={cn("rounded-xl border bg-card p-4", className)}>
        {/* Header with status and progress */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isNeedDocs ? (
              <AlertCircle className="h-5 w-5 text-orange-500" />
            ) : status === "COMPLETED" ? (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            ) : (
              <Circle className="h-5 w-5 text-primary" />
            )}
            <div>
              <span className={cn(
                "text-sm font-medium",
                isNeedDocs && "text-orange-600"
              )}>
                {currentInfo.label}
              </span>
              <p className="text-xs text-muted-foreground">
                {currentInfo.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-500",
                  isNeedDocs ? "bg-orange-400" : "bg-primary"
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {progressPercent}%
            </span>
          </div>
        </div>
        
        {/* Steps - 4 main statuses */}
        <div className="relative">
          {/* Background connector line */}
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-muted hidden sm:block" />
          
          {/* Progress connector line */}
          {(() => {
            // Find current step index
            const currentIndex = steps.findIndex(s => s.status === "current" || s.status === "warning");
            const completedIndex = currentIndex === -1 ? steps.length - 1 : currentIndex;
            // Calculate progress width (0%, 33%, 66%, 100% for 4 steps)
            const lineProgress = completedIndex === 0 ? 0 : (completedIndex / (steps.length - 1)) * 100;
            return (
              <div 
                className="absolute top-5 left-5 h-0.5 bg-primary hidden sm:block transition-all duration-500"
                style={{ width: `calc(${lineProgress}% - 20px)` }}
              />
            );
          })()}
          
          {/* Steps container */}
          <div className="flex justify-between">
            {steps.map((step) => (
              <Tooltip key={step.id}>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center relative">
                    {/* Step icon */}
                    <StepIcon status={step.status} Icon={step.icon} />
                    
                    {/* Label */}
                    <span 
                      className={cn(
                        "mt-2 text-xs text-center leading-tight max-w-[80px]",
                        step.status === "completed" && "text-primary font-medium",
                        step.status === "current" && "text-foreground font-medium",
                        step.status === "warning" && "text-orange-600 font-medium",
                        step.status === "pending" && "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <p className="font-medium">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
        
        {/* NEED_DOCS Warning Banner */}
        {isNeedDocs && (
          <div className="mt-4 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
                  ต้องเพิ่มเอกสาร
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-500 mt-0.5">
                  บัญชีแจ้งว่าเอกสารไม่ครบ กรุณาตรวจสอบและเพิ่มเอกสารที่ขาด
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// ==================== Step Icon Component ====================

interface StepIconProps {
  status: StepStatus;
  Icon: React.ComponentType<{ className?: string }>;
}

function StepIcon({ status, Icon }: StepIconProps) {
  if (status === "completed") {
    return (
      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 z-10">
        <Check className="h-5 w-5 text-primary-foreground" />
      </div>
    );
  }
  
  if (status === "current") {
    return (
      <div className="w-10 h-10 rounded-full bg-card border-2 border-primary flex items-center justify-center shrink-0 relative z-10">
        <Icon className="h-4 w-4 text-primary" />
        <span className="absolute -inset-1 rounded-full border-2 border-primary animate-ping opacity-30" />
      </div>
    );
  }
  
  if (status === "warning") {
    return (
      <div className="w-10 h-10 rounded-full bg-card border-2 border-orange-400 flex items-center justify-center shrink-0 z-10">
        <AlertCircle className="h-4 w-4 text-orange-600" />
      </div>
    );
  }
  
  // Pending
  return (
    <div className="w-10 h-10 rounded-full bg-card border-2 border-muted-foreground/20 flex items-center justify-center shrink-0 z-10">
      <Circle className="h-4 w-4 text-muted-foreground/50" />
    </div>
  );
}
