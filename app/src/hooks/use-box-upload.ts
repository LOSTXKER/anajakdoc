"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBox } from "@/server/actions/box";
import { toast } from "sonner";
import { getTodayForInput } from "@/lib/formatters";
import type { BoxType, ExpenseType } from "@/types";
import type { ExtractedFile } from "@/components/documents/upload/FileAnalysisCard";

interface UseBoxUploadOptions {
  initialType: BoxType;
}

export function useBoxUpload({ initialType }: UseBoxUploadOptions) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // State
  const [boxType, setBoxType] = useState<BoxType>(initialType);
  const [expenseType, setExpenseType] = useState<ExpenseType>("STANDARD");
  const [isMultiPayment, setIsMultiPayment] = useState(false);
  const [hasWht, setHasWht] = useState(false);
  const [whtRate, setWhtRate] = useState("3"); // Default 3% for services
  
  // Files state
  const [files, setFiles] = useState<ExtractedFile[]>([]);
  
  // Form state
  const [amount, setAmount] = useState("");
  const [boxDate, setBoxDate] = useState(getTodayForInput());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  // Handle file drop/select (simple - no AI analysis)
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles: ExtractedFile[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const id = `file-${Date.now()}-${i}`;
      
      // Create preview
      const preview = file.type.startsWith("image/") 
        ? URL.createObjectURL(file)
        : "";

      newFiles.push({
        id,
        file,
        preview,
        status: "done", // No analysis needed
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
    
    // Reset input
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

  // Submit form
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
        if (expenseType) {
          formData.append("expenseType", expenseType);
        }
        formData.append("boxDate", boxDate);
        formData.append("title", title || description || "รายการใหม่");
        formData.append("description", description);
        
        // Auto-set VAT based on expense type (STANDARD = มีใบกำกับภาษี = has VAT)
        const hasVat = expenseType === "STANDARD";
        formData.append("hasVat", hasVat.toString());
        
        // WHT - only set when STANDARD expense type
        if (expenseType === "STANDARD") {
          formData.append("hasWht", hasWht.toString());
          if (hasWht && whtRate) {
            formData.append("whtRate", whtRate);
          }
        } else {
          formData.append("hasWht", "false");
        }
        
        if (amount) {
          formData.append("totalAmount", amount);
        }
        
        // Multi-payment flag - for accounting to track
        formData.append("isMultiPayment", isMultiPayment.toString());
        
        if (notes) {
          formData.append("notes", notes);
        }

        // Add files (simple - no extracted data)
        files.forEach((f) => {
          formData.append(`files`, f.file);
        });

        const result = await createBox(formData);
        
        if (result.success && result.data) {
          toast.success("สร้างกล่องเอกสารสำเร็จ");
          router.push(`/documents/${result.data.id}`);
        } else {
          toast.error(result.error || "เกิดข้อผิดพลาด");
        }
      } catch {
        toast.error("เกิดข้อผิดพลาดในการสร้างกล่อง");
      }
    });
  };

  // Reset form to initial state
  const resetForm = () => {
    setFiles([]);
    setAmount("");
    setBoxDate(getTodayForInput());
    setTitle("");
    setDescription("");
    setNotes("");
    setIsMultiPayment(false);
    setHasWht(false);
    setWhtRate("3");
  };

  return {
    // State
    boxType,
    setBoxType,
    expenseType,
    setExpenseType,
    isMultiPayment,
    setIsMultiPayment,
    hasWht,
    setHasWht,
    whtRate,
    setWhtRate,
    files,
    amount,
    setAmount,
    boxDate,
    setBoxDate,
    title,
    setTitle,
    description,
    setDescription,
    notes,
    setNotes,
    isPending,
    
    // Actions
    handleFileSelect,
    removeFile,
    handleSubmit,
    resetForm,
  };
}
