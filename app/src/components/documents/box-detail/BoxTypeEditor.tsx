"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { 
  FileCheck, 
  Receipt, 
  Check,
  CreditCard,
  CalendarClock,
  Percent,
  Settings2,
  Loader2,
  Save,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ExpenseType } from "@/types";

// WHT rate options
const WHT_RATE_OPTIONS = [
  { value: "1", label: "1% - ค่าโฆษณา" },
  { value: "2", label: "2% - ค่าขนส่ง" },
  { value: "3", label: "3% - ค่าบริการ/จ้างทำของ" },
  { value: "5", label: "5% - ค่าเช่า" },
];

interface BoxTypeEditorProps {
  boxId: string;
  expenseType: ExpenseType | null;
  hasWht: boolean;
  whtRate: number | null;
  isMultiPayment: boolean;
  totalAmount: number;
  canEdit: boolean;
  onSave: (data: {
    expenseType: ExpenseType;
    hasWht: boolean;
    whtRate?: number;
    isMultiPayment: boolean;
    totalAmount: number;
  }) => Promise<void>;
}

export function BoxTypeEditor({
  boxId,
  expenseType: initialExpenseType,
  hasWht: initialHasWht,
  whtRate: initialWhtRate,
  isMultiPayment: initialIsMultiPayment,
  totalAmount: initialTotalAmount,
  canEdit,
  onSave,
}: BoxTypeEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [hasChanges, setHasChanges] = useState(false);
  
  // Local state
  const [expenseType, setExpenseType] = useState<ExpenseType>(initialExpenseType || "STANDARD");
  const [hasWht, setHasWht] = useState(initialHasWht);
  const [whtRate, setWhtRate] = useState(initialWhtRate?.toString() || "3");
  const [isMultiPayment, setIsMultiPayment] = useState(initialIsMultiPayment);
  const [amount, setAmount] = useState(initialTotalAmount?.toString() || "");

  // Track changes
  useEffect(() => {
    const changed = 
      expenseType !== (initialExpenseType || "STANDARD") ||
      hasWht !== initialHasWht ||
      whtRate !== (initialWhtRate?.toString() || "3") ||
      isMultiPayment !== initialIsMultiPayment ||
      amount !== (initialTotalAmount?.toString() || "");
    setHasChanges(changed);
  }, [expenseType, hasWht, whtRate, isMultiPayment, amount, initialExpenseType, initialHasWht, initialWhtRate, initialIsMultiPayment, initialTotalAmount]);

  // Reset WHT when switching to NO_VAT
  useEffect(() => {
    if (expenseType === "NO_VAT") {
      setHasWht(false);
    }
  }, [expenseType]);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      try {
        await onSave({
          expenseType,
          hasWht: expenseType === "STANDARD" ? hasWht : false,
          whtRate: hasWht ? parseInt(whtRate) : undefined,
          isMultiPayment,
          totalAmount: parseFloat(amount) || 0,
        });
        toast.success("บันทึกสำเร็จ");
        setHasChanges(false);
      } catch {
        toast.error("เกิดข้อผิดพลาด");
      }
    });
  }, [expenseType, hasWht, whtRate, isMultiPayment, amount, onSave]);

  if (!canEdit) {
    // Read-only view
    return (
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <Settings2 className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">ประเภทกล่อง</h3>
            <p className="text-sm text-gray-500">
              {initialExpenseType === "STANDARD" ? "มีใบกำกับภาษี" : "ไม่มีใบกำกับภาษี"}
              {initialHasWht && ` • WHT ${initialWhtRate}%`}
              {initialIsMultiPayment && " • จ่ายหลายงวด"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <Settings2 className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">ตั้งค่ากล่อง</h3>
            <p className="text-xs text-gray-500">บัญชีแก้ไขได้</p>
          </div>
        </div>
        
        {/* Save button */}
        {hasChanges && (
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="gap-1.5"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            บันทึก
          </Button>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Expense Type */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">ประเภทรายจ่าย</Label>
          <div className="grid grid-cols-2 gap-2">
            {/* STANDARD */}
            <button
              type="button"
              onClick={() => setExpenseType("STANDARD")}
              className={cn(
                "relative flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all",
                "hover:border-primary/50 hover:bg-primary/5",
                expenseType === "STANDARD"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-gray-200 bg-white"
              )}
            >
              {expenseType === "STANDARD" && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                expenseType === "STANDARD" ? "bg-primary/10" : "bg-emerald-100"
              )}>
                <FileCheck className={cn(
                  "h-4 w-4",
                  expenseType === "STANDARD" ? "text-primary" : "text-emerald-600"
                )} />
              </div>
              <div className="min-w-0 pr-4">
                <span className={cn(
                  "block font-medium text-sm",
                  expenseType === "STANDARD" ? "text-primary" : "text-gray-900"
                )}>
                  มีใบกำกับภาษี
                </span>
                <span className="block text-xs text-gray-500">
                  ขอคืน VAT ได้
                </span>
              </div>
            </button>

            {/* NO_VAT */}
            <button
              type="button"
              onClick={() => setExpenseType("NO_VAT")}
              className={cn(
                "relative flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all",
                "hover:border-slate-400 hover:bg-slate-50",
                expenseType === "NO_VAT"
                  ? "border-slate-500 bg-slate-50 ring-2 ring-slate-200"
                  : "border-gray-200 bg-white"
              )}
            >
              {expenseType === "NO_VAT" && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-500 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                expenseType === "NO_VAT" ? "bg-slate-200" : "bg-slate-100"
              )}>
                <Receipt className={cn(
                  "h-4 w-4",
                  expenseType === "NO_VAT" ? "text-slate-700" : "text-slate-600"
                )} />
              </div>
              <div className="min-w-0 pr-4">
                <span className={cn(
                  "block font-medium text-sm",
                  expenseType === "NO_VAT" ? "text-slate-700" : "text-gray-900"
                )}>
                  ไม่มีใบกำกับ
                </span>
                <span className="block text-xs text-gray-500">
                  บิลเงินสด
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* WHT (only for STANDARD) */}
        {expenseType === "STANDARD" && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50/50">
              <Checkbox
                id="hasWht"
                checked={hasWht}
                onCheckedChange={(checked) => setHasWht(checked === true)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <label htmlFor="hasWht" className="block font-medium text-sm text-gray-900 cursor-pointer">
                  มีหัก ณ ที่จ่าย (WHT)
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  ต้องออกหนังสือรับรองหัก ณ ที่จ่าย
                </p>
                
                {hasWht && (
                  <div className="mt-3">
                    <Label className="text-xs text-gray-600">อัตราหัก ณ ที่จ่าย</Label>
                    <Select value={whtRate} onValueChange={setWhtRate}>
                      <SelectTrigger className="mt-1 h-9">
                        <SelectValue placeholder="เลือกอัตรา..." />
                      </SelectTrigger>
                      <SelectContent>
                        {WHT_RATE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <Percent className="h-3 w-3 text-purple-500" />
                              <span>{opt.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Type */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">รูปแบบการชำระ</Label>
          <div className="grid grid-cols-2 gap-2">
            {/* Single payment */}
            <button
              type="button"
              onClick={() => setIsMultiPayment(false)}
              className={cn(
                "relative flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all",
                "hover:border-primary/50 hover:bg-primary/5",
                !isMultiPayment
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-gray-200 bg-white"
              )}
            >
              {!isMultiPayment && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                !isMultiPayment ? "bg-primary/10" : "bg-emerald-100"
              )}>
                <CreditCard className={cn(
                  "h-4 w-4",
                  !isMultiPayment ? "text-primary" : "text-emerald-600"
                )} />
              </div>
              <div className="min-w-0 pr-4">
                <span className={cn(
                  "block font-medium text-sm",
                  !isMultiPayment ? "text-primary" : "text-gray-900"
                )}>
                  จ่ายครั้งเดียว
                </span>
              </div>
            </button>

            {/* Multi payment */}
            <button
              type="button"
              onClick={() => setIsMultiPayment(true)}
              className={cn(
                "relative flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all",
                "hover:border-amber-400 hover:bg-amber-50",
                isMultiPayment
                  ? "border-amber-500 bg-amber-50 ring-2 ring-amber-200"
                  : "border-gray-200 bg-white"
              )}
            >
              {isMultiPayment && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                "bg-amber-100"
              )}>
                <CalendarClock className="h-4 w-4 text-amber-600" />
              </div>
              <div className="min-w-0 pr-4">
                <span className={cn(
                  "block font-medium text-sm",
                  isMultiPayment ? "text-amber-700" : "text-gray-900"
                )}>
                  จ่ายหลายงวด
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Total Amount */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {isMultiPayment ? "ยอดรวมทั้งหมด *" : "ยอดเงิน"}
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">฿</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              className={cn(
                "pl-8",
                isMultiPayment && "border-amber-300 focus:border-amber-500 focus:ring-amber-500"
              )}
              placeholder={isMultiPayment ? "กรอกยอดรวมทั้งหมด" : "0.00"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          {isMultiPayment && (
            <p className="text-xs text-amber-600">
              กรอกยอดรวมทั้งหมดของคำสั่งซื้อนี้
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
