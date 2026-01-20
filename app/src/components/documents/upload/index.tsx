"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Check,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BoxMatchPanel } from "@/components/documents/box-match-panel";
import { useBoxUpload } from "@/hooks";
import type { Category, Contact } from ".prisma/client";
import type { BoxType } from "@/types";

import { UploadZone } from "./UploadZone";
import { FileAnalysisCard, type ExtractedFile } from "./FileAnalysisCard";
import { BoxInfoForm } from "./BoxInfoForm";

interface UploadFirstFormProps {
  categories: Category[];
  contacts: Contact[];
}

export function UploadFirstForm({
  categories,
  contacts: initialContacts,
}: UploadFirstFormProps) {
  const searchParams = useSearchParams();
  
  // Get initial type from URL params
  const initialType: BoxType = searchParams.get("type") === "income" ? "INCOME" : "EXPENSE";
  
  // Use the custom hook for all state management
  const {
    // State
    step,
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
    isAnalyzing,
    amount,
    setAmount,
    slipAmount,
    boxDate,
    setBoxDate,
    title,
    setTitle,
    description,
    setDescription,
    contactName,
    selectedContactId,
    categoryId,
    setCategoryId,
    notes,
    setNotes,
    contacts,
    matchResult,
    isPending,
    
    // Computed
    analyzedCount,
    hasSlipOnly,
    hasTaxInvoice,
    
    // Actions
    handleFileSelect,
    removeFile,
    reanalyzeFile,
    handleContactChange,
    handleContactCreated,
    handleAddToExistingBox,
    handleCreateNew,
    handleSubmit,
  } = useBoxUpload({ 
    initialType, 
    initialContacts,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Link 
              href="/documents" 
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {step === "upload" ? "อัปโหลดเอกสาร" : "ตรวจสอบข้อมูล"}
              </h1>
              <p className="text-sm text-gray-500">
                {step === "upload" 
                  ? "อัปเอกสารอะไรก็ได้ AI จะอ่านและจัดการให้" 
                  : `${files.length} เอกสาร • AI วิเคราะห์แล้ว`
                }
              </p>
            </div>
          </div>

          {/* Box Type Toggle */}
          <div className="flex rounded-lg border p-0.5 bg-white">
            <button
              type="button"
              onClick={() => setBoxType("EXPENSE")}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5",
                boxType === "EXPENSE"
                  ? "bg-rose-500 text-white"
                  : "text-gray-500 hover:text-rose-600 hover:bg-rose-50"
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
                  : "text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
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
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">
                      เอกสารที่อัปโหลด ({files.length})
                    </h3>
                    {isAnalyzing && (
                      <span className="text-sm text-primary flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        กำลังวิเคราะห์...
                      </span>
                    )}
                  </div>

                  {files.map((f) => (
                    <FileAnalysisCard
                      key={f.id}
                      file={f}
                      expenseType={expenseType}
                      onRemove={() => removeFile(f.id)}
                      onReanalyze={() => reanalyzeFile(f.id)}
                    />
                  ))}
                </div>
              )}

              {/* Info Banner for Slip Only - shows different message based on ExpenseType */}
              {hasSlipOnly && analyzedCount > 0 && expenseType === "STANDARD" && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        มีเฉพาะสลิป - รอใบกำกับภาษี
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        ยอดเงิน VAT และหัก ณ ที่จ่าย จะรู้เมื่อได้ใบกำกับภาษี
                        <br />ระบบจะติดตามให้จนกว่าจะครบ
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {hasSlipOnly && analyzedCount > 0 && expenseType === "FOREIGN" && (
                <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-indigo-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-indigo-800">
                        มีเฉพาะสลิป - รอ Invoice ต่างประเทศ
                      </p>
                      <p className="text-sm text-indigo-700 mt-1">
                        เพิ่ม Invoice เพื่อยืนยันยอดและรายละเอียด
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Form or Match Panel */}
            <div className="space-y-4">
              {/* Show Match Panel if matches found */}
              {matchResult && matchResult.hasMatch && (
                <BoxMatchPanel
                  matches={matchResult.matches}
                  suggestedAction={matchResult.suggestedAction}
                  reason={matchResult.reason}
                  onSelectBox={handleAddToExistingBox}
                  onCreateNew={handleCreateNew}
                  isLoading={isPending}
                />
              )}

              {/* Show form if no matches or user chose to create new */}
              {(!matchResult || !matchResult.hasMatch) && (
              <>
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
                  slipAmount={slipAmount}
                  categories={categories}
                  contacts={contacts}
                  boxDate={boxDate}
                  setBoxDate={setBoxDate}
                  amount={amount}
                  setAmount={setAmount}
                  contactName={contactName}
                  selectedContactId={selectedContactId}
                  onContactChange={handleContactChange}
                  onContactCreated={handleContactCreated}
                  categoryId={categoryId}
                  setCategoryId={setCategoryId}
                  title={title}
                  setTitle={setTitle}
                  description={description}
                  setDescription={setDescription}
                  notes={notes}
                  setNotes={setNotes}
                  analyzedCount={analyzedCount}
                  hasSlipOnly={hasSlipOnly}
                  hasTaxInvoice={hasTaxInvoice}
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
              </>
              )}
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
