"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Check,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBoxUpload } from "@/hooks";
import type { BoxType } from "@/types";

import { UploadZone } from "./UploadZone";
import { FileAnalysisCard, type ExtractedFile } from "./FileAnalysisCard";
import { BoxInfoForm } from "./BoxInfoForm";

interface UploadFirstFormProps {}

export function UploadFirstForm({}: UploadFirstFormProps) {
  const searchParams = useSearchParams();
  
  // Get initial type from URL params
  const initialType: BoxType = searchParams.get("type") === "income" ? "INCOME" : "EXPENSE";
  
  // Use the custom hook for all state management
  const {
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
    
    // Contact (Section 9 - Smart Guess)
    contacts,
    contactsLoading,
    selectedContactId,
    handleContactSelect,
    
    // Actions
    handleFileSelect,
    removeFile,
    handleSubmit,
  } = useBoxUpload({ 
    initialType, 
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Link 
              href="/documents" 
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-foreground">สร้างกล่องเอกสาร</h1>
              <p className="text-sm text-muted-foreground">
                อัปโหลดเอกสารและกรอกข้อมูล
              </p>
            </div>
          </div>

          {/* Box Type Toggle */}
          <div className="flex rounded-lg border p-0.5 bg-card">
            <button
              type="button"
              onClick={() => setBoxType("EXPENSE")}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5",
                boxType === "EXPENSE"
                  ? "bg-rose-500 text-white"
                  : "text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
              )}
            >
              รายจ่าย
            </button>
            <button
              type="button"
              onClick={() => setBoxType("INCOME")}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5",
                boxType === "INCOME"
                  ? "bg-emerald-500 text-white"
                  : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
              )}
            >
              รายรับ
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Upload Area + Files */}
            <div className="space-y-4">
              {/* Upload Zone */}
              <UploadZone onFileSelect={handleFileSelect} />

              {/* Files List */}
              {files.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-foreground">
                    เอกสารที่อัปโหลด ({files.length})
                  </h3>

                  {files.map((f) => (
                    <FileAnalysisCard
                      key={f.id}
                      file={f}
                      onRemove={() => removeFile(f.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right: Form */}
            <div className="space-y-4">
              <BoxInfoForm
                boxType={boxType}
                expenseType={expenseType}
                setExpenseType={setExpenseType}
                isMultiPayment={isMultiPayment}
                setIsMultiPayment={setIsMultiPayment}
                hasWht={hasWht}
                setHasWht={setHasWht}
                whtRate={whtRate}
                setWhtRate={setWhtRate}
                boxDate={boxDate}
                setBoxDate={setBoxDate}
                amount={amount}
                setAmount={setAmount}
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
                notes={notes}
                setNotes={setNotes}
                // Contact (Section 9 - Smart Guess)
                contacts={contacts}
                contactsLoading={contactsLoading}
                selectedContactId={selectedContactId}
                onContactSelect={handleContactSelect}
              />

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="outline" asChild>
                  <Link href="/documents">ยกเลิก</Link>
                </Button>
                <Button 
                  type="submit" 
                  disabled={isPending || files.length === 0}
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  สร้างกล่องเอกสาร
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Re-export all components
export { UploadZone } from "./UploadZone";
export { FileAnalysisCard, type ExtractedFile } from "./FileAnalysisCard";
export { BoxInfoForm } from "./BoxInfoForm";
export { SimpleUploadForm } from "./SimpleUploadForm";