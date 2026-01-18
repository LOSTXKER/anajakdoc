"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Sparkles, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { extractDocumentData, type ExtractedDocumentData } from "@/server/actions/ocr";

interface OCRExtractButtonProps {
  imageUrl: string;
  onExtracted: (data: ExtractedDocumentData) => void;
  disabled?: boolean;
}

export function OCRExtractButton({ imageUrl, onExtracted, disabled }: OCRExtractButtonProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [result, setResult] = useState<ExtractedDocumentData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleExtract = async () => {
    setIsExtracting(true);
    setResult(null);

    const response = await extractDocumentData(imageUrl);
    setIsExtracting(false);

    if (response.success && response.data) {
      setResult(response.data);
      setDialogOpen(true);
    } else {
      toast.error(response.error || "ไม่สามารถอ่านเอกสารได้");
    }
  };

  const handleConfirm = () => {
    if (result) {
      onExtracted(result);
      setDialogOpen(false);
      toast.success("นำข้อมูลไปกรอกแล้ว");
    }
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined) return "-";
    return `฿${value.toLocaleString()}`;
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleExtract}
        disabled={disabled || isExtracting}
      >
        {isExtracting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4 mr-2" />
        )}
        {isExtracting ? "กำลังอ่าน..." : "อ่านข้อมูลอัตโนมัติ"}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              ผลการอ่านเอกสาร
            </DialogTitle>
          </DialogHeader>

          {result && (
            <div className="space-y-4">
              {/* Confidence */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ความมั่นใจ</span>
                <Badge variant={result.confidence >= 0.8 ? "default" : "secondary"}>
                  {Math.round(result.confidence * 100)}%
                </Badge>
              </div>

              {/* Extracted Data */}
              <div className="space-y-3 border rounded-lg p-4 bg-muted/50">
                {result.docType && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">ประเภท</span>
                    <span className="font-medium">{getDocTypeLabel(result.docType)}</span>
                  </div>
                )}

                {result.externalRef && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">เลขที่</span>
                    <span className="font-medium">{result.externalRef}</span>
                  </div>
                )}

                {result.docDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">วันที่</span>
                    <span className="font-medium">
                      {new Date(result.docDate).toLocaleDateString("th-TH")}
                    </span>
                  </div>
                )}

                {result.vendorName && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">ร้าน/คู่ค้า</span>
                    <span className="font-medium">{result.vendorName}</span>
                  </div>
                )}

                {result.subtotal !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">ยอดก่อน VAT</span>
                    <span className="font-medium">{formatCurrency(result.subtotal)}</span>
                  </div>
                )}

                {result.vatAmount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">VAT</span>
                    <span className="font-medium">{formatCurrency(result.vatAmount)}</span>
                  </div>
                )}

                {result.totalAmount !== undefined && (
                  <div className="flex justify-between text-lg">
                    <span className="font-medium">ยอดรวม</span>
                    <span className="font-bold text-primary">{formatCurrency(result.totalAmount)}</span>
                  </div>
                )}

                {result.description && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-muted-foreground">รายละเอียด</span>
                    <p className="font-medium mt-1">{result.description}</p>
                  </div>
                )}
              </div>

              {result.confidence < 0.7 && (
                <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
                  <AlertCircle className="h-4 w-4" />
                  ความมั่นใจต่ำ กรุณาตรวจสอบข้อมูลอีกครั้ง
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleConfirm}>
              <Check className="h-4 w-4 mr-2" />
              ใช้ข้อมูลนี้
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function getDocTypeLabel(docType: string): string {
  const labels: Record<string, string> = {
    SLIP: "สลิปโอนเงิน",
    RECEIPT: "ใบเสร็จรับเงิน",
    TAX_INVOICE: "ใบกำกับภาษี",
    INVOICE: "ใบแจ้งหนี้",
    OTHER: "อื่นๆ",
  };
  return labels[docType] || docType;
}
