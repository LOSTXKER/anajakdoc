"use client";

import { useState } from "react";
import { Loader2, Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getTodayForInput } from "@/lib/formatters";
import type { PaymentMethod } from "@prisma/client";

interface PaymentFormProps {
  remainingAmount: number;
  onSubmit: (data: {
    amount: number;
    method: PaymentMethod;
    paidDate: Date;
    reference?: string;
    notes?: string;
  }) => Promise<void>;
  isPending?: boolean;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "TRANSFER", label: "โอนเงิน" },
  { value: "CASH", label: "เงินสด" },
  { value: "CHEQUE", label: "เช็ค" },
  { value: "CREDIT_CARD", label: "บัตรเครดิต" },
  { value: "ONLINE", label: "ออนไลน์" },
];

export function PaymentForm({ remainingAmount, onSubmit, isPending }: PaymentFormProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(remainingAmount.toString());
  const [method, setMethod] = useState<PaymentMethod>("TRANSFER");
  const [paidDate, setPaidDate] = useState(getTodayForInput());
  const [reference, setReference] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await onSubmit({
      amount: parseFloat(amount),
      method,
      paidDate: new Date(paidDate),
      reference: reference || undefined,
    });

    // Reset form and close
    setAmount(remainingAmount.toString());
    setMethod("TRANSFER");
    setPaidDate(getTodayForInput());
    setReference("");
    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setAmount(remainingAmount.toString());
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          เพิ่มรายการจ่าย
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>บันทึกการชำระเงิน</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">จำนวนเงิน</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">฿</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8"
                placeholder="0.00"
                required
              />
            </div>
            <p className="text-xs text-gray-500">
              ยอดคงเหลือ: ฿{remainingAmount.toLocaleString()}
            </p>
            {/* Overpayment Warning */}
            {parseFloat(amount) > remainingAmount && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200 text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="text-xs">
                  จำนวนเงินเกินยอดคงเหลือ ฿{(parseFloat(amount) - remainingAmount).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>วิธีชำระ</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="paidDate">วันที่ชำระ</Label>
            <Input
              id="paidDate"
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              required
            />
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <Label htmlFor="reference">อ้างอิง (optional)</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="เลขที่สลิป, เลขเช็ค..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isPending || parseFloat(amount) <= 0}>
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              บันทึก
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
