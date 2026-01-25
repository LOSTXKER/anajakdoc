"use client";

import { useMemo } from "react";
import { 
  Check, 
  Circle, 
  FileText, 
  CreditCard, 
  Send, 
  Eye, 
  BookOpen,
  Receipt,
  FileCheck,
  AlertCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SerializedBox, BoxType, ExpenseType } from "@/types";

// ==================== Types ====================

type StepStatus = "completed" | "current" | "pending" | "warning";

interface ProcessStep {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: StepStatus;
}

interface ProcessBarProps {
  box: SerializedBox;
  className?: string;
}

// ==================== Step Definitions ====================

function getStepsForBox(box: SerializedBox): ProcessStep[] {
  const { boxType, expenseType, status, hasVat, hasWht, vatDocStatus, whtDocStatus, paymentStatus } = box;
  
  const steps: ProcessStep[] = [];
  
  // Check statuses
  const isDraft = status === "DRAFT";
  const isPending = status === "PENDING";
  const isNeedDocs = status === "NEED_DOCS";
  const isCompleted = status === "COMPLETED";
  const isSubmitted = !isDraft;
  
  // Document checks
  const hasDocuments = (box.documents?.length ?? 0) > 0;
  const isPaid = paymentStatus === "PAID" || paymentStatus === "OVERPAID";
  const vatReceived = vatDocStatus === "RECEIVED";
  const whtReceived = whtDocStatus === "RECEIVED";
  const whtSent = whtDocStatus === "REQUEST_SENT";
  
  // === EXPENSE Flow ===
  if (boxType === "EXPENSE") {
    // Step 1: สร้างกล่อง (always completed if box exists)
    steps.push({
      id: "create",
      label: "สร้างกล่อง",
      shortLabel: "สร้าง",
      description: "ระบุข้อมูลรายจ่าย",
      icon: FileText,
      status: "completed",
    });
    
    // Step 2: เตรียมเอกสาร
    steps.push({
      id: "prepare",
      label: "เตรียมเอกสาร",
      shortLabel: "เอกสาร",
      description: hasDocuments ? "อัปโหลดเอกสารแล้ว" : "อัปโหลดใบกำกับ/สลิป",
      icon: FileCheck,
      status: hasDocuments ? "completed" : isDraft ? "current" : "completed",
    });
    
    // Step 3: ชำระเงิน (optional based on payment mode)
    steps.push({
      id: "payment",
      label: "ชำระเงิน",
      shortLabel: "จ่าย",
      description: isPaid ? "ชำระแล้ว" : "บันทึกการชำระเงิน",
      icon: CreditCard,
      status: isPaid ? "completed" : isDraft ? "current" : "pending",
    });
    
    // Step 4: VAT (if hasVat)
    if (hasVat) {
      steps.push({
        id: "vat",
        label: "ใบกำกับภาษี",
        shortLabel: "VAT",
        description: vatReceived ? "ได้รับแล้ว" : "รอรับใบกำกับภาษี",
        icon: Receipt,
        status: vatReceived ? "completed" : isSubmitted ? "warning" : "pending",
      });
    }
    
    // Step 5: WHT (if hasWht)
    if (hasWht) {
      let whtStatus: StepStatus = "pending";
      let whtDesc = "ออกและส่งหนังสือหัก ณ ที่จ่าย";
      
      if (whtReceived) {
        whtStatus = "completed";
        whtDesc = "ได้รับหนังสือรับรองแล้ว";
      } else if (whtSent) {
        whtStatus = "current";
        whtDesc = "ส่งคำขอแล้ว รอรับ";
      } else if (isSubmitted) {
        whtStatus = "warning";
        whtDesc = "ยังไม่ได้ส่งคำขอ";
      }
      
      steps.push({
        id: "wht",
        label: "หัก ณ ที่จ่าย",
        shortLabel: "WHT",
        description: whtDesc,
        icon: AlertCircle,
        status: whtStatus,
      });
    }
    
    // Step 6: ส่งบัญชี
    steps.push({
      id: "submit",
      label: "ส่งบัญชี",
      shortLabel: "ส่ง",
      description: isSubmitted ? "ส่งแล้ว" : "ส่งให้บัญชีตรวจสอบ",
      icon: Send,
      status: isSubmitted ? "completed" : "pending",
    });
    
    // Step 7: ตรวจสอบ
    steps.push({
      id: "review",
      label: "ตรวจสอบ",
      shortLabel: "ตรวจ",
      description: isNeedDocs ? "ขาดเอกสาร - กรุณาเพิ่ม" : isPending ? "บัญชีกำลังตรวจสอบ" : isCompleted ? "ตรวจสอบแล้ว" : "รอบัญชีตรวจสอบ",
      icon: Eye,
      status: isCompleted ? "completed" : isNeedDocs ? "warning" : isPending ? "current" : "pending",
    });
    
    // Step 8: เสร็จสิ้น
    steps.push({
      id: "complete",
      label: "เสร็จสิ้น",
      shortLabel: "เสร็จ",
      description: isCompleted ? "ลงบัญชีเรียบร้อย" : "รอลงบัญชี",
      icon: BookOpen,
      status: isCompleted ? "completed" : "pending",
    });
  }
  
  // === INCOME Flow ===
  else if (boxType === "INCOME") {
    // Step 1: สร้างกล่อง
    steps.push({
      id: "create",
      label: "สร้างกล่อง",
      shortLabel: "สร้าง",
      description: "ระบุข้อมูลรายรับ",
      icon: FileText,
      status: "completed",
    });
    
    // Step 2: ออกใบแจ้งหนี้
    steps.push({
      id: "invoice",
      label: "ออกใบแจ้งหนี้",
      shortLabel: "Invoice",
      description: hasDocuments ? "ออกแล้ว" : "ออก Invoice ให้ลูกค้า",
      icon: FileCheck,
      status: hasDocuments ? "completed" : isDraft ? "current" : "completed",
    });
    
    // Step 3: VAT (if hasVat)
    if (hasVat) {
      steps.push({
        id: "vat",
        label: "ออกใบกำกับภาษี",
        shortLabel: "VAT",
        description: vatReceived ? "ออกแล้ว" : "ออกใบกำกับภาษี",
        icon: Receipt,
        status: vatReceived ? "completed" : isSubmitted ? "current" : "pending",
      });
    }
    
    // Step 4: รับเงิน
    steps.push({
      id: "receive",
      label: "รับเงิน",
      shortLabel: "รับเงิน",
      description: isPaid ? "รับเงินแล้ว" : "ยืนยันการรับเงิน",
      icon: CreditCard,
      status: isPaid ? "completed" : isDraft ? "current" : "pending",
    });
    
    // Step 5: WHT (if hasWht - receive WHT from customer)
    if (hasWht) {
      steps.push({
        id: "wht",
        label: "รับ WHT",
        shortLabel: "WHT",
        description: whtReceived ? "ได้รับแล้ว" : "รอรับหนังสือหัก ณ ที่จ่าย",
        icon: AlertCircle,
        status: whtReceived ? "completed" : isSubmitted ? "warning" : "pending",
      });
    }
    
    // Step 6: ส่งบัญชี
    steps.push({
      id: "submit",
      label: "ส่งบัญชี",
      shortLabel: "ส่ง",
      description: isSubmitted ? "ส่งแล้ว" : "ส่งให้บัญชีตรวจสอบ",
      icon: Send,
      status: isSubmitted ? "completed" : "pending",
    });
    
    // Step 7: ตรวจสอบ
    steps.push({
      id: "review",
      label: "ตรวจสอบ",
      shortLabel: "ตรวจ",
      description: isNeedDocs ? "ขาดเอกสาร" : isPending ? "กำลังตรวจสอบ" : isCompleted ? "ตรวจสอบแล้ว" : "รอตรวจสอบ",
      icon: Eye,
      status: isCompleted ? "completed" : isNeedDocs ? "warning" : isPending ? "current" : "pending",
    });
    
    // Step 8: เสร็จสิ้น
    steps.push({
      id: "complete",
      label: "เสร็จสิ้น",
      shortLabel: "เสร็จ",
      description: isCompleted ? "ลงบัญชีเรียบร้อย" : "รอลงบัญชี",
      icon: BookOpen,
      status: isCompleted ? "completed" : "pending",
    });
  }
  
  // === ADJUSTMENT Flow ===
  else {
    steps.push({
      id: "create",
      label: "สร้างรายการ",
      shortLabel: "สร้าง",
      description: "ระบุรายการปรับปรุง",
      icon: FileText,
      status: "completed",
    });
    
    steps.push({
      id: "document",
      label: "เอกสารประกอบ",
      shortLabel: "เอกสาร",
      description: hasDocuments ? "แนบแล้ว" : "แนบ CN/DN หรือหลักฐาน",
      icon: FileCheck,
      status: hasDocuments ? "completed" : isDraft ? "current" : "completed",
    });
    
    steps.push({
      id: "submit",
      label: "ส่งบัญชี",
      shortLabel: "ส่ง",
      description: isSubmitted ? "ส่งแล้ว" : "ส่งให้บัญชีตรวจสอบ",
      icon: Send,
      status: isSubmitted ? "completed" : "pending",
    });
    
    steps.push({
      id: "review",
      label: "ตรวจสอบ",
      shortLabel: "ตรวจ",
      description: isCompleted ? "ตรวจสอบแล้ว" : isPending ? "กำลังตรวจสอบ" : "รอตรวจสอบ",
      icon: Eye,
      status: isCompleted ? "completed" : isPending ? "current" : "pending",
    });
    
    steps.push({
      id: "complete",
      label: "เสร็จสิ้น",
      shortLabel: "เสร็จ",
      description: isCompleted ? "ลงบัญชีเรียบร้อย" : "รอลงบัญชี",
      icon: BookOpen,
      status: isCompleted ? "completed" : "pending",
    });
  }
  
  return steps;
}

