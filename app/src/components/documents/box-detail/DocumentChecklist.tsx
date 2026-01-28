"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  Check,
  Circle,
  Upload,
  Eye,
  Trash2,
  Loader2,
  FileText,
  ImageIcon,
  FileIcon,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Paperclip,
  Undo2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getDocTypeLabel } from "@/lib/utils";
import { getRequiredDocuments, type RequiredDocument } from "@/lib/document-requirements";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getBoxStatusLabel } from "@/lib/config/status-config";
import type { SerializedBox, DocType, ExpenseType, BoxType, BoxStatus } from "@/types";

// ==================== Types ====================

interface FileItem {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  createdAt: string | Date;
  docType: DocType;
}

interface DocumentChecklistProps {
  box: SerializedBox;
  files: FileItem[];
  canEdit?: boolean;
  status?: BoxStatus;
  onUploadFiles?: (files: File[], docType: DocType) => Promise<void>;
  onDeleteFile?: (fileId: string) => Promise<void>;
  onUpdateVatStatus?: (status: "MISSING" | "NA") => Promise<void>;
  onUpdateWhtStatus?: (status: "MISSING" | "NA") => Promise<void>;
  onToggleDocTypeNA?: (docTypeId: string, isNA: boolean) => Promise<void>;
}

// ==================== Helper Functions ====================

const getFileIcon = (mimeType: string) => {
  if (mimeType?.startsWith("image/")) return ImageIcon;
  if (mimeType === "application/pdf") return FileText;
  return FileIcon;
};

const getDocTypeBadgeClass = (docType: DocType) => {
  if (docType === "TAX_INVOICE" || docType === "TAX_INVOICE_ABB") {
    return "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300";
  }
  if (docType === "SLIP_TRANSFER" || docType === "SLIP_CHEQUE") {
    return "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300";
  }
  if (docType.startsWith("WHT_")) {
    return "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300";
  }
  return "bg-muted text-muted-foreground";
};

// ==================== Reusable Action Button ====================

interface ActionButtonProps {
  canEdit: boolean;
  status?: BoxStatus;
  onClick: (e: React.MouseEvent) => void;
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
  disabledTooltip?: string;
  children: React.ReactNode;
}

function ActionButton({
  canEdit,
  status,
  onClick,
  variant = "outline",
  size = "sm",
  className,
  disabled = false,
  disabledTooltip,
  children,
}: ActionButtonProps) {
  const tooltipMessage = disabledTooltip || `สถานะ "${status ? getBoxStatusLabel(status) : "ไม่ทราบ"}" ไม่สามารถแก้ไขได้`;

  if (!canEdit) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              variant={variant}
              size={size}
              className={cn("opacity-50 cursor-not-allowed", className)}
              disabled
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipMessage}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
    >
      {children}
    </Button>
  );
}


// ==================== Main Component ====================

