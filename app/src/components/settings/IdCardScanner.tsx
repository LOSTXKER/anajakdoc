"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, Loader2, User, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { extractThaiIdCard, type ThaiIdCardData } from "@/server/actions/thai-ocr";

interface IdCardScannerProps {
  onExtracted: (data: ThaiIdCardData) => void;
}

export function IdCardScanner({ onExtracted }: IdCardScannerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ThaiIdCardData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Extract data
    setLoading(true);
    setResult(null);

    try {
      // Convert to base64
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      const response = await extractThaiIdCard(base64, file.type);

      if (response.success && response.data) {
        setResult(response.data);
        toast.success("อ่านข้อมูลบัตรประชาชนสำเร็จ");
      } else {
        toast.error(response.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการอ่านบัตรประชาชน");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (result) {
      onExtracted(result);
      setOpen(false);
      setPreview(null);
      setResult(null);
    }
  };

  const handleReset = () => {
    setPreview(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" type="button">
          <Camera className="h-4 w-4 mr-2" />
          สแกนบัตร
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            สแกนบัตรประชาชน
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Area */}
          {!preview ? (
            <Card
              className="border-dashed cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground text-center">
                  คลิกเพื่ออัปโหลดรูปบัตรประชาชน
                  <br />
                  หรือลากไฟล์มาวางที่นี่
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="relative">
              <img
                src={preview}
                alt="บัตรประชาชน"
                className="w-full rounded-lg"
              />
              {loading && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm">กำลังอ่านข้อมูล...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Extracted Result */}
          {result && (
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-800 dark:text-green-200">
                    อ่านข้อมูลสำเร็จ
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">เลขบัตร:</span>
                      <p className="font-mono">
                        {result.idNumber.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, "$1-$2-$3-$4-$5")}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">วันเกิด:</span>
                      <p>{result.dateOfBirth}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground">ชื่อ-นามสกุล:</span>
                    <p>
                      {result.titleTh}
                      {result.firstNameTh} {result.lastNameTh}
                    </p>
                    {result.firstNameEn && (
                      <p className="text-muted-foreground">
                        {result.titleEn} {result.firstNameEn} {result.lastNameEn}
                      </p>
                    )}
                  </div>

                  {result.address && (
                    <div>
                      <span className="text-muted-foreground">ที่อยู่:</span>
                      <p className="text-xs">{result.address}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            {preview && (
              <Button variant="outline" onClick={handleReset}>
                <XCircle className="h-4 w-4 mr-2" />
                เลือกใหม่
              </Button>
            )}
            {result && (
              <Button onClick={handleConfirm}>
                <CheckCircle className="h-4 w-4 mr-2" />
                ใช้ข้อมูลนี้
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
