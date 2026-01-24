"use client";

import { useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  CreditCard,
  Banknote,
  Building2,
  Wallet,
  MoreHorizontal,
  Trash2,
  FileText,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatMoney } from "@/lib/formatters";
import { EmptyState } from "@/components/ui/empty-state";
import type { SerializedPayment } from "@/types";
import type { PaymentMethod } from "@prisma/client";

interface PaymentListProps {
  payments: SerializedPayment[];
  canEdit: boolean;
  onDelete?: (paymentId: string) => void;
}

const METHOD_CONFIG: Record<PaymentMethod, { label: string; icon: typeof CreditCard; color: string }> = {
  TRANSFER: { label: "โอนเงิน", icon: Building2, color: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900" },
  CASH: { label: "เงินสด", icon: Banknote, color: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900" },
  CHEQUE: { label: "เช็ค", icon: FileText, color: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900" },
  CREDIT_CARD: { label: "บัตรเครดิต", icon: CreditCard, color: "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900" },
  ONLINE: { label: "ออนไลน์", icon: Wallet, color: "text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900" },
};

export function PaymentList({ payments, canEdit, onDelete }: PaymentListProps) {
  if (payments.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="ยังไม่มีรายการชำระเงิน"
        className="py-6"
      />
    );
  }

  return (
    <div className="space-y-2">
      {payments.map((payment, index) => {
        const config = METHOD_CONFIG[payment.method];
        const Icon = config.icon;

        return (
          <div
            key={payment.id}
            className="flex items-center justify-between p-3 rounded-xl border bg-muted hover:bg-muted/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", config.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    งวดที่ {index + 1}
                  </span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {config.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(payment.paidDate), "d MMM yyyy", { locale: th })}
                  {payment.reference && ` • ${payment.reference}`}
                  {payment.documentId 
                    ? "" // มีสลิป - ไม่ต้องแสดงเพิ่ม เพราะจะเห็นจาก reference
                    : " (เพิ่มเอง)"
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-green-600">
                +฿{formatMoney(payment.amount)}
              </span>

              {/* แสดงปุ่มลบเฉพาะ payment ที่ไม่มี documentId (manual entry)
                  Payment ที่มี documentId ให้ลบผ่านการลบไฟล์สลิปแทน */}
              {canEdit && onDelete && !payment.documentId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onDelete(payment.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      ลบรายการนี้
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