export function DocumentChecklist({
  box,
  files,
  canEdit = false,
  status,
  onUploadFiles,
  onDeleteFile,
  onUpdateVatStatus,
  onUpdateWhtStatus,
  onToggleDocTypeNA,
}: DocumentChecklistProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingDocTypeRef = useRef<DocType>("OTHER");
  const [isPending, startTransition] = useTransition();
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Get required documents based on box config
  const requiredDocs = getRequiredDocuments(
    box.boxType,
    box.expenseType,
    box.hasVat ?? true,
    box.hasWht ?? false
  );

  // Get all doc types that are part of required docs
  const requiredDocTypes = new Set<DocType>(
    requiredDocs.flatMap((req) => req.matchingDocTypes)
  );

  // Group files by matching requirement
  const getFilesForRequirement = (req: RequiredDocument): FileItem[] => {
    return files.filter((f) => req.matchingDocTypes.includes(f.docType));
  };

  // Get files that don't match any requirement (supporting/other docs)
  const otherFiles = files.filter((file) => {
    return !requiredDocTypes.has(file.docType);
  });

  // Calculate stats - include NA status as "complete"
  const statsUnsorted = requiredDocs.map((req) => {
    const reqFiles = getFilesForRequirement(req);
    const hasFiles = reqFiles.length > 0;
    
    // Check if marked as NA
    const isWhtType = (req.id === "wht" || req.id === "wht_incoming") && box.hasWht;
    const isVatType = req.id === "tax_invoice" && box.hasVat;
    const isWhtNA = isWhtType && box.whtDocStatus === "NA";
    const isVatNA = isVatType && box.vatDocStatus === "NA";
    const isGeneralNA = !isWhtType && !isVatType && (box.naDocTypes || []).includes(req.id);
    const isNA = isWhtNA || isVatNA || isGeneralNA;
    
    return {
      ...req,
      files: reqFiles,
      isComplete: hasFiles || isNA, // NA counts as complete
    };
  });

  // Use original order (no special sorting needed now)
  const stats = statsUnsorted;

  const requiredCount = stats.filter((s) => s.required).length;
  const completedCount = stats.filter((s) => s.required && s.isComplete).length;
  const allRequiredComplete = completedCount === requiredCount;

  // Trigger upload with specific doc type
  const triggerUpload = (docType: DocType) => {
    pendingDocTypeRef.current = docType;
    fileInputRef.current?.click();
  };

  // Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0 || !onUploadFiles) return;

    const docType = pendingDocTypeRef.current;
    startTransition(async () => {
      await onUploadFiles(Array.from(selectedFiles), docType);
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

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">เอกสาร</h3>
              <p className="text-xs text-muted-foreground">
                {completedCount}/{requiredCount} รายการที่จำเป็น
              </p>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <div className="mt-3">
          {allRequiredComplete ? (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">เอกสารครบแล้ว พร้อมส่งบัญชี</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                ยังขาดเอกสาร {requiredCount - completedCount} รายการ
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Document Checklist */}
      <div className="divide-y">
        {stats.map((item) => {
          const isExpanded = expandedSections.has(item.id) || item.files.length > 0;
          
          // Check if this is a WHT/VAT item (uses separate status fields)
          const isWhtType = (item.id === "wht" || item.id === "wht_incoming") && box.hasWht;
          const isVatType = item.id === "tax_invoice" && box.hasVat;
          
          // Check if marked as NA (no document)
          const isWhtNA = isWhtType && box.whtDocStatus === "NA";
          const isVatNA = isVatType && box.vatDocStatus === "NA";
          // For non-WHT/VAT items, check naDocTypes array
          const isGeneralNA = !isWhtType && !isVatType && (box.naDocTypes || []).includes(item.id);
          const isNA = isWhtNA || isVatNA || isGeneralNA;

          return (
            <Collapsible
              key={item.id}
              open={isExpanded}
              onOpenChange={() => item.files.length > 0 && toggleSection(item.id)}
            >
              {/* Requirement Row */}
              <div
                className={cn(
                  "flex items-center gap-3 px-5 py-3",
                  item.files.length > 0 && "cursor-pointer hover:bg-muted/30"
                )}
                onClick={() => item.files.length > 0 && toggleSection(item.id)}
              >
                {/* Status Icon */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    (item.isComplete || isNA) && "bg-emerald-100 dark:bg-emerald-900",
                    !item.isComplete && !isNA && "bg-muted"
                  )}
                >
                  {item.isComplete || isNA ? (
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground">
                      {item.label}
                    </span>
                    {item.required && !item.isComplete && !isNA && (
                      <span className="text-xs text-destructive">*จำเป็น</span>
                    )}
                    {!item.required && !isNA && (
                      <span className="text-xs text-muted-foreground">(ไม่บังคับ)</span>
                    )}
                    {item.files.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({item.files.length} ไฟล์)
                      </span>
                    )}
                    {isNA && (
                      <Badge variant="outline" className="text-[10px] h-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600">
                        ไม่มีเอกสาร
                      </Badge>
                    )}
                  </div>
                  
                  {/* Description */}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.description}
                  </p>
                </div>

                {/* Action Buttons - Simple: ไม่มี + อัปโหลด - fixed width for alignment */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Undo NA button for WHT */}
                  {isWhtNA && onUpdateWhtStatus && (
                    <ActionButton
                      canEdit={canEdit}
                      status={status}
                      onClick={() => onUpdateWhtStatus("MISSING")}
                      disabled={isPending}
                      variant="ghost"
                      className="h-7 text-xs text-muted-foreground px-2"
                    >
                      <Undo2 className="h-3 w-3 mr-1" />
                      ยกเลิก
                    </ActionButton>
                  )}
                  {/* Undo NA button for VAT */}
                  {isVatNA && onUpdateVatStatus && (
                    <ActionButton
                      canEdit={canEdit}
                      status={status}
                      onClick={() => onUpdateVatStatus("MISSING")}
                      disabled={isPending}
                      variant="ghost"
                      className="h-7 text-xs text-muted-foreground px-2"
                    >
                      <Undo2 className="h-3 w-3 mr-1" />
                      ยกเลิก
                    </ActionButton>
                  )}
                  {/* Undo NA button for general documents */}
                  {isGeneralNA && onToggleDocTypeNA && (
                    <ActionButton
                      canEdit={canEdit}
                      status={status}
                      onClick={() => onToggleDocTypeNA(item.id, false)}
                      disabled={isPending}
                      variant="ghost"
                      className="h-7 text-xs text-muted-foreground px-2"
                    >
                      <Undo2 className="h-3 w-3 mr-1" />
                      ยกเลิก
                    </ActionButton>
                  )}
                  
                  {/* "ไม่มี" button for WHT */}
                  {isWhtType && !item.isComplete && !isNA && onUpdateWhtStatus && (
                    <ActionButton
                      canEdit={canEdit}
                      status={status}
                      onClick={() => onUpdateWhtStatus("NA")}
                      disabled={isPending}
                      variant="outline"
                      className="h-7 text-xs w-[52px]"
                    >
                      ไม่มี
                    </ActionButton>
                  )}
                  {/* "ไม่มี" button for VAT */}
                  {isVatType && !item.isComplete && !isNA && onUpdateVatStatus && (
                    <ActionButton
                      canEdit={canEdit}
                      status={status}
                      onClick={() => onUpdateVatStatus("NA")}
                      disabled={isPending}
                      variant="outline"
                      className="h-7 text-xs w-[52px]"
                    >
                      ไม่มี
                    </ActionButton>
                  )}
                  {/* "ไม่มี" button for general documents */}
                  {!isWhtType && !isVatType && !item.isComplete && !isNA && onToggleDocTypeNA && (
                    <ActionButton
                      canEdit={canEdit}
                      status={status}
                      onClick={() => onToggleDocTypeNA(item.id, true)}
                      disabled={isPending}
                      variant="outline"
                      className="h-7 text-xs w-[52px]"
                    >
                      ไม่มี
                    </ActionButton>
                  )}
                  
                  {/* Upload button - show when not NA */}
                  {!isNA && onUploadFiles && (
                    <ActionButton
                      canEdit={canEdit}
                      status={status}
                      onClick={() => triggerUpload(item.matchingDocTypes[0])}
                      disabled={isPending}
                      disabledTooltip={`สถานะ "${status ? getBoxStatusLabel(status) : "ไม่ทราบ"}" ไม่สามารถอัปโหลดได้`}
                      variant="outline"
                      className="h-7 text-xs w-[76px]"
                    >
                      {isPending ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Upload className="h-3 w-3 mr-1" />
                      )}
                      อัปโหลด
                    </ActionButton>
                  )}
                  
                  {/* Expand Button for files */}
                  {item.files.length > 0 && (
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  )}
                </div>
              </div>

              {/* Files under this requirement */}
              <CollapsibleContent>
                <div className="bg-muted/30 border-t">
                  {item.files.map((file) => (
                    <FileRow
                      key={file.id}
                      file={file}
                      canEdit={canEdit}
                      isDeleting={deletingId === file.id}
                      status={status}
                      onPreview={() => setPreviewFile(file)}
                      onDelete={() => handleDelete(file.id)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}

        {/* Supporting Documents Section - Always visible */}
        <div>
          <div className="flex items-center gap-3 px-5 py-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <Paperclip className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-foreground">
                  เอกสารประกอบ
                </span>
                <span className="text-xs text-muted-foreground">(ไม่บังคับ)</span>
                {otherFiles.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({otherFiles.length} ไฟล์)
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                ใบเสนอราคา, ใบสั่งซื้อ, สัญญา, ใบส่งของ หรืออื่นๆ
              </p>
            </div>
            
            {/* Upload Button - aligned with other rows */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Placeholder for "ไม่มี" alignment */}
              <span className="h-7 w-[52px]"></span>
              {onUploadFiles && (
                <ActionButton
                  canEdit={canEdit}
                  status={status}
                  onClick={() => triggerUpload("OTHER")}
                  disabled={isPending}
                  disabledTooltip={`สถานะ "${status ? getBoxStatusLabel(status) : "ไม่ทราบ"}" ไม่สามารถอัปโหลดได้`}
                  variant="outline"
                  className="h-7 text-xs w-[76px]"
                >
                  {isPending ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Upload className="h-3 w-3 mr-1" />
                  )}
                  อัปโหลด
                </ActionButton>
              )}
            </div>
          </div>
          
          {/* Files list - always visible */}
          {otherFiles.length > 0 && (
            <div className="bg-muted/20 border-t">
              {otherFiles.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  canEdit={canEdit}
                  isDeleting={deletingId === file.id}
                  status={status}
                  onPreview={() => setPreviewFile(file)}
                  onDelete={() => handleDelete(file.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Preview Dialog */}
      <FilePreviewDialog
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
}

// ==================== Sub Components ====================

interface FileRowProps {
  file: FileItem;
  canEdit: boolean;
  isDeleting: boolean;
  status?: BoxStatus;
  onPreview: () => void;
  onDelete: () => void;
}

function FileRow({ file, canEdit, isDeleting, status, onPreview, onDelete }: FileRowProps) {
  const IconComponent = getFileIcon(file.mimeType);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-5 pl-16 py-2.5 hover:bg-muted/50 transition-colors",
        isDeleting && "opacity-50"
      )}
    >
      {/* Thumbnail */}
      <div
        className="w-10 h-10 rounded-lg bg-background border flex items-center justify-center overflow-hidden cursor-pointer shrink-0"
        onClick={onPreview}
      >
        {file.mimeType?.startsWith("image/") && file.fileUrl ? (
          <Image
            src={file.fileUrl}
            alt={file.fileName}
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        ) : (
          <IconComponent
            className={cn(
              "h-5 w-5",
              file.mimeType === "application/pdf"
                ? "text-red-500"
                : "text-muted-foreground"
            )}
          />
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">
            {file.fileName}
          </p>
        </div>
        {/* Doc Type Badge */}
        <span
          className={cn(
            "inline-block px-2 py-0.5 rounded text-xs font-medium mt-0.5",
            getDocTypeBadgeClass(file.docType)
          )}
        >
          {getDocTypeLabel(file.docType)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onPreview}
        >
          <Eye className="h-4 w-4" />
        </Button>
        {canEdit ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground/50 cursor-not-allowed"
                  disabled
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>สถานะ "{status ? getBoxStatusLabel(status) : "ไม่ทราบ"}" ไม่สามารถลบได้</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

interface FilePreviewDialogProps {
  file: FileItem | null;
  onClose: () => void;
}

function FilePreviewDialog({ file, onClose }: FilePreviewDialogProps) {
  if (!file) return null;

  return (
    <Dialog open={!!file} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{file.fileName}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-center bg-muted rounded-xl overflow-hidden min-h-[400px]">
          {file.mimeType?.startsWith("image/") && file.fileUrl ? (
            <Image
              src={file.fileUrl}
              alt={file.fileName}
              width={800}
              height={600}
              className="max-w-full max-h-[70vh] object-contain"
            />
          ) : file.mimeType === "application/pdf" && file.fileUrl ? (
            <iframe
              src={file.fileUrl}
              className="w-full h-[70vh]"
              title={file.fileName}
            />
          ) : (
            <div className="text-center p-8">
              <FileIcon className="h-16 w-16 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">ไม่สามารถแสดงตัวอย่างได้</p>
              {file.fileUrl && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.open(file.fileUrl, "_blank")}
                >
                  เปิดในแท็บใหม่
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          {/* Doc Type Badge */}
          <span
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium",
              getDocTypeBadgeClass(file.docType)
            )}
          >
            {getDocTypeLabel(file.docType)}
          </span>

          {file.fileUrl && (
            <Button
              variant="outline"
              onClick={() => window.open(file.fileUrl, "_blank")}
            >
              <Eye className="h-4 w-4 mr-1.5" />
              เปิดในแท็บใหม่
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
