"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBox, getPendingBoxes, addFileToBox } from "@/server/actions/box";
import { 
  extractDocumentData, 
  findMatchingDocumentBox,
  type ExtractedDocumentData,
  type MatchResult,
} from "@/server/actions/ai-classify";
import { toast } from "sonner";
import { type ContactOption } from "@/components/documents/contact-input";
import { getTodayForInput } from "@/lib/formatters";
import type { Contact } from ".prisma/client";
import type { BoxType, ExpenseType } from "@/types";
import type { ExtractedFile } from "@/components/documents/upload/FileAnalysisCard";

// Step in the flow
export type FlowStep = "upload" | "review" | "confirm";

// Pending box type for matching
export interface PendingBox {
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
}

interface UseBoxUploadOptions {
  initialType: BoxType;
  initialContacts: Contact[];
}

export function useBoxUpload({ initialType, initialContacts }: UseBoxUploadOptions) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Flow state
  const [step, setStep] = useState<FlowStep>("upload");
  const [boxType, setBoxType] = useState<BoxType>(initialType);
  const [expenseType, setExpenseType] = useState<ExpenseType>("STANDARD");
  const [isMultiPayment, setIsMultiPayment] = useState(false);
  const [hasWht, setHasWht] = useState(false);
  const [whtRate, setWhtRate] = useState("3"); // Default 3% for services
  
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
  const [pendingBoxes, setPendingBoxes] = useState<PendingBox[]>([]);

  // Computed values
  const analyzedCount = files.filter(f => f.status === "done").length;
  const hasSlipOnly = files.every(
    f => f.extractedData?.type === "SLIP_TRANSFER" || f.extractedData?.type === "SLIP_CHEQUE"
  );
  const hasTaxInvoice = files.some(f => f.extractedData?.type === "TAX_INVOICE");

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

  // Helper: Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
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
  };

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
    } catch {
      setFiles(prev => prev.map(f => 
        f.id === extractedFile.id 
          ? { ...f, status: "error", error: "เกิดข้อผิดพลาด" } 
          : f
      ));
      return null;
    }
  };

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
  }, [pendingBoxes, amount, boxDate, contactName, description, isMultiPayment]);

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
      } catch {
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
        // WHT - set from user selection
        formData.append("hasWht", hasWht.toString());
        if (hasWht && whtRate) {
          formData.append("whtRate", whtRate);
        }
        
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

        // Add files with their extracted data
        files.forEach((f, idx) => {
          formData.append(`files`, f.file);
          if (f.extractedData?.type) {
            formData.append(`fileTypes[${idx}]`, f.extractedData.type);
          }
          if (f.extractedData?.amount) {
            formData.append(`fileAmounts[${idx}]`, f.extractedData.amount.toString());
          }
          if (f.extractedData?.vatAmount) {
            formData.append(`fileVatAmounts[${idx}]`, f.extractedData.vatAmount.toString());
          }
        });

        const result = await createBox(formData);
        
        if (result.success && result.data) {
          toast.success("สร้างกล่องเอกสารสำเร็จ");
          router.push(`/documents/${result.data.id}`);
        } else {
          toast.error(result.error || "เกิดข้อผิดพลาด");
        }
      } catch {
        toast.error("เกิดข้อผิดพลาดในการสร้างกล่อง");
      }
    });
  };

  // Reset form to initial state
  const resetForm = () => {
    setStep("upload");
    setFiles([]);
    setAmount("");
    setSlipAmount("");
    setBoxDate(getTodayForInput());
    setTitle("");
    setDescription("");
    setContactName("");
    setSelectedContactId("");
    setCategoryId("");
    setNotes("");
    setMatchResult(null);
    setIsMultiPayment(false);
    setHasWht(false);
    setWhtRate("3");
  };

  return {
    // State
    step,
    setStep,
    boxType,
    setBoxType,
    expenseType,
    setExpenseType,
    isMultiPayment,
    setIsMultiPayment,
    hasWht,
    setHasWht,
    whtRate,
    setWhtRate,
    files,
    isAnalyzing,
    amount,
    setAmount,
    slipAmount,
    setSlipAmount,
    boxDate,
    setBoxDate,
    title,
    setTitle,
    description,
    setDescription,
    contactName,
    selectedContactId,
    categoryId,
    setCategoryId,
    notes,
    setNotes,
    contacts,
    matchResult,
    isMatching,
    isPending,
    
    // Computed
    analyzedCount,
    hasSlipOnly,
    hasTaxInvoice,
    
    // Actions
    handleFileSelect,
    removeFile,
    reanalyzeFile,
    handleContactChange,
    handleContactCreated,
    handleAddToExistingBox,
    handleCreateNew,
    handleSubmit,
    resetForm,
  };
}
