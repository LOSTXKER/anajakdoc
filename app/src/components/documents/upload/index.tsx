"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createBox, getPendingBoxes, addFileToBox } from "@/server/actions/box";
import { 
  extractDocumentData, 
  findMatchingDocumentBox,
  type ExtractedDocumentData,
  type MatchResult,
} from "@/server/actions/ai-classify";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Check,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { type ContactOption } from "@/components/documents/contact-input";
import { BoxMatchPanel } from "@/components/documents/box-match-panel";
import { getTodayForInput } from "@/lib/formatters";
import type { Category, Contact } from ".prisma/client";
import type { BoxType, ExpenseType } from "@/types";

import { UploadZone } from "./UploadZone";
import { FileAnalysisCard, type ExtractedFile } from "./FileAnalysisCard";
import { BoxInfoForm } from "./BoxInfoForm";

// Step in the flow
type FlowStep = "upload" | "review" | "confirm";

interface UploadFirstFormProps {
  categories: Category[];
  contacts: Contact[];
}

export function UploadFirstForm({
  categories,
  contacts: initialContacts,
}: UploadFirstFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  // Get initial type from URL params
  const initialType = searchParams.get("type") === "income" ? "INCOME" : "EXPENSE";
  
  // Flow state
  const [step, setStep] = useState<FlowStep>("upload");
  const [boxType, setBoxType] = useState<BoxType>(initialType);
  const [expenseType, setExpenseType] = useState<ExpenseType>("STANDARD");
  const [isMultiPayment, setIsMultiPayment] = useState(false);
  
  // Files state
  const [files, setFiles] = useState<ExtractedFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Form state (populated from AI)
  const [amount, setAmount] = useState("");
  const [slipAmount, setSlipAmount] = useState(""); // Amount from slip (for multi-payment)
  const [boxDate, setBoxDate] = useState(getTodayForInput());
  const [title, setTitle] = useState("");
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
    boxNumber: string;
    title: string | null;
    totalAmount: number;
    boxDate: Date;
    contactId: string | null;
    contactName: string | null;
    contactTaxId: string | null;
    hasSlip: boolean;
    hasTaxInvoice: boolean;
  }>>([]);

  // Load pending boxes on mount (only for EXPENSE/INCOME, not ADJUSTMENT)
  useEffect(() => {
    async function loadPendingBoxes() {
      if (boxType === "ADJUSTMENT") return;
      const result = await getPendingBoxes(boxType);
      if (result.success && result.data) {
        setPendingBoxes(result.data);
      }
    }
    loadPendingBoxes();
  }, [boxType]);

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
      // Map pendingBoxes to the format expected by findMatchingDocumentBox
      const mappedBoxes = pendingBoxes.map(box => ({
        id: box.id,
        docNumber: box.boxNumber,
        description: box.title,
        totalAmount: box.totalAmount,
        docDate: box.boxDate,
        contactId: box.contactId,
        contactName: box.contactName,
        contactTaxId: box.contactTaxId,
        hasSlip: box.hasSlip,
        hasTaxInvoice: box.hasTaxInvoice,
      }));
      const match = await findMatchingDocumentBox(firstExtractedData, mappedBoxes);
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
        // For multi-payment, store slip amount separately (don't auto-fill total)
        if (data.amount) {
          if (isMultiPayment) {
            setSlipAmount(data.amount.toString());
          } else if (!amount) {
            setAmount(data.amount.toString());
          }
        }
        if (data.documentDate && boxDate === getTodayForInput()) setBoxDate(data.documentDate);
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
  const handleAddToExistingBox = async (boxId: string) => {
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

          const result = await addFileToBox(boxId, formData);
          
          if (!result.success) {
            toast.error(result.error || "เกิดข้อผิดพลาด");
            return;
          }

          // Show overpaid warning if applicable
          const resultData = result.data as { isOverpaid?: boolean; overpaidAmount?: number } | undefined;
          if (resultData?.isOverpaid && resultData?.overpaidAmount) {
            toast.warning(`ชำระเกินยอดรวม ฿${resultData.overpaidAmount.toLocaleString()} กรุณาตรวจสอบ`, {
              duration: 5000,
            });
          }
        }

        toast.success("เพิ่มเอกสารเข้ากล่องสำเร็จ");
        router.push(`/documents/${boxId}`);
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
        formData.append("boxType", boxType);
        if (expenseType) {
          formData.append("expenseType", expenseType);
        }
        formData.append("boxDate", boxDate);
        formData.append("title", title || description || `รายการจาก ${contactName || "ไม่ระบุ"}`);
        formData.append("description", description);
        
        // Auto-set VAT based on expense type (STANDARD = มีใบกำกับภาษี = has VAT)
        const hasVat = expenseType === "STANDARD";
        formData.append("hasVat", hasVat.toString());
        // WHT will be set by accounting later
        formData.append("hasWht", "false");
        
        // Amount is optional - if slip only, we might not know
        if (amount) {
          formData.append("totalAmount", amount);
        }
        
        // Multi-payment flag and slip amount
        formData.append("isMultiPayment", isMultiPayment.toString());
        if (isMultiPayment && slipAmount) {
          formData.append("slipAmount", slipAmount);
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

        const result = await createBox(formData);

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
    f.extractedData?.type === "SLIP_TRANSFER" || f.extractedData?.type === "SLIP_CHEQUE" || f.status !== "done"
  );
  const hasTaxInvoice = files.some(f => f.extractedData?.type === "TAX_INVOICE" || f.extractedData?.type === "TAX_INVOICE_ABB");

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

          {/* Box Type Toggle */}
          <div className="flex rounded-lg border p-0.5 bg-white">
            <button
              type="button"
              onClick={() => setBoxType("EXPENSE")}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5",
                boxType === "EXPENSE"
                  ? "bg-rose-500 text-white"
                  : "text-gray-500 hover:text-rose-600 hover:bg-rose-50"
              )}
            >
              รายจ่าย
            </button>
            <button
              type="button"
              onClick={() => setBoxType("INCOME")}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5",
                boxType === "INCOME"
                  ? "bg-emerald-500 text-white"
                  : "text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
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
              <UploadZone onFileSelect={handleFileSelect} />

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
                    <FileAnalysisCard
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
              <>
                <BoxInfoForm
                  boxType={boxType}
                  expenseType={expenseType}
                  setExpenseType={setExpenseType}
                  isMultiPayment={isMultiPayment}
                  setIsMultiPayment={setIsMultiPayment}
                  slipAmount={slipAmount}
                  categories={categories}
                  contacts={contacts}
                  boxDate={boxDate}
                  setBoxDate={setBoxDate}
                  amount={amount}
                  setAmount={setAmount}
                  contactName={contactName}
                  selectedContactId={selectedContactId}
                  onContactChange={handleContactChange}
                  onContactCreated={handleContactCreated}
                  categoryId={categoryId}
                  setCategoryId={setCategoryId}
                  title={title}
                  setTitle={setTitle}
                  description={description}
                  setDescription={setDescription}
                  notes={notes}
                  setNotes={setNotes}
                  analyzedCount={analyzedCount}
                  hasSlipOnly={hasSlipOnly}
                  hasTaxInvoice={hasTaxInvoice}
                />

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
              </>
              )}
            </div>
          </div>
        </form>
      </div>
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

// Re-export all components
export { UploadZone } from "./UploadZone";
export { FileAnalysisCard, type ExtractedFile } from "./FileAnalysisCard";
export { BoxInfoForm } from "./BoxInfoForm";
