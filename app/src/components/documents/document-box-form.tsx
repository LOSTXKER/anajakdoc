"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createDocument, updateDocument, reviewDocument, submitDocument } from "@/server/actions/document";
import { type DuplicateWarning } from "@/server/actions/file";
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
  Upload,
  Receipt,
  FileText,
  CheckCircle2,
  Check,
  X,
  Edit,
  Send,
  Sparkles,
  Plus,
  Replace,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DuplicateWarningAlert } from "@/components/documents/duplicate-warning";
import { ContactInput, type ContactOption } from "@/components/documents/contact-input";
import { DocumentFileCard, type ExtractedFile } from "@/components/documents/document-file-card";
import { ConflictResolver, SourceBadge } from "@/components/documents/conflict-resolver";
import { getDocumentChecklist, calculateCompletionPercent, type DocumentChecklist as ChecklistState } from "@/lib/checklist";
import { formatMoney, getTodayForInput } from "@/lib/formatters";
import { 
  EXPENSE_DOC_TYPES, 
  INCOME_DOC_TYPES, 
  WHT_TYPES,
  isAccountingRole,
  isAdminRole,
  canEditDocument,
  canReviewDocument,
  TRANSACTION_TYPE_CONFIG,
} from "@/lib/document-config";
import { useTaxCalculation, type AmountInputType } from "@/hooks/use-tax-calculation";
import { useDocumentExtraction } from "@/hooks/use-document-extraction";
import { useAggregatedData } from "@/hooks/use-aggregated-data";
import type { Category, Contact } from ".prisma/client";
import type { SubDocType, SerializedDocument, MemberRole } from "@/types";
import Link from "next/link";

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
    document?.docDate?.split("T")[0] || getTodayForInput()
  );
  const [categoryId, setCategoryId] = useState(document?.categoryId || "");
  const [description, setDescription] = useState(document?.description || "");
  const [notes, setNotes] = useState(document?.notes || "");
  
  // VAT selection
  const [vatRate, setVatRate] = useState(document?.vatRate || 0);
  
  // Amount input type - whether amount includes VAT or not
  const [amountInputType, setAmountInputType] = useState<AmountInputType>("includeVat");
  
  // WHT state
  const [hasWht, setHasWht] = useState(document?.hasWht || false);
  const [whtRate, setWhtRate] = useState(document?.whtRate || 3);
  const [whtSent, setWhtSent] = useState(document?.whtSent || false);
  const [whtReceived, setWhtReceived] = useState(document?.whtReceived || false);

  // Track which fields user has manually edited
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set());

  // Duplicate detection
  const [duplicateWarnings, setDuplicateWarnings] = useState<DuplicateWarning[]>([]);

  // Document extraction hook - auto analyzes files on upload
  const {
    files: extractedFiles,
    addFiles,
    removeFile: removeExtractedFile,
    reanalyzeFile,
    isAnalyzing,
    allAnalyzed,
    analyzedFiles,
  } = useDocumentExtraction({
    autoAnalyze: true,
    onFileAnalyzed: (file) => {
      if (file.status === "done") {
        toast.success(`วิเคราะห์ ${file.file.name} เรียบร้อย`);
      }
    },
  });

  // Aggregated data hook - combines data from all files
  const { data: aggregatedData, hasConflicts, conflictingFields } = useAggregatedData({
    files: extractedFiles,
    editedFields,
  });

  // Auto-fill form from aggregated data when files are analyzed
  useEffect(() => {
    if (!allAnalyzed || extractedFiles.length === 0) return;
    
    // Only auto-fill if user hasn't edited the field
    if (!editedFields.has("amount") && aggregatedData.amount.value && !amount) {
      setAmount(aggregatedData.amount.value.toString());
    }
    if (!editedFields.has("description") && aggregatedData.description.value && !description) {
      setDescription(aggregatedData.description.value);
    }
    if (!editedFields.has("contactName") && aggregatedData.contactName.value && !contactName) {
      setContactName(aggregatedData.contactName.value);
    }
    if (!editedFields.has("docDate") && aggregatedData.documentDate.value && docDate === getTodayForInput()) {
      setDocDate(aggregatedData.documentDate.value);
    }
    if (aggregatedData.hasVat && vatRate === 0) {
      setVatRate(7);
    }
  }, [allAnalyzed, aggregatedData, extractedFiles.length, editedFields, amount, description, contactName, docDate, vatRate]);

  // Mark field as user-edited
  const markFieldEdited = useCallback((field: string) => {
    setEditedFields(prev => new Set(prev).add(field));
  }, []);

  // Permission checks (using shared config)
  const isAccounting = isAccountingRole(userRole);
  const isOwnerOrAdmin = isAdminRole(userRole);
  
  // Can edit if not yet exported/booked/void
  const canEdit = mode === "create" || (document && canEditDocument(document.status));
  
  // Can send to accounting if still in DRAFT
  const canSendToAccounting = document && document.status === "DRAFT";
  
  // Accounting can review pending documents
  const canReview = document && canReviewDocument(document.status);
  
  // Can always view/edit button for owner/admin on non-final statuses
  const showEditButton = canEdit || isOwnerOrAdmin;

  // Document types based on transaction type (using shared config)
  const docTypes = transactionType === "EXPENSE" ? EXPENSE_DOC_TYPES : INCOME_DOC_TYPES;

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

  // Merge dialog state
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<{file: File; preview: string; docType: DocTypeForUI} | null>(null);
  const [existingFileIndex, setExistingFileIndex] = useState<number>(-1);

  // Calculate amounts using shared hook
  const { totalAmount, subtotal, vatAmount, whtAmount, netAmount } = useTaxCalculation({
    amount,
    vatRate,
    whtRate,
    hasWht,
    amountInputType,
  });

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

  // Handle file selection - now uses the extraction hook
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Add files to the extraction hook (auto-analyzes)
    await addFiles(Array.from(files));
    
    // Reset input
    e.target.value = "";
  };

  // Handle merge dialog actions (for duplicate doc types)
  const handleMergeAction = (action: "merge" | "replace" | "cancel") => {
    if (!pendingFile) return;

    if (action === "merge" || action === "replace") {
      addFiles([pendingFile.file]);
    }
    
    setPendingFile(null);
    setExistingFileIndex(-1);
    setShowMergeDialog(false);
  };

  // Remove file using the extraction hook
  const handleRemoveFile = (fileId: string) => {
    removeExtractedFile(fileId);
  };

  // Dismiss duplicate warning
  const dismissWarning = (index: number) => {
    setDuplicateWarnings(prev => prev.filter((_, i) => i !== index));
  };

  // Handle amount conflict resolution
  const handleAmountSelect = (value: number) => {
    setAmount(value.toString());
    markFieldEdited("amount");
  };

  // Handle contact conflict resolution
  const handleContactSelect = (value: string) => {
    setContactName(value);
    markFieldEdited("contactName");
  };

  // Handle form submission
  const handleSubmit = async (formData: FormData) => {
    setError(null);

    startTransition(async () => {
      const amountNum = parseFloat(amount) || 0;
      
      // Calculate VAT amounts based on input type
      let subtotalCalc: number;
      let totalAmountCalc: number;
      let vatAmountCalc = 0;
      
      if (vatRate > 0) {
        if (amountInputType === "includeVat") {
          // User entered total (including VAT)
          totalAmountCalc = amountNum;
          subtotalCalc = amountNum / (1 + vatRate / 100);
          vatAmountCalc = totalAmountCalc - subtotalCalc;
        } else {
          // User entered subtotal (excluding VAT)
          subtotalCalc = amountNum;
          vatAmountCalc = subtotalCalc * (vatRate / 100);
          totalAmountCalc = subtotalCalc + vatAmountCalc;
        }
      } else {
        // No VAT
        subtotalCalc = amountNum;
        totalAmountCalc = amountNum;
      }
      
      // Calculate WHT amount
      const whtAmountCalc = hasWht ? subtotalCalc * (whtRate / 100) : 0;
      
      formData.set("totalAmount", totalAmountCalc.toString());
      formData.set("subtotal", subtotalCalc.toString());
      formData.set("vatRate", vatRate.toString());
      formData.set("vatAmount", vatAmountCalc.toString());
      formData.set("whtAmount", whtAmountCalc.toString());
      formData.set("whtRate", hasWht ? whtRate.toString() : "0");
      formData.set("transactionType", transactionType);
      formData.set("hasWht", hasWht.toString());
      formData.set("whtSent", whtSent.toString());
      formData.set("whtReceived", whtReceived.toString());

      // Add files for create mode - use extractedFiles from hook
      if (mode === "create") {
        for (let i = 0; i < extractedFiles.length; i++) {
          const extractedFile = extractedFiles[i];
          formData.append(`files`, extractedFile.file);
          // Use AI-detected doc type or fallback to OTHER
          const docType = extractedFile.extractedData?.type || "OTHER";
          formData.append(`docTypes`, docType);
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

  // Count uploaded documents - use extractedFiles from hook
  const docCount = mode === "create" 
    ? extractedFiles.length 
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
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5",
                transactionType === "EXPENSE"
                  ? "bg-rose-500 text-white"
                  : "text-gray-500 hover:text-rose-600 hover:bg-rose-50"
              )}
            >
              <TRANSACTION_TYPE_CONFIG.EXPENSE.icon className="w-4 h-4" />
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
              <TRANSACTION_TYPE_CONFIG.INCOME.icon className="w-4 h-4" />
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
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <Label className="shrink-0">จำนวนเงิน *</Label>
                      {/* Source badge */}
                      {mode === "create" && aggregatedData.amount.sources.length > 0 && !editedFields.has("amount") && (
                        <SourceBadge 
                          source={aggregatedData.amount.sources} 
                          isUserEdited={editedFields.has("amount")}
                        />
                      )}
                    </div>
                    {isEditing && vatRate > 0 && (
                      <div className="flex rounded-md border p-0.5 bg-muted/30 shrink-0">
                        <button
                          type="button"
                          onClick={() => setAmountInputType("includeVat")}
                          className={cn(
                            "px-2 py-0.5 text-xs font-medium rounded transition-all",
                            amountInputType === "includeVat"
                              ? "bg-white text-primary shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          รวม VAT
                        </button>
                        <button
                          type="button"
                          onClick={() => setAmountInputType("excludeVat")}
                          className={cn(
                            "px-2 py-0.5 text-xs font-medium rounded transition-all",
                            amountInputType === "excludeVat"
                              ? "bg-white text-primary shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          ก่อน VAT
                        </button>
                      </div>
                    )}
                  </div>
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
                        onChange={(e) => {
                          setAmount(e.target.value);
                          markFieldEdited("amount");
                        }}
                        required
                      />
                      {vatRate > 0 && amount && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          {amountInputType === "includeVat" ? "รวม VAT" : "ก่อน VAT"}
                        </span>
                      )}
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
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <Label className="shrink-0">{transactionType === "EXPENSE" ? "ผู้ติดต่อ / ร้านค้า" : "ลูกค้า"} *</Label>
                    {/* Source badge */}
                    {mode === "create" && aggregatedData.contactName.sources.length > 0 && !editedFields.has("contactName") && (
                      <SourceBadge 
                        source={aggregatedData.contactName.sources} 
                        isUserEdited={editedFields.has("contactName")}
                      />
                    )}
                  </div>
                  {isEditing ? (
                    <>
                      <ContactInput
                        value={contactName}
                        onChange={(value, contactId) => {
                          handleContactChange(value, contactId);
                          markFieldEdited("contactName");
                        }}
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
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <Label className="shrink-0">รายละเอียด *</Label>
                  {/* Source badge */}
                  {mode === "create" && aggregatedData.description.sources.length > 0 && !editedFields.has("description") && (
                    <SourceBadge 
                      source={aggregatedData.description.sources} 
                      isUserEdited={editedFields.has("description")}
                    />
                  )}
                </div>
                {isEditing ? (
                  <Textarea
                    name="description"
                    placeholder="เช่น ค่าบริการ IT เดือนมกราคม..."
                    rows={2}
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      markFieldEdited("description");
                    }}
                    required
                  />
                ) : (
                  <p className="py-2 font-medium">{document?.description || "-"}</p>
                )}
              </div>

              {/* Row 4: Notes */}
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
                          {WHT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium text-rose-600">
                        {WHT_TYPES.find(t => t.value === whtRate.toString())?.label || `${whtRate}%`}
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
                    <div className="flex justify-between text-rose-600">
                      <span>หัก ณ ที่จ่าย {whtRate}%</span>
                      <span>-฿{formatMoney(whtAmount)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-2 border-t mt-2 font-bold">
                  <span className="text-sm">{transactionType === "EXPENSE" ? "ยอดโอนจริง" : "ยอดรับจริง"}</span>
                  <span className={transactionType === "INCOME" ? "text-primary" : "text-rose-600"}>
                    {transactionType === "INCOME" ? "+" : "-"}฿{formatMoney(netAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Documents (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Documents Panel */}
          <div className="rounded-xl border bg-white sticky top-4 max-h-[calc(100vh-160px)] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-gray-900">เอกสารในกล่อง</span>
                </div>
                {allAnalyzed && extractedFiles.length > 0 && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    AI วิเคราะห์แล้ว
                  </span>
                )}
                {isAnalyzing && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    กำลังวิเคราะห์...
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {docCount} เอกสาร
                {isAnalyzing && ` (กำลังวิเคราะห์...)`}
              </p>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1">
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
                      รองรับ: รูปภาพ, PDF • AI วิเคราะห์อัตโนมัติ
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

              {/* Uploaded Files (Create Mode) - New DocumentFileCard */}
              {mode === "create" && extractedFiles.length > 0 && (
                <div className="space-y-2">
                  {extractedFiles.map((extractedFile) => (
                    <DocumentFileCard
                      key={extractedFile.id}
                      extractedFile={extractedFile}
                      onRemove={() => handleRemoveFile(extractedFile.id)}
                      onReanalyze={() => reanalyzeFile(extractedFile.id)}
                      isEditable={isEditing}
                      compact={extractedFiles.length > 3}
                    />
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
              {extractedFiles.length === 0 && mode === "create" && (
                <div className="text-center py-6 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">ยังไม่มีเอกสาร</p>
                  <p className="text-xs mt-1">อัปโหลดเอกสาร AI จะวิเคราะห์อัตโนมัติ</p>
                </div>
              )}
            </div>
          </div>

          {/* Conflict Resolution Panel */}
          {mode === "create" && hasConflicts && (
            <div className="rounded-xl border bg-white overflow-hidden">
              <div className="px-5 py-4 border-b bg-amber-50">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-semibold">พบข้อมูลต่างกัน</span>
                </div>
                <p className="text-xs text-amber-600 mt-1">
                  กรุณาเลือกค่าที่ถูกต้อง
                </p>
              </div>
              <div className="p-4 space-y-4">
                {/* Amount Conflict */}
                {aggregatedData.amount.hasConflict && (
                  <ConflictResolver
                    field={aggregatedData.amount}
                    label="ยอดเงิน"
                    fieldType="amount"
                    value={parseFloat(amount) || undefined}
                    onChange={handleAmountSelect}
                  />
                )}
                
                {/* Contact Conflict */}
                {aggregatedData.contactName.hasConflict && (
                  <ConflictResolver
                    field={aggregatedData.contactName}
                    label="ผู้ขาย/ร้านค้า"
                    fieldType="text"
                    value={contactName || undefined}
                    onChange={handleContactSelect}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions - Only for create mode */}
      {mode === "create" && (
        <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-gray-50 -mx-6 px-6 py-4 border-t z-10">
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
