"use client";

import { Check, CreditCard, CalendarClock, Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PaymentModeSelectorProps {
  isMultiPayment: boolean;
  onChange: (isMultiPayment: boolean) => void;
}

export function PaymentModeSelector({ isMultiPayment, onChange }: PaymentModeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">รูปแบบการชำระ</Label>
      <div className="grid grid-cols-2 gap-2">
        {/* Single payment */}
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            "relative flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
            "hover:border-primary/50 hover:bg-primary/5",
            !isMultiPayment
              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
              : "border bg-card"
          )}
        >
          {!isMultiPayment && (
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Check className="h-3 w-3 text-white" />
            </div>
          )}
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
            !isMultiPayment ? "bg-primary/10" : "bg-emerald-100 dark:bg-emerald-900"
          )}>
            <CreditCard className={cn(
              "h-5 w-5",
              !isMultiPayment ? "text-primary" : "text-emerald-600"
            )} />
          </div>
          <div className="min-w-0 pr-4">
            <span className={cn(
              "block font-medium text-sm",
              !isMultiPayment ? "text-primary" : "text-foreground"
            )}>
              จ่ายครั้งเดียว
            </span>
            <span className="block text-xs text-muted-foreground">
              จบในครั้งเดียว
            </span>
          </div>
        </button>

        {/* Multi payment */}
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            "relative flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
            "hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950",
            isMultiPayment
              ? "border-amber-500 bg-amber-50 dark:bg-amber-950 ring-2 ring-amber-200 dark:ring-amber-800"
              : "border bg-card"
          )}
        >
          {isMultiPayment && (
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
              <Check className="h-3 w-3 text-white" />
            </div>
          )}
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
            "bg-amber-100 dark:bg-amber-900"
          )}>
            <CalendarClock className="h-5 w-5 text-amber-600" />
          </div>
          <div className="min-w-0 pr-4">
            <span className={cn(
              "block font-medium text-sm",
              isMultiPayment ? "text-amber-700 dark:text-amber-400" : "text-foreground"
            )}>
              แบ่งจ่ายหลายงวด
            </span>
            <span className="block text-xs text-muted-foreground">
              บัญชีติดตามยอดค้าง
            </span>
          </div>
        </button>
      </div>
      
      {/* Info note for multi-payment */}
      {isMultiPayment && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
          <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            กรุณากรอก<strong>ยอดรวมทั้งหมด</strong>ของรายการนี้ (ไม่ใช่ยอดงวดแรก) 
            เพื่อให้บัญชีติดตามยอดค้างชำระได้ถูกต้อง
          </p>
        </div>
      )}
    </div>
  );
}
