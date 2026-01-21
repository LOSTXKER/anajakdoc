"use client";

import { useTransition } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Loader2,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getBoxStatusConfig } from "@/lib/document-config";

// Components
import { FullWidthProgress } from "./FullWidthProgress";
import { BoxDetailsCard } from "./BoxDetailsCard";
import { BoxSettingsDialog } from "./BoxSettingsDialog";
import { SimpleFileList } from "./SimpleFileList";
import { PaymentSection } from "@/components/payments";

// Server actions
import { updateBox } from "@/server/actions/box/update";
import { addFileToBox, deleteBoxFile } from "@/server/actions/box/files";
import { extractDocumentData } from "@/server/actions/ai-classify";

import type { SerializedBox, DocType, ExpenseType } from "@/types";

interface BoxDetailSimpleProps {
  box: SerializedBox;
  canEdit?: boolean;
  canSend?: boolean;
  canReview?: boolean;
  canDelete?: boolean;
  onSendToAccounting?: () => Promise<void>;
  onReview?: (action: "approve" | "reject" | "need_info") => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function BoxDetailSimple({
  box,
  canEdit = false,
  canSend = false,
  canReview = false,
  canDelete = false,
  onSendToAccounting,
  onReview,
  onDelete,
}: BoxDetailSimpleProps) {
  const [isPending, startTransition] = useTransition();
  
  const allFiles = box.documents?.flatMap(doc => 
    doc.files?.map(f => ({
      ...f,
      docType: doc.docType,
    })) || []
  ) || [];

  const uploadedDocTypes = new Set<DocType>(
    box.documents?.map(doc => doc.docType) || []
  );

  const statusConfig = getBoxStatusConfig(box.status);
  const hasWht = box.hasWht || false;
  const whtSent = box.whtSent || false;
  const isPaid = box.paymentStatus === "PAID" || box.paymentStatus === "PARTIAL";

  const handleBoxTypeSave = async (data: {
    expenseType: ExpenseType;
    hasWht: boolean;
    whtRate?: number;
    isMultiPayment: boolean;
    totalAmount: number;
  }) => {
    const formData = new FormData();
    formData.set("expenseType", data.expenseType);
    formData.set("hasWht", data.hasWht.toString());
    if (data.whtRate) {
      formData.set("whtRate", data.whtRate.toString());
    }
    formData.set("totalAmount", data.totalAmount.toString());
    
    const result = await updateBox(box.id, formData);
    if (!result.success) {
      throw new Error(result.error);
    }
  };

  const handleUploadFiles = async (files: File[]) => {
    let successCount = 0;
    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        
        let docType = "OTHER";
        let amount: number | undefined;
        let vatAmount: number | undefined;
        
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
        if (amount) {
          formData.append("amount", amount.toString());
        }
        if (vatAmount) {
          formData.append("vatAmount", vatAmount.toString());
        }
        
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
      throw new Error(result.error);
    }
    toast.success("ลบไฟล์สำเร็จ");
  };

  const handleAction = (action: "send" | "approve" | "reject" | "need_info" | "delete") => {
    startTransition(async () => {
      try {
        if (action === "send" && onSendToAccounting) {
          await onSendToAccounting();
          toast.success("ส่งบัญชีเรียบร้อย");
        } else if (action === "delete" && onDelete) {
          await onDelete();
          toast.success("ลบกล่องเรียบร้อย");
        } else if (onReview) {
          await onReview(action as "approve" | "reject" | "need_info");
          toast.success(
            action === "approve" ? "อนุมัติเรียบร้อย" :
            action === "reject" ? "ปฏิเสธเรียบร้อย" :
            "ขอข้อมูลเพิ่มเติมเรียบร้อย"
          );
        }
      } catch {
        toast.error("เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Full Width Progress */}
      <FullWidthProgress
        expenseType={box.expenseType}
        hasWht={hasWht}
        uploadedDocTypes={uploadedDocTypes}
        isPaid={isPaid}
        whtSent={whtSent}
      />

      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Title Section */}
            <div className="flex items-center gap-4 min-w-0">
              <Link
                href="/documents"
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-foreground truncate">
                  {box.title || box.description || `รายการ ${box.boxNumber}`}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">{box.boxNumber}</span>
                  <span className="text-muted-foreground/50">•</span>
                  <Badge variant="secondary" className={statusConfig.className}>
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {canEdit && (
                <BoxSettingsDialog
                  boxId={box.id}
                  expenseType={box.expenseType}
                  hasWht={hasWht}
                  whtRate={box.whtRate}
                  isMultiPayment={false}
                  totalAmount={box.totalAmount}
                  canEdit={canEdit}
                  onSave={handleBoxTypeSave}
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
                  {isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1.5 h-4 w-4" />}
                  ลบ
                </Button>
              )}
              
              {canSend && onSendToAccounting && (
                <Button 
                  size="sm" 
                  onClick={() => handleAction("send")} 
                  disabled={isPending}
                  className="gap-1.5"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  ส่งบัญชี
                </Button>
              )}
              
              {canReview && onReview && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleAction("need_info")} 
                    disabled={isPending} 
                    className="text-amber-600 border-amber-300 hover:bg-amber-50"
                  >
                    <HelpCircle className="mr-1.5 h-4 w-4" /> ขอข้อมูล
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleAction("reject")} 
                    disabled={isPending} 
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <XCircle className="mr-1.5 h-4 w-4" /> ปฏิเสธ
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleAction("approve")} 
                    disabled={isPending}
                    className="gap-1.5"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    อนุมัติ
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <BoxDetailsCard
              contactName={box.contact?.name}
              contactTaxId={box.contact?.taxId}
              boxDate={box.boxDate}
              dueDate={box.dueDate}
              title={box.title}
              description={box.description}
              notes={box.notes}
              totalAmount={box.totalAmount}
              vatAmount={box.vatAmount}
              whtAmount={box.whtAmount}
              whtRate={box.whtRate}
              paidAmount={box.paidAmount}
              expenseType={box.expenseType}
            />

            <SimpleFileList
              files={allFiles}
              canEdit={canEdit}
              onUploadFiles={handleUploadFiles}
              onDeleteFile={canEdit ? handleDeleteFile : undefined}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <PaymentSection
              boxId={box.id}
              totalAmount={box.totalAmount}
              paidAmount={box.paidAmount}
              paymentStatus={box.paymentStatus}
              payments={box.payments || []}
              canEdit={canEdit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
