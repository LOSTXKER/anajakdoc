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
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { reviewBox } from "@/server/actions/box";
import { isAccountingRole, canReviewBox, getBoxTypeConfig, getBoxStatusConfig } from "@/lib/document-config";
import { formatDate, formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { MemberRole, SerializedBoxListItem } from "@/types";
import { DocumentStatusBadges } from "./StatusLegend";

type TabValue = "all" | "draft" | "preparing" | "submitted" | "need_docs" | "completed";

interface UnifiedDocumentViewProps {
  boxes: SerializedBoxListItem[];
  counts: {
    myBoxes: number;
    draft: number;
    preparing: number;
    submitted: number;
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
  
  // Memoize filtered box lists by status
  // Using 5-status system: DRAFT, PREPARING, SUBMITTED, NEED_DOCS, COMPLETED
  const filteredBoxes = useMemo(() => ({
    draftBoxes: boxes.filter(b => b.status === "DRAFT"),
    preparingBoxes: boxes.filter(b => b.status === "PREPARING"),
    submittedBoxes: boxes.filter(b => b.status === "SUBMITTED"),
    needDocsBoxes: boxes.filter(b => b.status === "NEED_DOCS"),
    completedBoxes: boxes.filter(b => b.status === "COMPLETED"),
  }), [boxes]);

  const { draftBoxes, preparingBoxes, submittedBoxes, needDocsBoxes, completedBoxes } = filteredBoxes;
  
  const getBoxesForTab = useCallback((tab: TabValue) => {
    switch (tab) {
      case "draft": return draftBoxes;
      case "preparing": return preparingBoxes;
      case "submitted": return submittedBoxes;
      case "need_docs": return needDocsBoxes;
      case "completed": return completedBoxes;
      default: return boxes;
    }
  }, [draftBoxes, preparingBoxes, submittedBoxes, needDocsBoxes, completedBoxes, boxes]);
  
  // Default tab - always start with "all"
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  
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
        if (box && ["SUBMITTED", "NEED_DOCS"].includes(box.status)) {
          const result = await reviewBox(id, "approve");
          if (result.success) successCount++;
        }
      }
      
      toast.success(`อนุมัติ ${successCount} รายการเรียบร้อย`);
      clearSelection();
      router.refresh();
    });
  };

  const showActions = isAccounting && (activeTab === "submitted" || activeTab === "all");
  const showCheckbox = isAccounting && activeTab === "submitted";

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
        
        {/* 1. Box Number - เลขที่ */}
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
        
        {/* 2. Date - วันที่ */}
        <TableCell className="text-muted-foreground">
          {formatDate(box.boxDate, "short")}
        </TableCell>
        
        {/* 3. Title - รายการ */}
        <TableCell className="max-w-[200px]">
          <Link href={`/documents/${box.id}`} className="hover:underline">
            <p className="truncate">{box.title || box.description || "-"}</p>
          </Link>
        </TableCell>
        
        {/* 4. Contact - คู่ค้า */}
        <TableCell className="text-muted-foreground">
          {box.contact?.name || "-"}
        </TableCell>
        
        {/* 5. Documents - เอกสาร */}
        <TableCell>
          <DocumentStatusBadges
            hasVat={box.hasVat}
            vatDocStatus={box.vatDocStatus}
            hasWht={box.hasWht}
            whtDocStatus={box.whtDocStatus}
            documentsCount={box._count?.documents || 0}
            naDocTypes={(box as any).naDocTypes || []}
            boxType={box.boxType}
            expenseType={box.expenseType}
            files={box.documents.map(d => ({ docType: d.docType }))}
          />
        </TableCell>
        
        {/* 6. Amount - จำนวนเงิน */}
        <TableCell className="text-right">
          <span className={cn("font-semibold", boxTypeConfig.amountColor)}>
            {box.boxType === "INCOME" ? "+" : "-"}฿{formatMoney(box.totalAmount)}
          </span>
        </TableCell>
        
        {/* 7. Category - หมวดหมู่ */}
        <TableCell>
          {box.category?.name && (
            <Badge variant="outline" className="text-xs">
              {box.category.name}
            </Badge>
          )}
        </TableCell>
        
        {/* 8. Status - สถานะ (workflow) */}
        <TableCell>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={cn("text-xs", boxStatusConfig.className)}>
              {boxStatusConfig.label}
            </Badge>
            {/* Reimbursement Badge */}
            {box.paymentMode === "EMPLOYEE_ADVANCE" && box.reimbursementStatus === "PENDING" && (
              <Badge variant="secondary" className="text-xs bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">
                <Wallet className="w-3 h-3 mr-1" />
                รอคืนเงิน
              </Badge>
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
              <TableHead>เอกสาร</TableHead>
              <TableHead className="text-right">จำนวนเงิน</TableHead>
              <TableHead>หมวดหมู่</TableHead>
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
      {/* Tabs - Status-based */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="bg-muted">
            {/* ทั้งหมด - First */}
            <TabsTrigger value="all" className="gap-2 data-[state=active]:bg-card">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">ทั้งหมด</span>
              <span className="text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
                {boxes.length}
              </span>
            </TabsTrigger>
            
            {/* ร่าง */}
            <TabsTrigger value="draft" className="gap-2 data-[state=active]:bg-card">
              <FileQuestion className="h-4 w-4" />
              <span className="hidden sm:inline">ร่าง</span>
              {draftBoxes.length > 0 && (
                <span className="text-xs bg-slate-500 text-white px-1.5 py-0.5 rounded-full">
                  {draftBoxes.length}
                </span>
              )}
            </TabsTrigger>
            
            {/* เตรียมเอกสาร */}
            <TabsTrigger value="preparing" className="gap-2 data-[state=active]:bg-card">
              <FileCheck className="h-4 w-4" />
              <span className="hidden sm:inline">เตรียมเอกสาร</span>
              {preparingBoxes.length > 0 && (
                <span className="text-xs bg-purple-500 text-white px-1.5 py-0.5 rounded-full">
                  {preparingBoxes.length}
                </span>
              )}
            </TabsTrigger>
            
            {/* ส่งแล้ว */}
            <TabsTrigger value="submitted" className="gap-2 data-[state=active]:bg-card">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">ส่งแล้ว</span>
              {submittedBoxes.length > 0 && (
                <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
                  {submittedBoxes.length}
                </span>
              )}
            </TabsTrigger>
            
            {/* ต้องเพิ่มเอกสาร */}
            <TabsTrigger value="need_docs" className="gap-2 data-[state=active]:bg-card">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden sm:inline">ต้องเพิ่มเอกสาร</span>
              {needDocsBoxes.length > 0 && (
                <span className="text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded-full">
                  {needDocsBoxes.length}
                </span>
              )}
            </TabsTrigger>
            
            {/* เสร็จสิ้น */}
            <TabsTrigger value="completed" className="gap-2 data-[state=active]:bg-card">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">เสร็จสิ้น</span>
              {completedBoxes.length > 0 && (
                <span className="text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                  {completedBoxes.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {/* Bulk Actions */}
            {someSelected && activeTab === "submitted" && (
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

            {/* Create Button */}
            <Button size="sm" asChild>
              <Link href="/documents/new">
                <Plus className="mr-1 h-4 w-4" />
                สร้างกล่องใหม่
              </Link>
            </Button>
          </div>
        </div>

        {/* Box Table by Status */}
        <div className="mt-4">
          {/* ทั้งหมด */}
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

          {/* ร่าง */}
          <TabsContent value="draft" className="m-0">
            {draftBoxes.length > 0 ? (
              renderTable(draftBoxes, false, false)
            ) : (
              <EmptyState
                icon={FileQuestion}
                title="ไม่มีกล่องร่าง"
                description="กล่องที่เพิ่งสร้างจะแสดงที่นี่"
              />
            )}
          </TabsContent>

          {/* เตรียมเอกสาร */}
          <TabsContent value="preparing" className="m-0">
            {preparingBoxes.length > 0 ? (
              renderTable(preparingBoxes, false, false)
            ) : (
              <EmptyState
                icon={FileCheck}
                title="ไม่มีกล่องที่กำลังเตรียมเอกสาร"
                description="กล่องที่กำลังอัปโหลดเอกสารจะแสดงที่นี่"
              />
            )}
          </TabsContent>

          {/* ส่งแล้ว */}
          <TabsContent value="submitted" className="m-0">
            {submittedBoxes.length > 0 ? (
              renderTable(submittedBoxes, showCheckbox, showActions)
            ) : (
              <EmptyState
                icon={Send}
                title="ไม่มีกล่องที่ส่งแล้ว"
                description="กล่องที่ส่งให้บัญชีตรวจสอบจะแสดงที่นี่"
              />
            )}
          </TabsContent>

          {/* ต้องเพิ่มเอกสาร */}
          <TabsContent value="need_docs" className="m-0">
            {needDocsBoxes.length > 0 ? (
              renderTable(needDocsBoxes, showCheckbox, showActions)
            ) : (
              <EmptyState
                icon={AlertCircle}
                title="ไม่มีกล่องที่ต้องเพิ่มเอกสาร"
                description="กล่องที่บัญชีขอเอกสารเพิ่มจะแสดงที่นี่"
              />
            )}
          </TabsContent>

          {/* เสร็จสิ้น */}
          <TabsContent value="completed" className="m-0">
            {completedBoxes.length > 0 ? (
              renderTable(completedBoxes, false, false)
            ) : (
              <EmptyState
                icon={CheckCircle}
                title="ไม่มีกล่องที่เสร็จสิ้น"
                description="กล่องที่ลงบัญชีเรียบร้อยแล้วจะแสดงที่นี่"
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
