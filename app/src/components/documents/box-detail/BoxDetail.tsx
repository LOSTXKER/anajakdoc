"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Loader2,
  Trash2,
  Send,
  FileText,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getBoxStatusConfig } from "@/lib/document-config";
import {
  getPrimaryAdvance,
  getPrimaryRevert,
} from "@/lib/config/status-transitions";

import { ProcessTimeline } from "./ProcessTimeline";
import { ProcessBar } from "./ProcessBar";
import { DocumentChecklist } from "./DocumentChecklist";
import { StatusRevertDialog } from "./StatusRevertDialog";
import { AmountSummary } from "./AmountSummary";
import { BoxInfoCard } from "./BoxInfoCard";
import { PayerInfoCard } from "./PayerInfoCard";
import { ShareDialog } from "@/components/documents/ShareDialog";
import { CommentList } from "@/components/documents/comments";
import { ActivityTimeline } from "@/components/documents/ActivityTimeline";
import type { CommentData } from "@/server/actions/comment";
import type { AuditLogEntry } from "@/server/actions/audit";

import { addFileToBox, deleteBoxFile, updateFileDocType } from "@/server/actions/box/files";
import { updateBoxStatus } from "@/server/actions/box/update-status";
import { updateVatDocStatus, updateWhtDocStatus } from "@/server/actions/box/update-doc-status";
import { extractDocumentData } from "@/server/actions/ai-classify";

import type { SerializedBox, DocType, BoxStatus } from "@/types";

interface PayerInfo {
  id: string;
  payerType: "COMPANY" | "PETTY_CASH" | "MEMBER";
  amount: number;
  reimbursementStatus: "NONE" | "PENDING" | "REIMBURSED";
  reimbursedAt: string | null;
  member: {
    id: string;
    visibleName: string | null;
    bankName: string | null;
    bankAccount: string | null;
    user: {
      name: string | null;
      email: string;
    };
  } | null;
}

interface BoxDetailProps {
  box: SerializedBox;
  contacts?: { id: string; name: string }[];
  categories?: { id: string; name: string }[];
  costCenters?: { id: string; name: string; code: string }[];
  comments?: CommentData[];
  activities?: AuditLogEntry[];
  payers?: PayerInfo[];
  currentUserId?: string;
  isAdmin?: boolean;
  canEdit?: boolean;
  canSend?: boolean;
  canDelete?: boolean;
  onSendToAccounting?: () => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function BoxDetail({
  box,
  contacts = [],
  categories = [],
  costCenters = [],
  comments = [],
  activities = [],
  payers = [],
  currentUserId = "",
  isAdmin = false,
  canEdit = false,
  canSend = false,
  canDelete = false,
  onSendToAccounting,
  onDelete,
}: BoxDetailProps) {
  const [isPending, startTransition] = useTransition();
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  
  // Get all files from documents
  const allFiles = box.documents?.flatMap(doc => 
    doc.files?.map(f => ({
      ...f,
      docType: doc.docType,
    })) || []
  ) || [];
  
  const statusConfig = getBoxStatusConfig(box.status);
  const hasWht = box.hasWht || false;
  
  // Get available status transitions
  const primaryAdvance = getPrimaryAdvance(box.status);
  const primaryRevert = getPrimaryRevert(box.status);

  // Handle file upload with AI classification
  const handleUploadFiles = async (files: File[]) => {
    let successCount = 0;
    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        
        let docType = "OTHER";
        let amount: number | undefined;
        let vatAmount: number | undefined;
        
        // AI classification
        const classifyResult = await extractDocumentData(base64, file.type);
        if (classifyResult.success && classifyResult.data) {
          docType = classifyResult.data.type;
          amount = classifyResult.data.amount;
          vatAmount = classifyResult.data.vatAmount;
          toast.info(`AI จำแนก: ${classifyResult.data.reason}`);
        }
        
        const formData = new FormData();
        formData.append("file", file);
        formData.append("docType", docType);
        if (amount) formData.append("amount", amount.toString());
        if (vatAmount) formData.append("vatAmount", vatAmount.toString());
        
        const result = await addFileToBox(box.id, formData);
        if (result.success) {
          successCount++;
        } else {
          toast.error(`${file.name}: ${result.error || "อัปโหลดไม่สำเร็จ"}`);
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(`${file.name}: อัปโหลดไม่สำเร็จ`);
      }
    }
    if (successCount > 0) {
      toast.success(`อัปโหลด ${successCount} ไฟล์สำเร็จ`);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("ต้องการลบไฟล์นี้?")) return;
    
    const result = await deleteBoxFile(box.id, fileId);
    if (!result.success) {
      toast.error(result.error || "ลบไม่สำเร็จ");
      return;
    }
    toast.success("ลบไฟล์สำเร็จ");
  };

  const handleChangeDocType = async (fileId: string, newDocType: DocType) => {
    const result = await updateFileDocType(box.id, fileId, newDocType);
    if (!result.success) {
      toast.error(result.error || "เปลี่ยนประเภทไม่สำเร็จ");
      return;
    }
    toast.success(result.message || "เปลี่ยนประเภทเอกสารสำเร็จ");
  };

  const handleAction = (action: "send" | "delete") => {
    startTransition(async () => {
      try {
        if (action === "send" && onSendToAccounting) {
          await onSendToAccounting();
          toast.success("ส่งบัญชีเรียบร้อย");
        } else if (action === "delete" && onDelete) {
          await onDelete();
          toast.success("ลบกล่องเรียบร้อย");
        }
      } catch {
        toast.error("เกิดข้อผิดพลาด");
      }
    });
  };

