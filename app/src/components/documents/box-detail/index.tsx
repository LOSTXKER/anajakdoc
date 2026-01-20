"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  X, 
  Send, 
  CheckCircle2, 
  HelpCircle, 
  XCircle, 
  Loader2, 
  Trash2,
  Package,
  Calendar,
  Building2,
  FolderOpen,
  CreditCard,
  FileText,
  AlertCircle,
  Plus,
  Eye,
  Download,
  MoreHorizontal,
  Check,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatMoney, getTodayForInput } from "@/lib/formatters";
import { getBoxStatusConfig, getDocStatusConfig, getDocTypeLabel } from "@/lib/document-config";
import { PaymentSection } from "@/components/payments";
import { FileList } from "./FileList";
import { TaxSummary } from "./TaxSummary";
import type { SerializedBox, DocType, ExpenseType } from "@/types";
import type { Category, Contact, CostCenter } from ".prisma/client";

interface BoxDetailViewProps {
  box: SerializedBox;
  categories?: Category[];
  contacts?: Contact[];
  costCenters?: CostCenter[];
  isEditing?: boolean;
  isPending?: boolean;
  onToggleEdit?: () => void;
  onSave?: (formData: FormData) => void;
  onSendToAccounting?: () => void;
  onReview?: (action: "approve" | "reject" | "need_info") => void;
  onFileUpload?: (files: FileList, docType?: DocType) => void;
  onDeleteFile?: (fileId: string) => void;
  onToggleItem?: (itemId: string) => void;
  onDelete?: () => void;
  isPendingToggle?: string;
  canEdit?: boolean;
  canSend?: boolean;
  canReview?: boolean;
  canDelete?: boolean;
}

