"use client";

import { useTransition } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Loader2,
  Trash2,
  Send,
  Settings2,
  Calendar,
  Building2,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getBoxStatusConfig } from "@/lib/document-config";

import { DocumentList } from "./DocumentList";
import { DocStatusCard } from "./DocStatusCard";
import { BoxSettings } from "./BoxSettings";
import { TaskList } from "@/components/tasks";
import { ShareDialog } from "@/components/documents/share-dialog";

import { updateBox } from "@/server/actions/box/update";
import { addFileToBox, deleteBoxFile } from "@/server/actions/box/files";
import { extractDocumentData } from "@/server/actions/ai-classify";

import type { SerializedBox, DocType, TaskType, TaskStatus } from "@/types";

interface TaskItem {
  id: string;
  taskType: TaskType;
  status: TaskStatus;
  title: string;
  description: string | null;
  dueDate: Date | string | null;
  escalationLevel: number;
  assignee: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  } | null;
  createdAt: Date | string;
}

interface BoxDetailProps {
  box: SerializedBox;
  tasks?: TaskItem[];
  contacts?: { id: string; name: string }[];
  canEdit?: boolean;
  canSend?: boolean;
  canDelete?: boolean;
  onSendToAccounting?: () => Promise<void>;
  onDelete?: () => Promise<void>;
  onRefresh?: () => void;
}

export function BoxDetail({
  box,
  tasks = [],
  contacts = [],
  canEdit = false,
  canSend = false,
  canDelete = false,
  onSendToAccounting,
  onDelete,
  onRefresh,
}: BoxDetailProps) {
  const [isPending, startTransition] = useTransition();
  
  // Get all files from documents
  const allFiles = box.documents?.flatMap(doc => 
    doc.files?.map(f => ({
      ...f,
      docType: doc.docType,
    })) || []
  ) || [];

  // Document status checks
  const uploadedDocTypes = new Set<DocType>(
    box.documents?.map(doc => doc.docType) || []
  );
  
  const statusConfig = getBoxStatusConfig(box.status);
  const hasWht = box.hasWht || false;
  const hasVat = box.hasVat !== false; // default true
  
  // VAT document status
  const hasTaxInvoice = uploadedDocTypes.has("TAX_INVOICE") || uploadedDocTypes.has("TAX_INVOICE_ABB");
  const hasCashReceipt = uploadedDocTypes.has("CASH_RECEIPT") || uploadedDocTypes.has("RECEIPT");
  
  // WHT document status  
  const hasWhtDoc = uploadedDocTypes.has("WHT_SENT") || uploadedDocTypes.has("WHT_RECEIVED");
  const whtSent = box.whtSent || false;

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

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short", 
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
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
              {/* Share Button */}
              <ShareDialog boxId={box.id} boxNumber={box.boxNumber} />

              {canEdit && (
                <BoxSettings
                  boxId={box.id}
                  title={box.title}
                  expenseType={box.expenseType}
                  hasWht={hasWht}
                  whtRate={box.whtRate}
                  totalAmount={box.totalAmount}
                  contactId={box.contactId}
                  contacts={contacts}
                  canEdit={canEdit}
                  paymentMode={box.paymentMode}
                  reimbursementStatus={box.reimbursementStatus}
                />
              )}
              
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

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        
        {/* Box Info Card */}
        <div className="rounded-2xl border bg-card p-5">
          <div className="grid grid-cols-2 gap-4">
            {/* Contact */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">ผู้ติดต่อ</p>
                <p className="font-medium text-foreground truncate">
                  {box.contact?.name || "ไม่ระบุ"}
                </p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">วันที่</p>
                <p className="font-medium text-foreground">{formatDate(box.boxDate)}</p>
              </div>
            </div>
          </div>

          {/* Description/Notes */}
          {(box.description || box.notes) && (
            <div className="mt-4 pt-4 border-t flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">รายละเอียด</p>
                <p className="text-sm text-foreground">
                  {box.description || box.notes}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* VAT/WHT Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* VAT Status */}
          {hasVat && box.expenseType === "STANDARD" && (
            <DocStatusCard
              type="VAT"
              status={hasTaxInvoice ? "received" : "missing"}
              label="ใบกำกับภาษี"
              description={hasTaxInvoice ? "ได้รับเอกสารแล้ว" : "รอเอกสาร"}
            />
          )}
          
          {/* WHT Status */}
          {hasWht && (
            <DocStatusCard
              type="WHT"
              status={whtSent ? "sent" : hasWhtDoc ? "received" : "missing"}
              label="หนังสือหัก ณ ที่จ่าย"
              description={
                whtSent ? "ส่งให้คู่ค้าแล้ว" :
                hasWhtDoc ? "ออกเอกสารแล้ว รอส่ง" : 
                "รอออกเอกสาร"
              }
              amount={box.whtAmount}
              rate={box.whtRate}
            />
          )}
        </div>

        {/* Documents List */}
        <DocumentList
          files={allFiles}
          canEdit={canEdit}
          onUploadFiles={handleUploadFiles}
          onDeleteFile={canEdit ? handleDeleteFile : undefined}
        />

        {/* Task List */}
        <TaskList
          boxId={box.id}
          tasks={tasks}
          onRefresh={onRefresh}
        />

      </div>
    </div>
  );
}
