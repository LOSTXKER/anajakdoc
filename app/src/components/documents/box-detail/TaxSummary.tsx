"use client";

import { formatMoney } from "@/lib/formatters";
import { getPaymentStatusConfig } from "@/lib/document-config";
import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/types";

interface TaxSummaryProps {
  totalAmount: number;
  vatAmount: number;
  vatRate?: number | null;
  whtAmount: number;
  whtRate?: number | null;
  paidAmount?: number;
  paymentStatus?: PaymentStatus;
}

export function TaxSummary({
  totalAmount,
  vatAmount,
  vatRate,
  whtAmount,
  whtRate,
  paidAmount = 0,
  paymentStatus,
}: TaxSummaryProps) {
  const subtotal = totalAmount - vatAmount;
  const netPayable = totalAmount - whtAmount;
  const remaining = netPayable - paidAmount;

  const paymentStatusConfig = paymentStatus ? getPaymentStatusConfig(paymentStatus) : null;

  return (
    <div className="rounded-xl border bg-white p-5">
      <h3 className="font-semibold text-gray-900 mb-4">สรุปภาษี & การชำระ</h3>
      
      <div className="space-y-3">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">ยอดก่อน VAT</span>
          <span className="font-medium text-gray-900">฿{formatMoney(subtotal)}</span>
        </div>
        
        {/* VAT */}
        {vatAmount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              VAT {vatRate ? `${vatRate}%` : ""}
            </span>
            <span className="font-medium text-emerald-600">+฿{formatMoney(vatAmount)}</span>
          </div>
        )}
        
        {/* Total */}
        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <span className="text-gray-900 font-medium">ยอดรวม</span>
          <span className="font-bold text-gray-900">฿{formatMoney(totalAmount)}</span>
        </div>
        
        {/* WHT */}
        {whtAmount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              หัก ณ ที่จ่าย {whtRate ? `${whtRate}%` : ""}
            </span>
            <span className="font-medium text-amber-600">-฿{formatMoney(whtAmount)}</span>
          </div>
        )}
        
        {/* Net Payable */}
        {whtAmount > 0 && (
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <span className="text-gray-900 font-medium">ยอดจ่ายจริง</span>
            <span className="font-bold text-primary">฿{formatMoney(netPayable)}</span>
          </div>
        )}

        {/* Payment Status */}
        {paymentStatus && (
          <div className="pt-3 border-t mt-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm">สถานะการชำระ</span>
              <Badge variant="secondary" className={paymentStatusConfig?.className}>
                {paymentStatusConfig?.label}
              </Badge>
            </div>
            
            {paidAmount > 0 && (
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">จ่ายแล้ว</span>
                <span className="font-medium text-emerald-600">฿{formatMoney(paidAmount)}</span>
              </div>
            )}
            
            {remaining > 0 && paymentStatus !== "PAID" && (
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600">คงเหลือ</span>
                <span className="font-medium text-amber-600">฿{formatMoney(remaining)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
