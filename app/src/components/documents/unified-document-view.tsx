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
} from "lucide-react";
import { toast } from "sonner";
import { reviewDocument } from "@/server/actions/document";
import { useDocumentSelection } from "@/hooks/use-document-selection";
import { useDocumentFilters, type TabValue } from "@/hooks/use-document-filters";
import { isAccountingRole } from "@/lib/document-config";
import type { MemberRole, SerializedDocumentListItem } from "@/types";

interface UnifiedDocumentViewProps {
  documents: SerializedDocumentListItem[];
  counts: {
    myDocs: number;
    pendingReview: number;
    needInfo: number;
    readyToExport: number;
    exported: number;
    booked: number;
    total: number;
  };
  userRole: MemberRole;
  userId: string;
}

export function UnifiedDocumentView({ documents, counts, userRole, userId }: UnifiedDocumentViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isAccounting = isAccountingRole(userRole);
  
  // Use custom hooks for filtering and selection
  const { myDocs, pendingDocs, readyDocs, doneDocs, getDocsForTab } = useDocumentFilters(documents, userId);
  
  // Default tab based on role
  const defaultTab: TabValue = isAccounting ? "pending" : "mine";
  const [activeTab, setActiveTab] = useState<TabValue>(defaultTab);
  
  const currentDocs = getDocsForTab(activeTab);
  
  // Use selection hook
  const {
    selectedIds,
    handleSelect,
    handleSelectAll,
    clearSelection,
    allSelected,
    someSelected,
  } = useDocumentSelection(currentDocs);

  // Action handler
  const handleAction = async (id: string, action: "approve" | "reject" | "need_info") => {
    startTransition(async () => {
      try {
        const result = await reviewDocument(id, action);
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
        const doc = documents.find(d => d.id === id);
        if (doc && ["PENDING_REVIEW", "NEED_INFO"].includes(doc.status)) {
          const result = await reviewDocument(id, "approve");
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
                {myDocs.length}
              </span>
            </TabsTrigger>
            {isAccounting && (
              <TabsTrigger value="pending" className="gap-2 data-[state=active]:bg-white">
                <Inbox className="h-4 w-4" />
                <span className="hidden sm:inline">รอตรวจ</span>
                {pendingDocs.length > 0 && (
                  <span className="text-xs bg-sky-500 text-white px-1.5 py-0.5 rounded-full">
                    {pendingDocs.length}
                  </span>
                )}
              </TabsTrigger>
            )}
            {isAccounting && (
              <TabsTrigger value="ready" className="gap-2 data-[state=active]:bg-white">
                <FileCheck className="h-4 w-4" />
                <span className="hidden sm:inline">พร้อม</span>
                {readyDocs.length > 0 && (
                  <span className="text-xs bg-violet-500 text-white px-1.5 py-0.5 rounded-full">
                    {readyDocs.length}
                  </span>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="done" className="gap-2 data-[state=active]:bg-white">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">เสร็จ</span>
              <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded-full">
                {doneDocs.length}
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

            {activeTab === "ready" && readyDocs.length > 0 && (
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
        {showCheckbox && currentDocs.length > 0 && (
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

        {/* Document List */}
        <div className="mt-4 space-y-3">
          <TabsContent value="mine" className="m-0">
            {myDocs.length > 0 ? (
              myDocs.map(doc => (
                <DocumentBoxCard
                  key={doc.id}
                  doc={doc}
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
            {pendingDocs.length > 0 ? (
              pendingDocs.map(doc => (
                <DocumentBoxCard
                  key={doc.id}
                  doc={doc}
                  selected={selectedIds.has(doc.id)}
                  onSelect={handleSelect}
                  onAction={handleAction}
                  showCheckbox={showCheckbox}
                  showActions={showActions}
                />
              ))
            ) : (
              <EmptyState
                icon={Inbox}
                title="ไม่มีเอกสารรอตรวจ"
                description="เอกสารที่ส่งเข้ามาใหม่จะแสดงที่นี่"
              />
            )}
          </TabsContent>

          <TabsContent value="ready" className="m-0">
            {readyDocs.length > 0 ? (
              readyDocs.map(doc => (
                <DocumentBoxCard
                  key={doc.id}
                  doc={doc}
                  showCheckbox={false}
                  showActions={false}
                />
              ))
            ) : (
              <EmptyState
                icon={FileCheck}
                title="ไม่มีเอกสารพร้อม Export"
                description="เอกสารที่อนุมัติแล้วจะแสดงที่นี่"
              />
            )}
          </TabsContent>

          <TabsContent value="done" className="m-0">
            {doneDocs.length > 0 ? (
              doneDocs.map(doc => (
                <DocumentBoxCard
                  key={doc.id}
                  doc={doc}
                  showCheckbox={false}
                  showActions={false}
                />
              ))
            ) : (
              <EmptyState
                icon={CheckCircle}
                title="ไม่มีเอกสารที่เสร็จแล้ว"
                description="เอกสารที่ Export หรือบันทึกบัญชีแล้วจะแสดงที่นี่"
              />
            )}
          </TabsContent>

          <TabsContent value="all" className="m-0">
            {documents.length > 0 ? (
              documents.map(doc => (
                <DocumentBoxCard
                  key={doc.id}
                  doc={doc}
                  selected={selectedIds.has(doc.id)}
                  onSelect={handleSelect}
                  onAction={handleAction}
                  showCheckbox={showCheckbox && showActions}
                  showActions={showActions}
                />
              ))
            ) : (
              <EmptyState
                icon={Package}
                title="ไม่มีเอกสาร"
                description="ยังไม่มีเอกสารในระบบ"
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
