"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createDocument, getPendingBoxes, addFileToExistingBox } from "@/server/actions/document";
import { 
  extractDocumentData, 
  findMatchingDocumentBox,
  type ExtractedDocumentData,
  type DocumentBoxMatch,
  type MatchResult,
} from "@/server/actions/ai-classify";
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
  Upload,
  FileText,
  Loader2,
  ArrowLeft,
  Check,
  X,
  Sparkles,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Package,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ContactInput, type ContactOption } from "@/components/documents/contact-input";
import { BoxMatchPanel } from "@/components/documents/box-match-panel";
import { formatMoney, getTodayForInput } from "@/lib/formatters";
import { getSubDocTypeConfig } from "@/lib/document-config";
import type { Category, Contact } from ".prisma/client";
import type { SubDocType } from "@/types";

// Step in the flow
type FlowStep = "upload" | "review" | "confirm";

// Extracted file with AI data
interface ExtractedFile {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "analyzing" | "done" | "error";
  extractedData?: ExtractedDocumentData;
  error?: string;
}

interface UploadFirstFormProps {
  categories: Category[];
  contacts: Contact[];
}

export function UploadFirstForm({
  categories,
  contacts: initialContacts,
}: UploadFirstFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Flow state
  const [step, setStep] = useState<FlowStep>("upload");
  const [transactionType, setTransactionType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  
  // Files state
  const [files, setFiles] = useState<ExtractedFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Form state (populated from AI)
  const [amount, setAmount] = useState("");
  const [docDate, setDocDate] = useState(getTodayForInput());
  const [description, setDescription] = useState("");
  const [contactName, setContactName] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [notes, setNotes] = useState("");
  
  // Contacts state
  const [contacts, setContacts] = useState<ContactOption[]>(
    initialContacts.map(c => ({
      id: c.id,
      name: c.name,
      taxId: c.taxId || undefined,
      contactType: c.contactType,
    }))
  );

  // Matching state
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [pendingBoxes, setPendingBoxes] = useState<Array<{
    id: string;
    docNumber: string;
    description: string | null;
    totalAmount: number;
    docDate: Date;
    contactId: string | null;
    contactName: string | null;
    contactTaxId: string | null;
    hasSlip: boolean;
    hasTaxInvoice: boolean;
  }>>([]);

  // Load pending boxes on mount
  useEffect(() => {
    async function loadPendingBoxes() {
      const result = await getPendingBoxes(transactionType);
      if (result.success && result.data) {
        setPendingBoxes(result.data);
      }
    }
    loadPendingBoxes();
  }, [transactionType]);

  // Handle file drop/select
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles: ExtractedFile[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const id = `file-${Date.now()}-${i}`;
      
      // Create preview
      const preview = file.type.startsWith("image/") 
        ? URL.createObjectURL(file)
        : "";

      newFiles.push({
        id,
        file,
        preview,
        status: "pending",
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
    
    // Start analyzing
    setIsAnalyzing(true);
    
    let firstExtractedData: ExtractedDocumentData | null = null;
    
    for (const extractedFile of newFiles) {
      const data = await analyzeFile(extractedFile);
      if (data && !firstExtractedData) {
        firstExtractedData = data;
      }
    }
    
    setIsAnalyzing(false);
    
    // Try to find matching boxes
    if (firstExtractedData && pendingBoxes.length > 0) {
      setIsMatching(true);
      const match = await findMatchingDocumentBox(firstExtractedData, pendingBoxes);
      setMatchResult(match);
      setIsMatching(false);
    }
    
    // Move to review step if we have results
    setStep("review");
    
    // Reset input
    e.target.value = "";
  }, [pendingBoxes]);

  // Analyze a single file with AI - returns extracted data
  const analyzeFile = async (extractedFile: ExtractedFile): Promise<ExtractedDocumentData | null> => {
    setFiles(prev => prev.map(f => 
      f.id === extractedFile.id ? { ...f, status: "analyzing" } : f
    ));

    try {
      // Convert file to base64
      const base64 = await fileToBase64(extractedFile.file);
      
      // Call AI extraction (full data, not just classification)
      const result = await extractDocumentData(base64, extractedFile.file.type);
      
      if (result.success && result.data) {
        setFiles(prev => prev.map(f => 
          f.id === extractedFile.id 
            ? { ...f, status: "done", extractedData: result.data } 
            : f
        ));
        
        // Auto-fill form from first successful result
        const data = result.data;
        if (data.amount && !amount) setAmount(data.amount.toString());
        if (data.documentDate && docDate === getTodayForInput()) setDocDate(data.documentDate);
        if (data.description && !description) setDescription(data.description);
        if (data.contactName && !contactName) setContactName(data.contactName);
        
        return data;
      } else {
        setFiles(prev => prev.map(f => 
          f.id === extractedFile.id 
            ? { ...f, status: "error", error: result.error || "วิเคราะห์ไม่สำเร็จ" } 
            : f
        ));
        return null;
      }
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === extractedFile.id 
          ? { ...f, status: "error", error: "เกิดข้อผิดพลาด" } 
          : f
      ));
      return null;
    }
  };

  // Remove file
  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter(f => f.id !== id);
    });
  };

  // Reanalyze file
  const reanalyzeFile = async (id: string) => {
    const file = files.find(f => f.id === id);
    if (file) {
      await analyzeFile(file);
    }
  };

  // Handle contact change
  const handleContactChange = (value: string, contactId?: string) => {
    setContactName(value);
    setSelectedContactId(contactId || "");
  };

  // Handle contact created
  const handleContactCreated = (contact: ContactOption) => {
    setContacts(prev => [...prev, contact]);
    setSelectedContactId(contact.id);
    setContactName(contact.name);
  };

  // Add to existing box
  const handleAddToExistingBox = async (documentId: string) => {
    if (files.length === 0) {
      toast.error("กรุณาอัปโหลดเอกสารอย่างน้อย 1 ไฟล์");
      return;
    }

    startTransition(async () => {
      try {
        // Add each file to the existing box
        for (const f of files) {
          const formData = new FormData();
          formData.append("file", f.file);
          if (f.extractedData?.type) {
            formData.append("docType", f.extractedData.type);
          }
          if (f.extractedData?.amount) {
            formData.append("amount", f.extractedData.amount.toString());
          }
          if (f.extractedData?.vatAmount) {
            formData.append("vatAmount", f.extractedData.vatAmount.toString());
          }

          const result = await addFileToExistingBox(documentId, formData);
          
          if (!result.success) {
            toast.error(result.error || "เกิดข้อผิดพลาด");
            return;
          }
        }

        toast.success("เพิ่มเอกสารเข้ากล่องสำเร็จ");
        router.push(`/documents/${documentId}`);
      } catch (error) {
        toast.error("เกิดข้อผิดพลาดในการเพิ่มเอกสาร");
      }
    });
  };

  // Clear match result and create new
  const handleCreateNew = () => {
    setMatchResult(null);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      toast.error("กรุณาอัปโหลดเอกสารอย่างน้อย 1 ไฟล์");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("transactionType", transactionType);
        formData.append("docDate", docDate);
        formData.append("description", description || `รายการจาก ${contactName || "ไม่ระบุ"}`);
        
        // Amount is optional - if slip only, we might not know
        if (amount) {
          formData.append("totalAmount", amount);
        }
        
        if (selectedContactId) {
          formData.append("contactId", selectedContactId);
        }
        if (categoryId) {
          formData.append("categoryId", categoryId);
        }
        if (notes) {
          formData.append("notes", notes);
        }

        // Add files
        files.forEach((f, index) => {
          formData.append(`file_${index}`, f.file);
          if (f.extractedData?.type) {
            formData.append(`fileType_${index}`, f.extractedData.type);
          }
        });

        const result = await createDocument(formData);

        if (result.success) {
          toast.success("สร้างกล่องเอกสารสำเร็จ");
          router.push(`/documents/${result.data?.id}`);
        } else {
          toast.error(result.error || "เกิดข้อผิดพลาด");
        }
      } catch (error) {
        toast.error("เกิดข้อผิดพลาดในการสร้างกล่อง");
      }
    });
  };

  // Get status summary
  const analyzedCount = files.filter(f => f.status === "done").length;
  const hasSlipOnly = files.length > 0 && files.every(f => 
    f.extractedData?.type === "SLIP" || f.status !== "done"
  );
  const hasTaxInvoice = files.some(f => f.extractedData?.type === "TAX_INVOICE");

  // Filtered categories based on transaction type
  const filteredCategories = categories.filter(
    c => c.categoryType === (transactionType === "EXPENSE" ? "EXPENSE" : "INCOME")
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Link 
              href="/documents" 
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {step === "upload" ? "อัปโหลดเอกสาร" : "ตรวจสอบข้อมูล"}
              </h1>
              <p className="text-sm text-gray-500">
                {step === "upload" 
                  ? "อัปเอกสารอะไรก็ได้ AI จะอ่านและจัดการให้" 
                  : `${files.length} เอกสาร • AI วิเคราะห์แล้ว`
                }
              </p>
            </div>
          </div>

          {/* Transaction Type Toggle */}
          <div className="flex rounded-lg border p-0.5 bg-white">
            <button
              type="button"
              onClick={() => setTransactionType("EXPENSE")}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5",
                transactionType === "EXPENSE"
                  ? "bg-rose-500 text-white"
                  : "text-gray-500 hover:text-rose-600 hover:bg-rose-50"
              )}
            >
              รายจ่าย
            </button>
            <button
              type="button"
              onClick={() => setTransactionType("INCOME")}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5",
                transactionType === "INCOME"
                  ? "bg-primary text-white"
                  : "text-gray-500 hover:text-primary hover:bg-primary/10"
              )}
            >
              รายรับ
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Upload Area + Files */}
            <div className="space-y-4">
              {/* Upload Zone */}
              <div className="rounded-xl border-2 border-dashed bg-white p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all">
                <label className="cursor-pointer block">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <div className="text-lg font-medium text-gray-700 mb-1">
                    ลากไฟล์มาวาง หรือ คลิกเลือก
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    รองรับ: รูปภาพ, PDF
                  </p>
                  <div className="inline-flex items-center gap-2 text-primary text-sm font-medium">
                    <Sparkles className="h-4 w-4" />
                    AI จะอ่านและจัดการให้อัตโนมัติ
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Files List */}
              {files.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">
                      เอกสารที่อัปโหลด ({files.length})
                    </h3>
                    {isAnalyzing && (
                      <span className="text-sm text-primary flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        กำลังวิเคราะห์...
                      </span>
                    )}
                  </div>

                  {files.map((f) => (
                    <FileCard
                      key={f.id}
                      file={f}
                      onRemove={() => removeFile(f.id)}
                      onReanalyze={() => reanalyzeFile(f.id)}
                    />
                  ))}
                </div>
              )}

              {/* Info Banner for Slip Only */}
              {hasSlipOnly && analyzedCount > 0 && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        มีเฉพาะสลิป - ยังไม่รู้ข้อมูลครบ
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        ยอดเงิน VAT และหัก ณ ที่จ่าย จะรู้เมื่อได้ใบกำกับภาษี
                        <br />ระบบจะติดตามให้จนกว่าจะครบ
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Form or Match Panel */}
            <div className="space-y-4">
              {/* Show Match Panel if matches found */}
              {matchResult && matchResult.hasMatch && (
                <BoxMatchPanel
                  matches={matchResult.matches}
                  suggestedAction={matchResult.suggestedAction}
                  reason={matchResult.reason}
                  onSelectBox={handleAddToExistingBox}
                  onCreateNew={handleCreateNew}
                  isLoading={isPending}
                />
              )}

              {/* Show form if no matches or user chose to create new */}
              {(!matchResult || !matchResult.hasMatch) && (
              <div className="rounded-xl border bg-white overflow-hidden">
                <div className="px-5 py-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">ข้อมูลกล่อง</h3>
                      <p className="text-sm text-gray-500">
                        {analyzedCount > 0 ? "AI กรอกให้แล้ว ตรวจสอบและแก้ไขได้" : "กรอกข้อมูลพื้นฐาน"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Date */}
                  <div className="space-y-2">
                    <Label>วันที่</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        className="pl-10"
                        value={docDate}
                        onChange={(e) => setDocDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Amount - Optional */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>ยอดเงิน {hasTaxInvoice && "*"}</Label>
                      {hasSlipOnly && (
                        <span className="text-xs text-amber-600">รอใบกำกับ</span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">฿</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-8"
                        placeholder={hasSlipOnly ? "รอข้อมูลจากใบกำกับ" : "0.00"}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="space-y-2">
                    <Label>{transactionType === "EXPENSE" ? "ผู้ติดต่อ / ร้านค้า" : "ลูกค้า"}</Label>
                    <ContactInput
                      value={contactName}
                      onChange={handleContactChange}
                      contacts={contacts}
                      placeholder="พิมพ์ชื่อหรือเลือกจากรายชื่อ..."
                      defaultRole={transactionType === "EXPENSE" ? "VENDOR" : "CUSTOMER"}
                      onContactCreated={handleContactCreated}
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label>หมวดหมู่</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกหมวดหมู่ (ถ้ามี)" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label>รายละเอียด</Label>
                    <Textarea
                      placeholder="เช่น ค่าบริการ IT เดือนมกราคม..."
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label>หมายเหตุ</Label>
                    <Textarea
                      placeholder="หมายเหตุเพิ่มเติม..."
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="outline" asChild>
                  <Link href="/documents">ยกเลิก</Link>
                </Button>
                <Button 
                  type="submit" 
                  disabled={isPending || files.length === 0}
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  สร้างกล่องเอกสาร
                </Button>
              </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// File Card Component
function FileCard({ 
  file, 
  onRemove, 
  onReanalyze 
}: { 
  file: ExtractedFile; 
  onRemove: () => void;
  onReanalyze: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { status, extractedData, error, preview } = file;

  const isImage = file.file.type.startsWith("image/");
  const isPdf = file.file.type === "application/pdf";

  const docType = extractedData?.type as SubDocType | undefined;
  const docTypeConfig = docType ? getSubDocTypeConfig(docType) : null;
  const confidence = extractedData?.confidence ?? 0;

  return (
    <div className={cn(
      "rounded-lg border bg-white overflow-hidden transition-all",
      status === "analyzing" && "border-primary/50 bg-primary/5",
      status === "error" && "border-red-300 bg-red-50",
      status === "done" && "border-green-200"
    )}>
      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
          {isImage && preview ? (
            <Image
              src={preview}
              alt={file.file.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className={cn("h-8 w-8", isPdf ? "text-red-500" : "text-muted-foreground")} />
            </div>
          )}
          
          {status === "analyzing" && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {status === "analyzing" ? (
              <span className="text-sm text-primary font-medium flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                AI กำลังอ่าน...
              </span>
            ) : status === "error" ? (
              <span className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {error}
              </span>
            ) : docTypeConfig ? (
              <div className="flex items-center gap-2">
                <span className={cn("text-xs px-2 py-0.5 rounded font-medium", docTypeConfig.colorClass)}>
                  {docTypeConfig.label}
                </span>
                {confidence > 0 && (
                  <span className={cn(
                    "text-xs",
                    confidence >= 0.8 ? "text-green-600" : 
                    confidence >= 0.5 ? "text-amber-600" : "text-red-600"
                  )}>
                    {Math.round(confidence * 100)}%
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">รอวิเคราะห์</span>
            )}
          </div>

          <p className="text-xs text-muted-foreground truncate">{file.file.name}</p>

          {/* Quick preview */}
          {status === "done" && extractedData && !isExpanded && (
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              {extractedData.amount && (
                <span className="font-medium text-foreground">
                  ฿{formatMoney(extractedData.amount)}
                </span>
              )}
              {extractedData.contactName && (
                <span className="truncate max-w-[120px]">
                  {extractedData.contactName}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-start gap-1 shrink-0">
          {status === "done" && extractedData && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
          
          {(status === "error" || status === "done") && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onReanalyze}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Expanded details */}
      {status === "done" && extractedData && isExpanded && (
        <div className="px-3 pb-3 border-t bg-muted/30">
          <div className="grid grid-cols-2 gap-2 pt-3 text-sm">
            {extractedData.amount !== undefined && (
              <div>
                <span className="text-xs text-muted-foreground">ยอดเงิน</span>
                <p className="font-semibold text-primary">
                  ฿{formatMoney(extractedData.amount)}
                </p>
              </div>
            )}
            
            {extractedData.vatAmount !== undefined && extractedData.vatAmount > 0 && (
              <div>
                <span className="text-xs text-muted-foreground">VAT</span>
                <p className="font-medium">฿{formatMoney(extractedData.vatAmount)}</p>
              </div>
            )}
            
            {extractedData.documentDate && (
              <div>
                <span className="text-xs text-muted-foreground">วันที่</span>
                <p className="font-medium">{extractedData.documentDate}</p>
              </div>
            )}
            
            {extractedData.documentNumber && (
              <div>
                <span className="text-xs text-muted-foreground">เลขที่เอกสาร</span>
                <p className="font-medium">{extractedData.documentNumber}</p>
              </div>
            )}
            
            {extractedData.contactName && (
              <div className="col-span-2">
                <span className="text-xs text-muted-foreground">ผู้ขาย/ร้านค้า</span>
                <p className="font-medium">{extractedData.contactName}</p>
              </div>
            )}
            
            {extractedData.taxId && (
              <div className="col-span-2">
                <span className="text-xs text-muted-foreground">เลขประจำตัวผู้เสียภาษี</span>
                <p className="font-medium font-mono text-xs">{extractedData.taxId}</p>
              </div>
            )}
            
            {extractedData.description && (
              <div className="col-span-2">
                <span className="text-xs text-muted-foreground">รายละเอียด</span>
                <p className="font-medium text-xs">{extractedData.description}</p>
              </div>
            )}
          </div>

          {/* Show what we don't know for slips */}
          {extractedData.type === "SLIP" && (
            <div className="mt-3 p-2 rounded bg-amber-50 text-xs text-amber-700">
              <p className="font-medium">⚠️ สลิปไม่มีข้อมูล VAT และหัก ณ ที่จ่าย</p>
              <p>จะรู้เมื่อได้รับใบกำกับภาษี</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper: Convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}
