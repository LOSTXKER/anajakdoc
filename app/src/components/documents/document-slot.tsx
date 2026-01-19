"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Receipt,
  FileCheck,
  FileText,
  File,
  Upload,
  Eye,
  MoreVertical,
  Plus,
  X,
  AlertTriangle,
  Check,
  Loader2,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import { createSubDocumentWithFile, updateSubDocumentStatus } from "@/server/actions/subdocument";
import type { SubDocType, SerializedSubDocument } from "@/types";

export type SlotStatus = "pending" | "completed" | "not_applicable" | "not_required";

interface DocumentSlotProps {
  documentId: string;
  type: SubDocType;
  label: string;
  description: string;
  required: boolean;
  status: SlotStatus;
  subDocuments: SerializedSubDocument[];
  warning?: string;
  canEdit?: boolean;
  onStatusChange?: (status: SlotStatus, reason?: string) => void;
}

const slotIcons: Partial<Record<SubDocType, typeof Receipt>> = {
  SLIP: Receipt,
  TAX_INVOICE: FileCheck,
  INVOICE: FileText,
  RECEIPT: Receipt,
  WHT_CERT_SENT: FileText,
  WHT_CERT_RECEIVED: FileText,
  QUOTATION: FileText,
  CONTRACT: FileText,
  OTHER: File,
};

const statusConfig = {
  pending: {
    bg: "bg-gray-50 border-gray-200 hover:border-primary/30",
    icon: "text-gray-400",
    badge: "bg-gray-100 text-gray-500",
    label: "รอเอกสาร",
  },
  completed: {
    bg: "bg-primary/5 border-primary/30 hover:border-primary/50",
    icon: "text-primary",
    badge: "bg-primary/10 text-primary",
    label: "มีแล้ว",
  },
  not_applicable: {
    bg: "bg-gray-50/50 border-gray-100",
    icon: "text-gray-300",
    badge: "bg-gray-100 text-gray-400",
    label: "ไม่มี",
  },
  not_required: {
    bg: "bg-transparent border-dashed border-gray-200",
    icon: "text-gray-200",
    badge: "",
    label: "",
  },
};

