"use client";

import { useRef } from "react";
import { Check, Upload, Circle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DOC_TYPE_CONFIG, getDocTypeConfig } from "@/lib/config/doc-type-config";
import { EXPENSE_TYPE_CONFIG } from "@/lib/config/expense-type-config";
import type { SerializedBox, DocType, ExpenseType, BoxType } from "@/types";

interface RequiredDocument {
  docType: DocType;
  label: string;
  description: string;
  required: boolean;
  uploaded: boolean;
  alternativeTypes?: DocType[]; // Alternative doc types that also satisfy this requirement
}

interface RequiredDocumentsProps {
  box: SerializedBox;
  uploadedDocTypes: Set<DocType>;
  canEdit?: boolean;
  onUploadFiles?: (files: File[]) => Promise<void>;
}

/**
 * Get required documents based on box type and expense type
 */
function getRequiredDocuments(
  boxType: BoxType,
  expenseType: ExpenseType | null,
  hasVat: boolean,
  hasWht: boolean,
  uploadedDocTypes: Set<DocType>
): RequiredDocument[] {
  const docs: RequiredDocument[] = [];

  // Helper to check if any of the doc types are uploaded
  const hasAny = (...types: DocType[]) => types.some((t) => uploadedDocTypes.has(t));

  if (boxType === "EXPENSE") {
    // Based on expense type
    switch (expenseType) {
      case "STANDARD":
        // มีใบกำกับภาษี
        docs.push({
          docType: "TAX_INVOICE",
          label: "ใบกำกับภาษี",
          description: "เอกสารหลักสำหรับขอคืน VAT",
          required: true,
          uploaded: hasAny("TAX_INVOICE", "TAX_INVOICE_ABB"),
          alternativeTypes: ["TAX_INVOICE_ABB"],
        });
        docs.push({
          docType: "SLIP_TRANSFER",
          label: "หลักฐานการชำระเงิน",
          description: "สลิปโอนเงิน, เช็ค หรือ Statement",
          required: true,
          uploaded: hasAny("SLIP_TRANSFER", "SLIP_CHEQUE", "BANK_STATEMENT", "CREDIT_CARD_STATEMENT"),
          alternativeTypes: ["SLIP_CHEQUE", "BANK_STATEMENT", "CREDIT_CARD_STATEMENT"],
        });
        break;

      case "NO_VAT":
        // ไม่มีใบกำกับภาษี
        docs.push({
          docType: "CASH_RECEIPT",
          label: "บิลเงินสด/ใบเสร็จ",
          description: "บิลเงินสด หรือใบเสร็จจากร้านค้า",
          required: true,
          uploaded: hasAny("CASH_RECEIPT", "RECEIPT", "OTHER"),
          alternativeTypes: ["RECEIPT", "OTHER"],
        });
        docs.push({
          docType: "SLIP_TRANSFER",
          label: "หลักฐานการชำระเงิน",
          description: "สลิปโอนเงิน หรือยืนยันจ่ายเงินสด",
          required: true,
          uploaded: hasAny("SLIP_TRANSFER", "SLIP_CHEQUE", "BANK_STATEMENT"),
          alternativeTypes: ["SLIP_CHEQUE", "BANK_STATEMENT"],
        });
        break;

      case "PETTY_CASH":
        // เบิกเงินสดย่อย
        docs.push({
          docType: "PETTY_CASH_VOUCHER",
          label: "ใบสำคัญจ่าย/บิล",
          description: "ใบสำคัญจ่ายหรือบิลเงินสด (ถ้ามี)",
          required: false,
          uploaded: hasAny("PETTY_CASH_VOUCHER", "CASH_RECEIPT", "RECEIPT"),
          alternativeTypes: ["CASH_RECEIPT", "RECEIPT"],
        });
        break;

      case "FOREIGN":
        // จ่ายต่างประเทศ
        docs.push({
          docType: "FOREIGN_INVOICE",
          label: "Invoice ต่างประเทศ",
          description: "Invoice จากผู้ขายต่างประเทศ",
          required: true,
          uploaded: hasAny("FOREIGN_INVOICE"),
        });
        docs.push({
          docType: "SLIP_TRANSFER",
          label: "หลักฐานการชำระเงิน",
          description: "สลิปโอน, Statement หรือ Online Receipt",
          required: true,
          uploaded: hasAny("SLIP_TRANSFER", "BANK_STATEMENT", "ONLINE_RECEIPT"),
          alternativeTypes: ["BANK_STATEMENT", "ONLINE_RECEIPT"],
        });
        break;

      default:
        // Default EXPENSE
        docs.push({
          docType: "TAX_INVOICE",
          label: "เอกสารค่าใช้จ่าย",
          description: "ใบกำกับภาษี, ใบเสร็จ หรือบิล",
          required: true,
          uploaded: hasAny("TAX_INVOICE", "TAX_INVOICE_ABB", "RECEIPT", "CASH_RECEIPT"),
          alternativeTypes: ["TAX_INVOICE_ABB", "RECEIPT", "CASH_RECEIPT"],
        });
        docs.push({
          docType: "SLIP_TRANSFER",
          label: "หลักฐานการชำระเงิน",
          description: "สลิปโอนเงิน หรือหลักฐานการจ่าย",
          required: true,
          uploaded: hasAny("SLIP_TRANSFER", "SLIP_CHEQUE", "BANK_STATEMENT"),
          alternativeTypes: ["SLIP_CHEQUE", "BANK_STATEMENT"],
        });
    }

    // WHT document (if hasWht)
    if (hasWht) {
      docs.push({
        docType: "WHT_SENT",
        label: "หนังสือหัก ณ ที่จ่าย",
        description: "หนังสือรับรองการหักภาษี ณ ที่จ่าย",
        required: true,
        uploaded: hasAny("WHT_SENT"),
      });
    }
  } else if (boxType === "INCOME") {
    // รายรับ
    docs.push({
      docType: "INVOICE",
      label: "ใบแจ้งหนี้",
      description: "ใบแจ้งหนี้ที่ออกให้ลูกค้า",
      required: true,
      uploaded: hasAny("INVOICE"),
    });

    if (hasVat) {
      docs.push({
        docType: "TAX_INVOICE",
        label: "ใบกำกับภาษี",
        description: "ใบกำกับภาษีที่ออกให้ลูกค้า",
        required: true,
        uploaded: hasAny("TAX_INVOICE"),
      });
    }

    docs.push({
      docType: "RECEIPT",
      label: "หลักฐานรับเงิน",
      description: "สลิปโอนเข้า หรือใบเสร็จรับเงิน",
      required: false,
      uploaded: hasAny("RECEIPT", "SLIP_TRANSFER", "BANK_STATEMENT"),
      alternativeTypes: ["SLIP_TRANSFER", "BANK_STATEMENT"],
    });

    if (hasWht) {
      docs.push({
        docType: "WHT_INCOMING",
        label: "หนังสือหัก ณ ที่จ่าย",
        description: "หนังสือหัก ณ ที่จ่ายจากลูกค้า",
        required: true,
        uploaded: hasAny("WHT_INCOMING", "WHT_RECEIVED"),
        alternativeTypes: ["WHT_RECEIVED"],
      });
    }
  } else if (boxType === "ADJUSTMENT") {
    // ปรับปรุง
    docs.push({
      docType: "CREDIT_NOTE",
      label: "เอกสารประกอบ",
      description: "CN/DN หรือหลักฐานการคืนเงิน",
      required: true,
      uploaded: hasAny("CREDIT_NOTE", "DEBIT_NOTE", "REFUND_RECEIPT", "OTHER"),
      alternativeTypes: ["DEBIT_NOTE", "REFUND_RECEIPT", "OTHER"],
    });
  }

  return docs;
}

