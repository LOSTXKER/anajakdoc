"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Package,
  Calendar,
  Building2,
  FolderOpen,
  Receipt,
  FileText,
  FileCheck,
  Check,
  AlertCircle,
  Plus,
  Eye,
  Trash2,
  Send,
  Edit,
  MoreVertical,
  Upload,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatMoney } from "@/lib/formatters";
import type { SerializedDocument, SubDocType } from "@/types";

interface BoxDetailViewProps {
  document: SerializedDocument;
  onEdit?: () => void;
  onSendToAccounting?: () => void;
  onAddDocument?: () => void;
  onViewFile?: (fileId: string) => void;
  onDeleteFile?: (fileId: string) => void;
  canEdit?: boolean;
  canSend?: boolean;
}

// Document step configuration
const DOC_STEPS = {
  EXPENSE: [
    { 
      id: "slip", 
      label: "สลิปโอนเงิน", 
      docType: "SLIP" as SubDocType,
      icon: Receipt,
      description: "หลักฐานการจ่ายเงิน",
    },
    { 
      id: "taxInvoice", 
      label: "ใบกำกับภาษี", 
      docType: "TAX_INVOICE" as SubDocType,
      icon: FileText,
      description: "ใบกำกับภาษี/ใบเสร็จ",
    },
    { 
      id: "whtCert", 
      label: "หนังสือหัก ณ ที่จ่าย", 
      docType: "WHT_CERT_SENT" as SubDocType,
      icon: FileCheck,
      description: "50 ทวิ",
      conditional: true,
    },
  ],
  INCOME: [
    { 
      id: "invoice", 
      label: "ใบแจ้งหนี้", 
      docType: "INVOICE" as SubDocType,
      icon: FileText,
      description: "ใบแจ้งหนี้ที่ออก",
    },
    { 
      id: "slip", 
      label: "หลักฐานรับเงิน", 
      docType: "SLIP" as SubDocType,
      icon: Receipt,
      description: "สลิป/หลักฐานการรับ",
    },
    { 
      id: "whtCert", 
      label: "หนังสือหัก ณ ที่จ่าย", 
      docType: "WHT_CERT_RECEIVED" as SubDocType,
      icon: FileCheck,
      description: "50 ทวิ ที่ได้รับ",
      conditional: true,
    },
  ],
};

