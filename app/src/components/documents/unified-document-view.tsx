"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentBoxCard } from "@/components/documents/document-box-card";
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
} from "lucide-react";
import { toast } from "sonner";
import { reviewBox } from "@/server/actions/box";
import { isAccountingRole } from "@/lib/document-config";
import type { MemberRole, SerializedBoxListItem } from "@/types";

type TabValue = "mine" | "pending" | "incomplete" | "ready" | "done" | "all";

interface UnifiedDocumentViewProps {
  boxes: SerializedBoxListItem[];
  counts: {
    myBoxes: number;
    pendingReview: number;
    needInfo: number;
    approved: number;
    exported: number;
    total: number;
    incomplete: number;
    complete: number;
  };
  userRole: MemberRole;
  userId: string;
}

export function UnifiedDocumentView({ boxes, counts, userRole, userId }: UnifiedDocumentViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isAccounting = isAccountingRole(userRole);
  
  // Filter boxes by tab
  const myBoxes = boxes.filter(b => b.createdById === userId);
  const pendingBoxes = boxes.filter(b => ["PENDING_REVIEW", "NEED_INFO"].includes(b.status));
  const incompleteBoxes = boxes.filter(b => b.docStatus === "INCOMPLETE");
  const readyBoxes = boxes.filter(b => b.status === "APPROVED");
  const doneBoxes = boxes.filter(b => ["EXPORTED"].includes(b.status));
  
  const getBoxesForTab = (tab: TabValue) => {
    switch (tab) {
      case "mine": return myBoxes;
      case "pending": return pendingBoxes;
      case "incomplete": return incompleteBoxes;
      case "ready": return readyBoxes;
      case "done": return doneBoxes;
      default: return boxes;
    }
  };
  
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
        if (box && ["PENDING_REVIEW", "NEED_INFO"].includes(box.status)) {
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

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="bg-gray-100/80">
            <TabsTrigger value="mine" className="gap-2 data-[state=active]:bg-white">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">ของฉัน</span>
              <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded-full">
                {myBoxes.length}
              </span>
            </TabsTrigger>
            {isAccounting && (
              <TabsTrigger value="pending" className="gap-2 data-[state=active]:bg-white">
                <Inbox className="h-4 w-4" />
                <span className="hidden sm:inline">รอตรวจ</span>
                {pendingBoxes.length > 0 && (
                  <span className="text-xs bg-sky-500 text-white px-1.5 py-0.5 rounded-full">
                    {pendingBoxes.length}
                  </span>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="incomplete" className="gap-2 data-[state=active]:bg-white">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden sm:inline">รอเอกสาร</span>
              {incompleteBoxes.length > 0 && (
                <span className="text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded-full">
                  {incompleteBoxes.length}
                </span>
              )}
            </TabsTrigger>
            {isAccounting && (
              <TabsTrigger value="ready" className="gap-2 data-[state=active]:bg-white">
                <FileCheck className="h-4 w-4" />
                <span className="hidden sm:inline">พร้อม</span>
                {readyBoxes.length > 0 && (
                  <span className="text-xs bg-violet-500 text-white px-1.5 py-0.5 rounded-full">
                    {readyBoxes.length}
                  </span>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="done" className="gap-2 data-[state=active]:bg-white">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">เสร็จ</span>
              <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded-full">
                {doneBoxes.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-white">
              <span className="hidden sm:inline">ทั้งหมด</span>
              <span className="sm:hidden">All</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {/* Bulk Actions */}
            {someSelected && activeTab === "pending" && (
              <>
                <span className="text-sm text-gray-500">
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

            {activeTab === "ready" && readyBoxes.length > 0 && (
              <Button size="sm" variant="outline" asChild>
                <Link href="/export">
                  <Download className="mr-1 h-4 w-4" />
                  ไป Export
                </Link>
              </Button>
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

        {/* Select All Header */}
        {showCheckbox && currentBoxes.length > 0 && (
          <div className="flex items-center gap-3 py-3 px-1 border-b">
            <Checkbox
              checked={allSelected}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-gray-500">
              {allSelected ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
            </span>
          </div>
        )}

        {/* Box List */}
        <div className="mt-4 space-y-3">
          <TabsContent value="mine" className="m-0">
            {myBoxes.length > 0 ? (
              myBoxes.map(box => (
                <DocumentBoxCard
                  key={box.id}
                  box={box}
                  showCheckbox={false}
                  showActions={false}
                />
              ))
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
              pendingBoxes.map(box => (
                <DocumentBoxCard
                  key={box.id}
                  box={box}
                  selected={selectedIds.has(box.id)}
                  onSelect={handleSelect}
                  onAction={handleAction}
                  showCheckbox={showCheckbox}
                  showActions={showActions}
                />
              ))
            ) : (
              <EmptyState
                icon={Inbox}
                title="ไม่มีกล่องรอตรวจ"
                description="กล่องเอกสารที่ส่งเข้ามาใหม่จะแสดงที่นี่"
              />
            )}
          </TabsContent>

          <TabsContent value="incomplete" className="m-0">
            {incompleteBoxes.length > 0 ? (
              incompleteBoxes.map(box => (
                <DocumentBoxCard
                  key={box.id}
                  box={box}
                  showCheckbox={false}
                  showActions={false}
                />
              ))
            ) : (
              <EmptyState
                icon={AlertCircle}
                title="ไม่มีกล่องรอเอกสาร"
                description="กล่องที่เอกสารยังไม่ครบจะแสดงที่นี่"
              />
            )}
          </TabsContent>

          <TabsContent value="ready" className="m-0">
            {readyBoxes.length > 0 ? (
              readyBoxes.map(box => (
                <DocumentBoxCard
                  key={box.id}
                  box={box}
                  showCheckbox={false}
                  showActions={false}
                />
              ))
            ) : (
              <EmptyState
                icon={FileCheck}
                title="ไม่มีกล่องพร้อม Export"
                description="กล่องที่อนุมัติแล้วจะแสดงที่นี่"
              />
            )}
          </TabsContent>

          <TabsContent value="done" className="m-0">
            {doneBoxes.length > 0 ? (
              doneBoxes.map(box => (
                <DocumentBoxCard
                  key={box.id}
                  box={box}
                  showCheckbox={false}
                  showActions={false}
                />
              ))
            ) : (
              <EmptyState
                icon={CheckCircle}
                title="ไม่มีกล่องที่เสร็จแล้ว"
                description="กล่องที่ Export แล้วจะแสดงที่นี่"
              />
            )}
          </TabsContent>

          <TabsContent value="all" className="m-0">
            {boxes.length > 0 ? (
              boxes.map(box => (
                <DocumentBoxCard
                  key={box.id}
                  box={box}
                  selected={selectedIds.has(box.id)}
                  onSelect={handleSelect}
                  onAction={handleAction}
                  showCheckbox={showCheckbox && showActions}
                  showActions={showActions}
                />
              ))
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
    </div>
  );
}
