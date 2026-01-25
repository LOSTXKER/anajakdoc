"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BulkActions } from "@/components/documents/BulkActions";
import { EmptyState } from "@/components/ui/empty-state";
import {
  User,
  Inbox,
  FileCheck,
  CheckCircle,
  CheckCircle2,
  Download,
  Plus,
  Package,
  AlertCircle,
  Wallet,
  MoreVertical,
  Eye,
  HelpCircle,
  XCircle,
  FileQuestion,
  Send,
  Search,
  FileSearch,
} from "lucide-react";
import { toast } from "sonner";
import { reviewBox } from "@/server/actions/box";
import { isAccountingRole, canReviewBox, getBoxTypeConfig, getBoxStatusConfig } from "@/lib/document-config";
import { formatDate, formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { MemberRole, SerializedBoxListItem } from "@/types";
import { StatusLegend, DocStatusIcons } from "./StatusLegend";

type TabValue = "mine" | "pending" | "need_docs" | "tracking" | "done" | "reimburse" | "all";

interface UnifiedDocumentViewProps {
  boxes: SerializedBoxListItem[];
  counts: {
    myBoxes: number;
    draft: number;
    pending: number;
    needDocs: number;
    completed: number;
    total: number;
    vatMissing: number;
    whtMissing: number;
    reimbursePending?: number;
  };
  userRole: MemberRole;
  userId: string;
}

export function UnifiedDocumentView({ boxes, counts, userRole, userId }: UnifiedDocumentViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isAccounting = isAccountingRole(userRole);
  
  // Memoize filtered box lists to prevent recalculation on every render
  // Using simplified 4-status system: DRAFT, PENDING, NEED_DOCS, COMPLETED
  const filteredBoxes = useMemo(() => ({
    myBoxes: boxes.filter(b => b.createdById === userId),
    // รอตรวจ: PENDING เท่านั้น (แยกจาก NEED_DOCS)
    pendingBoxes: boxes.filter(b => b.status === "PENDING"),
    // ขาดเอกสาร: NEED_DOCS เท่านั้น
    needDocsBoxes: boxes.filter(b => b.status === "NEED_DOCS"),
    // เสร็จ: COMPLETED
    doneBoxes: boxes.filter(b => b.status === "COMPLETED"),
    // ติดตาม VAT/WHT: boxes that need VAT/WHT documents
    trackingBoxes: boxes.filter(b => 
      (b.hasVat && b.vatDocStatus === "MISSING") ||
      (b.hasWht && ["MISSING", "REQUEST_SENT"].includes(b.whtDocStatus))
    ),
    // รอคืนเงิน: Employee paid, pending reimbursement
    reimburseBoxes: boxes.filter(b => 
      b.paymentMode === "EMPLOYEE_ADVANCE" && b.reimbursementStatus === "PENDING"
    ),
  }), [boxes, userId]);

  const { myBoxes, pendingBoxes, needDocsBoxes, doneBoxes, trackingBoxes, reimburseBoxes } = filteredBoxes;
  
  // Tracking filter state
  const [trackingFilter, setTrackingFilter] = useState<"all" | "vat_missing" | "wht_missing" | "wht_sent">("all");
  
  // Filter tracking boxes based on dropdown
  const filteredTrackingBoxes = useMemo(() => {
    if (trackingFilter === "all") return trackingBoxes;
    if (trackingFilter === "vat_missing") return trackingBoxes.filter(b => b.hasVat && b.vatDocStatus === "MISSING");
    if (trackingFilter === "wht_missing") return trackingBoxes.filter(b => b.hasWht && b.whtDocStatus === "MISSING");
    if (trackingFilter === "wht_sent") return trackingBoxes.filter(b => b.hasWht && b.whtDocStatus === "REQUEST_SENT");
    return trackingBoxes;
  }, [trackingBoxes, trackingFilter]);
  
  const getBoxesForTab = useCallback((tab: TabValue) => {
    switch (tab) {
      case "mine": return myBoxes;
      case "pending": return pendingBoxes;
      case "need_docs": return needDocsBoxes;
      case "tracking": return filteredTrackingBoxes;
      case "done": return doneBoxes;
      case "reimburse": return reimburseBoxes;
      default: return boxes;
    }
  }, [myBoxes, pendingBoxes, needDocsBoxes, filteredTrackingBoxes, doneBoxes, reimburseBoxes, boxes]);
  
  // Default tab based on role
  const defaultTab: TabValue = isAccounting ? "pending" : "mine";
  const [activeTab, setActiveTab] = useState<TabValue>(defaultTab);
  
  const currentBoxes = getBoxesForTab(activeTab);
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(currentBoxes.map(b => b.id)));
    } else {
      setSelectedIds(new Set());
    }
  };
  
  const clearSelection = () => setSelectedIds(new Set());
  const allSelected = currentBoxes.length > 0 && selectedIds.size === currentBoxes.length;
  const someSelected = selectedIds.size > 0;

  // Action handler
  const handleAction = async (id: string, action: "approve" | "reject" | "need_info") => {
    startTransition(async () => {
      try {
        const result = await reviewBox(id, action);
        if (result.success) {
          toast.success(
            action === "approve" ? "อนุมัติเรียบร้อย" :
            action === "reject" ? "ปฏิเสธเรียบร้อย" : "ส่งขอข้อมูลเพิ่มแล้ว"
          );
          router.refresh();
        } else {
          toast.error(result.error || "เกิดข้อผิดพลาด");
        }
      } catch {
        toast.error("เกิดข้อผิดพลาด");
      }
    });
  };

  // Bulk action
  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    
    startTransition(async () => {
      let successCount = 0;
      
      for (const id of selectedIds) {
        const box = boxes.find(b => b.id === id);
        if (box && ["PENDING", "NEED_DOCS"].includes(box.status)) {
          const result = await reviewBox(id, "approve");
          if (result.success) successCount++;
        }
      }
      
      toast.success(`อนุมัติ ${successCount} รายการเรียบร้อย`);
      clearSelection();
      router.refresh();
    });
  };

  const showActions = isAccounting && (activeTab === "pending" || activeTab === "all");
  const showCheckbox = isAccounting && activeTab === "pending";

  // Render table row for a box
  const renderTableRow = (box: SerializedBoxListItem, showRowCheckbox: boolean, showRowActions: boolean) => {
    const boxTypeConfig = getBoxTypeConfig(box.boxType);
    const boxStatusConfig = getBoxStatusConfig(box.status);
    const canReview = canReviewBox(box.status);
    const BoxTypeIcon = boxTypeConfig.icon;

    return (
      <TableRow key={box.id} className="group">
        {/* Checkbox */}
        {showRowCheckbox && (
          <TableCell className="w-[40px]">
            <Checkbox
              checked={selectedIds.has(box.id)}
              onCheckedChange={(checked) => handleSelect(box.id, checked === true)}
            />
          </TableCell>
        )}
        
        {/* Box Number */}
        <TableCell>
          <Link href={`/documents/${box.id}`} className="hover:underline">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={cn("text-xs gap-1", boxTypeConfig.badgeClass)}>
                <BoxTypeIcon className="w-3 h-3" />
              </Badge>
              <span className="font-medium">{box.boxNumber}</span>
            </div>
          </Link>
        </TableCell>
        
        {/* Date */}
        <TableCell className="text-muted-foreground">
          {formatDate(box.boxDate, "short")}
        </TableCell>
        
        {/* Title */}
        <TableCell className="max-w-[200px]">
          <Link href={`/documents/${box.id}`} className="hover:underline">
            <p className="truncate">{box.title || box.description || "-"}</p>
          </Link>
        </TableCell>
        
        {/* Contact */}
        <TableCell className="text-muted-foreground">
          {box.contact?.name || "-"}
        </TableCell>
        
        {/* Category */}
        <TableCell>
          {box.category?.name && (
            <Badge variant="outline" className="text-xs">
              {box.category.name}
            </Badge>
          )}
        </TableCell>
        
        {/* Amount */}
        <TableCell className="text-right">
          <span className={cn("font-semibold", boxTypeConfig.amountColor)}>
            {box.boxType === "INCOME" ? "+" : "-"}฿{formatMoney(box.totalAmount)}
          </span>
        </TableCell>
        
        {/* Status */}
        <TableCell>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={cn("text-xs", boxStatusConfig.className)}>
              {boxStatusConfig.label}
            </Badge>
            {/* VAT/WHT Status Icons with Tooltips */}
            <DocStatusIcons 
              hasVat={box.hasVat}
              vatDocStatus={box.vatDocStatus}
              hasWht={box.hasWht}
              whtDocStatus={box.whtDocStatus}
            />
            {/* Reimbursement Icon */}
            {box.paymentMode === "EMPLOYEE_ADVANCE" && box.reimbursementStatus === "PENDING" && (
              <span title="รอเบิกคืนเงิน" className="cursor-help">
                <Wallet className="w-4 h-4 text-orange-500" />
              </span>
            )}
          </div>
        </TableCell>
        
        {/* Actions */}
        <TableCell className="w-[50px]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
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
              {showRowActions && canReview && (
                <>
                  <DropdownMenuItem onClick={() => handleAction(box.id, "approve")}>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                    อนุมัติ
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction(box.id, "need_info")}>
                    <HelpCircle className="mr-2 h-4 w-4 text-amber-600" />
                    ขอข้อมูลเพิ่ม
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction(box.id, "reject")}>
                    <XCircle className="mr-2 h-4 w-4 text-red-600" />
                    ปฏิเสธ
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  };

  // Render table with data
  const renderTable = (data: SerializedBoxListItem[], showTableCheckbox: boolean, showTableActions: boolean) => {
    if (data.length === 0) return null;
    
    return (
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {showTableCheckbox && (
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead>เลขที่</TableHead>
              <TableHead>วันที่</TableHead>
              <TableHead>รายการ</TableHead>
              <TableHead>คู่ค้า</TableHead>
              <TableHead>หมวดหมู่</TableHead>
              <TableHead className="text-right">จำนวนเงิน</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map(box => renderTableRow(box, showTableCheckbox, showTableActions))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Status Legend - คำอธิบายสถานะ */}
      <StatusLegend showVatWht={isAccounting} />
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="bg-muted">
            <TabsTrigger value="mine" className="gap-2 data-[state=active]:bg-card">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">ของฉัน</span>
              <span className="text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
                {myBoxes.length}
              </span>
            </TabsTrigger>
            {isAccounting && (
              <TabsTrigger value="pending" className="gap-2 data-[state=active]:bg-card">
                <Inbox className="h-4 w-4" />
                <span className="hidden sm:inline">รอตรวจ</span>
                {pendingBoxes.length > 0 && (
                  <span className="text-xs bg-sky-500 text-white px-1.5 py-0.5 rounded-full">
                    {pendingBoxes.length}
                  </span>
                )}
              </TabsTrigger>
            )}
            {isAccounting && (
              <TabsTrigger value="need_docs" className="gap-2 data-[state=active]:bg-card">
                <AlertCircle className="h-4 w-4" />
                <span className="hidden sm:inline">ขาดเอกสาร</span>
                {needDocsBoxes.length > 0 && (
                  <span className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full">
                    {needDocsBoxes.length}
                  </span>
                )}
              </TabsTrigger>
            )}
            {isAccounting && (
              <TabsTrigger value="tracking" className="gap-2 data-[state=active]:bg-card">
                <FileSearch className="h-4 w-4" />
                <span className="hidden sm:inline">ติดตาม VAT/WHT</span>
                {trackingBoxes.length > 0 && (
                  <span className="text-xs bg-purple-500 text-white px-1.5 py-0.5 rounded-full">
                    {trackingBoxes.length}
                  </span>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="done" className="gap-2 data-[state=active]:bg-card">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">เสร็จ</span>
              <span className="text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
                {doneBoxes.length}
              </span>
            </TabsTrigger>
            {isAccounting && (
              <TabsTrigger value="reimburse" className="gap-2 data-[state=active]:bg-card">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">รอคืนเงิน</span>
                {reimburseBoxes.length > 0 && (
                  <span className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full">
                    {reimburseBoxes.length}
                  </span>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="all" className="data-[state=active]:bg-card">
              <span className="hidden sm:inline">ทั้งหมด</span>
              <span className="sm:hidden">All</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {/* Bulk Actions */}
            {someSelected && activeTab === "pending" && (
              <>
                <span className="text-sm text-muted-foreground">
                  เลือก {selectedIds.size} รายการ
                </span>
                <Button 
                  size="sm" 
                  onClick={handleBulkApprove}
                  disabled={isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  อนุมัติทั้งหมด
                </Button>
              </>
            )}

            {/* Tracking Filter Dropdown */}
            {activeTab === "tracking" && (
              <Select value={trackingFilter} onValueChange={(v) => setTrackingFilter(v as typeof trackingFilter)}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="กรองตาม..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="vat_missing">ขาดใบ VAT</SelectItem>
                  <SelectItem value="wht_missing">ขาดใบ WHT</SelectItem>
                  <SelectItem value="wht_sent">ส่งคำขอ WHT แล้ว</SelectItem>
                </SelectContent>
              </Select>
            )}

            {activeTab === "mine" && (
              <Button size="sm" asChild>
                <Link href="/documents/new">
                  <Plus className="mr-1 h-4 w-4" />
                  สร้างกล่องใหม่
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Box Table */}
        <div className="mt-4">
          <TabsContent value="mine" className="m-0">
            {myBoxes.length > 0 ? (
              renderTable(myBoxes, false, false)
            ) : (
              <EmptyState
                icon={Package}
                title="ยังไม่มีกล่องเอกสาร"
                description="เริ่มสร้างกล่องเอกสารแรกของคุณ"
                action={
                  <Button asChild>
                    <Link href="/documents/new">
                      <Plus className="mr-2 h-4 w-4" />
                      สร้างกล่องใหม่
                    </Link>
                  </Button>
                }
              />
            )}
          </TabsContent>

          <TabsContent value="pending" className="m-0">
            {pendingBoxes.length > 0 ? (
              renderTable(pendingBoxes, showCheckbox, showActions)
            ) : (
              <EmptyState
                icon={Inbox}
                title="ไม่มีกล่องรอตรวจ"
                description="กล่องเอกสารที่ส่งเข้ามาใหม่จะแสดงที่นี่"
              />
            )}
          </TabsContent>

          <TabsContent value="need_docs" className="m-0">
            {needDocsBoxes.length > 0 ? (
              renderTable(needDocsBoxes, showCheckbox, showActions)
            ) : (
              <EmptyState
                icon={AlertCircle}
                title="ไม่มีกล่องที่ขาดเอกสาร"
                description="กล่องที่ต้องเพิ่มเอกสารจะแสดงที่นี่"
              />
            )}
          </TabsContent>

          <TabsContent value="tracking" className="m-0">
            {filteredTrackingBoxes.length > 0 ? (
              renderTable(filteredTrackingBoxes, false, false)
            ) : (
              <EmptyState
                icon={Search}
                title="ไม่มีเอกสารที่ต้องติดตาม"
                description="กล่องที่ขาดใบ VAT หรือใบหัก ณ ที่จ่ายจะแสดงที่นี่"
              />
            )}
          </TabsContent>

          <TabsContent value="done" className="m-0">
            {doneBoxes.length > 0 ? (
              renderTable(doneBoxes, false, false)
            ) : (
              <EmptyState
                icon={CheckCircle}
                title="ไม่มีกล่องที่เสร็จแล้ว"
                description="กล่องที่ Export แล้วจะแสดงที่นี่"
              />
            )}
          </TabsContent>

          <TabsContent value="reimburse" className="m-0">
            {reimburseBoxes.length > 0 ? (
              renderTable(reimburseBoxes, isAccounting, false)
            ) : (
              <EmptyState
                icon={Wallet}
                title="ไม่มีรายการรอคืนเงิน"
                description="รายการที่พนักงานสำรองจ่ายจะแสดงที่นี่"
              />
            )}
          </TabsContent>

          <TabsContent value="all" className="m-0">
            {boxes.length > 0 ? (
              renderTable(boxes, showCheckbox && showActions, showActions)
            ) : (
              <EmptyState
                icon={Package}
                title="ไม่มีกล่องเอกสาร"
                description="ยังไม่มีกล่องเอกสารในระบบ"
                action={
                  <Button asChild>
                    <Link href="/documents/new">
                      <Plus className="mr-2 h-4 w-4" />
                      สร้างกล่องใหม่
                    </Link>
                  </Button>
                }
              />
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Floating Bulk Actions Bar */}
      {someSelected && isAccounting && (
        <BulkActions
          selectedIds={Array.from(selectedIds)}
          onClearSelection={clearSelection}
          userRole={userRole}
        />
      )}
    </div>
  );
}