export function BoxDetailView({
  box,
  categories = [],
  contacts = [],
  costCenters = [],
  isEditing = false,
  isPending = false,
  onToggleEdit,
  onSave,
  onSendToAccounting,
  onReview,
  onFileUpload,
  onDeleteFile,
  onToggleItem,
  onDelete,
  isPendingToggle,
  canEdit = false,
  canSend = false,
  canReview = false,
  canDelete = false,
}: BoxDetailViewProps) {
  // Form state for editing
  const [title, setTitle] = useState(box.title || "");
  const [description, setDescription] = useState(box.description || "");
  const [amount, setAmount] = useState(box.totalAmount?.toString() || "");
  const [boxDate, setBoxDate] = useState(box.boxDate?.split("T")[0] || getTodayForInput());
  const [categoryId, setCategoryId] = useState(box.categoryId || "");
  const [contactId, setContactId] = useState(box.contactId || "");
  const [notes, setNotes] = useState(box.notes || "");

  // File upload refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDocType, setUploadingDocType] = useState<DocType | undefined>();

  // Get all files from documents
  const allFiles = box.documents?.flatMap(doc => 
    doc.files?.map(f => ({
      ...f,
      docType: doc.docType,
    })) || []
  ) || [];

  // Get status configs
  const statusConfig = getBoxStatusConfig(box.status);
  const docStatusConfig = getDocStatusConfig(box.docStatus);

  // Filter categories & contacts
  const filteredCategories = categories.filter(
    c => c.categoryType === (box.boxType === "EXPENSE" ? "EXPENSE" : "INCOME")
  );
  const filteredContacts = contacts.filter(c => {
    if (box.boxType === "EXPENSE") {
      return c.contactRole === "VENDOR" || c.contactRole === "BOTH";
    }
    return c.contactRole === "CUSTOMER" || c.contactRole === "BOTH";
  });

  // Determine document status
  const hasSlip = box.documents?.some(d => ["SLIP_TRANSFER", "SLIP_CHEQUE"].includes(d.docType));
  const hasTaxInvoice = box.documents?.some(d => d.docType === "TAX_INVOICE");
  const isPaid = box.paymentStatus === "PAID" || box.paymentStatus === "PARTIAL";
  const needsTaxInvoice = box.expenseType === "STANDARD" && !hasTaxInvoice;

  // Get specific file references for checklist display
  const slipFiles = allFiles.filter(f => ["SLIP_TRANSFER", "SLIP_CHEQUE"].includes(f.docType));
  const taxInvoiceFiles = allFiles.filter(f => f.docType === "TAX_INVOICE");
  const whtFiles = allFiles.filter(f => f.docType === "WHT_SENT");
  
  // WHT status
  const hasWht = box.hasWht || false;
  const whtIssued = whtFiles.length > 0;
  const whtSent = box.whtSent || false;

  // Cash receipt status (for NO_VAT expense type)
  const cashReceiptFiles = allFiles.filter(f => ["CASH_RECEIPT", "RECEIPT", "OTHER"].includes(f.docType));
  const hasCashReceipt = cashReceiptFiles.length > 0;
  const noCashReceiptConfirmed = box.noReceiptReason === "NO_CASH_RECEIPT";

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && onFileUpload) {
      onFileUpload(files, uploadingDocType);
    }
    e.target.value = "";
    setUploadingDocType(undefined);
  };

  const triggerFileUpload = (docType?: DocType) => {
    setUploadingDocType(docType);
    fileInputRef.current?.click();
  };

  // Handle save
  const handleSave = () => {
    if (!onSave) return;
    
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("totalAmount", amount);
    formData.append("boxDate", boxDate);
    if (categoryId) formData.append("categoryId", categoryId);
    if (contactId) formData.append("contactId", contactId);
    if (notes) formData.append("notes", notes);
    
    onSave(formData);
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/documents"
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors shrink-0 mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {box.title || box.description || `รายการ ${box.boxNumber}`}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">{box.boxNumber}</span>
              <span className="text-gray-300">•</span>
              <Badge variant="secondary" className={statusConfig.className}>
                {statusConfig.label}
              </Badge>
              {docStatusConfig && (
                <Badge variant="outline" className={docStatusConfig.className}>
                  {docStatusConfig.label}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={onToggleEdit} disabled={isPending}>
                <X className="mr-1 h-4 w-4" /> ยกเลิก
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isPending}>
                {isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                บันทึก
              </Button>
            </>
          ) : (
            <>
              {canDelete && onDelete && (
                <Button variant="outline" size="sm" onClick={onDelete} disabled={isPending} className="text-red-600 border-red-300 hover:bg-red-50">
                  <Trash2 className="mr-1 h-4 w-4" /> ลบ
                </Button>
              )}
              {canEdit && (
                <Button variant="outline" size="sm" onClick={onToggleEdit}>
                  <Edit className="mr-1 h-4 w-4" /> แก้ไข
                </Button>
              )}
              {canSend && (
                <Button size="sm" onClick={onSendToAccounting} disabled={isPending}>
                  {isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
                  ส่งบัญชี
                </Button>
              )}
              {canReview && onReview && (
                <>
                  <Button variant="outline" size="sm" onClick={() => onReview("need_info")} disabled={isPending} className="text-amber-600 border-amber-300 hover:bg-amber-50">
                    <HelpCircle className="mr-1 h-4 w-4" /> ขอข้อมูล
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onReview("reject")} disabled={isPending} className="text-red-600 border-red-300 hover:bg-red-50">
                    <XCircle className="mr-1 h-4 w-4" /> ปฏิเสธ
                  </Button>
                  <Button size="sm" onClick={() => onReview("approve")} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">
                    {isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}
                    อนุมัติ
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - Main Info (3/5) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Info Card */}
          <div className="rounded-2xl border bg-white overflow-hidden">
            {/* Amount Header */}
            <div className={cn(
              "px-6 py-5",
              box.boxType === "EXPENSE" ? "bg-gradient-to-r from-red-50 to-orange-50" : "bg-gradient-to-r from-green-50 to-emerald-50"
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">ยอดรวม</p>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <span className={cn("text-2xl font-bold", box.boxType === "EXPENSE" ? "text-red-600" : "text-green-600")}>฿</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className={cn(
                          "text-2xl font-bold border-0 border-b-2 rounded-none px-0 h-auto py-0 w-40 focus-visible:ring-0 bg-transparent",
                          box.boxType === "EXPENSE" ? "text-red-600 border-red-300 focus-visible:border-red-500" : "text-green-600 border-green-300 focus-visible:border-green-500"
                        )}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  ) : (
                    <p className={cn("text-3xl font-bold", box.boxType === "EXPENSE" ? "text-red-600" : "text-green-600")}>
                      ฿{formatMoney(box.totalAmount)}
                    </p>
                  )}
                </div>
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center",
                  box.boxType === "EXPENSE" ? "bg-red-100" : "bg-green-100"
                )}>
                  <Package className={cn("h-7 w-7", box.boxType === "EXPENSE" ? "text-red-600" : "text-green-600")} />
                </div>
              </div>
              
              {/* VAT Info */}
              {box.expenseType === "STANDARD" && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-100 text-green-700 text-sm">
                    <Check className="h-3 w-3" />
                    <span>VAT ฿{formatMoney(box.vatAmount)} (ขอคืน VAT ได้)</span>
                  </div>
                </div>
              )}
              {/* WHT Info */}
              {hasWht && box.whtAmount > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-100 text-purple-700 text-sm">
                    <span>หัก ณ ที่จ่าย ฿{formatMoney(box.whtAmount)} ({box.whtRate}%)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Details Grid */}
            <div className="p-6">
              {isEditing ? (
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <Label className="text-sm text-gray-500">ชื่อรายการ</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="เช่น ค่าบริการ IT ม.ค."
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Date */}
                    <div>
                      <Label className="text-sm text-gray-500">วันที่</Label>
                      <Input
                        type="date"
                        className="mt-1"
                        value={boxDate}
                        onChange={(e) => setBoxDate(e.target.value)}
                      />
                    </div>

                    {/* Contact */}
                    <div>
                      <Label className="text-sm text-gray-500">{box.boxType === "EXPENSE" ? "ร้านค้า" : "ลูกค้า"}</Label>
                      <Select value={contactId || "__none__"} onValueChange={(v) => setContactId(v === "__none__" ? "" : v)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="เลือก..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">ไม่ระบุ</SelectItem>
                          {filteredContacts.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Category */}
                    <div>
                      <Label className="text-sm text-gray-500">หมวดหมู่</Label>
                      <Select value={categoryId || "__none__"} onValueChange={(v) => setCategoryId(v === "__none__" ? "" : v)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="เลือก..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">ไม่ระบุ</SelectItem>
                          {filteredCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label className="text-sm text-gray-500">หมายเหตุ</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="รายละเอียดเพิ่มเติม..."
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  {/* Date */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">วันที่</p>
                      <p className="font-medium text-gray-900">
                        {new Date(box.boxDate).toLocaleDateString("th-TH", { 
                          day: "numeric", month: "short", year: "numeric" 
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{box.boxType === "EXPENSE" ? "ร้านค้า" : "ลูกค้า"}</p>
                      <p className="font-medium text-gray-900">{box.contact?.name || "ไม่ระบุ"}</p>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      <FolderOpen className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">หมวดหมู่</p>
                      <p className="font-medium text-gray-900">{box.category?.name || "ไม่ระบุ"}</p>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      isPaid ? "bg-green-100" : "bg-amber-100"
                    )}>
                      <CreditCard className={cn("h-5 w-5", isPaid ? "text-green-600" : "text-amber-600")} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">การชำระเงิน</p>
                      <p className={cn("font-medium", isPaid ? "text-green-600" : "text-amber-600")}>
                        {isPaid ? `จ่ายแล้ว ฿${formatMoney(box.paidAmount)}` : "รอชำระ"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {!isEditing && box.notes && (
                <div className="mt-4 p-3 rounded-xl bg-gray-50 border">
                  <p className="text-sm text-gray-600">{box.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Documents Section */}
          <FileList
            files={allFiles}
            canEdit={canEdit}
            onTriggerFileUpload={() => triggerFileUpload()}
            onDeleteFile={onDeleteFile}
          />
        </div>

        {/* Right Column - Status (2/5) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Status Card */}
          <div className="rounded-2xl border bg-white overflow-hidden">
            {(() => {
              // คำนวณจำนวน checklist items
              const items: { label: string; completed: boolean }[] = [];
              
              // 1. การชำระเงิน
              items.push({ label: "การชำระเงิน", completed: isPaid });
              
              // 2. มีใบกำกับภาษี (STANDARD)
              if (box.expenseType === "STANDARD") {
                items.push({ label: "มีใบกำกับภาษี", completed: hasTaxInvoice });
              }
              
              // 3. มีบิลเงินสด (NO_VAT)
              if (box.expenseType === "NO_VAT") {
                items.push({ label: "มีบิลเงินสด", completed: hasCashReceipt || noCashReceiptConfirmed });
              }
              
              // 4. WHT (ถ้ามี)
              if (hasWht) {
                items.push({ label: "ออก WHT", completed: whtIssued });
                items.push({ label: "ส่ง WHT", completed: whtSent });
              }
              
              const completedCount = items.filter(i => i.completed).length;
              const totalCount = items.length;
              const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
              
              return (
                <div className="px-5 py-4 border-b flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">สถานะเอกสาร</h3>
                    <p className="text-sm text-gray-500">
                      {completedCount === totalCount 
                        ? "เอกสารครบถ้วน" 
                        : `${completedCount}/${totalCount} รายการ`
                      }
                    </p>
                  </div>
                  <div className="ml-auto">
                    <Progress 
                      value={progressPercent} 
                      className="h-2 w-24" 
                    />
                  </div>
                </div>
              );
            })()}

            <div className="p-5 space-y-3">
              {/* Warning Banner */}
              {hasSlip && !hasTaxInvoice && box.expenseType === "STANDARD" && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-amber-700">มีสลิปแล้ว แต่ยังไม่มีใบกำกับภาษี</p>
                    <p className="text-xs text-amber-600">เพิ่มใบกำกับเพื่อยืนยันยอดและ VAT</p>
                  </div>
                </div>
              )}

              {/* การชำระเงิน - แสดงสถานะ + ปุ่มอัปโหลดสลิป */}
              {/* ถ้าต้องการเพิ่มรายการชำระ (เงินสด/โอน/เช็ค) ไปกดที่ PaymentSection */}
              <div className={cn(
                "flex items-start gap-3 p-3 rounded-xl border",
                isPaid ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  isPaid ? "bg-green-100" : "bg-gray-200"
                )}>
                  {isPaid ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-gray-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={cn("font-medium text-sm", isPaid ? "text-green-700" : "text-gray-700")}>
                    การชำระเงิน {isPaid && <Check className="inline h-3 w-3 ml-1" />}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isPaid && hasSlip 
                      ? "ชำระแล้ว - มีหลักฐานการโอน" 
                      : isPaid 
                        ? "ชำระแล้ว" 
                        : "รอชำระเงิน"
                    }
                  </p>
                  {/* File Reference - แสดงสลิปถ้ามี */}
                  {hasSlip && slipFiles.length > 0 && (
                    <div className="mt-1 text-xs text-gray-500">
                      └── {slipFiles[0].fileName}
                    </div>
                  )}
                </div>

                {/* Actions - แค่ปุ่มอัปโหลดสลิป */}
                {canEdit && !isPaid && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => triggerFileUpload("SLIP_TRANSFER")}
                    className="text-xs shrink-0"
                  >
                    <Plus className="h-3 w-3 mr-1" /> สลิป
                  </Button>
                )}
              </div>

              {/* Tax Invoice (only for STANDARD expense) */}
              {box.expenseType === "STANDARD" && (
                <div className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border",
                  hasTaxInvoice ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    hasTaxInvoice ? "bg-green-100" : "bg-amber-100"
                  )}>
                    {hasTaxInvoice ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <FileText className="h-4 w-4 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={cn("font-medium text-sm", hasTaxInvoice ? "text-green-700" : "text-amber-700")}>
                      มีใบกำกับภาษี {hasTaxInvoice ? <Check className="inline h-3 w-3 ml-1" /> : <span className="text-red-500 text-xs ml-1">จำเป็น</span>}
                    </p>
                    <p className="text-xs text-gray-500">
                      {hasTaxInvoice ? "อัปโหลดใบกำกับภาษีจากผู้ขาย" : "อัปโหลดใบกำกับภาษีจากผู้ขาย"}
                    </p>
                    {/* File Reference */}
                    {hasTaxInvoice && taxInvoiceFiles.length > 0 && (
                      <div className="mt-1 text-xs text-gray-500">
                        └── {taxInvoiceFiles[0].fileName}
                      </div>
                    )}
                  </div>
                  {canEdit && !hasTaxInvoice && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => triggerFileUpload("TAX_INVOICE")}
                      className="text-xs border-amber-300 text-amber-700 hover:bg-amber-100 shrink-0"
                    >
                      <Plus className="h-3 w-3 mr-1" /> เพิ่ม
                    </Button>
                  )}
                </div>
              )}

              {/* Cash Receipt (only for NO_VAT expense - ไม่มีใบกำกับภาษี) */}
              {box.expenseType === "NO_VAT" && (
                <div className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border",
                  (hasCashReceipt || noCashReceiptConfirmed) ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    (hasCashReceipt || noCashReceiptConfirmed) ? "bg-green-100" : "bg-amber-100"
                  )}>
                    {(hasCashReceipt || noCashReceiptConfirmed) ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <FileText className="h-4 w-4 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={cn("font-medium text-sm", (hasCashReceipt || noCashReceiptConfirmed) ? "text-green-700" : "text-amber-700")}>
                      {noCashReceiptConfirmed 
                        ? <>ยืนยันไม่มีบิลเงินสด <Check className="inline h-3 w-3 ml-1" /></>
                        : hasCashReceipt 
                          ? <>มีบิลเงินสด <Check className="inline h-3 w-3 ml-1" /></>
                          : <>มีบิลเงินสด <span className="text-red-500 text-xs ml-1">จำเป็น</span></>
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {noCashReceiptConfirmed 
                        ? "ยืนยันแล้วว่าไม่มีบิลเงินสด" 
                        : hasCashReceipt 
                          ? "อัปโหลดบิลเงินสดแล้ว"
                          : "อัปโหลดบิลเงินสด หรือกดยืนยันถ้าไม่มีบิล"
                      }
                    </p>
                    {/* File Reference */}
                    {hasCashReceipt && cashReceiptFiles.length > 0 && (
                      <div className="mt-1 text-xs text-gray-500">
                        └── {cashReceiptFiles[0].fileName}
                      </div>
                    )}
                  </div>
                  {/* Actions: Upload or Confirm no receipt */}
                  {canEdit && !hasCashReceipt && (
                    <div className="flex gap-1 shrink-0">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => triggerFileUpload("CASH_RECEIPT")}
                        className="text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                      >
                        <Plus className="h-3 w-3 mr-1" /> เพิ่ม
                      </Button>
                      {onToggleItem && (
                        <Button 
                          size="sm" 
                          variant={noCashReceiptConfirmed ? "outline" : "default"}
                          onClick={() => onToggleItem("hasCashReceipt")}
                          disabled={isPendingToggle === "hasCashReceipt"}
                          className={cn(
                            "text-xs",
                            noCashReceiptConfirmed && "border-green-300 text-green-700 hover:bg-green-100"
                          )}
                        >
                          {isPendingToggle === "hasCashReceipt" ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : noCashReceiptConfirmed ? (
                            <Check className="h-3 w-3 mr-1" />
                          ) : null}
                          {noCashReceiptConfirmed ? "ยืนยันแล้ว" : "ไม่มีบิล"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* WHT Items (only when hasWht is true) */}
              {hasWht && (
                <>
                  {/* WHT Issued */}
                  <div className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border",
                    whtIssued ? "bg-green-50 border-green-200" : "bg-purple-50 border-purple-200"
                  )}>
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      whtIssued ? "bg-green-100" : "bg-purple-100"
                    )}>
                      {whtIssued ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={cn("font-medium text-sm", whtIssued ? "text-green-700" : "text-purple-700")}>
                        ออกหนังสือหัก ณ ที่จ่ายแล้ว {whtIssued && <Check className="inline h-3 w-3 ml-1" />}
                      </p>
                      <p className="text-xs text-gray-500">อัปโหลดหนังสือหัก ณ ที่จ่าย</p>
                      {/* File Reference */}
                      {whtIssued && whtFiles.length > 0 && (
                        <div className="mt-1 text-xs text-gray-500">
                          └── {whtFiles[0].fileName}
                        </div>
                      )}
                    </div>
                    {canEdit && !whtIssued && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => triggerFileUpload("WHT_SENT")}
                        className="text-xs border-purple-300 text-purple-700 hover:bg-purple-100 shrink-0"
                      >
                        <Plus className="h-3 w-3 mr-1" /> เพิ่ม
                      </Button>
                    )}
                  </div>

                  {/* WHT Sent (toggle) */}
                  <div className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border",
                    whtSent ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                  )}>
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      whtSent ? "bg-green-100" : "bg-gray-200"
                    )}>
                      {whtSent ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={cn("font-medium text-sm", whtSent ? "text-green-700" : "text-gray-700")}>
                        ส่งหนังสือหัก ณ ที่จ่ายแล้ว {whtSent && <Check className="inline h-3 w-3 ml-1" />}
                      </p>
                      <p className="text-xs text-gray-500">
                        {whtSent ? "ยืนยันว่าส่งให้คู่ค้าแล้ว" : "รอยืนยันว่าส่งให้คู่ค้าแล้ว"}
                      </p>
                    </div>
                    {canEdit && onToggleItem && whtIssued && (
                      <Button 
                        size="sm" 
                        variant={whtSent ? "outline" : "default"}
                        onClick={() => onToggleItem("whtSent")}
                        disabled={isPendingToggle === "whtSent"}
                        className={cn(
                          "text-xs shrink-0",
                          whtSent && "border-green-300 text-green-700 hover:bg-green-100"
                        )}
                      >
                        {isPendingToggle === "whtSent" ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : whtSent ? (
                          <Check className="h-3 w-3 mr-1" />
                        ) : null}
                        {whtSent ? "ยืนยันแล้ว" : "ยืนยัน"}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Payment Section - Full functionality */}
          <PaymentSection
            boxId={box.id}
            totalAmount={box.totalAmount}
            paidAmount={box.paidAmount}
            paymentStatus={box.paymentStatus}
            payments={box.payments || []}
            canEdit={canEdit}
          />

          {/* Tax Summary */}
          {(box.vatAmount > 0 || box.whtAmount > 0) && (
            <TaxSummary
              totalAmount={box.totalAmount}
              vatAmount={box.vatAmount}
              vatRate={box.vatRate}
              whtAmount={box.whtAmount}
              whtRate={box.whtRate}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Re-export all components for direct access
export { BoxHeader } from "./BoxHeader";
export { BoxSummaryCard } from "./BoxSummaryCard";
export { DocumentProgress } from "./DocumentProgress";
export { FileList } from "./FileList";
export { TaxSummary } from "./TaxSummary";