// ==================== Main Component ====================

export function ProcessBar({ box, className }: ProcessBarProps) {
  const steps = useMemo(() => getStepsForBox(box), [box]);
  
  // Calculate progress
  const completedCount = steps.filter(s => s.status === "completed").length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  
  return (
    <TooltipProvider>
      <div className={cn("rounded-xl border bg-card p-4", className)}>
        {/* Header with progress */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">ความคืบหน้า</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {progressPercent}%
            </span>
          </div>
        </div>
        
        {/* Steps - Horizontal scrollable on mobile */}
        <div className="relative">
          {/* Connector line */}
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-muted hidden sm:block" />
          
          {/* Steps container */}
          <div className="flex overflow-x-auto pb-2 sm:pb-0 gap-1 sm:gap-0 sm:justify-between scrollbar-hide">
            {steps.map((step, index) => (
              <Tooltip key={step.id}>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center min-w-[60px] sm:min-w-0 relative">
                    {/* Step icon */}
                    <StepIcon status={step.status} Icon={step.icon} />
                    
                    {/* Label */}
                    <span 
                      className={cn(
                        "mt-2 text-xs text-center leading-tight",
                        step.status === "completed" && "text-primary font-medium",
                        step.status === "current" && "text-foreground font-medium",
                        step.status === "warning" && "text-orange-600 font-medium",
                        step.status === "pending" && "text-muted-foreground"
                      )}
                    >
                      <span className="hidden sm:inline">{step.label}</span>
                      <span className="sm:hidden">{step.shortLabel}</span>
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
        
        {/* Current step hint */}
        {steps.some(s => s.status === "current") && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5 animate-pulse" />
              <div>
                <p className="text-sm font-medium">
                  ขั้นตอนปัจจุบัน: {steps.find(s => s.status === "current")?.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {steps.find(s => s.status === "current")?.description}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Warning hint */}
        {steps.some(s => s.status === "warning") && (
          <div className="mt-3 p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
                  รายการที่ต้องติดตาม
                </p>
                <ul className="text-xs text-orange-600 dark:text-orange-500 mt-1 space-y-0.5">
                  {steps.filter(s => s.status === "warning").map(s => (
                    <li key={s.id}>• {s.label}: {s.description}</li>
                  ))}
                </ul>
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
      <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center shrink-0 relative z-10">
        <Icon className="h-4 w-4 text-primary" />
        <span className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-30" />
      </div>
    );
  }
  
  if (status === "warning") {
    return (
      <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-400 flex items-center justify-center shrink-0 z-10">
        <Icon className="h-4 w-4 text-orange-600" />
      </div>
    );
  }
  
  // Pending
  return (
    <div className="w-10 h-10 rounded-full bg-muted border-2 border-muted-foreground/20 flex items-center justify-center shrink-0 z-10">
      <Circle className="h-4 w-4 text-muted-foreground/50" />
    </div>
  );
}
