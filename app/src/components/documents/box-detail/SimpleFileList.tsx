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

interface SimpleFileListProps {
  files: FileItem[];
  canEdit: boolean;
  onUploadFiles: (files: File[]) => Promise<void>;
  onDeleteFile?: (fileId: string) => Promise<void>;
}

// Get icon for file type
const getFileIcon = (mimeType: string) => {
  if (mimeType?.startsWith("image/")) {
    return ImageIcon;
  }
  if (mimeType === "application/pdf") {
    return FileText;
  }
  return FileIcon;
};

// Get doc type badge style
const getDocTypeBadgeClass = (docType: DocType) => {
  if (docType === "TAX_INVOICE" || docType === "TAX_INVOICE_ABB") {
    return "bg-primary/10 text-primary border-primary/20";
  }
  if (docType === "SLIP_TRANSFER" || docType === "SLIP_CHEQUE") {
    return "bg-primary/10 text-primary border-primary/20";
  }
  if (docType.startsWith("WHT_")) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  if (docType === "INVOICE" || docType === "RECEIPT") {
    return "bg-violet-50 text-violet-700 border-violet-200";
  }
  return "bg-muted text-muted-foreground border-border";
};

export function SimpleFileList({
  files,
  canEdit,
  onUploadFiles,
  onDeleteFile,
}: SimpleFileListProps) {
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
    await onDeleteFile(fileId);
    setDeletingId(null);
  };

  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b bg-muted/30 flex items-center justify-between">
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
            className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            เพิ่มไฟล์
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

      {/* File Grid */}
      {files.length === 0 ? (
        <div className="p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium mb-1">ยังไม่มีเอกสาร</p>
          <p className="text-sm text-muted-foreground mb-4">อัปโหลดเอกสารเพื่อเริ่มต้น</p>
          {canEdit && (
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              className="gap-1.5"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              เพิ่มเอกสาร
            </Button>
          )}
        </div>
      ) : (
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {files.map((file) => {
            const IconComponent = getFileIcon(file.mimeType);
            const isDeleting = deletingId === file.id;
            
            return (
              <div 
                key={file.id} 
                className={cn(
                  "group relative rounded-xl border bg-card overflow-hidden transition-all duration-200",
                  "hover:shadow-md hover:border-primary/30",
                  isDeleting && "opacity-50"
                )}
              >
                {/* Preview Area */}
                <div 
                  className="aspect-[4/3] bg-muted/50 flex items-center justify-center cursor-pointer overflow-hidden"
                  onClick={() => setPreviewFile(file)}
                >
                  {file.mimeType?.startsWith("image/") && file.fileUrl ? (
                    <Image
                      src={file.fileUrl}
                      alt={file.fileName}
                      width={200}
                      height={150}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <IconComponent className={cn(
                      "h-10 w-10",
                      file.mimeType === "application/pdf" ? "text-red-400" : "text-muted-foreground"
                    )} />
                  )}
                </div>
                
                {/* File Info */}
                <div className="p-3">
                  <p className="text-sm font-medium text-foreground truncate mb-1.5" title={file.fileName}>
                    {file.fileName}
                  </p>
                  <span className={cn(
                    "inline-block px-2 py-0.5 rounded-md text-xs font-medium border",
                    getDocTypeBadgeClass(file.docType)
                  )}>
                    {getDocTypeLabel(file.docType)}
                  </span>
                </div>

                {/* Hover Actions */}
                <div className={cn(
                  "absolute inset-0 bg-foreground/60 backdrop-blur-sm flex items-center justify-center gap-2 opacity-0 transition-opacity duration-200",
                  "group-hover:opacity-100"
                )}>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-10 w-10 rounded-xl"
                    onClick={() => setPreviewFile(file)}
                  >
                    <Eye className="h-5 w-5" />
                  </Button>
                  {canEdit && onDeleteFile && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-10 w-10 rounded-xl"
                      onClick={() => handleDelete(file.id)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Trash2 className="h-5 w-5 text-destructive" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Add Button Card */}
          {canEdit && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              className={cn(
                "aspect-[4/3] rounded-xl border-2 border-dashed bg-muted/30 flex flex-col items-center justify-center",
                "text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-200",
                isPending && "opacity-50 cursor-not-allowed"
              )}
            >
              {isPending ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <>
                  <Plus className="h-8 w-8 mb-1" />
                  <span className="text-sm font-medium">เพิ่มไฟล์</span>
                </>
              )}
            </button>
          )}
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
              "px-3 py-1.5 rounded-lg text-sm font-medium border",
              previewFile && getDocTypeBadgeClass(previewFile.docType)
            )}>
              {previewFile && getDocTypeLabel(previewFile.docType)}
            </span>
            
            {previewFile?.fileUrl && (
              <Button 
                variant="outline" 
                onClick={() => window.open(previewFile.fileUrl, "_blank")}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                เปิดในแท็บใหม่
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
