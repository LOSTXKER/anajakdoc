"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createDocument, updateDocument, reviewDocument, submitDocument } from "@/server/actions/document";
import { type DuplicateWarning } from "@/server/actions/file";
import { createSubDocumentWithFile } from "@/server/actions/subdocument";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { Switch } from "@/components/ui/switch";
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
} from "@/components/ui/dialog";
import {
  Package,
  Calendar,
  FolderOpen,
  Loader2,
  Save,
  ArrowLeft,
  TrendingDown,
  TrendingUp,
  Upload,
  Receipt,
  FileCheck,
  FileText,
  CheckCircle2,
  Check,
  X,
  Edit,
  Send,
  Sparkles,
  RefreshCw,
  Plus,
  Replace,
  GripVertical,
  AlertTriangle,
  Hash,
  Link2,
  User,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DuplicateWarningAlert } from "@/components/documents/duplicate-warning";
import { ContactInput, type ContactOption } from "@/components/documents/contact-input";
import { extractDocumentData, type ExtractedDocumentData } from "@/server/actions/ai-classify";
import { getDocumentChecklist, calculateCompletionPercent, type DocumentChecklist as ChecklistState } from "@/lib/checklist";
import type { Category, Contact } from ".prisma/client";
import type { SubDocType, SerializedDocument, MemberRole } from "@/types";
import Link from "next/link";
import Image from "next/image";

type FormMode = "create" | "edit" | "view";

interface DocumentBoxFormProps {
  mode: FormMode;
  transactionType?: "EXPENSE" | "INCOME";
  categories: Category[];
  contacts: Contact[];
  document?: SerializedDocument;
  userRole?: MemberRole;
}


// Extended type for UI (includes OTHER which AI might return)
type DocTypeForUI = SubDocType | "OTHER" | "QUOTATION";

// Document types for tracking
const expenseDocTypes: { type: DocTypeForUI; label: string; icon: typeof Receipt }[] = [
  { type: "SLIP", label: "สลิปโอนเงิน", icon: Receipt },
  { type: "TAX_INVOICE", label: "ใบกำกับภาษี", icon: FileCheck },
  { type: "INVOICE", label: "ใบแจ้งหนี้", icon: FileText },
  { type: "OTHER", label: "อื่นๆ", icon: FileText },
];

const incomeDocTypes: { type: DocTypeForUI; label: string; icon: typeof Receipt }[] = [
  { type: "INVOICE", label: "ใบแจ้งหนี้", icon: FileText },
  { type: "RECEIPT", label: "ใบเสร็จรับเงิน", icon: Receipt },
  { type: "TAX_INVOICE", label: "ใบกำกับภาษี", icon: FileCheck },
  { type: "OTHER", label: "อื่นๆ", icon: FileText },
];

// WHT Types
const whtTypes = [
  { value: "1", label: "1% - ค่าขนส่ง" },
  { value: "2", label: "2% - ค่าโฆษณา" },
  { value: "3", label: "3% - ค่าบริการ/จ้างทำของ" },
  { value: "5", label: "5% - ค่าเช่า" },
];

interface FilePreview {
  file: File;
  preview: string;
  docType: DocTypeForUI;
  extractedData?: ExtractedDocumentData;
}

// Aggregated AI result from all documents
interface AggregatedAIData {
  description?: string;
  amount?: number;
  contactName?: string;
  documentDate?: string;
  taxId?: string;
  vatAmount?: number;
}