export function RequiredDocuments({
  box,
  uploadedDocTypes,
  canEdit = false,
  onUploadFiles,
}: RequiredDocumentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requiredDocs = getRequiredDocuments(
    box.boxType,
    box.expenseType,
    box.hasVat ?? true,
    box.hasWht ?? false,
    uploadedDocTypes
  );

  // Count completed
  const completedCount = requiredDocs.filter((d) => d.uploaded).length;
  const requiredCount = requiredDocs.filter((d) => d.required).length;
  const requiredCompleted = requiredDocs.filter((d) => d.required && d.uploaded).length;
  const allRequiredComplete = requiredCompleted === requiredCount;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !onUploadFiles) return;
    await onUploadFiles(Array.from(files));
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (requiredDocs.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border bg-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">เอกสารที่ต้องการ</h3>
        <span className="text-sm text-muted-foreground">
          {completedCount}/{requiredDocs.length}
        </span>
      </div>

      {/* Status Banner */}
      {allRequiredComplete ? (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 mb-4">
          <Check className="h-4 w-4" />
          <span className="text-sm font-medium">เอกสารครบแล้ว พร้อมส่งบัญชี</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 mb-4">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">
            ยังขาดเอกสาร {requiredCount - requiredCompleted} รายการ
          </span>
        </div>
      )}

      {/* Document List */}
      <div className="space-y-2">
        {requiredDocs.map((doc) => {
          const config = getDocTypeConfig(doc.docType);
          const Icon = config.icon;

          return (
            <div
              key={doc.docType}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                doc.uploaded
                  ? "bg-muted/30 border-transparent"
                  : "bg-background border-dashed border-muted-foreground/30"
              )}
            >
              {/* Status Icon */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  doc.uploaded
                    ? "bg-emerald-100 dark:bg-emerald-900"
                    : "bg-muted"
                )}
              >
                {doc.uploaded ? (
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-medium text-sm",
                      doc.uploaded ? "text-foreground" : "text-foreground"
                    )}
                  >
                    {doc.label}
                  </span>
                  {doc.required && !doc.uploaded && (
                    <span className="text-xs text-destructive">*จำเป็น</span>
                  )}
                  {!doc.required && (
                    <span className="text-xs text-muted-foreground">(ไม่บังคับ)</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {doc.description}
                </p>
              </div>

              {/* Upload Button */}
              {canEdit && !doc.uploaded && onUploadFiles && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUploadClick}
                  className="shrink-0"
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  อัปโหลด
                </Button>
              )}

              {/* Uploaded indicator */}
              {doc.uploaded && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                  อัปโหลดแล้ว
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
