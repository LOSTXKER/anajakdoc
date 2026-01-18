"use client";

import { useState, useTransition, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createDocument, updateDocument, submitDocument, reviewDocument } from "@/server/actions/document";
import { checkSoftDuplicate, type DuplicateWarning } from "@/server/actions/file";
import { createSubDocumentWithFile } from "@/server/actions/subdocument";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Calendar,
  DollarSign,
  Building2,
  FolderOpen,
  Users,
  Loader2,
  Save,
  ArrowLeft,
  UserPlus,
  TrendingDown,
  TrendingUp,
  Calculator,
  Upload,
  Receipt,
  FileCheck,
  FileText,
  CheckCircle2,
  X,
  Send,
  MessageSquare,
  XCircle,
  Clock,
  AlertCircle,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import { ContactForm } from "@/components/settings/contact-form";
import { DuplicateWarningAlert } from "@/components/documents/duplicate-warning";
import { DocumentChecklist } from "@/components/documents/document-checklist";
import { getDocumentChecklist, calculateCompletionPercent, getStatusLabel, getStatusColor } from "@/lib/checklist";
import type { Category, CostCenter, Contact, Document } from ".prisma/client";
import type { SubDocType, SerializedDocument, MemberRole } from "@/types";
import Link from "next/link";
import Image from "next/image";

type FormMode = "create" | "edit" | "view";

interface DocumentBoxFormProps {
  mode: FormMode;
  transactionType?: "EXPENSE" | "INCOME";
  categories: Category[];
  costCenters: CostCenter[];
  contacts: Contact[];
  document?: SerializedDocument;
  userRole?: MemberRole;
}

const vatOptions = [
  { value: "none", label: "ไม่มี VAT", rate: 0 },
  { value: "vat7", label: "VAT 7%", rate: 7 },
  { value: "vat7_inclusive", label: "VAT 7% (รวมใน)", rate: 7 },
];

const whtOptions = [
  { value: "none", label: "ไม่หัก", rate: 0 },
  { value: "wht1", label: "1% - ค่าขนส่ง", rate: 1 },
  { value: "wht2", label: "2% - ค่าโฆษณา", rate: 2 },
  { value: "wht3", label: "3% - ค่าบริการ/ค่าจ้าง", rate: 3 },
  { value: "wht5", label: "5% - ค่าเช่า", rate: 5 },
];

const paymentMethods = [
  { value: "TRANSFER", label: "โอนเงิน" },
  { value: "CASH", label: "เงินสด" },
  { value: "CREDIT_CARD", label: "บัตรเครดิต" },
  { value: "CHEQUE", label: "เช็ค" },
  { value: "OTHER", label: "อื่นๆ" },
];

// Get status display based on completion percent
function getStatusDisplay(doc: SerializedDocument) {
  const percent = doc.completionPercent || 0;
  const isExported = doc.status === "EXPORTED";
  const isBooked = doc.status === "BOOKED";
  const isVoid = doc.status === "VOID" || doc.status === "REJECTED";

  if (isVoid) {
    return { label: "ยกเลิก", color: "bg-gray-100 text-gray-500", icon: XCircle };
  }
  if (isBooked) {
    return { label: "บันทึกแล้ว", color: "bg-teal-100 text-teal-700", icon: CheckCircle2 };
  }
  if (isExported) {
    return { label: "Export แล้ว", color: "bg-purple-100 text-purple-700", icon: CheckCircle2 };
  }
  if (percent === 100 || doc.isComplete) {
    return { label: "เอกสารครบ", color: "bg-green-100 text-green-700", icon: CheckCircle2 };
  }
  if (percent >= 50) {
    return { label: `${percent}%`, color: "bg-yellow-100 text-yellow-700", icon: Clock };
  }
  return { label: `${percent}%`, color: "bg-orange-100 text-orange-700", icon: AlertCircle };
}

interface RequiredDoc {
  type: SubDocType;
  label: string;
  icon: typeof Receipt;
  required: boolean;
  description: string;
}

interface FilePreview {
  file: File;
  preview: string;
  docType: SubDocType;
}

