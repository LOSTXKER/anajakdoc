"use client";

import Link from "next/link";
import { Package, MoreVertical, Eye, CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatMoney } from "@/lib/formatters";
import { canReviewDocument, getTransactionTypeConfig } from "@/lib/document-config";
import { cn } from "@/lib/utils";
import type { SerializedDocumentListItem } from "@/types";

interface DocumentBoxCardProps {
  doc: SerializedDocumentListItem;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  onAction?: (id: string, action: "approve" | "reject" | "need_info") => void;
  showCheckbox?: boolean;
  showActions?: boolean;
}

export function DocumentBoxCard({
  doc,
  selected = false,
  onSelect,
  onAction,
  showCheckbox = false,
  showActions = false,
}: DocumentBoxCardProps) {
  const canReview = canReviewDocument(doc.status);
  const txConfig = getTransactionTypeConfig(doc.transactionType);
  const TxIcon = txConfig.icon;

  return (
    <div className={cn(
      "group relative border rounded-xl p-4 bg-white hover:shadow-sm transition-all duration-200",
      doc.transactionType === "INCOME" 
        ? "hover:border-primary/50 border-l-4 border-l-primary" 
        : "hover:border-rose-300 border-l-4 border-l-rose-400"
    )}>
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        {showCheckbox && onSelect && (
          <div className="pt-1">
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) => onSelect(doc.id, checked === true)}
            />
          </div>
        )}

        {/* Box Icon - colored by transaction type */}
        <Link href={`/documents/${doc.id}`} className="shrink-0">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
            doc.transactionType === "INCOME"
              ? "bg-primary/10 group-hover:bg-primary/20"
              : "bg-rose-100 group-hover:bg-rose-200"
          )}>
            <Package className={cn(
              "w-6 h-6",
              doc.transactionType === "INCOME" ? "text-primary" : "text-rose-600"
            )} />
          </div>
        </Link>

        {/* Content */}
        <Link href={`/documents/${doc.id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Transaction type badge */}
            <Badge variant="secondary" className={cn("text-xs gap-1", txConfig.badgeClass)}>
              <TxIcon className="w-3 h-3" />
              {txConfig.label}
            </Badge>
            <span className="font-semibold text-gray-900">{doc.docNumber}</span>
            <StatusBadge status={doc.status} />
          </div>
          <p className="text-gray-600 truncate mt-1">
            {doc.description || "ไม่มีรายละเอียด"}
          </p>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 flex-wrap">
            {doc.contact?.name && (
              <>
                <span>{doc.contact.name}</span>
                <span className="text-gray-300">•</span>
              </>
            )}
            <span>{formatDate(doc.docDate, "short")}</span>
            {doc.submittedBy?.name && (
              <>
                <span className="text-gray-300">•</span>
                <span>โดย {doc.submittedBy.name}</span>
              </>
            )}
          </div>
        </Link>

        {/* Amount & Actions */}
        <div className="flex items-start gap-2 shrink-0">
          <div className="text-right">
            <p className={cn(
              "text-lg font-bold",
              doc.transactionType === "INCOME" ? "text-primary" : "text-rose-600"
            )}>
              {doc.transactionType === "INCOME" ? "+" : "-"}฿{formatMoney(doc.totalAmount)}
            </p>
            {doc.category?.name && (
              <p className="text-sm text-gray-500">{doc.category.name}</p>
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
                <Link href={`/documents/${doc.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  ดูรายละเอียด
                </Link>
              </DropdownMenuItem>
              {showActions && canReview && onAction && (
                <>
                  <DropdownMenuItem onClick={() => onAction(doc.id, "approve")}>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                    อนุมัติ
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAction(doc.id, "need_info")}>
                    <HelpCircle className="mr-2 h-4 w-4 text-amber-600" />
                    ขอข้อมูลเพิ่ม
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAction(doc.id, "reject")}>
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
}