export function DocumentBoxForm({
  mode,
  transactionType: defaultTransactionType = "EXPENSE",
  categories,
  contacts: initialContacts,
  document,
  userRole = "STAFF",
}: DocumentBoxFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(mode === "create" || mode === "edit");

  // Transaction type
  const [transactionType, setTransactionType] = useState<"EXPENSE" | "INCOME">(
    document?.transactionType || defaultTransactionType
  );

  // Contact state
  const [contacts, setContacts] = useState<ContactOption[]>(
    initialContacts.map(c => ({
      id: c.id,
      name: c.name,
      taxId: (c as ContactOption).taxId,
      contactType: (c as ContactOption).contactType,
    }))
  );
  const [selectedContactId, setSelectedContactId] = useState(document?.contactId || "");
  const [contactName, setContactName] = useState(document?.contact?.name || "");

  // Simple form fields
  const [amount, setAmount] = useState(document?.totalAmount?.toString() || "");
  const [docDate, setDocDate] = useState(
    document?.docDate?.split("T")[0] || new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(document?.dueDate?.split("T")[0] || "");
  const [categoryId, setCategoryId] = useState(document?.categoryId || "");
  const [description, setDescription] = useState(document?.description || "");
  const [notes, setNotes] = useState(document?.notes || "");
  const [externalRef, setExternalRef] = useState(document?.externalRef || "");
  
  // VAT selection
  const [vatRate, setVatRate] = useState(document?.vatRate || 0);
  
  // WHT state
  const [hasWht, setHasWht] = useState(document?.hasWht || false);
  const [whtRate, setWhtRate] = useState(document?.whtRate || 3);
  const [whtSent, setWhtSent] = useState(document?.whtSent || false);
  const [whtReceived, setWhtReceived] = useState(document?.whtReceived || false);

  // File upload state (for create mode)
  const [uploadedFiles, setUploadedFiles] = useState<FilePreview[]>([]);

  // Duplicate detection
  const [duplicateWarnings, setDuplicateWarnings] = useState<DuplicateWarning[]>([]);

  // Permissions
  // Permission checks
  const isAccounting = ["ACCOUNTING", "ADMIN", "OWNER"].includes(userRole);
  const isOwnerOrAdmin = ["ADMIN", "OWNER"].includes(userRole);
  
  // Can edit if not yet exported/booked/void
  const editableStatuses = ["DRAFT", "NEED_INFO", "PENDING_REVIEW", "READY_TO_EXPORT"];
  const canEdit = mode === "create" || (document && editableStatuses.includes(document.status));
  
  // Can send to accounting if still in DRAFT
  const canSendToAccounting = document && document.status === "DRAFT";
  
  // Accounting can review pending documents
  const canReview = document && ["PENDING_REVIEW", "NEED_INFO"].includes(document.status);
  
  // Can always view/edit button for owner/admin on non-final statuses
  const showEditButton = canEdit || isOwnerOrAdmin;

  // Document types based on transaction type
  const docTypes = transactionType === "EXPENSE" ? expenseDocTypes : incomeDocTypes;

  // Checklist calculation (for view mode)
  const checklistState: ChecklistState = {
    isPaid: document?.isPaid || false,
    hasPaymentProof: document?.hasPaymentProof || false,
    hasTaxInvoice: document?.hasTaxInvoice || false,
    hasInvoice: document?.hasInvoice || false,
    whtIssued: document?.whtIssued || false,
    whtSent: document?.whtSent || false,
    whtReceived: document?.whtReceived || false,
  };
  
  // Get uploaded doc types from subDocuments
  const uploadedDocTypes = new Set<SubDocType>(
    document?.subDocuments?.map(sub => sub.docType) || []
  );
  
  // Calculate checklist items
  const checklistItems = document 
    ? getDocumentChecklist(
        document.transactionType,
        (document.vatRate ?? 0) > 0,
        document.hasWht,
        checklistState,
        uploadedDocTypes
      )
    : [];
  
  const completionPercent = calculateCompletionPercent(checklistItems);

  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);

  // Merge dialog state
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<{file: File; preview: string; docType: DocTypeForUI} | null>(null);
  const [existingFileIndex, setExistingFileIndex] = useState<number>(-1);

  // Format money
  const formatMoney = (value: number) => {
    return value.toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Calculate amounts
  const totalAmount = parseFloat(amount) || 0;
  const subtotal = vatRate > 0 ? totalAmount / (1 + vatRate / 100) : totalAmount;
  const vatAmount = vatRate > 0 ? totalAmount - subtotal : 0;
  const whtAmount = hasWht ? subtotal * (whtRate / 100) : 0;
  const netAmount = totalAmount - whtAmount;

  // Handle contact selection
  const handleContactChange = (value: string, contactId?: string) => {
    setContactName(value);
    setSelectedContactId(contactId || "");
  };

  // Handle new contact created
  const handleContactCreated = (newContact: ContactOption) => {
    setContacts(prev => [...prev, newContact]);
    setSelectedContactId(newContact.id);
    setContactName(newContact.name);
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: FilePreview[] = [];

    for (const file of Array.from(files)) {
      // Create preview
      const preview = URL.createObjectURL(file);
      
      // Determine doc type based on file name or default
      let docType: DocTypeForUI = "OTHER";
      const fileName = file.name.toLowerCase();
      if (fileName.includes("slip") || fileName.includes("สลิป")) {
        docType = "SLIP";
      } else if (fileName.includes("tax") || fileName.includes("กำกับ")) {
        docType = "TAX_INVOICE";
      } else if (fileName.includes("invoice") || fileName.includes("แจ้งหนี้")) {
        docType = "INVOICE";
      } else if (fileName.includes("receipt") || fileName.includes("เสร็จ")) {
        docType = "RECEIPT";
      }

      // Check for existing file of same type
      const existingIndex = uploadedFiles.findIndex(f => f.docType === docType);
      if (existingIndex >= 0 && docType !== "OTHER") {
        setPendingFile({ file, preview, docType });
        setExistingFileIndex(existingIndex);
        setShowMergeDialog(true);
        continue;
      }

      newFiles.push({ file, preview, docType });
    }

    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
    
    // Reset input
    e.target.value = "";
  };

  // Handle merge dialog actions
  const handleMergeAction = (action: "merge" | "replace" | "cancel") => {
    if (!pendingFile) return;

    if (action === "merge") {
      setUploadedFiles(prev => [...prev, pendingFile]);
    } else if (action === "replace") {
      setUploadedFiles(prev => {
        const newFiles = [...prev];
        newFiles[existingFileIndex] = pendingFile;
        return newFiles;
      });
    }
    
    setPendingFile(null);
    setExistingFileIndex(-1);
    setShowMergeDialog(false);
  };

  // Update doc type for a file
  const updateFileDocType = (index: number, newType: DocTypeForUI) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      newFiles[index] = { ...newFiles[index], docType: newType };
      return newFiles;
    });
  };

  // Remove file
  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Dismiss duplicate warning
  const dismissWarning = (index: number) => {
    setDuplicateWarnings(prev => prev.filter((_, i) => i !== index));
  };

  // AI Analysis
  const handleAIAnalysis = async () => {
    if (uploadedFiles.length === 0) return;
    
    setIsAnalyzing(true);
    
    try {
      const aggregatedData: AggregatedAIData = {};
      
      for (const filePreview of uploadedFiles) {
        // Convert file to base64
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix (e.g., "data:image/png;base64,")
            const base64 = result.split(",")[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(filePreview.file);
        });
        
        const result = await extractDocumentData(base64Data, filePreview.file.type);
        
        if (result.success && result.data) {
          filePreview.extractedData = result.data;
          
          // Update document type if detected
          if (result.data.type) {
            const typeMap: Record<string, DocTypeForUI> = {
              "TAX_INVOICE": "TAX_INVOICE",
              "INVOICE": "INVOICE",
              "RECEIPT": "RECEIPT",
              "SLIP": "SLIP",
              "QUOTATION": "QUOTATION",
              "OTHER": "OTHER",
            };
            const newType = typeMap[result.data.type] || filePreview.docType;
            if (newType !== filePreview.docType) {
              const index = uploadedFiles.indexOf(filePreview);
              updateFileDocType(index, newType);
            }
          }
          
          // Aggregate extracted data
          if (result.data.description && !aggregatedData.description) {
            aggregatedData.description = result.data.description;
          }
          if (result.data.amount && !aggregatedData.amount) {
            aggregatedData.amount = result.data.amount;
          }
          if (result.data.contactName && !aggregatedData.contactName) {
            aggregatedData.contactName = result.data.contactName;
          }
          if (result.data.documentDate && !aggregatedData.documentDate) {
            aggregatedData.documentDate = result.data.documentDate;
          }
          if (result.data.vatAmount) {
            aggregatedData.vatAmount = result.data.vatAmount;
          }
        }
      }
      
      if (aggregatedData.description && !description) {
        setDescription(aggregatedData.description);
      }
      if (aggregatedData.amount && !amount) {
        setAmount(aggregatedData.amount.toString());
      }
      if (aggregatedData.contactName && !contactName) {
        setContactName(aggregatedData.contactName);
      }
      if (aggregatedData.documentDate && !docDate) {
        setDocDate(aggregatedData.documentDate);
      }
      if (aggregatedData.vatAmount && aggregatedData.vatAmount > 0) {
        setVatRate(7);
      }
      
      setIsAnalyzed(true);
      toast.success("วิเคราะห์เอกสารเรียบร้อย");
    } catch {
      toast.error("ไม่สามารถวิเคราะห์เอกสารได้");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (formData: FormData) => {
    setError(null);

    startTransition(async () => {
      const amountNum = parseFloat(amount) || 0;
      
      // Calculate VAT amounts
      let subtotalCalc = amountNum;
      let vatAmountCalc = 0;
      
      if (vatRate > 0) {
        subtotalCalc = amountNum / (1 + vatRate / 100);
        vatAmountCalc = amountNum - subtotalCalc;
      }
      
      // Calculate WHT amount
      const whtAmountCalc = hasWht ? subtotalCalc * (whtRate / 100) : 0;
      
      formData.set("totalAmount", amountNum.toString());
      formData.set("subtotal", subtotalCalc.toString());
      formData.set("vatRate", vatRate.toString());
      formData.set("vatAmount", vatAmountCalc.toString());
      formData.set("whtAmount", whtAmountCalc.toString());
      formData.set("whtRate", hasWht ? whtRate.toString() : "0");
      formData.set("transactionType", transactionType);
      formData.set("hasWht", hasWht.toString());
      formData.set("whtSent", whtSent.toString());
      formData.set("whtReceived", whtReceived.toString());
      formData.set("externalRef", externalRef);
      if (dueDate) {
        formData.set("dueDate", dueDate);
      }

      // Add files for create mode
      if (mode === "create") {
        for (let i = 0; i < uploadedFiles.length; i++) {
          const filePreview = uploadedFiles[i];
          formData.append(`files`, filePreview.file);
          formData.append(`docTypes`, filePreview.docType === "OTHER" ? "OTHER" : filePreview.docType);
        }
      }

      const result = mode === "create" 
        ? await createDocument(formData)
        : await updateDocument(document!.id, formData);

      if (!result.success) {
        setError(result.error || "เกิดข้อผิดพลาด");
        toast.error(result.error || "เกิดข้อผิดพลาด");
      } else {
        toast.success(mode === "create" ? "สร้างกล่องเรียบร้อย" : "บันทึกเรียบร้อย");
        const data = result.data as { id: string } | undefined;
        if (mode === "create" && data?.id) {
          router.push(`/documents/${data.id}`);
        } else if (mode === "edit") {
          setIsEditing(false);
          router.refresh();
        } else {
          setIsEditing(false);
          router.refresh();
        }
      }
    });
  };

  // Handle send to accounting
  const handleSendToAccounting = async () => {
    if (!document) return;
    
    startTransition(async () => {
      const result = await submitDocument(document.id);
      
      if (result.success) {
        toast.success("ส่งให้บัญชีเรียบร้อย");
        router.refresh();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  // Handle approve
  const handleApprove = async () => {
    if (!document) return;
    
    startTransition(async () => {
      const result = await reviewDocument(document.id, "approve");
      
      if (result.success) {
        toast.success("อนุมัติเรียบร้อย");
        router.refresh();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  // Count uploaded documents
  const docCount = mode === "create" 
    ? uploadedFiles.length 
    : (document?.subDocuments?.length || 0);

  return (
    <form action={handleSubmit} className="space-y-6 max-w-5xl mx-auto">
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <DuplicateWarningAlert warnings={duplicateWarnings} onDismiss={dismissWarning} />

      {/* Document Info Header (View Mode) */}
      {mode !== "create" && document && (
        <>
          {/* Header Bar */}
          <div className="flex items-center justify-between">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-3">
              <Link 
                href="/documents" 
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary/90 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {transactionType === "EXPENSE" ? "รายจ่าย" : "รายรับ"}
                  </h1>
                  <StatusBadge status={document.status} />
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{new Date(document.docDate).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    ยกเลิก
                  </Button>
                  <Button size="sm" type="submit" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                    บันทึก
                  </Button>
                </>
              ) : (
                <>
                  {canSendToAccounting && (
                    <Button size="sm" onClick={handleSendToAccounting} disabled={isPending}>
                      <Send className="mr-1.5 h-4 w-4" />
                      ส่งบัญชี
                    </Button>
                  )}
                  {isAccounting && canReview && (
                    <Button size="sm" onClick={handleApprove} disabled={isPending}>
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      อนุมัติ
                    </Button>
                  )}
                  {showEditButton && (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="mr-1.5 h-4 w-4" />
                      แก้ไข
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Progress Stepper */}
          {checklistItems.length > 0 && (
            <div className="flex items-start justify-between px-4 py-6 bg-white rounded-xl border">
              {checklistItems.map((item, index) => (
                <div key={item.id} className="flex-1 flex flex-col items-center relative">
                  {/* Connector Line */}
                  {index < checklistItems.length - 1 && (
                    <div 
                      className={cn(
                        "absolute top-5 left-1/2 w-full h-0.5",
                        item.completed ? "bg-primary" : "bg-gray-200"
                      )} 
                    />
                  )}
                  
                  {/* Circle */}
                  <div
                    className={cn(
                      "relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                      item.completed
                        ? "bg-primary border-primary text-white"
                        : "bg-white border-gray-300 text-gray-400"
                    )}
                  >
                    {item.completed ? (
                      <Check className="h-5 w-5" />
                    ) : item.id === "whtSent" ? (
                      <Send className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </div>

                  {/* Label */}
                  <span className={cn(
                    "mt-2 text-xs text-center max-w-[80px]",
                    item.completed ? "text-primary font-medium" : "text-gray-500"
                  )}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Mode Header */}
      {mode === "create" && (
        <div className="flex items-center justify-between">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-3">
            <Link 
              href="/documents" 
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary/90 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                สร้างกล่องเอกสาร
              </h1>
              <p className="text-sm text-gray-500">กรอกข้อมูลและแนบเอกสาร</p>
            </div>
          </div>

          {/* Right: Transaction Type Toggle */}
          <div className="flex rounded-lg border p-0.5 bg-white">
            <button
              type="button"
              onClick={() => setTransactionType("EXPENSE")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                transactionType === "EXPENSE"
                  ? "bg-primary text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              รายจ่าย
            </button>
            <button
              type="button"
              onClick={() => setTransactionType("INCOME")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                transactionType === "INCOME"
                  ? "bg-primary text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              รายรับ
            </button>
          </div>
        </div>
      )}

      {/* Main Content - 2 Column Layout */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* LEFT COLUMN - Form Details (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Basic Info Card */}
          <div className="rounded-xl border bg-white overflow-hidden">
            {/* Card Title */}
            <div className="px-5 py-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {mode === "create" ? "ข้อมูลรายการ" : "รายละเอียดกล่อง"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {mode === "create" ? "ข้อมูลพื้นฐานของรายการ" : "ข้อมูลกล่องเอกสาร"}
                  </p>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-5 space-y-5">
              {/* Row 1: Date & Amount */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>วันที่ *</Label>
                  {isEditing ? (
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        name="docDate"
                        type="date"
                        className="pl-10"
                        value={docDate}
                        onChange={(e) => setDocDate(e.target.value)}
                        required
                      />
                    </div>
                  ) : (
                    <p className="py-2 font-medium">
                      {document && new Date(document.docDate).toLocaleDateString("th-TH", {
                        day: "numeric", month: "long", year: "numeric"
                      })}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>จำนวนเงิน (รวม VAT) *</Label>
                  {isEditing ? (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">฿</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-8 text-lg font-semibold"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>
                  ) : (
                    <p className="py-2 text-lg font-bold text-primary">
                      ฿{formatMoney(document?.totalAmount || 0)}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Contact & Category */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{transactionType === "EXPENSE" ? "ผู้ติดต่อ / ร้านค้า" : "ลูกค้า"} *</Label>
                  {isEditing ? (
                    <>
                      <ContactInput
                        value={contactName}
                        onChange={handleContactChange}
                        contacts={contacts}
                        placeholder={transactionType === "EXPENSE" ? "พิมพ์ชื่อหรือเลือกจากรายชื่อ..." : "พิมพ์ชื่อลูกค้า..."}
                        defaultRole={transactionType === "EXPENSE" ? "VENDOR" : "CUSTOMER"}
                        onContactCreated={handleContactCreated}
                      />
                      <input type="hidden" name="contactId" value={selectedContactId} />
                    </>
                  ) : (
                    <p className="py-2 font-medium">{document?.contact?.name || "-"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>หมวดหมู่</Label>
                  {isEditing ? (
                    <Select name="categoryId" value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger>
                        <FolderOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="เลือกหมวดหมู่ (ถ้ามี)" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="py-2 font-medium">{document?.category?.name || "-"}</p>
                  )}
                </div>
              </div>

              {/* Row 3: Description */}
              <div className="space-y-2">
                <Label>รายละเอียด *</Label>
                {isEditing ? (
                  <Textarea
                    name="description"
                    placeholder="เช่น ค่าบริการ IT เดือนมกราคม..."
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                ) : (
                  <p className="py-2 font-medium">{document?.description || "-"}</p>
                )}
              </div>

              {/* Row 4: Reference & Due Date */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>เลขที่อ้างอิง</Label>
                  {isEditing ? (
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        name="externalRef"
                        className="pl-10"
                        placeholder="เลขที่ใบแจ้งหนี้, PO, ..."
                        value={externalRef}
                        onChange={(e) => setExternalRef(e.target.value)}
                      />
                    </div>
                  ) : (
                    <p className="py-2 font-medium">{document?.externalRef || "-"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>วันครบกำหนด</Label>
                  {isEditing ? (
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        name="dueDate"
                        type="date"
                        className="pl-10"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                  ) : (
                    <p className="py-2 font-medium">
                      {document?.dueDate 
                        ? new Date(document.dueDate).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })
                        : "-"
                      }
                    </p>
                  )}
                </div>
              </div>

              {/* Row 5: Notes */}
              <div className="space-y-2">
                <Label>หมายเหตุ</Label>
                {isEditing ? (
                  <Textarea
                    name="notes"
                    placeholder="หมายเหตุเพิ่มเติม..."
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                ) : (
                  <p className="py-2 text-muted-foreground">{document?.notes || "-"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Tax & Summary Section - inside left column */}
          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h3 className="font-semibold text-gray-900">ภาษีและยอดเงิน</h3>
            </div>

            <div className="p-5 space-y-4">
              {/* VAT Selection */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">ภาษีมูลค่าเพิ่ม (VAT)</Label>
                  <p className="text-xs text-muted-foreground">มีใบกำกับภาษี?</p>
                </div>
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setVatRate(0)}
                      className={`py-1.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                        vatRate === 0
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      ไม่มี VAT
                    </button>
                    <button
                      type="button"
                      onClick={() => setVatRate(7)}
                      className={`py-1.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                        vatRate === 7
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      VAT 7%
                    </button>
                  </div>
                ) : (
                  <p className="font-medium">{vatRate > 0 ? `VAT ${vatRate}%` : "ไม่มี VAT"}</p>
                )}
              </div>

              {/* WHT Section */}
              <div className="p-3 rounded-lg border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">หัก ณ ที่จ่าย</Label>
                    <p className="text-xs text-muted-foreground">
                      {transactionType === "EXPENSE" ? "หักภาษีผู้ขาย?" : "ถูกหักภาษี?"}
                    </p>
                  </div>
                  <Switch
                    checked={hasWht}
                    onCheckedChange={setHasWht}
                    disabled={!isEditing}
                  />
                </div>
                
                {hasWht && (
                  <div className="space-y-2">
                    <Label className="text-sm">ประเภทและอัตรา</Label>
                    {isEditing ? (
                      <Select value={whtRate.toString()} onValueChange={(v) => setWhtRate(parseInt(v))}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="เลือกประเภทภาษีหัก ณ ที่จ่าย" />
                        </SelectTrigger>
                        <SelectContent>
                          {whtTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium text-orange-600">
                        {whtTypes.find(t => t.value === whtRate.toString())?.label || `${whtRate}%`}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Amount Summary */}
              <div className="p-3 rounded-lg bg-gray-50 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">สรุปยอด</span>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">ยอดก่อน VAT</span>
                    <span>฿{formatMoney(subtotal)}</span>
                  </div>
                  {vatRate > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>VAT {vatRate}%</span>
                      <span>+฿{formatMoney(vatAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">ยอดรวม VAT</span>
                    <span>฿{formatMoney(totalAmount)}</span>
                  </div>
                  {hasWht && (
                    <div className="flex justify-between text-orange-600">
                      <span>หัก ณ ที่จ่าย {whtRate}%</span>
                      <span>-฿{formatMoney(whtAmount)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-2 border-t mt-2 font-bold">
                  <span className="text-sm">{transactionType === "EXPENSE" ? "ยอดโอนจริง" : "ยอดรับจริง"}</span>
                  <span className="text-primary">
                    ฿{formatMoney(netAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Documents (2 cols) */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-white sticky top-4">
            {/* Header */}
            <div className="px-5 py-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-gray-900">เอกสารในกล่อง</span>
                </div>
                {isAnalyzed && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    AI วิเคราะห์แล้ว
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {docCount} เอกสาร
              </p>
            </div>

            <div className="p-4 space-y-3">
              {/* Upload Area */}
              {isEditing && (
                <label className="block p-5 rounded-lg border-2 border-dashed hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <div className="text-sm">
                      <span className="text-primary font-medium">คลิกเพื่อเลือก</span>
                      <span className="text-muted-foreground"> หรือลากไฟล์มาวาง</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      รองรับ: รูปภาพ, PDF
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              )}

              {/* AI Analysis Button */}
              {mode === "create" && uploadedFiles.length > 0 && isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleAIAnalysis}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังวิเคราะห์...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      AI วิเคราะห์เอกสาร
                    </>
                  )}
                </Button>
              )}

              {/* Uploaded Files (Create Mode) */}
              {mode === "create" && uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/30">
                      <div className="w-9 h-9 rounded bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {docTypes.find(d => d.type === file.docType)?.label || file.docType}
                        </p>
                      </div>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="w-7 h-7 rounded-full hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Existing files (view/edit mode) */}
              {mode !== "create" && document?.subDocuments && document.subDocuments.length > 0 && (
                <div className="space-y-2">
                  {document.subDocuments.map((subDoc) => (
                    <div key={subDoc.id} className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/30">
                      <div className="w-9 h-9 rounded bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {docTypes.find(d => d.type === subDoc.docType)?.label || subDoc.docType}
                        </p>
                        {subDoc.files && subDoc.files.length > 0 && (
                          <p className="text-xs text-muted-foreground">{subDoc.files.length} ไฟล์</p>
                        )}
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {uploadedFiles.length === 0 && mode === "create" && (
                <div className="text-center py-6 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">ยังไม่มีเอกสาร</p>
                  <p className="text-xs mt-1">อัปโหลดเอกสารเพื่อเริ่มต้น</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions - Only for create mode */}
      {mode === "create" && (
        <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-gray-50 -mx-6 px-6 py-4 border-t">
          <Button type="button" variant="outline" asChild>
            <Link href="/documents">ยกเลิก</Link>
          </Button>
          <Button 
            type="submit" 
            disabled={isPending || !amount || !description}
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            สร้างกล่องเอกสาร
          </Button>
        </div>
      )}

      {/* Merge Dialog */}
      <Dialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              พบเอกสารซ้ำ
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            มีเอกสารประเภท "{pendingFile && docTypes.find(d => d.type === pendingFile.docType)?.label}" อยู่แล้ว
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleMergeAction("merge")}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              เพิ่มทั้งคู่
            </Button>
            <Button
              type="button"
              onClick={() => handleMergeAction("replace")}
            >
              <Replace className="h-4 w-4 mr-1.5" />
              แทนที่
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleMergeAction("cancel")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
