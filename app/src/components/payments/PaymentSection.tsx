"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, AlertCircle, Wallet, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatMoney } from "@/lib/formatters";
import { createPayment, deletePayment } from "@/server/actions/payment";
import { toast } from "sonner";
import { PaymentList } from "./PaymentList";
import { PaymentForm } from "./PaymentForm";
import type { SerializedPayment, PaymentStatus } from "@/types";
import type { PaymentMethod } from "@prisma/client";

interface PaymentSectionProps {
  boxId: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  payments: SerializedPayment[];
  canEdit: boolean;
}

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; icon: typeof Check }> = {
  UNPAID: { label: "ยังไม่จ่าย", color: "bg-red-100 text-red-700", icon: AlertCircle },
  PARTIAL: { label: "จ่ายบางส่วน", color: "bg-amber-100 text-amber-700", icon: AlertCircle },
  PAID: { label: "จ่ายครบแล้ว", color: "bg-green-100 text-green-700", icon: Check },
  OVERPAID: { label: "จ่ายเกิน", color: "bg-blue-100 text-blue-700", icon: Check },
  REFUNDED: { label: "คืนเงินแล้ว", color: "bg-purple-100 text-purple-700", icon: Check },
};

export function PaymentSection({
  boxId,
  totalAmount,
  paidAmount,
  paymentStatus,
  payments,
  canEdit,
}: PaymentSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const remaining = Math.max(0, totalAmount - paidAmount);
  const progressPercent = totalAmount > 0 ? Math.min(100, (paidAmount / totalAmount) * 100) : 0;
  
  // When totalAmount is 0, show simplified state
  const hasNoAmount = totalAmount === 0 && paidAmount === 0;
  const statusConfig = STATUS_CONFIG[paymentStatus];
  const StatusIcon = statusConfig.icon;

  const handleAddPayment = async (data: {
    amount: number;
    method: PaymentMethod;
    paidDate: Date;
    reference?: string;
    notes?: string;
  }) => {
    startTransition(async () => {
      const result = await createPayment({
        boxId,
        amount: data.amount,
        method: data.method,
        paidDate: data.paidDate,
        reference: data.reference,
        notes: data.notes,
      });

      if (result.success) {
        toast.success("บันทึกการชำระเงินสำเร็จ");
        router.refresh();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleDeletePayment = (paymentId: string) => {
    if (!confirm("ต้องการลบรายการนี้?")) return;

    startTransition(async () => {
      const result = await deletePayment(paymentId);
      if (result.success) {
        toast.success("ลบรายการสำเร็จ");
        router.refresh();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  // Simplified view when no amount set yet
  if (hasNoAmount && payments.length === 0) {
    return (
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b bg-muted/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <Wallet className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">การชำระเงิน</h3>
            <p className="text-xs text-muted-foreground">รอระบุยอดเงิน</p>
          </div>
        </div>
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            ยังไม่มียอดเงินที่ต้องชำระ
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            paymentStatus === "PAID" || paymentStatus === "OVERPAID" 
              ? "bg-green-100" 
              : "bg-amber-100"
          )}>
            <Wallet className={cn(
              "h-5 w-5",
              paymentStatus === "PAID" || paymentStatus === "OVERPAID" 
                ? "text-green-600" 
                : "text-amber-600"
            )} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">การชำระเงิน</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={statusConfig.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </div>

        {canEdit && remaining > 0 && (
          <PaymentForm
            remainingAmount={remaining}
            onSubmit={handleAddPayment}
            isPending={isPending}
          />
        )}
      </div>

      {/* Summary */}
      <div className="px-5 py-4 bg-muted/30 border-b">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">ความคืบหน้า</span>
          <span className="text-sm font-medium">
            {progressPercent.toFixed(0)}%
          </span>
        </div>
        <Progress value={progressPercent} className="h-2 mb-3" />
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">ยอดรวม</p>
            <p className="font-semibold text-foreground">฿{formatMoney(totalAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">ชำระแล้ว</p>
            <p className="font-semibold text-green-600">฿{formatMoney(paidAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">คงเหลือ</p>
            <p className={cn(
              "font-semibold",
              remaining > 0 ? "text-red-600" : "text-muted-foreground"
            )}>
              ฿{formatMoney(remaining)}
            </p>
          </div>
        </div>

        {/* Overpaid Warning */}
        {paymentStatus === "OVERPAID" && (
          <div className="flex items-center gap-2 p-3 mt-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="text-sm">
              ชำระเกินยอดรวม ฿{formatMoney(paidAmount - totalAmount)} กรุณาตรวจสอบ
            </span>
          </div>
        )}
      </div>

      {/* Payment List */}
      <div className="px-5 py-4">
        <PaymentList
          payments={payments}
          canEdit={canEdit}
          onDelete={handleDeletePayment}
        />
      </div>
    </div>
  );
}
