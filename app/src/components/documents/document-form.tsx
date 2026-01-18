"use client";

import { useState, useTransition, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createDocument, updateDocument } from "@/server/actions/document";
import { checkSoftDuplicate, type DuplicateWarning } from "@/server/actions/file";
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
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Package,
  FileText,
  Calendar,
  DollarSign,
  Building2,
  FolderOpen,
  Users,
  Loader2,
  Save,
  ArrowLeft,
  UserPlus,
  Info,
  TrendingDown,
  TrendingUp,
  Calculator,
  Upload,
  Receipt,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ContactForm } from "@/components/settings/contact-form";
import { DuplicateWarningAlert } from "@/components/documents/duplicate-warning";
import type { Category, CostCenter, Contact, Document } from ".prisma/client";
import type { SubDocType } from "@/types";
import Link from "next/link";
import Image from "next/image";

interface DocumentFormProps {
  transactionType: "EXPENSE" | "INCOME";
  categories: Category[];
  costCenters: CostCenter[];
  contacts: Contact[];
  document?: Document;
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

// Required documents based on settings
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

export function DocumentForm({
  transactionType,
  categories,
  costCenters,
  contacts: initialContacts,
  document,
}: DocumentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Contact state
  const [contacts, setContacts] = useState<Array<{ id: string; name: string }>>(initialContacts);
  const [selectedContactId, setSelectedContactId] = useState(document?.contactId || "");
  const [showAddContact, setShowAddContact] = useState(false);

  // Amount & Calculation state
  const [baseAmount, setBaseAmount] = useState(document?.subtotal?.toString() || "");
  const [vatOption, setVatOption] = useState("none");
  const [whtOption, setWhtOption] = useState("none");
  const [docDate, setDocDate] = useState(
    document?.docDate?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0]
  );

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<FilePreview[]>([]);
  const [activeUploadType, setActiveUploadType] = useState<SubDocType | null>(null);

  // Duplicate detection
  const [duplicateWarnings, setDuplicateWarnings] = useState<DuplicateWarning[]>([]);