export function BoxDetailView({
  document: doc,
  onEdit,
  onSendToAccounting,
  onAddDocument,
  onViewFile,
  onDeleteFile,
  canEdit = false,
  canSend = false,
}: BoxDetailViewProps) {
  // Get uploaded doc types
  const uploadedDocTypes = new Set<SubDocType>(
    doc.subDocuments?.map(sub => sub.docType) || []
  );

  // Get all files
  const allFiles = doc.subDocuments?.flatMap(sub => 
    sub.files?.map(f => ({
      ...f,
      docType: sub.docType,
    })) || []
  ) || [];

  // Steps based on transaction type
  const steps = DOC_STEPS[doc.transactionType].filter(
    step => !step.conditional || doc.hasWht
  );

  // Get step status
  const getStepStatus = (stepId: string): "completed" | "pending" | "missing" => {
    switch (stepId) {
      case "slip":
        return uploadedDocTypes.has("SLIP") ? "completed" : "missing";
      case "taxInvoice":
        return uploadedDocTypes.has("TAX_INVOICE") ? "completed" : 
               doc.totalAmount === 0 ? "missing" : "pending";
      case "invoice":
        return uploadedDocTypes.has("INVOICE") || uploadedDocTypes.has("TAX_INVOICE") 
          ? "completed" : "pending";
      case "whtCert":
        return uploadedDocTypes.has("WHT_CERT_SENT") || uploadedDocTypes.has("WHT_CERT_RECEIVED")
          ? "completed" : "pending";
      default:
        return "pending";
    }
  };

  // Calculate progress
  const completedSteps = steps.filter(s => getStepStatus(s.id) === "completed").length;
  const progressPercent = Math.round((completedSteps / steps.length) * 100);
  const isComplete = completedSteps === steps.length;

  // Warning message
  const hasSlip = uploadedDocTypes.has("SLIP");
  const hasTaxInvoice = uploadedDocTypes.has("TAX_INVOICE");
  
  const warningMessage = hasSlip && !hasTaxInvoice && doc.transactionType === "EXPENSE"
    ? {
        message: "มีสลิปแล้ว แต่ยังไม่มีใบกำกับภาษี",
        detail: doc.totalAmount === 0 
          ? "เพิ่มใบกำกับเพื่อยืนยันยอดและ VAT" 
          : "เพิ่มใบกำกับเพื่อยืนยันยอดและ VAT",
      }
    : doc.hasWht && !uploadedDocTypes.has("WHT_CERT_SENT") && !uploadedDocTypes.has("WHT_CERT_RECEIVED")
    ? {
        message: doc.transactionType === "EXPENSE" ? "รอส่งหนังสือหัก ณ ที่จ่าย" : "รอรับหนังสือหัก ณ ที่จ่าย",
        detail: "อัปโหลดเมื่อได้รับ/ส่ง 50 ทวิ",
      }
    : null;

  // Get doc type label
  const getDocTypeLabel = (docType: SubDocType) => {
    const labels: Record<SubDocType, string> = {
      SLIP: "สลิป",
      TAX_INVOICE: "ใบกำกับ",
      INVOICE: "ใบแจ้งหนี้",
      RECEIPT: "ใบเสร็จ",
      WHT_CERT_SENT: "WHT ส่ง",
      WHT_CERT_RECEIVED: "WHT รับ",
      OTHER: "อื่นๆ",
    };
    return labels[docType] || docType;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link 
            href="/documents" 
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {doc.docNumber}
              </span>
              <StatusBadge status={doc.status} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canSend && onSendToAccounting && (
            <Button size="sm" onClick={onSendToAccounting}>
              <Send className="mr-1.5 h-4 w-4" />
              ส่งบัญชี
            </Button>
          )}
          {canEdit && onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="mr-1.5 h-4 w-4" />
              แก้ไข
            </Button>
          )}
        </div>
      </div>

      {/* Title & Summary Card */}
      <div className="rounded-xl border bg-white p-5">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">
          {doc.description || `${doc.transactionType === "EXPENSE" ? "รายจ่าย" : "รายรับ"}`}
        </h1>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">ยอดรวม</p>
              <p className="text-lg font-bold text-primary">
                {doc.totalAmount > 0 ? `฿${formatMoney(doc.totalAmount)}` : "รอยอด"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">วันที่</p>
              <p className="font-medium text-gray-900">
                {new Date(doc.docDate).toLocaleDateString("th-TH", { 
                  day: "numeric", month: "short", year: "numeric" 
                })}
              </p>
            </div>
          </div>

          {doc.contact && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {doc.transactionType === "EXPENSE" ? "ร้านค้า" : "ลูกค้า"}
                </p>
                <p className="font-medium text-gray-900">{doc.contact.name}</p>
              </div>
            </div>
          )}

          {doc.category && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <FolderOpen className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">หมวดหมู่</p>
                <p className="font-medium text-gray-900">{doc.category.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* VAT Info */}
        {doc.vatAmount > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 text-green-700">
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">
                VAT ฿{formatMoney(doc.vatAmount)} (เครม VAT ได้)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Document Progress */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              isComplete ? "bg-green-100" : "bg-amber-100"
            )}>
              {isComplete ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                สถานะเอกสาร
              </h3>
              <p className="text-sm text-gray-500">
                ความครบถ้วน: {progressPercent}%
              </p>
            </div>
          </div>
          <Progress value={progressPercent} className="w-32 h-2" />
        </div>

        <div className="p-5 space-y-3">
          {/* Warning Banner */}
          {warningMessage && (
            <div className="rounded-lg p-3 bg-amber-50 border border-amber-200 flex items-start gap-3 mb-4">
              <Sparkles className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  {warningMessage.message}
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  {warningMessage.detail}
                </p>
              </div>
            </div>
          )}

          {/* Steps */}
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const Icon = step.icon;
            const file = allFiles.find(f => f.docType === step.docType);

            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-all",
                  status === "completed"
                    ? "bg-green-50/50 border-green-200"
                    : status === "missing"
                    ? "bg-amber-50/50 border-amber-200"
                    : "bg-gray-50 border-gray-200"
                )}
              >
                {/* Status Icon */}
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  status === "completed" ? "bg-green-500 text-white" :
                  status === "missing" ? "bg-amber-100 text-amber-600" :
                  "bg-gray-200 text-gray-400"
                )}>
                  {status === "completed" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "font-medium text-sm",
                      status === "completed" ? "text-green-700" :
                      status === "missing" ? "text-amber-700" :
                      "text-gray-600"
                    )}>
                      {step.label}
                    </p>
                    {status === "completed" && (
                      <span className="text-xs text-green-600">มีแล้ว</span>
                    )}
                    {status === "missing" && (
                      <span className="text-xs text-amber-600">ยังไม่มี</span>
                    )}
                    {status === "pending" && (
                      <span className="text-xs text-gray-400">รอ</span>
                    )}
                  </div>

                  {/* File info if completed */}
                  {status === "completed" && file && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      └── {file.fileName}
                    </p>
                  )}

                  {/* VAT info */}
                  {step.id === "taxInvoice" && status === "completed" && doc.vatAmount > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      └── VAT ฿{formatMoney(doc.vatAmount)} → เครม VAT ได้ ✓
                    </p>
                  )}

                  {/* AI suggestion for WHT */}
                  {step.id === "whtCert" && status !== "completed" && doc.hasWht && (
                    <p className="text-xs text-amber-600 mt-1">
                      └── AI แนะนำ: น่าจะมี WHT
                    </p>
                  )}
                </div>

                {/* Action */}
                {status !== "completed" && onAddDocument && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onAddDocument}
                    className={cn(
                      "shrink-0",
                      status === "missing" && "border-amber-300 text-amber-700 hover:bg-amber-50"
                    )}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    เพิ่ม
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Files in Box */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            ไฟล์ในกล่อง ({allFiles.length} ไฟล์)
          </h3>
          {onAddDocument && (
            <Button variant="outline" size="sm" onClick={onAddDocument}>
              <Plus className="h-4 w-4 mr-1" />
              เพิ่มเอกสาร
            </Button>
          )}
        </div>

        {allFiles.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Upload className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500">ยังไม่มีไฟล์</p>
            {onAddDocument && (
              <Button variant="outline" size="sm" className="mt-3" onClick={onAddDocument}>
                <Plus className="h-4 w-4 mr-1" />
                เพิ่มเอกสาร
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {allFiles.map((file) => (
              <div key={file.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
                {/* File Preview */}
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  {file.publicUrl && file.fileType?.startsWith("image/") ? (
                    <Image
                      src={file.publicUrl}
                      alt={file.fileName}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <FileText className={cn(
                      "h-5 w-5",
                      file.fileType === "application/pdf" ? "text-red-500" : "text-gray-400"
                    )} />
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.fileName}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded",
                      file.docType === "TAX_INVOICE" ? "bg-blue-100 text-blue-700" :
                      file.docType === "SLIP" ? "bg-green-100 text-green-700" :
                      "bg-gray-100 text-gray-600"
                    )}>
                      {getDocTypeLabel(file.docType as SubDocType)}
                    </span>
                    {file.createdAt && (
                      <span>
                        {new Date(file.createdAt).toLocaleDateString("th-TH", {
                          day: "numeric", month: "short"
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {file.publicUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.open(file.publicUrl, "_blank")}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {onDeleteFile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-500"
                      onClick={() => onDeleteFile(file.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tax & Amount Summary */}
      {doc.totalAmount > 0 && (
        <div className="rounded-xl border bg-white p-5">
          <h3 className="font-semibold text-gray-900 mb-4">ภาษีและยอดเงิน</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">ยอดก่อน VAT</span>
              <span className="font-medium">฿{formatMoney(doc.subtotal || doc.totalAmount)}</span>
            </div>
            {doc.vatAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">VAT {doc.vatRate || 7}%</span>
                <span className="font-medium">฿{formatMoney(doc.vatAmount)}</span>
              </div>
            )}
            {doc.whtAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">หัก ณ ที่จ่าย {doc.whtRate || 3}%</span>
                <span className="font-medium text-red-600">-฿{formatMoney(doc.whtAmount)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between">
              <span className="font-medium text-gray-900">ยอดรวมสุทธิ</span>
              <span className="font-bold text-lg text-primary">
                ฿{formatMoney(doc.totalAmount - (doc.whtAmount || 0))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
