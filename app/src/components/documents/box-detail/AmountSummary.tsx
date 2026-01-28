"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Receipt,
  Percent,
  Calculator,
  Loader2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/formatters";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { updateBox } from "@/server/actions/box/update-box";
import { calculateNetAmount } from "@/lib/config/box-type-config";
import { getBoxStatusLabel } from "@/lib/config/status-config";

import type { BoxType, ExpenseType, BoxStatus } from "@/types";

// ==================== Types ====================

interface AmountSummaryProps {
  boxId: string;
  boxType: BoxType;
  totalAmount: number;
  vatAmount: number;
  whtAmount: number;
  hasVat?: boolean;
  vatRate?: number | null;
  hasWht?: boolean;
  whtRate?: number | null;
  expenseType?: ExpenseType | null;
  canEdit?: boolean;
  status?: BoxStatus;
}

// ==================== Config ====================

const EXPENSE_TYPES = [
  { value: "STANDARD", label: "มี VAT" },
  { value: "NO_VAT", label: "ไม่มี VAT" },
];

const WHT_RATES = [
  { value: "1", label: "1%" },
  { value: "2", label: "2%" },
  { value: "3", label: "3%" },
  { value: "5", label: "5%" },
];

// ==================== Component ====================

export function AmountSummary({
  boxId,
  boxType,
  totalAmount,
  vatAmount,
  whtAmount,
  hasVat = true,
  hasWht = false,
  whtRate,
  expenseType,
  canEdit = false,
  status,
}: AmountSummaryProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formAmount, setFormAmount] = useState(totalAmount.toString());
  const [formExpenseType, setFormExpenseType] = useState<string>(expenseType || "STANDARD");
  const [formHasWht, setFormHasWht] = useState(hasWht);
  const [formWhtRate, setFormWhtRate] = useState(whtRate?.toString() || "3");

  // VAT is determined by expenseType (STANDARD = has VAT)
  const formHasVat = formExpenseType === "STANDARD";

  // Calculate VAT (7% of total if VAT included)
  const calculateVat = (amount: number, includeVat: boolean) => {
    if (!includeVat) return 0;
    return Math.round((amount * 7 / 107) * 100) / 100;
  };

  // Calculate WHT
  const calculateWht = (amount: number, includeVat: boolean, includeWht: boolean, rate: number) => {
    if (!includeWht) return 0;
    const baseAmount = includeVat ? amount - calculateVat(amount, true) : amount;
    return Math.round((baseAmount * rate / 100) * 100) / 100;
  };

  // Calculated values for edit mode preview
  const editAmount = parseFloat(formAmount) || 0;
  const editVat = calculateVat(editAmount, formHasVat);
  const editWht = calculateWht(editAmount, formHasVat, formHasWht, parseFloat(formWhtRate) || 0);
  const editNet = calculateNetAmount(boxType, editAmount, editWht);

  // Display values
  const netAmount = calculateNetAmount(boxType, totalAmount, whtAmount);

  // Get expense type label
  const getExpenseTypeLabel = () => {
    const found = EXPENSE_TYPES.find(t => t.value === expenseType);
    if (found) return found.label;
    return "ไม่ระบุ";
  };
  const expenseTypeLabel = getExpenseTypeLabel();

  // Reset form when entering edit mode
  const handleStartEdit = () => {
    setFormAmount(totalAmount.toString());
    setFormExpenseType(expenseType || "STANDARD");
    setFormHasWht(hasWht);
    setFormWhtRate(whtRate?.toString() || "3");
    setIsEditing(true);
  };

  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false);
  };

  // Save all changes
  const handleSave = async () => {
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error("ยอดเงินไม่ถูกต้อง");
      return;
    }

    const calculatedVat = calculateVat(amount, formHasVat);
    const calculatedWht = calculateWht(amount, formHasVat, formHasWht, parseFloat(formWhtRate) || 0);

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.set("totalAmount", amount.toString());
      formData.set("hasVat", formHasVat.toString());
      formData.set("vatAmount", calculatedVat.toString());
      formData.set("expenseType", formExpenseType);
      formData.set("hasWht", formHasWht.toString());
      formData.set("whtAmount", calculatedWht.toString());
      if (formHasWht) {
        formData.set("whtRate", formWhtRate);
      }

      const result = await updateBox(boxId, formData);

      if (result.success) {
        toast.success("บันทึกเรียบร้อย");
        setIsEditing(false);
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-5">
      {/* Header with Edit Button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          ยอดเงิน
        </h3>
        {!isEditing && (
          canEdit ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartEdit}
              className="h-8 px-3 text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-4 w-4 mr-1.5" />
              แก้ไข
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    className="h-8 px-3 text-muted-foreground/50 cursor-not-allowed"
                  >
                    <Pencil className="h-4 w-4 mr-1.5" />
                    แก้ไข
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>สถานะ "{status ? getBoxStatusLabel(status) : "ไม่ทราบ"}" ไม่สามารถแก้ไขได้</p>
              </TooltipContent>
            </Tooltip>
          )
        )}
        {isEditing && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-8 px-3"
            >
              <X className="h-4 w-4 mr-1" />
              ยกเลิก
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 px-3"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1.5" />
              )}
              บันทึก
            </Button>
          </div>
        )}
      </div>

      {/* Expense Type - At the top for EXPENSE boxes (determines VAT) */}
      {boxType === "EXPENSE" && (
        <div className="flex items-center justify-between text-sm mb-4 pb-4 border-b">
          <span className="text-muted-foreground">ประเภทรายจ่าย</span>
          {isEditing ? (
            <Select
              value={formExpenseType || "STANDARD"}
              onValueChange={(v) => setFormExpenseType(v)}
            >
              <SelectTrigger className="h-8 w-auto text-sm font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="font-medium text-foreground">{expenseTypeLabel}</span>
          )}
        </div>
      )}

      {/* Amount Breakdown */}
      <div className="space-y-3">
        {/* Total Amount */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Receipt className="h-4 w-4" />
            <span className="text-sm">ยอดรวม</span>
          </div>
          {isEditing ? (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">฿</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="h-8 w-28 text-right text-lg font-bold"
              />
            </div>
          ) : (
            <span className="font-bold text-lg text-foreground">
              ฿{formatMoney(totalAmount)}
            </span>
          )}
        </div>

        {/* VAT - show only when has VAT */}
        {(isEditing ? formHasVat : vatAmount > 0 || hasVat) && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Percent className="h-4 w-4" />
              <span>VAT 7%</span>
            </div>
            <span className="text-foreground">
              ฿{formatMoney(isEditing ? editVat : vatAmount)}
            </span>
          </div>
        )}

        {/* WHT */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Banknote className="h-4 w-4" />
            <span>
              หัก ณ ที่จ่าย
              {isEditing 
                ? (formHasWht && formWhtRate ? ` ${formWhtRate}%` : "")
                : (hasWht && whtRate ? ` ${whtRate}%` : "")
              }
            </span>
          </div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <span className={formHasWht ? "text-rose-600" : "text-muted-foreground"}>
                {formHasWht ? "-" : ""}฿{formatMoney(editWht)}
              </span>
              <Select
                value={formHasWht ? formWhtRate : "0"}
                onValueChange={(v) => {
                  if (v === "0") {
                    setFormHasWht(false);
                  } else {
                    setFormHasWht(true);
                    setFormWhtRate(v);
                  }
                }}
              >
                <SelectTrigger className="h-7 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">ไม่มี</SelectItem>
                  {WHT_RATES.map((rate) => (
                    <SelectItem key={rate.value} value={rate.value}>
                      {rate.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <span className={whtAmount > 0 ? "text-rose-600" : "text-muted-foreground"}>
              {whtAmount > 0 ? "-" : ""}฿{formatMoney(whtAmount)}
            </span>
          )}
        </div>

        {/* Divider & Net Amount */}
        <div className="border-t my-2" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calculator className="h-4 w-4" />
            <span className="text-sm font-medium">สุทธิ</span>
          </div>
          <span className="font-bold text-lg text-foreground">
            ฿{formatMoney(isEditing ? editNet : netAmount)}
          </span>
        </div>

      </div>

    </div>
  );
}
