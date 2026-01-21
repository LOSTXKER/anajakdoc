"use client";

import { 
  Building2, 
  Calendar, 
  FileText,
  Receipt,
} from "lucide-react";
import { formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { ExpenseType } from "@/types";

interface BoxDetailsCardProps {
  contactName?: string | null;
  contactTaxId?: string | null;
  boxDate: string;
  dueDate?: string | null;
  title?: string | null;
  description?: string | null;
  notes?: string | null;
  totalAmount: number;
  vatAmount: number;
  whtAmount: number;
  whtRate?: number | null;
  paidAmount: number;
  expenseType: ExpenseType | null;
}

export function BoxDetailsCard({
  contactName,
  contactTaxId,
  boxDate,
  dueDate,
  title,
  description,
  notes,
  totalAmount,
  vatAmount,
  whtAmount,
  whtRate,
  paidAmount,
  expenseType,
}: BoxDetailsCardProps) {
  const netPayable = totalAmount - whtAmount;
  const remaining = netPayable - paidAmount;

  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">รายละเอียด</h3>
            <p className="text-xs text-muted-foreground">
              {expenseType === "STANDARD" ? "มีใบกำกับภาษี" : 
               expenseType === "NO_VAT" ? "ไม่มีใบกำกับภาษี" : 
               "รอระบุประเภท"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Contact & Date Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Contact */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">ผู้ติดต่อ</p>
              <p className="font-medium text-foreground truncate">
                {contactName || "ไม่ระบุ"}
              </p>
              {contactTaxId && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {contactTaxId}
                </p>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">วันที่</p>
              <p className="font-medium text-foreground">
                {new Date(boxDate).toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              {dueDate && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  ครบกำหนด: {new Date(dueDate).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {(title || description || notes) && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">รายละเอียด</p>
              {title && (
                <p className="font-medium text-foreground">{title}</p>
              )}
              {description && (
                <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
              )}
              {notes && (
                <p className="text-sm text-muted-foreground mt-1 italic">"{notes}"</p>
              )}
            </div>
          </div>
        )}

        {/* Amount Breakdown */}
        <div className="pt-4 border-t border-border/60">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
            รายละเอียดยอดเงิน
          </p>
          
          <div className="space-y-2.5">
            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">ยอดรวม</span>
              <span className="text-base font-semibold text-foreground">฿{formatMoney(totalAmount)}</span>
            </div>
            
            {/* Paid amount */}
            {paidAmount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">ชำระแล้ว</span>
                <span className="text-sm font-medium text-primary">-฿{formatMoney(paidAmount)}</span>
              </div>
            )}
            
            {/* Remaining */}
            <div className={cn(
              "flex justify-between items-center pt-3 mt-1 border-t border-dashed",
              remaining > 0 ? "text-destructive" : "text-primary"
            )}>
              <span className="text-sm font-semibold">คงเหลือ</span>
              <span className="text-lg font-bold">
                {remaining <= 0 ? "ชำระครบแล้ว ✓" : `฿${formatMoney(remaining)}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
