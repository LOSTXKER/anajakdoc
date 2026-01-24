"use client";

/**
 * SimpleUploadForm - 10-Second Upload Rule (Section 2.1)
 * 
 * พนักงานทำได้ใน 10 วินาที:
 * 1) ถ่าย/อัปโหลด
 * 2) เลือก VAT (มี/ไม่มี)
 * 3) เลือก WHT (มี/ไม่มี)
 * 4) ส่ง
 */

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Upload, 
  FileCheck, 
  Receipt,
  Percent,
  Check,
  Loader2,
  X,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createBox } from "@/server/actions/box";
import { toast } from "sonner";
import type { BoxType } from "@/types";
import { WHT_RATE_OPTIONS } from "@/lib/constants";

interface FileItem {
  id: string;
  file: File;
  preview: string;
}

interface SimpleUploadFormProps {
  initialType?: BoxType;
}

export function SimpleUploadForm({ initialType = "EXPENSE" }: SimpleUploadFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Core state - minimal
  const [boxType, setBoxType] = useState<BoxType>(initialType);
  const [hasVat, setHasVat] = useState(true);
  const [hasWht, setHasWht] = useState(false);
  const [whtRate, setWhtRate] = useState("3");
  const [files, setFiles] = useState<FileItem[]>([]);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles: FileItem[] = Array.from(selectedFiles).map((file, i) => ({
      id: `file-${Date.now()}-${i}`,
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
    }));

    setFiles(prev => [...prev, ...newFiles]);
    e.target.value = "";
  }, []);

  // Remove file
  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter(f => f.id !== id);
    });
  };

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles.length) return;

    const newFiles: FileItem[] = Array.from(droppedFiles).map((file, i) => ({
      id: `file-${Date.now()}-${i}`,
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      toast.error("กรุณาอัปโหลดเอกสารอย่างน้อย 1 ไฟล์");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("boxType", boxType);
        formData.append("expenseType", hasVat ? "STANDARD" : "NO_VAT");
        formData.append("boxDate", new Date().toISOString().split("T")[0]);
        formData.append("hasVat", hasVat.toString());
        formData.append("hasWht", hasWht.toString());
        
        if (hasWht && whtRate) {
          formData.append("whtRate", whtRate);
        }

        files.forEach(f => formData.append("files", f.file));

        const result = await createBox(formData);
        
        if (result.success && result.data) {
          toast.success("ส่งเอกสารสำเร็จ!");
          router.push(`/documents/${result.data.id}`);
        } else {
          toast.error(result.error || "เกิดข้อผิดพลาด");
        }
      } catch {
        toast.error("เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <Link 
              href="/documents" 
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-semibold text-foreground">ส่งเอกสาร</h1>
          </div>

          {/* Box Type Toggle */}
          <div className="flex rounded-lg border p-0.5 bg-card">
            <button
              type="button"
              onClick={() => setBoxType("EXPENSE")}
              className={cn(
                "px-3 py-1 text-sm font-medium rounded-md transition-all",
                boxType === "EXPENSE"
                  ? "bg-rose-500 dark:bg-rose-600 text-white"
                  : "text-muted-foreground hover:bg-rose-50 dark:hover:bg-rose-950"
              )}
            >
              จ่าย
            </button>
            <button
              type="button"
              onClick={() => setBoxType("INCOME")}
              className={cn(
                "px-3 py-1 text-sm font-medium rounded-md transition-all",
                boxType === "INCOME"
                  ? "bg-emerald-500 dark:bg-emerald-600 text-white"
                  : "text-muted-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950"
              )}
            >
              รับ
            </button>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 space-y-4">
        
        {/* Upload Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={cn(
            "border-2 border-dashed rounded-2xl p-6 text-center transition-colors",
            files.length > 0 
              ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950" 
              : "border-gray-300 bg-white hover:border-primary/50"
          )}
        >
          <input
            type="file"
            accept="image/*,application/pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          
          {files.length === 0 ? (
            <label htmlFor="file-upload" className="cursor-pointer block">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">ถ่ายรูปหรืออัปโหลด</p>
              <p className="text-sm text-muted-foreground mt-1">รูปภาพ หรือ PDF</p>
            </label>
          ) : (
            <div className="space-y-3">
              {/* File previews */}
              <div className="flex flex-wrap gap-2 justify-center">
                {files.map((f) => (
                  <div key={f.id} className="relative group">
                    {f.preview ? (
                      <img 
                        src={f.preview} 
                        alt="" 
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg border bg-muted flex items-center justify-center">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(f.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 dark:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <label 
                htmlFor="file-upload"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-card border text-sm font-medium cursor-pointer hover:bg-muted"
              >
                <Upload className="h-4 w-4" />
                เพิ่มไฟล์
              </label>
            </div>
          )}
        </div>

        {/* VAT Toggle - Big Button Style */}
        <div 
          className={cn(
            "flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer",
            hasVat 
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950" 
              : "border-gray-200 bg-white"
          )}
          onClick={() => setHasVat(!hasVat)}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              hasVat ? "bg-emerald-50 dark:bg-emerald-950" : "bg-muted"
            )}>
              <FileCheck className={cn(
                "h-5 w-5",
                hasVat ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <p className="font-medium text-foreground">มีใบกำกับภาษี (VAT)</p>
              <p className="text-sm text-muted-foreground">
                {hasVat ? "ขอคืน VAT ได้" : "บิลเงินสด/ร้านไม่จด VAT"}
              </p>
            </div>
          </div>
          <Switch 
            checked={hasVat} 
            onCheckedChange={setHasVat}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* WHT Toggle */}
        <div 
          className={cn(
            "flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer",
            hasWht 
              ? "border-amber-500 bg-amber-50 dark:bg-amber-950" 
              : "border-gray-200 bg-white"
          )}
          onClick={() => setHasWht(!hasWht)}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              hasWht ? "bg-amber-50 dark:bg-amber-950" : "bg-muted"
            )}>
              <Percent className={cn(
                "h-5 w-5",
                hasWht ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <p className="font-medium text-foreground">หัก ณ ที่จ่าย (WHT)</p>
              <p className="text-sm text-muted-foreground">
                {hasWht ? "ต้องออกหนังสือรับรอง" : "ไม่มีหัก ณ ที่จ่าย"}
              </p>
            </div>
          </div>
          <Switch 
            checked={hasWht} 
            onCheckedChange={setHasWht}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* WHT Rate Selector (show when hasWht) */}
        {hasWht && (
          <div className="px-4 pb-2 -mt-2">
            <Label className="text-sm text-muted-foreground mb-2 block">อัตราหัก ณ ที่จ่าย</Label>
            <div className="grid grid-cols-4 gap-2">
              {WHT_RATE_OPTIONS.map((rate) => (
                <button
                  key={rate.value}
                  type="button"
                  onClick={() => setWhtRate(rate.value)}
                  className={cn(
                    "py-2 px-3 rounded-lg text-sm font-medium transition-all",
                    whtRate === rate.value
                      ? "bg-amber-500 dark:bg-amber-600 text-white"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  )}
                >
                  {rate.value}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button - Fixed at bottom on mobile */}
        <div className="sticky bottom-4 pt-4">
          <Button 
            type="submit" 
            size="lg"
            disabled={isPending || files.length === 0}
            className={cn(
              "w-full h-14 text-lg rounded-xl transition-all",
              files.length > 0 
                ? "bg-primary hover:bg-primary/90" 
                : "bg-gray-300"
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                กำลังส่ง...
              </>
            ) : (
              <>
                <Check className="mr-2 h-5 w-5" />
                ส่งเอกสาร
              </>
            )}
          </Button>
          
          {files.length === 0 && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              กรุณาอัปโหลดเอกสารก่อนส่ง
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