  // Handle status advance
  const handleAdvance = async () => {
    if (!primaryAdvance) return;
    setIsStatusLoading(true);
    try {
      const result = await updateBoxStatus({
        boxId: box.id,
        newStatus: primaryAdvance.to,
      });
      if (result.success) {
        toast.success(result.message || "เปลี่ยนสถานะสำเร็จ");
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } finally {
      setIsStatusLoading(false);
    }
  };

  // Handle status revert (with reason)
  const handleRevertConfirm = async (reason: string) => {
    if (!primaryRevert) return;
    setIsStatusLoading(true);
    try {
      const result = await updateBoxStatus({
        boxId: box.id,
        newStatus: primaryRevert.to,
        reason,
      });
      if (result.success) {
        toast.success(result.message || "เปลี่ยนสถานะสำเร็จ");
        setRevertDialogOpen(false);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
        throw new Error(result.error);
      }
    } finally {
      setIsStatusLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Back + Title */}
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/documents"
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-foreground truncate">
                  {box.title || box.description || "รายการใหม่"}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-muted-foreground">{box.boxNumber}</span>
                  <Badge variant="secondary" className={cn("text-xs", statusConfig.className)}>
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Status Change Buttons */}
              {canEdit && primaryRevert && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRevertDialogOpen(true)}
                  disabled={isStatusLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">{primaryRevert.label}</span>
                </Button>
              )}
              
              {canEdit && primaryAdvance && (
                <Button
                  size="sm"
                  onClick={handleAdvance}
                  disabled={isStatusLoading}
                >
                  {isStatusLoading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : null}
                  <span className="hidden sm:inline">{primaryAdvance.label}</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}

              {/* Separator */}
              {canEdit && (primaryAdvance || primaryRevert) && (
                <div className="w-px h-6 bg-border mx-1" />
              )}

              {/* Share Button */}
              <ShareDialog boxId={box.id} boxNumber={box.boxNumber} />
              
              {canDelete && onDelete && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleAction("delete")} 
                  disabled={isPending}
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  <span className="hidden sm:inline ml-1.5">ลบ</span>
                </Button>
              )}
              
              {canSend && onSendToAccounting && (
                <Button 
                  size="sm" 
                  onClick={() => handleAction("send")} 
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span className="ml-1.5">ส่งบัญชี</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content - 2 Column Layout */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Process Bar - Shows steps with VAT/WHT tracking */}
        <ProcessBar box={box} />

        {/* 2 Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Main Content (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Document Checklist - shows requirements + uploaded files */}
            <DocumentChecklist
              box={box}
              files={allFiles}
              canEdit={canEdit}
              onUploadFiles={handleUploadFiles}
              onDeleteFile={canEdit ? handleDeleteFile : undefined}
              onChangeDocType={canEdit ? handleChangeDocType : undefined}
              onUpdateVatStatus={canEdit ? async (status) => {
                const result = await updateVatDocStatus(box.id, status);
                if (result.success) {
                  toast.success("อัปเดตสถานะใบกำกับภาษีแล้ว");
                } else {
                  toast.error(result.error || "เกิดข้อผิดพลาด");
                }
              } : undefined}
              onUpdateWhtStatus={canEdit ? async (status) => {
                const result = await updateWhtDocStatus(box.id, status);
                if (result.success) {
                  toast.success(
                    status === "REQUEST_SENT" 
                      ? "ส่งคำขอใบหัก ณ ที่จ่ายแล้ว" 
                      : "อัปเดตสถานะใบหัก ณ ที่จ่ายแล้ว"
                  );
                } else {
                  toast.error(result.error || "เกิดข้อผิดพลาด");
                }
              } : undefined}
            />

            {/* Comments Section - Below Documents */}
            <div className="rounded-2xl border bg-card p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                ความคิดเห็น
              </h3>
              <CommentList
                boxId={box.id}
                comments={comments}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
              />
            </div>
          </div>

          {/* Right Column - Sidebar (1/3 width) */}
          <div className="space-y-4">
            {/* Amount Summary Card */}
            <AmountSummary
              boxId={box.id}
              boxType={box.boxType}
              totalAmount={box.totalAmount}
              vatAmount={box.vatAmount}
              whtAmount={box.whtAmount}
              hasVat={box.hasVat}
              vatRate={box.vatRate}
              hasWht={hasWht}
              whtRate={box.whtRate}
              expenseType={box.expenseType}
              canEdit={canEdit}
            />

            {/* Box Info Card - Inline Editable */}
            <BoxInfoCard
              boxId={box.id}
              title={box.title}
              boxDate={box.boxDate}
              description={box.description}
              notes={box.notes}
              contact={box.contact}
              category={box.category}
              costCenter={box.costCenter}
              contacts={contacts}
              categories={categories}
              costCenters={costCenters}
              canEdit={canEdit}
            />

            {/* Payer Info Card - Who Paid */}
            {payers.length > 0 && (
              <PayerInfoCard
                payers={payers}
                canEdit={canEdit}
              />
            )}

            {/* Activity Timeline - Height Limited */}
            {activities.length > 0 && (
              <div className="rounded-2xl border bg-card p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <History className="h-4 w-4" />
                  ประวัติกิจกรรม
                  <span className="text-xs text-muted-foreground font-normal">
                    ({activities.length} รายการ)
                  </span>
                </h3>
                <div className="max-h-80 overflow-y-auto pr-1 scrollbar-thin">
                  <ActivityTimeline activities={activities} />
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Status Revert Dialog */}
      {primaryRevert && (
        <StatusRevertDialog
          open={revertDialogOpen}
          onOpenChange={setRevertDialogOpen}
          currentStatus={box.status}
          targetStatus={primaryRevert.to}
          onConfirm={handleRevertConfirm}
          isLoading={isStatusLoading}
        />
      )}
    </div>
  );
}
