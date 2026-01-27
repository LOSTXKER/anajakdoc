"use client";

import { memo } from "react";
import Link from "next/link";
import { Package, MoreVertical, Eye, CheckCircle2, HelpCircle, XCircle, AlertCircle, CheckCircle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatMoney } from "@/lib/formatters";
import { canReviewBox, getBoxTypeConfig, getBoxStatusConfig, getDocStatusConfig, getExpenseTypeLabel } from "@/lib/document-config";
import { cn } from "@/lib/utils";
import type { SerializedBoxListItem } from "@/types";

interface DocumentBoxCardProps {
  box: SerializedBoxListItem;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  onAction?: (id: string, action: "approve" | "reject" | "need_info") => void;
  showCheckbox?: boolean;
  showActions?: boolean;
  showReimburseBadge?: boolean;
}

/**
 * DocumentBoxCard - Displays a single box/document item in a list.
 * 
 * Wrapped with React.memo to prevent unnecessary re-renders when parent
 * component updates but box props haven't changed.
 */
export const DocumentBoxCard = memo(function DocumentBoxCard({
  box,
  selected = false,
  onSelect,
  onAction,
  showCheckbox = false,
  showActions = false,
  showReimburseBadge = false,
}: DocumentBoxCardProps) {
  const canReview = canReviewBox(box.status);
  const boxTypeConfig = getBoxTypeConfig(box.boxType);
  const boxStatusConfig = getBoxStatusConfig(box.status);
  const BoxTypeIcon = boxTypeConfig.icon;

  // Helper to get VAT badge info
  const getVatBadgeInfo = () => {
    if (!box.hasVat) return null;
    switch (box.vatDocStatus) {
      case "RECEIVED":
      case "VERIFIED":
        return { label: "ใบกำกับ ✓", className: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" };
      case "MISSING":
        return { label: "ใบกำกับ ขาด", className: "bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800" };
      default:
        return { label: "ใบกำกับ รอ", className: "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700" };
    }
  };

  // Helper to get WHT badge info
  const getWhtBadgeInfo = () => {
    if (!box.hasWht) return null;
    switch (box.whtDocStatus) {
      case "RECEIVED":
      case "VERIFIED":
        return { label: "หัก ณ ที่จ่าย ✓", className: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" };
      case "REQUEST_SENT":
        return { label: "หัก ณ ที่จ่าย รอ", className: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" };
      case "MISSING":
        return { label: "หัก ณ ที่จ่าย ขาด", className: "bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800" };
      default:
        return { label: "หัก ณ ที่จ่าย รอ", className: "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700" };
    }
  };

  const vatBadge = getVatBadgeInfo();
  const whtBadge = getWhtBadgeInfo();

  return (
    <div className={cn(
      "group relative border border-border rounded-xl p-4 bg-card hover:shadow-sm transition-all duration-200",
      box.boxType === "INCOME" 
        ? "hover:border-emerald-300 dark:hover:border-emerald-700 border-l-4 border-l-emerald-400 dark:border-l-emerald-600" 
        : "hover:border-rose-300 dark:hover:border-rose-700 border-l-4 border-l-rose-400 dark:border-l-rose-600"
    )}>
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        {showCheckbox && onSelect && (
          <div className="pt-1">
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) => onSelect(box.id, checked === true)}
            />
          </div>
        )}

        {/* Box Icon */}
        <Link href={`/documents/${box.id}`} className="shrink-0">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
            boxTypeConfig.bgLight,
            "group-hover:opacity-80"
          )}>
            <Package className={cn("w-6 h-6", boxTypeConfig.iconColor)} />
          </div>
        </Link>

        {/* Content */}
        <Link href={`/documents/${box.id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Box type badge */}
            <Badge variant="secondary" className={cn("text-xs gap-1", boxTypeConfig.badgeClass)}>
              <BoxTypeIcon className="w-3 h-3" />
              {boxTypeConfig.label}
            </Badge>
            
            {/* Expense type */}
            {box.expenseType && (
              <Badge variant="outline" className="text-xs">
                {getExpenseTypeLabel(box.expenseType)}
              </Badge>
            )}
            
            <span className="font-semibold text-foreground">{box.boxNumber}</span>
            
            {/* Status badge */}
            <Badge variant="secondary" className={cn("text-xs", boxStatusConfig.className)}>
              {boxStatusConfig.label}
            </Badge>
            
            {/* Doc status indicator */}
            {box.docStatus === "INCOMPLETE" ? (
              <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-3 h-3" />
                รอเอกสาร
              </span>
            ) : box.docStatus === "COMPLETE" ? (
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-3 h-3" />
                ครบแล้ว
              </span>
            ) : null}
            
            {/* Reimbursement badge (Section 19) */}
            {(showReimburseBadge || box.paymentMode === "EMPLOYEE_ADVANCE") && box.reimbursementStatus === "PENDING" && (
              <Badge variant="secondary" className="text-xs bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800 gap-1">
                <Wallet className="w-3 h-3" />
                รอคืนเงิน
              </Badge>
            )}
            
            {/* VAT Badge */}
            {vatBadge && (
              <Badge variant="secondary" className={cn("text-xs", vatBadge.className)}>
                {vatBadge.label}
              </Badge>
            )}
            
            {/* WHT Badge */}
            {whtBadge && (
              <Badge variant="secondary" className={cn("text-xs", whtBadge.className)}>
                {whtBadge.label}
              </Badge>
            )}
          </div>
          
          <p className="text-muted-foreground truncate mt-1">
            {box.title || box.description || "ไม่มีรายละเอียด"}
          </p>
          
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground flex-wrap">
            {box.contact?.name && (
              <>
                <span>{box.contact.name}</span>
                <span className="text-border">•</span>
              </>
            )}
            <span>{formatDate(box.boxDate, "short")}</span>
            {box.createdBy?.name && (
              <>
                <span className="text-border">•</span>
                <span>โดย {box.createdBy.name}</span>
              </>
            )}
            {box._count && box._count.documents > 0 && (
              <>
                <span className="text-border">•</span>
                <span>{box._count.documents} เอกสาร</span>
              </>
            )}
          </div>
        </Link>

        {/* Amount & Actions */}
        <div className="flex items-start gap-2 shrink-0">
          <div className="text-right">
            <p className={cn("text-lg font-bold", boxTypeConfig.amountColor)}>
              {box.boxType === "INCOME" ? "+" : "-"}฿{formatMoney(box.totalAmount)}
            </p>
            {box.category?.name && (
              <p className="text-sm text-muted-foreground">{box.category.name}</p>
            )}
            {/* Payment status indicator */}
            {box.paymentStatus === "PAID" ? (
              <span className="text-xs text-emerald-600 dark:text-emerald-400">จ่ายแล้ว</span>
            ) : box.paymentStatus === "PARTIAL" ? (
              <span className="text-xs text-amber-600 dark:text-amber-400">จ่ายบางส่วน</span>
            ) : box.totalAmount > 0 && (
              <span className="text-xs text-muted-foreground">รอจ่าย</span>
            )}
          </div>

          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/documents/${box.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  ดูรายละเอียด
                </Link>
              </DropdownMenuItem>
              {showActions && canReview && onAction && (
                <>
                  <DropdownMenuItem onClick={() => onAction(box.id, "approve")}>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                    อนุมัติ
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAction(box.id, "need_info")}>
                    <HelpCircle className="mr-2 h-4 w-4 text-amber-600" />
                    ขอข้อมูลเพิ่ม
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAction(box.id, "reject")}>
                    <XCircle className="mr-2 h-4 w-4 text-red-600" />
                    ปฏิเสธ
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
});
