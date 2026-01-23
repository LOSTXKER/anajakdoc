"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  FileText,
  Plus,
  Eye,
  Trash2,
  Upload,
  Loader2,
  ImageIcon,
  FileIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getDocTypeLabel } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DocType } from "@/types";

interface FileItem {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  createdAt: string | Date;
  docType: DocType;
}

interface DocumentListProps {
  files: FileItem[];
  canEdit: boolean;
  onUploadFiles: (files: File[]) => Promise<void>;
  onDeleteFile?: (fileId: string) => Promise<void>;
}

// Get icon based on file type
const getFileIcon = (mimeType: string) => {
  if (mimeType?.startsWith("image/")) return ImageIcon;
  if (mimeType === "application/pdf") return FileText;
  return FileIcon;
};

// Doc type badge colors
const getDocTypeBadgeClass = (docType: DocType) => {
  if (docType === "TAX_INVOICE" || docType === "TAX_INVOICE_ABB") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (docType === "SLIP_TRANSFER" || docType === "SLIP_CHEQUE") {
    return "bg-blue-100 text-blue-700";
  }
  if (docType.startsWith("WHT_")) {
    return "bg-purple-100 text-purple-700";
  }
  if (docType === "RECEIPT" || docType === "CASH_RECEIPT") {
    return "bg-amber-100 text-amber-700";
  }
  return "bg-muted text-muted-foreground";
};

export function DocumentList({
  files,
  canEdit,
  onUploadFiles,
  onDeleteFile,
}: DocumentListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    startTransition(async () => {
      await onUploadFiles(Array.from(selectedFiles));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    });
  };

  const handleDelete = async (fileId: string) => {
    if (!onDeleteFile) return;
    setDeletingId(fileId);
    try {
      await onDeleteFile(fileId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">เอกสารทั้งหมด</h3>
            <p className="text-xs text-muted-foreground">{files.length} ไฟล์</p>
          </div>
        </div>
        
        {canEdit && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span className="ml-1.5">เพิ่มไฟล์</span>
          </Button>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Empty State */}
      {files.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
            <Upload className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium mb-1">ยังไม่มีเอกสาร</p>
          <p className="text-sm text-muted-foreground mb-4">อัปโหลดเอกสารเพื่อเริ่มต้น</p>
          {canEdit && (
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Plus className="h-4 w-4 mr-1.5" />
              )}
              เพิ่มเอกสาร
            </Button>
          )}
        </div>
      ) : (
        /* File List */
        <div className="divide-y">
          {files.map((file) => {
            const IconComponent = getFileIcon(file.mimeType);
            const isDeleting = deletingId === file.id;
            
            return (
              <div 
                key={file.id} 
                className={cn(
                  "flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors",
                  isDeleting && "opacity-50"
                )}
              >
                {/* Thumbnail */}
                <div 
                  className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden cursor-pointer shrink-0"
                  onClick={() => setPreviewFile(file)}
                >
                  {file.mimeType?.startsWith("image/") && file.fileUrl ? (
                    <Image
                      src={file.fileUrl}
                      alt={file.fileName}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <IconComponent className={cn(
                      "h-6 w-6",
                      file.mimeType === "application/pdf" ? "text-red-500" : "text-muted-foreground"
                    )} />
                  )}
                </div>
                
                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {file.fileName}
                  </p>
                  <span className={cn(
                    "inline-block px-2 py-0.5 rounded text-xs font-medium mt-1",
                    getDocTypeBadgeClass(file.docType)
                  )}>
                    {getDocTypeLabel(file.docType)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPreviewFile(file)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canEdit && onDeleteFile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(file.id)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">
              {previewFile?.fileName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex items-center justify-center bg-muted rounded-xl overflow-hidden min-h-[400px]">
            {previewFile?.mimeType?.startsWith("image/") && previewFile?.fileUrl ? (
              <Image
                src={previewFile.fileUrl}
                alt={previewFile.fileName}
                width={800}
                height={600}
                className="max-w-full max-h-[70vh] object-contain"
              />
            ) : previewFile?.mimeType === "application/pdf" && previewFile?.fileUrl ? (
              <iframe
                src={previewFile.fileUrl}
                className="w-full h-[70vh]"
                title={previewFile.fileName}
              />
            ) : (
              <div className="text-center p-8">
                <FileIcon className="h-16 w-16 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">ไม่สามารถแสดงตัวอย่างได้</p>
                {previewFile?.fileUrl && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => window.open(previewFile.fileUrl, "_blank")}
                  >
                    เปิดในแท็บใหม่
                  </Button>
                )}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <span className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium",
              previewFile && getDocTypeBadgeClass(previewFile.docType)
            )}>
              {previewFile && getDocTypeLabel(previewFile.docType)}
            </span>
            
            {previewFile?.fileUrl && (
              <Button 
                variant="outline" 
                onClick={() => window.open(previewFile.fileUrl, "_blank")}
              >
                <Eye className="h-4 w-4 mr-1.5" />
                เปิดในแท็บใหม่
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
