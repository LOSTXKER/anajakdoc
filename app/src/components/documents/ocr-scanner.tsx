"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Scan,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  Calendar,
  Building2,
  Receipt,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { extractDocumentData, type ExtractedDocumentData } from "@/server/actions/ocr";

interface OcrScannerProps {
  imageUrl?: string;
  onDataExtracted: (data: ExtractedDocumentData) => void;
}

const docTypeLabels: Record<string, string> = {
  SLIP: "สลิปโอนเงิน",
  RECEIPT: "ใบเสร็จ",
  TAX_INVOICE: "ใบกำกับภาษี",
  INVOICE: "ใบแจ้งหนี้",
  OTHER: "อื่นๆ",
};

export function OcrScanner({ imageUrl, onDataExtracted }: OcrScannerProps) {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedDocumentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = () => {
    if (!imageUrl) {
      toast.error("กรุณาอัปโหลดไฟล์ก่อน");
      return;
    }

    setError(null);
    setExtractedData(null);
    setDialogOpen(true);

    startTransition(async () => {
      const result = await extractDocumentData(imageUrl);
      if (result.success && result.data) {
        setExtractedData(result.data);
      } else {
        setError(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleApply = () => {
    if (extractedData) {
      onDataExtracted(extractedData);
      setDialogOpen(false);
      toast.success("นำข้อมูลจาก OCR มาใช้แล้ว");
    }
  };

  const confidenceColor = extractedData?.confidence
    ? extractedData.confidence > 0.8
      ? "text-green-600"
      : extractedData.confidence > 0.5
      ? "text-yellow-600"
      : "text-red-600"
    : "";

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleScan}
        disabled={!imageUrl || isPending}
        className="gap-2"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Scan className="h-4 w-4" />
        )}
        สแกนข้อมูล (OCR)
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              ผลการสแกน OCR
            </DialogTitle>
            <DialogDescription>
              ระบบอ่านข้อมูลจากเอกสารโดยใช้ AI
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isPending && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">กำลังอ่านข้อมูล...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  อาจใช้เวลาสักครู่
                </p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center py-8 text-destructive">
                <AlertCircle className="h-12 w-12 mb-4" />
                <p className="font-medium">ไม่สามารถอ่านข้อมูลได้</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            )}

            {extractedData && (
              <div className="space-y-4">
                {/* Confidence */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ความมั่นใจ</span>
                  <Badge variant="outline" className={confidenceColor}>
                    {Math.round((extractedData.confidence || 0) * 100)}%
                  </Badge>
                </div>

                {/* Extracted Fields */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    {extractedData.docType && (
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground w-24">ประเภท</span>
                        <span className="font-medium">
                          {docTypeLabels[extractedData.docType] || extractedData.docType}
                        </span>
                      </div>
                    )}

                    {extractedData.externalRef && (
                      <div className="flex items-center gap-3">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground w-24">เลขที่</span>
                        <span className="font-medium">{extractedData.externalRef}</span>
                      </div>
                    )}

                    {extractedData.docDate && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground w-24">วันที่</span>
                        <span className="font-medium">
                          {new Date(extractedData.docDate).toLocaleDateString("th-TH")}
                        </span>
                      </div>
                    )}

                    {extractedData.vendorName && (
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground w-24">ร้าน/บริษัท</span>
                        <span className="font-medium truncate">{extractedData.vendorName}</span>
                      </div>
                    )}

                    <div className="border-t pt-3 mt-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {extractedData.subtotal !== undefined && (
                          <div>
                            <span className="text-muted-foreground">ก่อน VAT:</span>
                            <span className="ml-2 font-medium">
                              ฿{extractedData.subtotal.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {extractedData.vatAmount !== undefined && (
                          <div>
                            <span className="text-muted-foreground">VAT:</span>
                            <span className="ml-2 font-medium">
                              ฿{extractedData.vatAmount.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                      {extractedData.totalAmount !== undefined && (
                        <div className="mt-2 text-lg">
                          <span className="text-muted-foreground">ยอดรวม:</span>
                          <span className="ml-2 font-bold text-primary">
                            ฿{extractedData.totalAmount.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {extractedData.description && (
                      <div className="border-t pt-3">
                        <span className="text-sm text-muted-foreground">รายละเอียด:</span>
                        <p className="mt-1 text-sm">{extractedData.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    ยกเลิก
                  </Button>
                  <Button onClick={handleApply}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    ใช้ข้อมูลนี้
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
