"use client";

import { useRef, useState, useTransition, useCallback } from "react";
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
  Send,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getDocTypeConfig, getDocTypesForBoxType } from "@/lib/config/doc-type-config";
import { getDocTypeLabel } from "@/lib/utils";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SerializedBox, DocType, ExpenseType, BoxType } from "@/types";

// ==================== Types ====================

interface FileItem {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  createdAt: string | Date;
  docType: DocType;
}

interface RequiredDocument {
  id: string;
  docType: DocType;
  label: string;
  description: string;
  required: boolean;
  matchingDocTypes: DocType[]; // Doc types that satisfy this requirement
}

interface DocumentChecklistProps {
  box: SerializedBox;
  files: FileItem[];
  canEdit?: boolean;
  onUploadFiles?: (files: File[]) => Promise<void>;
  onDeleteFile?: (fileId: string) => Promise<void>;
  onChangeDocType?: (fileId: string, newDocType: DocType) => Promise<void>;
  onUpdateVatStatus?: (status: "RECEIVED" | "VERIFIED") => Promise<void>;
  onUpdateWhtStatus?: (status: "REQUEST_SENT" | "RECEIVED" | "VERIFIED") => Promise<void>;
}

// ==================== Helper Functions ====================

function getRequiredDocuments(
  boxType: BoxType,
  expenseType: ExpenseType | null,
  hasVat: boolean,
  hasWht: boolean
): RequiredDocument[] {
  const docs: RequiredDocument[] = [];

  if (boxType === "EXPENSE") {
    switch (expenseType) {
      case "STANDARD":
        docs.push({
          id: "tax_invoice",
          docType: "TAX_INVOICE",
          label: "ใบกำกับภาษี",
          description: "เอกสารหลักสำหรับขอคืน VAT",
          required: true,
          matchingDocTypes: ["TAX_INVOICE", "TAX_INVOICE_ABB"],
        });
        docs.push({
          id: "payment_proof",
          docType: "SLIP_TRANSFER",
          label: "หลักฐานการชำระเงิน",
          description: "สลิปโอนเงิน, เช็ค หรือ Statement",
          required: true,
          matchingDocTypes: ["SLIP_TRANSFER", "SLIP_CHEQUE", "BANK_STATEMENT", "CREDIT_CARD_STATEMENT"],
        });
        break;

      case "NO_VAT":
        docs.push({
          id: "cash_receipt",
          docType: "CASH_RECEIPT",
          label: "บิลเงินสด/ใบเสร็จ",
          description: "บิลเงินสด หรือใบเสร็จจากร้านค้า",
          required: true,
          matchingDocTypes: ["CASH_RECEIPT", "RECEIPT", "OTHER"],
        });
        docs.push({
          id: "payment_proof",
          docType: "SLIP_TRANSFER",
          label: "หลักฐานการชำระเงิน",
          description: "สลิปโอนเงิน หรือยืนยันจ่ายเงินสด",
          required: true,
          matchingDocTypes: ["SLIP_TRANSFER", "SLIP_CHEQUE", "BANK_STATEMENT"],
        });
        break;

      case "PETTY_CASH":
        docs.push({
          id: "petty_cash",
          docType: "PETTY_CASH_VOUCHER",
          label: "ใบสำคัญจ่าย/บิล",
          description: "ใบสำคัญจ่ายหรือบิลเงินสด (ถ้ามี)",
          required: false,
          matchingDocTypes: ["PETTY_CASH_VOUCHER", "CASH_RECEIPT", "RECEIPT"],
        });
        break;

      case "FOREIGN":
        docs.push({
          id: "foreign_invoice",
          docType: "FOREIGN_INVOICE",
          label: "Invoice ต่างประเทศ",
          description: "Invoice จากผู้ขายต่างประเทศ",
          required: true,
          matchingDocTypes: ["FOREIGN_INVOICE"],
        });
        docs.push({
          id: "payment_proof",
          docType: "SLIP_TRANSFER",
          label: "หลักฐานการชำระเงิน",
          description: "สลิปโอน, Statement หรือ Online Receipt",
          required: true,
          matchingDocTypes: ["SLIP_TRANSFER", "BANK_STATEMENT", "ONLINE_RECEIPT"],
        });
        break;

      default:
        docs.push({
          id: "expense_doc",
          docType: "TAX_INVOICE",
          label: "เอกสารค่าใช้จ่าย",
          description: "ใบกำกับภาษี, ใบเสร็จ หรือบิล",
          required: true,
          matchingDocTypes: ["TAX_INVOICE", "TAX_INVOICE_ABB", "RECEIPT", "CASH_RECEIPT"],
        });
        docs.push({
          id: "payment_proof",
          docType: "SLIP_TRANSFER",
          label: "หลักฐานการชำระเงิน",
          description: "สลิปโอนเงิน หรือหลักฐานการจ่าย",
          required: true,
          matchingDocTypes: ["SLIP_TRANSFER", "SLIP_CHEQUE", "BANK_STATEMENT"],
        });
    }

    if (hasWht) {
      docs.push({
        id: "wht",
        docType: "WHT_SENT",
        label: "หนังสือหัก ณ ที่จ่าย",
        description: "หนังสือรับรองการหักภาษี ณ ที่จ่าย",
        required: true,
        matchingDocTypes: ["WHT_SENT"],
      });
    }
  } else if (boxType === "INCOME") {
    docs.push({
      id: "invoice",
      docType: "INVOICE",
      label: "ใบแจ้งหนี้",
      description: "ใบแจ้งหนี้ที่ออกให้ลูกค้า",
      required: true,
      matchingDocTypes: ["INVOICE"],
    });

    if (hasVat) {
      docs.push({
        id: "tax_invoice",
        docType: "TAX_INVOICE",
        label: "ใบกำกับภาษี",
        description: "ใบกำกับภาษีที่ออกให้ลูกค้า",
        required: true,
        matchingDocTypes: ["TAX_INVOICE"],
      });
    }

    docs.push({
      id: "payment_proof",
      docType: "RECEIPT",
      label: "หลักฐานรับเงิน",
      description: "สลิปโอนเข้า หรือใบเสร็จรับเงิน",
      required: false,
      matchingDocTypes: ["RECEIPT", "SLIP_TRANSFER", "BANK_STATEMENT"],
    });

    if (hasWht) {
      docs.push({
        id: "wht_incoming",
        docType: "WHT_INCOMING",
        label: "หนังสือหัก ณ ที่จ่าย",
        description: "หนังสือหัก ณ ที่จ่ายจากลูกค้า",
        required: true,
        matchingDocTypes: ["WHT_INCOMING", "WHT_RECEIVED"],
      });
    }
  } else if (boxType === "ADJUSTMENT") {
    docs.push({
      id: "adjustment_doc",
      docType: "CREDIT_NOTE",
      label: "เอกสารประกอบ",
      description: "CN/DN หรือหลักฐานการคืนเงิน",
      required: true,
      matchingDocTypes: ["CREDIT_NOTE", "DEBIT_NOTE", "REFUND_RECEIPT", "OTHER"],
    });
  }

  return docs;
}

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


