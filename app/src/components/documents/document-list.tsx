"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FileText,
  Package,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BulkActions } from "./bulk-actions";
import type { PaginatedResponse, SerializedDocument, MemberRole } from "@/types";

interface DocumentListProps {
  documents: PaginatedResponse<SerializedDocument>;
  userRole?: MemberRole;
  showBulkActions?: boolean;
}

// Get status label and color based on completion percent
function getStatusDisplay(doc: SerializedDocument) {
  const percent = doc.completionPercent || 0;
  const isExported = doc.status === "EXPORTED";
  const isBooked = doc.status === "BOOKED";
  const isVoid = doc.status === "VOID" || doc.status === "REJECTED";

  if (isVoid) {
    return { label: "ยกเลิก", color: "bg-gray-100 text-gray-500" };
  }
  if (isBooked) {
    return { label: "บันทึกแล้ว", color: "bg-teal-100 text-teal-700" };
  }
  if (isExported) {
    return { label: "Export แล้ว", color: "bg-purple-100 text-purple-700" };
  }
  if (percent === 100 || doc.isComplete) {
    return { label: "เอกสารครบ", color: "bg-green-100 text-green-700" };
  }
  return { label: `${percent}%`, color: percent >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-orange-100 text-orange-700" };
}

const docTypeLabels: Record<string, string> = {
  SLIP: "สลิปโอนเงิน",
  RECEIPT: "ใบเสร็จ",
  TAX_INVOICE: "ใบกำกับภาษี",
  INVOICE: "ใบแจ้งหนี้",
  QUOTATION: "ใบเสนอราคา",
  PURCHASE_ORDER: "ใบสั่งซื้อ",
  DELIVERY_NOTE: "ใบส่งของ",
  OTHER: "อื่นๆ",
};

export function DocumentList({ documents, userRole = "STAFF", showBulkActions = true }: DocumentListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === documents.items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(documents.items.map((d) => d.id));
    }
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  if (documents.items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium mb-1">ยังไม่มีเอกสาร</h3>
          <p className="text-muted-foreground text-sm mb-4">
            เริ่มต้นด้วยการสร้างกล่องเอกสารใหม่
          </p>
          <Button asChild>
            <Link href="/documents/new">
              <Package className="mr-2 h-4 w-4" />
              สร้างกล่องใหม่
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Select All */}
      {showBulkActions && documents.items.length > 0 && (
        <div className="flex items-center gap-3">
          <Checkbox
            checked={selectedIds.length === documents.items.length}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm text-muted-foreground">
            {selectedIds.length > 0
              ? `เลือก ${selectedIds.length} จาก ${documents.items.length} รายการ`
              : "เลือกทั้งหมด"}
          </span>
        </div>
      )}

      {/* Document Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documents.items.map((doc) => (
          <div key={doc.id} className="relative">
            {showBulkActions && (
              <div
                className="absolute top-2 left-2 z-10"
                onClick={(e) => toggleSelect(doc.id, e)}
              >
                <Checkbox
                  checked={selectedIds.includes(doc.id)}
                  className="bg-background"
                />
              </div>
            )}
            <Link href={`/documents/${doc.id}`}>
              <Card className={`hover:shadow-md transition-shadow cursor-pointer h-full ${selectedIds.includes(doc.id) ? "ring-2 ring-primary" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 pl-6">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{doc.docNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {docTypeLabels[doc.docType] || doc.docType}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/documents/${doc.id}`}>ดูรายละเอียด</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/documents/${doc.id}/edit`}>แก้ไข</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Amount */}
                  <div className="mb-3">
                    <p className="text-2xl font-bold">
                      ฿{doc.totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </p>
                    {doc.category && (
                      <p className="text-sm text-muted-foreground">{doc.category.name}</p>
                    )}
                  </div>

                  {/* Files preview */}
                  {doc._count && doc._count.files > 0 && (
                    <div className="flex items-center gap-1 mb-3 text-xs text-muted-foreground">
                      <ImageIcon className="h-3 w-3" />
                      <span>{doc._count.files} ไฟล์</span>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={doc.submittedBy.avatarUrl || undefined} />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {getInitials(doc.submittedBy.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                        {doc.submittedBy.name || doc.submittedBy.email}
                      </span>
                    </div>
                    {(() => {
                      const status = getStatusDisplay(doc);
                      return (
                        <Badge className={status.color}>
                          {status.label}
                        </Badge>
                      );
                    })()}
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(doc.docDate).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {documents.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            แสดง {(documents.page - 1) * documents.pageSize + 1} -{" "}
            {Math.min(documents.page * documents.pageSize, documents.total)} จาก{" "}
            {documents.total} รายการ
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={documents.page === 1}
              asChild
            >
              <Link href={`?page=${documents.page - 1}`}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <span className="text-sm">
              หน้า {documents.page} / {documents.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={documents.page === documents.totalPages}
              asChild
            >
              <Link href={`?page=${documents.page + 1}`}>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {showBulkActions && (
        <BulkActions
          selectedIds={selectedIds}
          onClearSelection={clearSelection}
          userRole={userRole}
        />
      )}
    </div>
  );
}
