"use client";

import { useState, useTransition, useEffect } from "react";
import { 
  Settings2,
  FileCheck, 
  Receipt, 
  Check,
  CreditCard,
  CalendarClock,
  Percent,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ExpenseType } from "@/types";

const WHT_RATE_OPTIONS = [
  { value: "1", label: "1% - ค่าโฆษณา" },
  { value: "2", label: "2% - ค่าขนส่ง" },
  { value: "3", label: "3% - ค่าบริการ/จ้างทำของ" },
  { value: "5", label: "5% - ค่าเช่า" },
];

interface BoxSettingsDialogProps {
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

export function BoxSettingsDialog({
  boxId,
  expenseType: initialExpenseType,
  hasWht: initialHasWht,
  whtRate: initialWhtRate,
  isMultiPayment: initialIsMultiPayment,
  totalAmount: initialTotalAmount,
  canEdit,
  onSave,
}: BoxSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  const [expenseType, setExpenseType] = useState<ExpenseType>(initialExpenseType || "STANDARD");
  const [hasWht, setHasWht] = useState(initialHasWht);
  const [whtRate, setWhtRate] = useState(initialWhtRate?.toString() || "3");
  const [isMultiPayment, setIsMultiPayment] = useState(initialIsMultiPayment);
  const [amount, setAmount] = useState(initialTotalAmount?.toString() || "");

  useEffect(() => {
    if (open) {
      setExpenseType(initialExpenseType || "STANDARD");
      setHasWht(initialHasWht);
      setWhtRate(initialWhtRate?.toString() || "3");
      setIsMultiPayment(initialIsMultiPayment);
      setAmount(initialTotalAmount?.toString() || "");
    }
  }, [open, initialExpenseType, initialHasWht, initialWhtRate, initialIsMultiPayment, initialTotalAmount]);

  useEffect(() => {
    if (expenseType === "NO_VAT") {
      setHasWht(false);
    }
  }, [expenseType]);

  const handleSave = () => {
    startTransition(async () => {
      try {
        await onSave({
          expenseType,
          hasWht: expenseType === "STANDARD" ? hasWht : false,
          whtRate: hasWht ? parseInt(whtRate) : undefined,
          isMultiPayment,
          totalAmount: parseFloat(amount) || 0,
        });
        toast.success("บันทึกการตั้งค่าสำเร็จ");
        setOpen(false);
      } catch {
        toast.error("เกิดข้อผิดพลาด");
      }
    });
  };

  if (!canEdit) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Settings2 className="h-4 w-4" />
          ตั้งค่า
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings2 className="h-5 w-5 text-primary" />
            </div>
            ตั้งค่ากล่องเอกสาร
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Expense Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">ประเภทรายจ่าย</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExpenseType("STANDARD")}
                className={cn(
                  "relative flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all",
                  expenseType === "STANDARD"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                {expenseType === "STANDARD" && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                  </div>
                )}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  expenseType === "STANDARD" ? "bg-primary/15" : "bg-muted"
                )}>
                  <FileCheck className={cn(
                    "h-5 w-5",
                    expenseType === "STANDARD" ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <div className="min-w-0 pr-5">
                  <span className={cn(
                    "block font-medium text-sm",
                    expenseType === "STANDARD" ? "text-primary" : "text-foreground"
                  )}>
                    มีใบกำกับภาษี
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    ขอคืน VAT ได้
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExpenseType("NO_VAT")}
                className={cn(
                  "relative flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all",
                  expenseType === "NO_VAT"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                {expenseType === "NO_VAT" && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                  </div>
                )}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  expenseType === "NO_VAT" ? "bg-primary/15" : "bg-muted"
                )}>
                  <Receipt className={cn(
                    "h-5 w-5",
                    expenseType === "NO_VAT" ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <div className="min-w-0 pr-5">
                  <span className={cn(
                    "block font-medium text-sm",
                    expenseType === "NO_VAT" ? "text-primary" : "text-foreground"
                  )}>
                    ไม่มีใบกำกับ
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    บิลเงินสด
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* WHT */}
          {expenseType === "STANDARD" && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-xl border bg-muted/30">
                <Checkbox
                  id="hasWht"
                  checked={hasWht}
                  onCheckedChange={(checked) => setHasWht(checked === true)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <label htmlFor="hasWht" className="block font-medium text-sm text-foreground cursor-pointer">
                    มีหัก ณ ที่จ่าย (WHT)
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ต้องออกหนังสือรับรองหัก ณ ที่จ่าย
                  </p>
                  
                  {hasWht && (
                    <div className="mt-3">
                      <Label className="text-xs text-muted-foreground">อัตราหัก ณ ที่จ่าย</Label>
                      <Select value={whtRate} onValueChange={setWhtRate}>
                        <SelectTrigger className="mt-1.5 h-10">
                          <SelectValue placeholder="เลือกอัตรา..." />
                        </SelectTrigger>
                        <SelectContent>
                          {WHT_RATE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <div className="flex items-center gap-2">
                                <Percent className="h-3.5 w-3.5 text-primary" />
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
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsMultiPayment(false)}
                className={cn(
                  "relative flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all",
                  !isMultiPayment
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                {!isMultiPayment && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                  </div>
                )}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  !isMultiPayment ? "bg-primary/15" : "bg-muted"
                )}>
                  <CreditCard className={cn(
                    "h-5 w-5",
                    !isMultiPayment ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <span className={cn(
                  "font-medium text-sm pr-5",
                  !isMultiPayment ? "text-primary" : "text-foreground"
                )}>
                  จ่ายครั้งเดียว
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsMultiPayment(true)}
                className={cn(
                  "relative flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all",
                  isMultiPayment
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                {isMultiPayment && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                  </div>
                )}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  isMultiPayment ? "bg-primary/15" : "bg-muted"
                )}>
                  <CalendarClock className={cn(
                    "h-5 w-5",
                    isMultiPayment ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <span className={cn(
                  "font-medium text-sm pr-5",
                  isMultiPayment ? "text-primary" : "text-foreground"
                )}>
                  จ่ายหลายงวด
                </span>
              </button>
            </div>
          </div>

          {/* Total Amount */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {isMultiPayment ? "ยอดรวมทั้งหมด" : "ยอดเงิน"}
            </Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">฿</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="pl-9 h-11"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            {isMultiPayment && (
              <p className="text-xs text-muted-foreground">
                กรอกยอดรวมทั้งหมดของคำสั่งซื้อนี้
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            ยกเลิก
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