// ==================== Main Component ====================

export function DocumentChecklist({
  box,
  files,
  canEdit = false,
  onUploadFiles,
  onDeleteFile,
  onChangeDocType,
  onUpdateVatStatus,
  onUpdateWhtStatus,
}: DocumentChecklistProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);

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

  // Calculate stats
  const stats = requiredDocs.map((req) => ({
    ...req,
    files: getFilesForRequirement(req),
    isComplete: getFilesForRequirement(req).length > 0,
  }));

  const requiredCount = stats.filter((s) => s.required).length;
  const completedCount = stats.filter((s) => s.required && s.isComplete).length;
  const allRequiredComplete = completedCount === requiredCount;

  // Drag & Drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone entirely
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!onUploadFiles) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    startTransition(async () => {
      await onUploadFiles(droppedFiles);
    });
  }, [onUploadFiles]);

  // Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0 || !onUploadFiles) return;

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

      {/* Drag & Drop Zone */}
      {canEdit && onUploadFiles && (
        <div
          ref={dropZoneRef}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "mx-4 my-3 p-4 border-2 border-dashed rounded-xl transition-all cursor-pointer",
            "flex flex-col items-center justify-center gap-2",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
          )}
        >
          {isPending ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <Upload className={cn("h-6 w-6", isDragging ? "text-primary" : "text-muted-foreground")} />
          )}
          <div className="text-center">
            <p className={cn("text-sm font-medium", isDragging ? "text-primary" : "text-foreground")}>
              {isDragging ? "ปล่อยไฟล์ที่นี่" : "ลากไฟล์มาวางที่นี่"}
            </p>
            <p className="text-xs text-muted-foreground">
              หรือคลิกเพื่อเลือกไฟล์ (AI จะจำแนกประเภทให้อัตโนมัติ)
            </p>
          </div>
        </div>
      )}

      {/* Document Checklist */}
      <div className="divide-y">
        {stats.map((item) => {
          const isExpanded = expandedSections.has(item.id) || item.files.length > 0;

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
                    item.isComplete
                      ? "bg-emerald-100 dark:bg-emerald-900"
                      : "bg-muted"
                  )}
                >
                  {item.isComplete ? (
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
                    {item.required && !item.isComplete && (
                      <span className="text-xs text-destructive">*จำเป็น</span>
                    )}
                    {!item.required && (
                      <span className="text-xs text-muted-foreground">(ไม่บังคับ)</span>
                    )}
                    {item.files.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({item.files.length} ไฟล์)
                      </span>
                    )}
                    
                    {/* VAT Status Badge */}
                    {item.id === "tax_invoice" && box.hasVat && !item.isComplete && (
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-xs",
                          box.vatDocStatus === "MISSING" && "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
                          box.vatDocStatus === "RECEIVED" && "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
                          box.vatDocStatus === "VERIFIED" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
                        )}
                      >
                        {box.vatDocStatus === "MISSING" && "รอใบกำกับ"}
                        {box.vatDocStatus === "RECEIVED" && "ได้รับแล้ว"}
                        {box.vatDocStatus === "VERIFIED" && "ตรวจสอบแล้ว"}
                      </Badge>
                    )}
                    
                    {/* WHT Status Badge */}
                    {(item.id === "wht" || item.id === "wht_incoming") && box.hasWht && !item.isComplete && (
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-xs",
                          box.whtDocStatus === "MISSING" && "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
                          box.whtDocStatus === "REQUEST_SENT" && "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
                          box.whtDocStatus === "RECEIVED" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
                        )}
                      >
                        {box.whtDocStatus === "MISSING" && (
                          <><Clock className="w-3 h-3 mr-1" />รอใบหัก ณ ที่จ่าย</>
                        )}
                        {box.whtDocStatus === "REQUEST_SENT" && (
                          <><Send className="w-3 h-3 mr-1" />ส่งคำขอแล้ว</>
                        )}
                        {box.whtDocStatus === "RECEIVED" && (
                          <><CheckCircle2 className="w-3 h-3 mr-1" />ได้รับแล้ว</>
                        )}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.description}
                  </p>
                  
                  {/* WHT CTA Buttons */}
                  {(item.id === "wht" || item.id === "wht_incoming") && box.hasWht && !item.isComplete && canEdit && (
                    <div className="flex items-center gap-2 mt-2">
                      {box.whtDocStatus === "MISSING" && onUpdateWhtStatus && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateWhtStatus("REQUEST_SENT");
                            }}
                          >
                            <Send className="w-3 h-3 mr-1" />
                            ส่งคำขอ
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateWhtStatus("RECEIVED");
                            }}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            ได้รับแล้ว
                          </Button>
                        </>
                      )}
                      {box.whtDocStatus === "REQUEST_SENT" && onUpdateWhtStatus && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateWhtStatus("RECEIVED");
                          }}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          ได้รับแล้ว
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* VAT CTA Button (Mark as Received) */}
                  {item.id === "tax_invoice" && box.hasVat && !item.isComplete && canEdit && box.vatDocStatus === "MISSING" && onUpdateVatStatus && (
                    <div className="flex items-center gap-2 mt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateVatStatus("RECEIVED");
                        }}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        ได้รับแล้ว
                      </Button>
                    </div>
                  )}
                </div>

                {/* Expand Button */}
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

              {/* Files under this requirement */}
              <CollapsibleContent>
                <div className="bg-muted/30 border-t">
                  {item.files.map((file) => (
                    <FileRow
                      key={file.id}
                      file={file}
                      boxType={box.boxType}
                      canEdit={canEdit}
                      isDeleting={deletingId === file.id}
                      onPreview={() => setPreviewFile(file)}
                      onDelete={() => handleDelete(file.id)}
                      onChangeDocType={onChangeDocType}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}

        {/* Supporting Documents Section - Always show */}
        <Collapsible defaultOpen={otherFiles.length > 0}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <Paperclip className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <span className="font-medium text-sm text-foreground">
                  เอกสารประกอบ
                </span>
                <span className="text-xs text-muted-foreground ml-2">(ไม่บังคับ)</span>
                {otherFiles.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    - {otherFiles.length} ไฟล์
                  </span>
                )}
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="bg-muted/20 border-t px-5 py-3">
              {otherFiles.length > 0 ? (
                <div className="space-y-0 -mx-5 -my-3">
                  {otherFiles.map((file) => (
                    <FileRow
                      key={file.id}
                      file={file}
                      boxType={box.boxType}
                      canEdit={canEdit}
                      isDeleting={deletingId === file.id}
                      onPreview={() => setPreviewFile(file)}
                      onDelete={() => handleDelete(file.id)}
                      onChangeDocType={onChangeDocType}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  <p className="mb-2">เอกสารเพิ่มเติมที่อาจเป็นประโยชน์:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground/80">
                    <li>ใบเสนอราคา (Quotation)</li>
                    <li>ใบสั่งซื้อ (Purchase Order)</li>
                    <li>สัญญา (Contract)</li>
                    <li>ใบส่งของ (Delivery Note)</li>
                  </ul>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
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
        boxType={box.boxType}
        onClose={() => setPreviewFile(null)}
        canEdit={canEdit}
        onChangeDocType={onChangeDocType}
      />
    </div>
  );
}

// ==================== Sub Components ====================

interface FileRowProps {
  file: FileItem;
  boxType: BoxType;
  canEdit: boolean;
  isDeleting: boolean;
  onPreview: () => void;
  onDelete: () => void;
  onChangeDocType?: (fileId: string, newDocType: DocType) => Promise<void>;
}

function FileRow({ file, boxType, canEdit, isDeleting, onPreview, onDelete, onChangeDocType }: FileRowProps) {
  const docTypeOptions = getDocTypesForBoxType(boxType);
  const IconComponent = getFileIcon(file.mimeType);
  const [isChanging, setIsChanging] = useState(false);

  const handleDocTypeChange = async (newType: string) => {
    if (!onChangeDocType || newType === file.docType) return;
    setIsChanging(true);
    try {
      await onChangeDocType(file.id, newType as DocType);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-5 pl-16 py-2.5 hover:bg-muted/50 transition-colors",
        (isDeleting || isChanging) && "opacity-50"
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
        {/* Doc Type - Dropdown if editable */}
        {canEdit && onChangeDocType ? (
          <Select
            value={file.docType}
            onValueChange={handleDocTypeChange}
            disabled={isChanging}
          >
            <SelectTrigger 
              className={cn(
                "h-auto w-auto gap-1 px-2 py-0.5 mt-0.5 text-xs rounded border-0 cursor-pointer",
                "hover:ring-2 hover:ring-primary/20 transition-all",
                getDocTypeBadgeClass(file.docType)
              )}
            >
              <SelectValue>{getDocTypeLabel(file.docType)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {docTypeOptions.map((dt) => (
                <SelectItem key={dt.type} value={dt.type}>
                  {dt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span
            className={cn(
              "inline-block px-2 py-0.5 rounded text-xs font-medium mt-0.5",
              getDocTypeBadgeClass(file.docType)
            )}
          >
            {getDocTypeLabel(file.docType)}
          </span>
        )}
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
        {canEdit && (
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
        )}
      </div>
    </div>
  );
}

interface FilePreviewDialogProps {
  file: FileItem | null;
  boxType: BoxType;
  onClose: () => void;
  canEdit?: boolean;
  onChangeDocType?: (fileId: string, newDocType: DocType) => Promise<void>;
}

function FilePreviewDialog({ file, boxType, onClose, canEdit, onChangeDocType }: FilePreviewDialogProps) {
  const [isChanging, setIsChanging] = useState(false);
  const docTypeOptions = getDocTypesForBoxType(boxType);

  if (!file) return null;

  const handleDocTypeChange = async (newType: string) => {
    if (!onChangeDocType || newType === file.docType) return;
    setIsChanging(true);
    try {
      await onChangeDocType(file.id, newType as DocType);
    } finally {
      setIsChanging(false);
    }
  };

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
          {/* Doc Type - Editable dropdown in preview */}
          {canEdit && onChangeDocType ? (
            <Select
              value={file.docType}
              onValueChange={handleDocTypeChange}
              disabled={isChanging}
            >
              <SelectTrigger 
                className={cn(
                  "h-auto w-auto gap-1.5 px-3 py-1.5 text-sm rounded-lg border-0 cursor-pointer",
                  "hover:ring-2 hover:ring-primary/20 transition-all",
                  getDocTypeBadgeClass(file.docType)
                )}
              >
                <SelectValue>{getDocTypeLabel(file.docType)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {docTypeOptions.map((dt) => (
                  <SelectItem key={dt.type} value={dt.type}>
                    {dt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium",
                getDocTypeBadgeClass(file.docType)
              )}
            >
              {getDocTypeLabel(file.docType)}
            </span>
          )}

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