export function DocumentSlot({
  documentId,
  type,
  label,
  description,
  required,
  status,
  subDocuments,
  warning,
  canEdit = true,
  onStatusChange,
}: DocumentSlotProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [showNotApplicableDialog, setShowNotApplicableDialog] = useState(false);
  const [notApplicableReason, setNotApplicableReason] = useState("");
  const [showFilesDialog, setShowFilesDialog] = useState(false);

  const Icon = slotIcons[type] || File;
  const config = statusConfig[status];
  const fileCount = subDocuments.reduce((acc, doc) => acc + (doc.files?.length || 0), 0);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.set("documentId", documentId);
        formData.set("docType", type);
        formData.set("file", file);

        const result = await createSubDocumentWithFile(formData);
        if (!result.success) {
          throw new Error(result.error || "อัปโหลดไม่สำเร็จ");
        }
      }
      toast.success(`อัปโหลด ${files.length} ไฟล์สำเร็จ`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle "ไม่มี" action
  const handleNotApplicable = async () => {
    if (!notApplicableReason.trim() && required) {
      toast.error("กรุณาระบุเหตุผล");
      return;
    }

    try {
      const result = await updateSubDocumentStatus(documentId, type, "not_applicable", notApplicableReason);
      if (result.success) {
        toast.success("บันทึกเรียบร้อย");
        setShowNotApplicableDialog(false);
        setNotApplicableReason("");
        router.refresh();
        onStatusChange?.("not_applicable", notApplicableReason);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  // Handle "มีแล้ว" action (revert from not_applicable)
  const handleHaveDocument = async () => {
    try {
      const result = await updateSubDocumentStatus(documentId, type, "pending", "");
      if (result.success) {
        toast.success("เปลี่ยนสถานะเรียบร้อย");
        router.refresh();
        onStatusChange?.("pending");
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  // Don't render if not required
  if (status === "not_required") {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          "rounded-lg border p-3 transition-all",
          config.bg,
          status === "not_applicable" && "opacity-50"
        )}
      >
        {/* Header - Compact */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn("p-1.5 rounded-md bg-background/80", config.icon)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h4 className="font-medium text-sm truncate">{label}</h4>
            </div>
          </div>

          {/* Status Badge & Menu */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {status === "completed" && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary flex items-center gap-0.5">
                <Check className="h-3 w-3" />
                {fileCount}
              </span>
            )}
            {status === "pending" && required && (
              <span className="text-xs px-1.5 py-0.5 rounded border text-gray-500">รอ</span>
            )}

            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {status !== "not_applicable" && (
                    <>
                      <DropdownMenuItem asChild>
                        <label className="cursor-pointer">
                          <Upload className="h-4 w-4 mr-2" />
                          อัปโหลดไฟล์
                          <input
                            type="file"
                            accept="image/jpeg,image/png,application/pdf"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShowNotApplicableDialog(true)}>
                        <X className="h-4 w-4 mr-2" />
                        ไม่มีเอกสารนี้
                      </DropdownMenuItem>
                    </>
                  )}
                  {status === "not_applicable" && (
                    <DropdownMenuItem onClick={handleHaveDocument}>
                      <Check className="h-4 w-4 mr-2" />
                      มีเอกสารแล้ว
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* File Preview (Completed) */}
        {status === "completed" && subDocuments.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {/* Show first file only */}
            {subDocuments.slice(0, 1).flatMap((doc) =>
              doc.files?.slice(0, 1).map((file) => (
                  <a
                    key={file.id}
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-1.5 rounded-md bg-white border text-xs hover:bg-gray-50 transition-colors"
                  >
                    {file.mimeType?.startsWith("image/") ? (
                      <Image
                        src={file.fileUrl}
                        alt={file.fileName}
                        width={24}
                        height={24}
                        className="rounded object-cover"
                      />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-400" />
                    )}
                    <span className="truncate flex-1 text-gray-700">{file.fileName}</span>
                  </a>
              ))
            )}

            {/* View All / Add More inline */}
            <div className="flex gap-1.5">
              {fileCount > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs flex-1"
                  onClick={() => setShowFilesDialog(true)}
                >
                  +{fileCount - 1} ไฟล์
                </Button>
              )}
              {canEdit && (
                <label className="flex items-center justify-center gap-1 h-7 px-2 rounded-md border border-dashed cursor-pointer hover:bg-gray-50 transition-colors text-xs text-gray-400 flex-1">
                  <Plus className="h-3 w-3" />
                  เพิ่ม
                  <input
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Compact Upload Area (Pending) */}
        {status === "pending" && canEdit && (
          <label className={cn(
            "mt-2 flex items-center justify-center gap-2 py-2 rounded-md border border-dashed cursor-pointer transition-colors text-xs",
            isUploading ? "bg-primary/5 border-primary" : "hover:bg-gray-50 hover:border-primary/40"
          )}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-primary">อัปโหลด...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400">อัปโหลดไฟล์</span>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        )}

        {/* Warning - more subtle */}
        {warning && status !== "completed" && (
          <p className="mt-2 text-[10px] text-gray-400 leading-tight">
            ⚠️ {warning}
          </p>
        )}
      </div>

      {/* Not Applicable Dialog */}
      <Dialog open={showNotApplicableDialog} onOpenChange={setShowNotApplicableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ไม่มี{label}</DialogTitle>
            <DialogDescription>
              {warning && (
                <div className="mt-2 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700">{warning}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                เหตุผลที่ไม่มี{label} {required && "*"}
              </label>
              <Textarea
                placeholder="เช่น ผู้ขายไม่ได้จดทะเบียน VAT"
                value={notApplicableReason}
                onChange={(e) => setNotApplicableReason(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotApplicableDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleNotApplicable}>
              ยืนยัน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View All Files Dialog */}
      <Dialog open={showFilesDialog} onOpenChange={setShowFilesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{label} ({fileCount} ไฟล์)</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
            {subDocuments.flatMap((doc) =>
              doc.files?.map((file) => (
                <a
                  key={file.id}
                  href={file.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  {file.mimeType?.startsWith("image/") ? (
                    <Image
                      src={file.fileUrl}
                      alt={file.fileName}
                      width={48}
                      height={48}
                      className="rounded object-cover"
                    />
                  ) : (
                    <FileText className="h-10 w-10 text-gray-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.fileName}</p>
                    <p className="text-xs text-gray-500">
                      {(file.fileSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </a>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
