"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    bg: "bg-orange-50 border-orange-200 hover:border-orange-300",
    icon: "text-orange-500",
    badge: "bg-orange-100 text-orange-700",
    label: "รอเอกสาร",
  },
  completed: {
    bg: "bg-green-50 border-green-200 hover:border-green-300",
    icon: "text-green-500",
    badge: "bg-green-100 text-green-700",
    label: "มีแล้ว",
  },
  not_applicable: {
    bg: "bg-gray-50 border-gray-200",
    icon: "text-gray-400",
    badge: "bg-gray-100 text-gray-500",
    label: "ไม่มี",
  },
  not_required: {
    bg: "bg-transparent border-dashed border-gray-200",
    icon: "text-gray-300",
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
          "rounded-xl border-2 p-4 transition-all",
          config.bg,
          status === "not_applicable" && "opacity-60"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg bg-white shadow-sm", config.icon)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium text-sm">{label}</h4>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>

          {/* Status Badge & Menu */}
          <div className="flex items-center gap-1">
            {status === "completed" && (
              <Badge className={config.badge}>
                <Check className="h-3 w-3 mr-1" />
                {fileCount} ไฟล์
              </Badge>
            )}
            {status === "pending" && required && (
              <Badge className={config.badge}>รอ</Badge>
            )}
            {status === "not_applicable" && (
              <Badge className={config.badge}>
                <Ban className="h-3 w-3 mr-1" />
                ไม่มี
              </Badge>
            )}

            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
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

        {/* File Preview / Upload Area */}
        {status === "completed" && subDocuments.length > 0 && (
          <div className="space-y-2">
            {/* Show first 2 files */}
            <div className="grid grid-cols-2 gap-2">
              {subDocuments.slice(0, 2).flatMap((doc) =>
                doc.files?.slice(0, 2).map((file) => (
                  <a
                    key={file.id}
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg bg-white border hover:bg-muted/50 transition-colors"
                  >
                    {file.mimeType?.startsWith("image/") ? (
                      <Image
                        src={file.fileUrl}
                        alt={file.fileName}
                        width={32}
                        height={32}
                        className="rounded object-cover"
                      />
                    ) : (
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    )}
                    <span className="text-xs truncate flex-1">{file.fileName}</span>
                  </a>
                ))
              )}
            </div>

            {/* View All Button */}
            {fileCount > 2 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setShowFilesDialog(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                ดูทั้งหมด ({fileCount} ไฟล์)
              </Button>
            )}

            {/* Add More */}
            {canEdit && (
              <label className="flex items-center justify-center gap-2 py-2 rounded-lg border-2 border-dashed cursor-pointer hover:bg-white/50 transition-colors">
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">เพิ่มไฟล์</span>
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
        )}

        {/* Upload Area (Pending) */}
        {status === "pending" && canEdit && (
          <label className={cn(
            "flex flex-col items-center justify-center gap-2 py-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors",
            isUploading ? "bg-primary/5 border-primary" : "hover:bg-white/50 hover:border-primary/50"
          )}>
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-primary">กำลังอัปโหลด...</span>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  คลิกเพื่ออัปโหลด หรือลากไฟล์มาวาง
                </span>
                <span className="text-xs text-muted-foreground">
                  รองรับ JPG, PNG, PDF
                </span>
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

        {/* Not Applicable Message */}
        {status === "not_applicable" && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <Ban className="h-6 w-6 mx-auto mb-2 opacity-50" />
            ไม่มีเอกสารนี้
          </div>
        )}

        {/* Warning */}
        {warning && status !== "completed" && (
          <div className="mt-3 flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">{warning}</p>
          </div>
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
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
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
                    <FileText className="h-10 w-10 text-muted-foreground" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.fileName}</p>
                    <p className="text-xs text-muted-foreground">
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