export function DocumentBoxForm({
  mode,
  transactionType: defaultTransactionType = "EXPENSE",
  categories,
  costCenters,
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
  const [contacts, setContacts] = useState<Array<{ id: string; name: string }>>(initialContacts);
  const [selectedContactId, setSelectedContactId] = useState(document?.contactId || "");
  const [showAddContact, setShowAddContact] = useState(false);

  // Amount & Calculation state
  const [baseAmount, setBaseAmount] = useState(
    document ? (document.subtotal + document.vatAmount).toString() : ""
  );
  const [vatOption, setVatOption] = useState(() => {
    if (!document) return "none";
    if (document.vatRate === 7 || document.vatAmount > 0) {
      return document.isVatInclusive ? "vat7_inclusive" : "vat7";
    }
    return "none";
  });
  const [whtOption, setWhtOption] = useState(() => {
    if (!document || !document.hasWht) return "none";
    const rate = document.whtRate;
    if (rate === 1) return "wht1";
    if (rate === 2) return "wht2";
    if (rate === 3) return "wht3";
    if (rate === 5) return "wht5";
    return "none";
  });
  const [docDate, setDocDate] = useState(
    document?.docDate?.split("T")[0] || new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(document?.dueDate?.split("T")[0] || "");
  const [categoryId, setCategoryId] = useState(document?.categoryId || "");
  const [costCenterId, setCostCenterId] = useState(document?.costCenterId || "");
  const [description, setDescription] = useState(document?.description || "");
  const [notes, setNotes] = useState(document?.notes || "");
  const [paymentMethod, setPaymentMethod] = useState<string>(document?.paymentMethod || "TRANSFER");

  // File upload state (for create mode)
  const [uploadedFiles, setUploadedFiles] = useState<FilePreview[]>([]);

  // Review dialog
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | "need_info" | null>(null);
  const [reviewComment, setReviewComment] = useState("");

  // Duplicate detection
  const [duplicateWarnings, setDuplicateWarnings] = useState<DuplicateWarning[]>([]);

  // Permissions
  const canEdit = mode === "create" || (document && ["DRAFT", "NEED_INFO"].includes(document.status));
  const canSubmit = document && document.status === "DRAFT";
  const canReview = ["ACCOUNTING", "ADMIN", "OWNER"].includes(userRole) && 
                   document && ["PENDING_REVIEW", "NEED_INFO"].includes(document.status);

  // Calculate amounts
  const calculations = useMemo(() => {
    const base = parseFloat(baseAmount) || 0;
    const vatConfig = vatOptions.find(v => v.value === vatOption) || vatOptions[0];
    const whtConfig = whtOptions.find(w => w.value === whtOption) || whtOptions[0];

    let subtotal = base;
    let vatAmount = 0;
    let whtAmount = 0;

    if (vatConfig.value === "vat7_inclusive") {
      subtotal = base / 1.07;
      vatAmount = base - subtotal;
    } else if (vatConfig.value === "vat7") {
      subtotal = base;
      vatAmount = base * 0.07;
    } else {
      subtotal = base;
      vatAmount = 0;
    }

    if (whtConfig.rate > 0) {
      whtAmount = subtotal * (whtConfig.rate / 100);
    }

    const totalAmount = subtotal + vatAmount - whtAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      whtAmount: Math.round(whtAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      vatRate: vatConfig.rate,
      whtRate: whtConfig.rate,
      hasVat: vatConfig.rate > 0,
      hasWht: whtConfig.rate > 0,
      isVatInclusive: vatConfig.value === "vat7_inclusive",
    };
  }, [baseAmount, vatOption, whtOption]);

  // Required documents
  const requiredDocs = useMemo((): RequiredDoc[] => {
    const docs: RequiredDoc[] = [];

    if (transactionType === "EXPENSE") {
      docs.push({
        type: "SLIP",
        label: "สลิปโอนเงิน",
        icon: Receipt,
        required: true,
        description: "หลักฐานการชำระเงิน",
      });

      if (calculations.hasVat) {
        docs.push({
          type: "TAX_INVOICE",
          label: "ใบกำกับภาษี",
          icon: FileCheck,
          required: true,
          description: "ต้องมีเพื่อขอคืน VAT",
        });
      }

      if (calculations.hasWht) {
        docs.push({
          type: "WHT_CERT_SENT",
          label: "หนังสือหัก ณ ที่จ่าย",
          icon: FileText,
          required: true,
          description: "ต้องออกให้คู่ค้า",
        });
      }

      docs.push({
        type: "INVOICE",
        label: "ใบแจ้งหนี้",
        icon: FileText,
        required: false,
        description: "ถ้ามี",
      });
    } else {
      docs.push({
        type: "INVOICE",
        label: "ใบแจ้งหนี้",
        icon: FileText,
        required: true,
        description: "ที่ออกให้ลูกค้า",
      });

      if (calculations.hasVat) {
        docs.push({
          type: "TAX_INVOICE",
          label: "ใบกำกับภาษี",
          icon: FileCheck,
          required: true,
          description: "ที่ออกให้ลูกค้า",
        });
      }

      docs.push({
        type: "RECEIPT",
        label: "ใบเสร็จรับเงิน",
        icon: Receipt,
        required: false,
        description: "หลังรับเงินแล้ว",
      });

      if (calculations.hasWht) {
        docs.push({
          type: "WHT_CERT_RECEIVED",
          label: "หนังสือหัก ณ ที่จ่าย",
          icon: FileText,
          required: true,
          description: "ที่ได้รับจากลูกค้า",
        });
      }
    }

    return docs;
  }, [transactionType, calculations.hasVat, calculations.hasWht]);

  // Check uploaded docs (for create mode or from document)
  const uploadedDocTypes = useMemo(() => {
    if (mode === "create") {
      return new Set(uploadedFiles.map(f => f.docType));
    }
    if (document?.subDocuments) {
      return new Set(document.subDocuments.map(d => d.docType));
    }
    return new Set<SubDocType>();
  }, [mode, uploadedFiles, document?.subDocuments]);

  // Contact handler
  function handleContactCreated(newContact: { id: string; name: string }) {
    setContacts(prev => [...prev, newContact]);
    setSelectedContactId(newContact.id);
    setShowAddContact(false);
  }

  // File handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, docType: SubDocType) => {
    const files = e.target.files;
    if (!files) return;

    // For create mode, just store in state
    if (mode === "create") {
      const newFiles: FilePreview[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const preview = URL.createObjectURL(file);
        newFiles.push({ file, preview, docType });
      }
      setUploadedFiles(prev => [...prev, ...newFiles]);
      return;
    }

    // For view/edit mode, upload directly
    if (document) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.set("documentId", document.id);
        formData.set("docType", docType);
        formData.set("file", file);

        toast.loading(`กำลังอัปโหลด ${file.name}...`, { id: `upload-${i}` });

        const result = await createSubDocumentWithFile(formData);

        if (result.success) {
          toast.success(`อัปโหลด ${file.name} สำเร็จ`, { id: `upload-${i}` });
          router.refresh();
        } else {
          toast.error(result.error || `อัปโหลด ${file.name} ไม่สำเร็จ`, { id: `upload-${i}` });
        }
      }
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Duplicate check
  useEffect(() => {
    if (calculations.totalAmount <= 0 || mode === "view") return;

    const timer = setTimeout(async () => {
      try {
        const warning = await checkSoftDuplicate(
          calculations.totalAmount,
          selectedContactId || null,
          new Date(docDate),
          document?.id
        );
        
        if (warning) {
          setDuplicateWarnings(prev => {
            const exists = prev.some(w => w.documentId === warning.documentId);
            if (exists) return prev;
            return [...prev, warning];
          });
        }
      } catch (error) {
        console.error("Error checking duplicates:", error);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [calculations.totalAmount, selectedContactId, docDate, document?.id, mode]);

  function dismissWarning(index: number) {
    setDuplicateWarnings(prev => prev.filter((_, i) => i !== index));
  }

  // Submit handler
  async function handleSubmit(formData: FormData) {
    setError(null);
    
    formData.set("subtotal", calculations.subtotal.toString());
    formData.set("vatAmount", calculations.vatAmount.toString());
    formData.set("whtAmount", calculations.whtAmount.toString());
    formData.set("totalAmount", calculations.totalAmount.toString());
    formData.set("transactionType", transactionType);
    formData.set("hasWht", calculations.hasWht.toString());
    formData.set("hasValidVat", calculations.hasVat.toString());
    formData.set("vatRate", calculations.vatRate.toString());
    formData.set("whtRate", calculations.whtRate.toString());
    formData.set("isVatInclusive", calculations.isVatInclusive.toString());

    // Add files for create mode
    if (mode === "create") {
      uploadedFiles.forEach((filePreview) => {
        formData.append(`files`, filePreview.file);
        formData.append(`fileTypes`, filePreview.docType);
      });
    }

    startTransition(async () => {
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
        }
      }
    });
  }

  // Submit for review
  const handleSubmitForReview = () => {
    if (!document) return;
    startTransition(async () => {
      const result = await submitDocument(document.id);
      if (result.success) {
        toast.success("ส่งตรวจเรียบร้อย");
        router.refresh();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  // Review handler
  const handleReview = (action: "approve" | "reject" | "need_info") => {
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const confirmReview = () => {
    if (!reviewAction || !document) return;
    
    startTransition(async () => {
      const result = await reviewDocument(document.id, reviewAction, reviewComment);
      if (result.success) {
        toast.success(result.message);
        setReviewDialogOpen(false);
        setReviewComment("");
        router.refresh();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const formatMoney = (amount: number) => {
    return amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const statusDisplay = document ? getStatusDisplay(document) : null;
  const StatusIcon = statusDisplay?.icon || Clock;

  return (
    <form action={handleSubmit} className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/documents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับ
          </Link>
        </Button>

        {mode === "view" && canEdit && !isEditing && (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            แก้ไข
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <DuplicateWarningAlert warnings={duplicateWarnings} onDismiss={dismissWarning} />

      {/* Status & Info Card */}
      <Card className={`border-2 ${
        transactionType === "EXPENSE" ? "border-red-200 bg-red-50/30" : "border-green-200 bg-green-50/30"
      }`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <div className={`p-2 rounded-lg ${
                transactionType === "EXPENSE" ? "bg-red-100" : "bg-green-100"
              }`}>
                {transactionType === "EXPENSE" ? (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">
                    {mode === "create" ? "สร้างกล่อง" : document?.docNumber}
                  </h2>
                  {document && statusDisplay && (
                    <Badge className={statusDisplay.color}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {statusDisplay.label}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {transactionType === "EXPENSE" ? "รายจ่าย" : "รายรับ"}
                  {mode === "create" && " - กรอกยอดเงิน เลือก VAT และหัก ณ ที่จ่าย"}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            {mode !== "create" && (
              <div className="flex gap-2">
                {canSubmit && (
                  <Button onClick={handleSubmitForReview} disabled={isPending}>
                    <Send className="mr-2 h-4 w-4" />
                    ส่งตรวจ
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Amount & Calculation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                ยอดเงิน
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Base Amount */}
              <div className="space-y-2">
                <Label htmlFor="baseAmount" className="text-base font-medium">
                  ยอดเงิน {isEditing ? "*" : ""}
                </Label>
                {isEditing ? (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">฿</span>
                    <Input
                      id="baseAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-8 text-2xl h-14 font-medium"
                      placeholder="0.00"
                      value={baseAmount}
                      onChange={(e) => setBaseAmount(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-primary">
                    ฿{formatMoney(document?.totalAmount || 0)}
                  </div>
                )}
              </div>

              {/* VAT & WHT Selection */}
              {isEditing && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>VAT</Label>
                    <Select value={vatOption} onValueChange={setVatOption}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {vatOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>หัก ณ ที่จ่าย</Label>
                    <Select value={whtOption} onValueChange={setWhtOption}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {whtOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Calculation Result */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ยอดก่อน VAT</span>
                  <span>฿{formatMoney(isEditing ? calculations.subtotal : (document?.subtotal || 0))}</span>
                </div>
                {(isEditing ? calculations.hasVat : document?.vatAmount && document.vatAmount > 0) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      VAT {isEditing ? calculations.vatRate : document?.vatRate || 7}%
                    </span>
                    <span className="text-blue-600">
                      +฿{formatMoney(isEditing ? calculations.vatAmount : (document?.vatAmount || 0))}
                    </span>
                  </div>
                )}
                {(isEditing ? calculations.hasWht : document?.hasWht) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      หัก ณ ที่จ่าย {isEditing ? calculations.whtRate : document?.whtRate}%
                    </span>
                    <span className="text-orange-600">
                      -฿{formatMoney(isEditing ? calculations.whtAmount : (document?.whtAmount || 0))}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-medium">ยอดที่ต้องจ่ายจริง</span>
                  <span className="text-2xl font-bold text-primary">
                    ฿{formatMoney(isEditing ? calculations.totalAmount : (document?.totalAmount || 0))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                ข้อมูลธุรกรรม
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>วันที่ธุรกรรม {isEditing ? "*" : ""}</Label>
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
                    <p className="font-medium">
                      {document && new Date(document.docDate).toLocaleDateString("th-TH", {
                        day: "numeric", month: "long", year: "numeric"
                      })}
                    </p>
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
                    <p className="font-medium">
                      {document?.dueDate 
                        ? new Date(document.dueDate).toLocaleDateString("th-TH")
                        : "-"
                      }
                    </p>
                  )}
                </div>
              </div>

              {/* Category & Cost Center */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>หมวดหมู่ {isEditing ? "*" : ""}</Label>
                  {isEditing ? (
                    <Select name="categoryId" value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger>
                        <FolderOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="เลือกหมวดหมู่" />
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
                    <p className="font-medium">{document?.category?.name || "-"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>ศูนย์ต้นทุน</Label>
                  {isEditing ? (
                    <Select name="costCenterId" value={costCenterId} onValueChange={setCostCenterId}>
                      <SelectTrigger>
                        <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="เลือก (ถ้ามี)" />
                      </SelectTrigger>
                      <SelectContent>
                        {costCenters.map((cc) => (
                          <SelectItem key={cc.id} value={cc.id}>
                            {cc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">{document?.costCenter?.name || "-"}</p>
                  )}
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-2">
                <Label>
                  {transactionType === "EXPENSE" ? "ผู้ขาย/ร้านค้า" : "ลูกค้า"} {isEditing ? "*" : ""}
                </Label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Select 
                      name="contactId" 
                      value={selectedContactId}
                      onValueChange={setSelectedContactId}
                    >
                      <SelectTrigger className="flex-1">
                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="เลือก..." />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="icon">
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>เพิ่มผู้ติดต่อใหม่</DialogTitle>
                        </DialogHeader>
                        <ContactForm
                          defaultRole={transactionType === "EXPENSE" ? "VENDOR" : "CUSTOMER"}
                          onSuccess={handleContactCreated}
                          onCancel={() => setShowAddContact(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <p className="font-medium">{document?.contact?.name || "-"}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>รายละเอียด {isEditing ? "*" : ""}</Label>
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
                  <p>{document?.description || "-"}</p>
                )}
              </div>

              {/* Payment & Notes */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>วิธีชำระเงิน</Label>
                  {isEditing ? (
                    <Select name="paymentMethod" value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">
                      {paymentMethods.find(m => m.value === document?.paymentMethod)?.label || "-"}
                    </p>
                  )}
                </div>
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
                    <p className="text-muted-foreground">{document?.notes || "-"}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Review Actions */}
          {canReview && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">ตรวจสอบเอกสาร</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-3">
                <Button onClick={() => handleReview("approve")} className="flex-1">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  อนุมัติ
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleReview("need_info")}
                  className="flex-1"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  ขอข้อมูลเพิ่ม
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleReview("reject")}
                  className="flex-1"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  ปฏิเสธ
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Checklist / Required Documents */}
        <div className="space-y-6">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                {mode === "create" ? "กล่องเอกสาร" : "สถานะการดำเนินการ"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* For view/edit mode - use checklist */}
              {mode !== "create" && document && (() => {
                const checklistData = {
                  isPaid: document.isPaid || false,
                  hasPaymentProof: document.hasPaymentProof || false,
                  hasTaxInvoice: document.hasTaxInvoice || false,
                  hasInvoice: document.hasInvoice || false,
                  whtIssued: document.whtIssued || false,
                  whtSent: document.whtSent || false,
                  whtReceived: document.whtReceived || false,
                };
                const checklistItems = getDocumentChecklist(
                  transactionType,
                  calculations.hasVat || document.hasValidVat || false,
                  calculations.hasWht || document.hasWht || false,
                  checklistData,
                  uploadedDocTypes
                );
                const completionPercent = document.completionPercent || calculateCompletionPercent(checklistItems);
                
                return (
                  <DocumentChecklist
                    documentId={document.id}
                    items={checklistItems}
                    completionPercent={completionPercent}
                    canEdit={true}
                  />
                );
              })()}

              {/* For create mode - show required docs with upload */}
              {mode === "create" && (
                <div className="space-y-4">
                  {requiredDocs.map((doc) => {
                    const isUploaded = uploadedDocTypes.has(doc.type);
                    const Icon = doc.icon;

                    return (
                      <div
                        key={doc.type}
                        className={`rounded-lg border p-3 transition-colors ${
                          isUploaded 
                            ? "border-green-200 bg-green-50" 
                            : doc.required 
                              ? "border-orange-200 bg-orange-50" 
                              : "border-border"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`p-1.5 rounded ${
                            isUploaded ? "bg-green-100" : doc.required ? "bg-orange-100" : "bg-muted"
                          }`}>
                            <Icon className={`h-4 w-4 ${
                              isUploaded ? "text-green-600" : doc.required ? "text-orange-600" : "text-muted-foreground"
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{doc.label}</span>
                              {doc.required && !isUploaded && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0 text-orange-600 border-orange-200">
                                  จำเป็น
                                </Badge>
                              )}
                              {isUploaded && (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{doc.description}</p>

                            {/* Uploaded files */}
                            {uploadedFiles.filter(f => f.docType === doc.type).length > 0 && (
                              <div className="mt-2 space-y-1">
                                {uploadedFiles.filter(f => f.docType === doc.type).map((file, idx) => {
                                  const fileIndex = uploadedFiles.findIndex(f => f === file);
                                  return (
                                    <div key={idx} className="flex items-center gap-2 text-xs bg-background rounded p-1.5">
                                      {file.file.type.startsWith("image/") ? (
                                        <Image
                                          src={file.preview}
                                          alt={file.file.name}
                                          width={24}
                                          height={24}
                                          className="rounded object-cover"
                                        />
                                      ) : (
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                      )}
                                      <span className="flex-1 truncate">{file.file.name}</span>
                                      <button
                                        type="button"
                                        onClick={() => removeFile(fileIndex)}
                                        className="text-muted-foreground hover:text-destructive"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Upload button */}
                            <label className="mt-2 flex items-center justify-center gap-2 py-2 px-3 rounded border-2 border-dashed cursor-pointer hover:bg-muted/50 transition-colors">
                              <Upload className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {isUploaded ? "เพิ่มไฟล์" : "อัปโหลด"}
                              </span>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,application/pdf"
                                multiple
                                onChange={(e) => handleFileSelect(e, doc.type)}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Summary */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">เอกสารจำเป็น</span>
                      <span className={`font-medium ${
                        requiredDocs.filter(d => d.required).every(d => uploadedDocTypes.has(d.type))
                          ? "text-green-600"
                          : "text-orange-600"
                      }`}>
                        {requiredDocs.filter(d => d.required && uploadedDocTypes.has(d.type)).length}/
                        {requiredDocs.filter(d => d.required).length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      {isEditing && (
        <div className="flex items-center justify-end gap-3">
          {mode === "view" ? (
            <>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                บันทึก
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" asChild>
                <Link href="/documents">ยกเลิก</Link>
              </Button>
              <Button type="submit" disabled={isPending || !baseAmount}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {mode === "create" ? "สร้างกล่อง" : "บันทึก"}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" && "อนุมัติเอกสาร"}
              {reviewAction === "reject" && "ปฏิเสธเอกสาร"}
              {reviewAction === "need_info" && "ขอข้อมูลเพิ่มเติม"}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="ความคิดเห็น (ถ้ามี)..."
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button 
              onClick={confirmReview} 
              disabled={isPending}
              variant={reviewAction === "reject" ? "destructive" : "default"}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ยืนยัน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
