"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Upload, X, FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createSubDocument, addSubDocumentFile } from "@/server/actions/subdocument";
import { uploadFile } from "@/server/actions/file";
import { extractDocumentData, type ExtractedDocumentData } from "@/server/actions/ocr";
import { SubDocType, TransactionType } from "@/types";
import Image from "next/image";

interface SubDocumentFormProps {
  documentId: string;
  transactionType: TransactionType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const expenseDocTypes: { value: SubDocType; label: string }[] = [
  { value: "SLIP", label: "🧾 สลิปโอนเงิน" },
  { value: "TAX_INVOICE", label: "📋 ใบกำกับภาษี" },
  { value: "INVOICE", label: "📄 ใบแจ้งหนี้" },
  { value: "RECEIPT", label: "🧾 ใบเสร็จรับเงิน" },
  { value: "WHT_CERT_SENT", label: "📝 หนังสือหัก ณ ที่จ่าย" },
  { value: "CONTRACT", label: "📑 สัญญา/ใบสั่งซื้อ" },
  { value: "OTHER", label: "📁 อื่นๆ" },
];

const incomeDocTypes: { value: SubDocType; label: string }[] = [
  { value: "QUOTATION", label: "💰 ใบเสนอราคา" },
  { value: "INVOICE", label: "📄 ใบแจ้งหนี้" },
  { value: "RECEIPT", label: "🧾 ใบเสร็จรับเงิน" },
  { value: "TAX_INVOICE", label: "📋 ใบกำกับภาษี" },
  { value: "WHT_CERT_RECEIVED", label: "📝 หนังสือหัก ณ ที่จ่าย (รับ)" },
  { value: "CONTRACT", label: "📑 สัญญา" },
  { value: "OTHER", label: "📁 อื่นๆ" },
];

interface FilePreview {
  file: File;
  preview: string;
}

export function SubDocumentForm({
  documentId,
  transactionType,
  open,
  onOpenChange,
  onSuccess,
}: SubDocumentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isExtracting, setIsExtracting] = useState(false);
  const [docType, setDocType] = useState<SubDocType>("SLIP");
  const [docNumber, setDocNumber] = useState("");
  const [docDate, setDocDate] = useState("");
  const [amount, setAmount] = useState("");
  const [vatAmount, setVatAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<FilePreview[]>([]);

  const docTypes = transactionType === "EXPENSE" ? expenseDocTypes : incomeDocTypes;

  // OCR Extract function
  const handleOCRExtract = async () => {
    if (files.length === 0) {
      toast.error("กรุณาเลือกไฟล์ก่อนอ่านข้อมูล");
      return;
    }

    const firstImageFile = files.find(f => f.file.type.startsWith("image/"));
    if (!firstImageFile) {
      toast.error("ไม่พบไฟล์รูปภาพสำหรับอ่าน OCR");
      return;
    }

    setIsExtracting(true);
    
    // Upload file first to get URL
    const formData = new FormData();
    formData.append("file", firstImageFile.file);
    formData.append("documentId", documentId);
    
    const uploadResult = await uploadFile(formData);
    
    if (!uploadResult.success || !uploadResult.data) {
      toast.error("ไม่สามารถอัปโหลดไฟล์ได้");
      setIsExtracting(false);
      return;
    }

    // Extract data
    const result = await extractDocumentData(uploadResult.data.url);
    setIsExtracting(false);

    if (result.success && result.data) {
      // Auto-fill form
      if (result.data.docType) {
        const mappedType = mapOCRDocType(result.data.docType);
        if (mappedType) setDocType(mappedType);
      }
      if (result.data.externalRef) setDocNumber(result.data.externalRef);
      if (result.data.docDate) setDocDate(result.data.docDate);
      if (result.data.totalAmount) setAmount(result.data.totalAmount.toString());
      if (result.data.vatAmount) setVatAmount(result.data.vatAmount.toString());
      if (result.data.description) setNotes(result.data.description);
      
      toast.success(`อ่านข้อมูลสำเร็จ (ความมั่นใจ ${Math.round(result.data.confidence * 100)}%)`);
    } else {
      toast.error(result.error || "ไม่สามารถอ่านข้อมูลได้");
    }
  };

  const mapOCRDocType = (ocrType: string): SubDocType | null => {
    const mapping: Record<string, SubDocType> = {
      SLIP: "SLIP",
      RECEIPT: "RECEIPT",
      TAX_INVOICE: "TAX_INVOICE",
      INVOICE: "INVOICE",
      OTHER: "OTHER",
    };
    return mapping[ocrType] || null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles: FilePreview[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const preview = URL.createObjectURL(file);
      newFiles.push({ file, preview });
    }
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      toast.error("กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์");
      return;
    }

    startTransition(async () => {
      // 1. Create SubDocument
      const result = await createSubDocument({
        documentId,
        docType,
        docNumber: docNumber || undefined,
        docDate: docDate ? new Date(docDate) : undefined,
        amount: amount ? parseFloat(amount) : undefined,
        notes: notes || undefined,
      });

      if (!result.success || !result.data) {
        toast.error(result.error || "เกิดข้อผิดพลาด");
        return;
      }

      const subDocumentId = result.data.id;

      // 2. Upload files
      let uploadErrors = 0;
      for (let i = 0; i < files.length; i++) {
        const { file } = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("documentId", documentId);

        const uploadResult = await uploadFile(formData);
        
        if (uploadResult.success && uploadResult.data) {
          // 3. Add file to SubDocument
          await addSubDocumentFile(subDocumentId, {
            fileName: file.name,
            fileUrl: uploadResult.data.url,
            fileSize: file.size,
            mimeType: file.type,
            pageOrder: i,
            isPrimary: i === 0,
          });
        } else {
          uploadErrors++;
        }
      }

      if (uploadErrors > 0) {
        toast.warning(`อัปโหลดไฟล์สำเร็จบางส่วน (${files.length - uploadErrors}/${files.length})`);
      } else {
        toast.success("เพิ่มเอกสารเรียบร้อย");
      }

      // Reset form
      setDocType("SLIP");
      setDocNumber("");
      setDocDate("");
      setAmount("");
      setNotes("");
      setFiles([]);
      onOpenChange(false);
      onSuccess?.();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>เพิ่มเอกสารในกล่อง</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Doc Type */}
          <div className="space-y-2">
            <Label>ประเภทเอกสาร *</Label>
            <Select value={docType} onValueChange={(v) => setDocType(v as SubDocType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {docTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Files */}
          <div className="space-y-2">
            <Label>ไฟล์เอกสาร *</Label>
            <div className="border-2 border-dashed rounded-lg p-4">
              {files.length === 0 ? (
                <label className="flex flex-col items-center justify-center cursor-pointer py-4">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวาง
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    รองรับ JPG, PNG, PDF (สูงสุด 10MB)
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="space-y-3">
                  {/* File previews */}
                  <div className="grid grid-cols-4 gap-2">
                    {files.map((f, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                          {f.file.type.startsWith("image/") ? (
                            <Image
                              src={f.preview}
                              alt={f.file.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-primary-foreground px-1 rounded">
                            หลัก
                          </span>
                        )}
                      </div>
                    ))}
                    
                    {/* Add more button */}
                    <label className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/50">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <input
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {files.length} ไฟล์ • ไฟล์แรกจะเป็นไฟล์หลัก
                    </p>
                    
                    {/* OCR Button */}
                    {files.some(f => f.file.type.startsWith("image/")) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleOCRExtract}
                        disabled={isExtracting}
                      >
                        {isExtracting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        {isExtracting ? "กำลังอ่าน..." : "อ่านข้อมูลอัตโนมัติ"}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Doc Number */}
          <div className="space-y-2">
            <Label>เลขที่เอกสาร</Label>
            <Input
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder="เช่น INV-2026-001"
            />
          </div>

          {/* Doc Date & Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>วันที่เอกสาร</Label>
              <Input
                type="date"
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>ยอดเงิน</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>หมายเหตุ</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isPending || files.length === 0}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              เพิ่มเอกสาร
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
