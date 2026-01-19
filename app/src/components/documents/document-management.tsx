"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Inbox,
  FileCheck,
  Download,
  CheckCircle,
  Clock,
  FileText,
  MoreVertical,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { reviewDocument } from "@/server/actions/document";
import type { MemberRole, SerializedDocument } from "@/types";

interface DocumentManagementProps {
  documents: SerializedDocument[];
  counts: {
    pendingReview: number;
    needInfo: number;
    readyToExport: number;
    exported: number;
    booked: number;
    total: number;
  };
  userRole: MemberRole;
}

type TabValue = "pending" | "ready" | "done" | "all";

// Get status display
function getStatusBadge(status: string) {
  switch (status) {
    case "DRAFT":
      return { label: "ร่าง", variant: "secondary" as const };
    case "PENDING_REVIEW":
      return { label: "รอตรวจ", variant: "default" as const };
    case "NEED_INFO":
      return { label: "ขอข้อมูลเพิ่ม", variant: "destructive" as const };
    case "READY_TO_EXPORT":
      return { label: "พร้อม Export", variant: "default" as const };
    case "EXPORTED":
      return { label: "Export แล้ว", variant: "outline" as const };
    case "BOOKED":
      return { label: "เสร็จแล้ว", variant: "outline" as const };
    case "REJECTED":
    case "VOID":
      return { label: "ยกเลิก", variant: "secondary" as const };
    default:
      return { label: status, variant: "secondary" as const };
  }
}

function DocumentRow({ 
  doc, 
  selected, 
  onSelect, 
  onAction 
}: { 
  doc: SerializedDocument; 
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onAction: (id: string, action: "approve" | "reject" | "need_info") => void;
}) {
  const statusBadge = getStatusBadge(doc.status);
  const canReview = ["PENDING_REVIEW", "NEED_INFO"].includes(doc.status);
  
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0">
      {/* Checkbox */}
      <Checkbox
        checked={selected}
        onCheckedChange={(checked) => onSelect(doc.id, checked === true)}
      />

      {/* Main Content */}
      <Link href={`/documents/${doc.id}`} className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{doc.docNumber}</span>
              <Badge variant={statusBadge.variant} className="text-xs">
                {statusBadge.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {doc.description || "ไม่มีรายละเอียด"}
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>{doc.contact?.name || "-"}</span>
              <span>•</span>
              <span>{new Date(doc.docDate).toLocaleDateString("th-TH")}</span>
              {doc.submittedBy && (
                <>
                  <span>•</span>
                  <span>โดย {doc.submittedBy.name}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p className="font-semibold">
          ฿{doc.totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-muted-foreground">
          {doc.category?.name || "-"}
        </p>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0">
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
          {canReview && (
            <>
              <DropdownMenuItem onClick={() => onAction(doc.id, "approve")}>
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                อนุมัติ
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction(doc.id, "need_info")}>
                <HelpCircle className="mr-2 h-4 w-4 text-orange-600" />
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
  );
}

export function DocumentManagement({ documents, counts, userRole }: DocumentManagementProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabValue>("pending");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter documents by tab
  const pendingDocs = documents.filter(d => ["PENDING_REVIEW", "NEED_INFO"].includes(d.status));
  const readyDocs = documents.filter(d => d.status === "READY_TO_EXPORT");
  const doneDocs = documents.filter(d => ["EXPORTED", "BOOKED"].includes(d.status));

  const getDocsForTab = (tab: TabValue) => {
    switch (tab) {
      case "pending": return pendingDocs;
      case "ready": return readyDocs;
      case "done": return doneDocs;
      case "all": return documents;
    }
  };

  const currentDocs = getDocsForTab(activeTab);

  // Selection handlers
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
      setSelectedIds(new Set(currentDocs.map(d => d.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // Action handler
  const handleAction = async (id: string, action: "approve" | "reject" | "need_info") => {
    setIsProcessing(true);
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
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk action
  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    
    setIsProcessing(true);
    let successCount = 0;
    
    for (const id of selectedIds) {
      const doc = documents.find(d => d.id === id);
      if (doc && ["PENDING_REVIEW", "NEED_INFO"].includes(doc.status)) {
        const result = await reviewDocument(id, "approve");
        if (result.success) successCount++;
      }
    }
    
    toast.success(`อนุมัติ ${successCount} รายการเรียบร้อย`);
    setSelectedIds(new Set());
    router.refresh();
    setIsProcessing(false);
  };

  const allSelected = currentDocs.length > 0 && currentDocs.every(d => selectedIds.has(d.id));
  const someSelected = selectedIds.size > 0;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTab("pending")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Inbox className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">รอตรวจ</p>
                <p className="text-2xl font-bold">{counts.pendingReview + counts.needInfo}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTab("ready")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FileCheck className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">พร้อม Export</p>
                <p className="text-2xl font-bold">{counts.readyToExport}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTab("done")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">เสร็จแล้ว</p>
                <p className="text-2xl font-bold">{counts.exported + counts.booked}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTab("all")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileText className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ทั้งหมด</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              รอตรวจ
              {pendingDocs.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {pendingDocs.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ready" className="gap-2">
              <FileCheck className="h-4 w-4" />
              พร้อม Export
              {readyDocs.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {readyDocs.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="done" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              เสร็จแล้ว
            </TabsTrigger>
            <TabsTrigger value="all">
              ทั้งหมด
            </TabsTrigger>
          </TabsList>

          {/* Bulk Actions */}
          {someSelected && activeTab === "pending" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                เลือก {selectedIds.size} รายการ
              </span>
              <Button 
                size="sm" 
                onClick={handleBulkApprove}
                disabled={isProcessing}
              >
                <CheckCircle2 className="mr-1 h-4 w-4" />
                อนุมัติทั้งหมด
              </Button>
            </div>
          )}

          {activeTab === "ready" && readyDocs.length > 0 && (
            <Button size="sm" asChild>
              <Link href="/export">
                <Download className="mr-1 h-4 w-4" />
                ไป Export
              </Link>
            </Button>
          )}
        </div>

        {/* Document List */}
        <Card className="mt-4">
          {/* Header */}
          {currentDocs.length > 0 && (
            <div className="flex items-center gap-4 p-4 border-b bg-muted/30">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                {allSelected ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
              </span>
            </div>
          )}

          {/* Content */}
          <TabsContent value="pending" className="m-0">
            {pendingDocs.length > 0 ? (
              pendingDocs.map(doc => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  selected={selectedIds.has(doc.id)}
                  onSelect={handleSelect}
                  onAction={handleAction}
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
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  selected={selectedIds.has(doc.id)}
                  onSelect={handleSelect}
                  onAction={handleAction}
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
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  selected={selectedIds.has(doc.id)}
                  onSelect={handleSelect}
                  onAction={handleAction}
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
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  selected={selectedIds.has(doc.id)}
                  onSelect={handleSelect}
                  onAction={handleAction}
                />
              ))
            ) : (
              <EmptyState 
                icon={FileText}
                title="ไม่มีเอกสาร"
                description="ยังไม่มีเอกสารในระบบ"
              />
            )}
          </TabsContent>
        </Card>
      </Tabs>
    </div>
  );
}

function EmptyState({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: typeof Inbox;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Icon className="h-12 w-12 mb-4 opacity-50" />
      <h3 className="font-medium mb-1">{title}</h3>
      <p className="text-sm">{description}</p>
    </div>
  );
}