  // Calculate amounts
  const calculations = useMemo(() => {
    const base = parseFloat(baseAmount) || 0;
    const vatConfig = vatOptions.find(v => v.value === vatOption) || vatOptions[0];
    const whtConfig = whtOptions.find(w => w.value === whtOption) || whtOptions[0];

    let subtotal = base;
    let vatAmount = 0;
    let whtAmount = 0;

    if (vatConfig.value === "vat7_inclusive") {
      // VAT included - calculate backwards
      subtotal = base / 1.07;
      vatAmount = base - subtotal;
    } else if (vatConfig.value === "vat7") {
      // VAT exclusive
      subtotal = base;
      vatAmount = base * 0.07;
    } else {
      subtotal = base;
      vatAmount = 0;
    }

    // WHT calculated on subtotal (before VAT)
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

  // Required documents based on settings
  const requiredDocs = useMemo((): RequiredDoc[] => {
    const docs: RequiredDoc[] = [];

    if (transactionType === "EXPENSE") {
      // Slip is usually needed
      docs.push({
        type: "SLIP",
        label: "สลิปโอนเงิน",
        icon: Receipt,
        required: true,
        description: "หลักฐานการชำระเงิน",
      });

      // Tax invoice if VAT
      if (calculations.hasVat) {
        docs.push({
          type: "TAX_INVOICE",
          label: "ใบกำกับภาษี",
          icon: FileCheck,
          required: true,
          description: "ต้องมีเพื่อขอคืน VAT",
        });
      }

      // WHT cert if WHT
      if (calculations.hasWht) {
        docs.push({
          type: "WHT_CERT_SENT",
          label: "หนังสือหัก ณ ที่จ่าย",
          icon: FileText,
          required: true,
          description: "ต้องออกให้คู่ค้า",
        });
      }

      // Invoice optional
      docs.push({
        type: "INVOICE",
        label: "ใบแจ้งหนี้",
        icon: FileText,
        required: false,
        description: "ถ้ามี",
      });
    } else {
      // INCOME
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

  // Check which docs are uploaded
  const uploadedDocTypes = useMemo(() => {
    return new Set(uploadedFiles.map(f => f.docType));
  }, [uploadedFiles]);

  // Contact created handler
  function handleContactCreated(newContact: { id: string; name: string }) {
    setContacts(prev => [...prev, newContact]);
    setSelectedContactId(newContact.id);
    setShowAddContact(false);
  }

  // File handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, docType: SubDocType) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: FilePreview[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const preview = URL.createObjectURL(file);
      newFiles.push({ file, preview, docType });
    }
    setUploadedFiles(prev => [...prev, ...newFiles]);
    setActiveUploadType(null);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Debounced duplicate check
  useEffect(() => {
    if (calculations.totalAmount <= 0) return;

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
  }, [calculations.totalAmount, selectedContactId, docDate, document?.id]);

  // Dismiss warning
  function dismissWarning(index: number) {
    setDuplicateWarnings(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    
    // Add calculated values
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

    // Add files to formData
    uploadedFiles.forEach((filePreview, index) => {
      formData.append(`files`, filePreview.file);
      formData.append(`fileTypes`, filePreview.docType);
    });

    startTransition(async () => {
      const result = document
        ? await updateDocument(document.id, formData)
        : await createDocument(formData);

      if (!result.success) {
        setError(result.error || "เกิดข้อผิดพลาด");
        toast.error(result.error || "เกิดข้อผิดพลาด");
      } else {
        toast.success(document ? "อัปเดตกล่องเรียบร้อย" : "สร้างกล่องเรียบร้อย");
        const data = result.data as { id: string } | undefined;
        if (!document && data?.id) {
          router.push(`/documents/${data.id}`);
        }
      }
    });
  }

  const formatMoney = (amount: number) => {
    return amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <form action={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/documents">
          <ArrowLeft className="mr-2 h-4 w-4" />
          กลับ
        </Link>
      </Button>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Duplicate Warnings */}
      <DuplicateWarningAlert warnings={duplicateWarnings} onDismiss={dismissWarning} />

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="p-2 bg-blue-100 rounded-lg h-fit">
              {transactionType === "EXPENSE" ? (
                <TrendingDown className="h-5 w-5 text-blue-600" />
              ) : (
                <TrendingUp className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-blue-900">
                {transactionType === "EXPENSE" ? "สร้างกล่องรายจ่าย" : "สร้างกล่องรายรับ"}
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                กรอกยอดเงิน เลือก VAT และหัก ณ ที่จ่าย ระบบจะคำนวณและบอกเอกสารที่ต้องอัปโหลดให้อัตโนมัติ
              </p>
            </div>
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
                คำนวณยอดเงิน
              </CardTitle>
              <CardDescription>กรอกยอดเงินและเลือกภาษี ระบบจะคำนวณให้อัตโนมัติ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Base Amount */}
              <div className="space-y-2">
                <Label htmlFor="baseAmount" className="text-base font-medium">
                  ยอดเงิน *
                </Label>
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
              </div>

              {/* VAT & WHT Selection */}
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

              {/* Calculation Result */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ยอดก่อน VAT</span>
                  <span>฿{formatMoney(calculations.subtotal)}</span>
                </div>
                {calculations.hasVat && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      VAT {calculations.vatRate}%
                      {calculations.isVatInclusive && " (รวมในยอด)"}
                    </span>
                    <span className="text-blue-600">+฿{formatMoney(calculations.vatAmount)}</span>
                  </div>
                )}
                {calculations.hasWht && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">หัก ณ ที่จ่าย {calculations.whtRate}%</span>
                    <span className="text-orange-600">-฿{formatMoney(calculations.whtAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-medium">ยอดที่ต้องจ่ายจริง</span>
                  <span className="text-2xl font-bold text-primary">
                    ฿{formatMoney(calculations.totalAmount)}
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
                  <Label htmlFor="docDate">วันที่ธุรกรรม *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="docDate"
                      name="docDate"
                      type="date"
                      className="pl-10"
                      value={docDate}
                      onChange={(e) => setDocDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">วันครบกำหนด</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      className="pl-10"
                      defaultValue={document?.dueDate?.toISOString().split("T")[0] || ""}
                    />
                  </div>
                </div>
              </div>

              {/* Category & Cost Center */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryId">หมวดหมู่ *</Label>
                  <Select name="categoryId" defaultValue={document?.categoryId || ""}>
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costCenterId">ศูนย์ต้นทุน</Label>
                  <Select name="costCenterId" defaultValue={document?.costCenterId || ""}>
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
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-2">
                <Label htmlFor="contactId">
                  {transactionType === "EXPENSE" ? "ผู้ขาย/ร้านค้า *" : "ลูกค้า *"}
                </Label>
                <div className="flex gap-2">
                  <Select 
                    name="contactId" 
                    value={selectedContactId}
                    onValueChange={setSelectedContactId}
                  >
                    <SelectTrigger className="flex-1">
                      <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder={transactionType === "EXPENSE" ? "เลือกผู้ขาย" : "เลือกลูกค้า"} />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          ยังไม่มีผู้ติดต่อ
                        </div>
                      ) : (
                        contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="icon" title="เพิ่มผู้ติดต่อใหม่">
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <UserPlus className="h-5 w-5" />
                          เพิ่ม{transactionType === "EXPENSE" ? "ผู้ขาย" : "ลูกค้า"}ใหม่
                        </DialogTitle>
                      </DialogHeader>
                      <ContactForm
                        defaultRole={transactionType === "EXPENSE" ? "VENDOR" : "CUSTOMER"}
                        onSuccess={handleContactCreated}
                        onCancel={() => setShowAddContact(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">รายละเอียดธุรกรรม *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="เช่น ค่าบริการ IT เดือนมกราคม..."
                  rows={2}
                  defaultValue={document?.description || ""}
                  required
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">วิธีชำระเงิน</Label>
                <Select name="paymentMethod" defaultValue={document?.paymentMethod || "TRANSFER"}>
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
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">หมายเหตุ</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="หมายเหตุเพิ่มเติม..."
                  rows={2}
                  defaultValue={document?.notes || ""}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Required Documents */}
        <div className="space-y-6">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                เอกสารที่ต้องอัปโหลด
              </CardTitle>
              <CardDescription>
                อัปโหลดเอกสารตามที่ระบบแนะนำ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {requiredDocs.map((doc) => {
                const isUploaded = uploadedDocTypes.has(doc.type);
                const files = uploadedFiles.filter(f => f.docType === doc.type);
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
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <div className={`p-1.5 rounded ${
                          isUploaded ? "bg-green-100" : doc.required ? "bg-orange-100" : "bg-muted"
                        }`}>
                          <Icon className={`h-4 w-4 ${
                            isUploaded ? "text-green-600" : doc.required ? "text-orange-600" : "text-muted-foreground"
                          }`} />
                        </div>
                        <div>
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
                        </div>
                      </div>
                    </div>

                    {/* Uploaded files */}
                    {files.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {files.map((file, idx) => {
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
                );
              })}

              {/* Summary */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">อัปโหลดแล้ว</span>
                  <span className="font-medium">
                    {uploadedFiles.length} ไฟล์
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" asChild>
          <Link href="/documents">ยกเลิก</Link>
        </Button>
        <Button type="submit" disabled={isPending || !baseAmount}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              สร้างกล่อง
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
