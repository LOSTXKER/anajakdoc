"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Check,
  Upload,
  Loader2,
  CreditCard,
  FileText,
  Receipt,
  Send,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { updateDocumentChecklist } from "@/server/actions/document";
import { createSubDocumentWithFile } from "@/server/actions/subdocument";
import type { ChecklistItem } from "@/lib/checklist";
import type { SubDocType } from "@/types";

interface DocumentStepperProps {
  documentId: string;
  items: ChecklistItem[];
  completionPercent: number;
  canEdit?: boolean;
}

// Step icons mapping
const stepIcons: Record<string, typeof CreditCard> = {
  isPaid: CreditCard,
  hasPaymentProof: Receipt,
  hasTaxInvoice: FileText,
  hasInvoice: FileText,
  whtIssued: FileText,
  whtSent: Send,
  whtReceived: Inbox,
};

export function DocumentStepper({
  documentId,
  items,
  completionPercent,
  canEdit = true,
}: DocumentStepperProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<ChecklistItem | null>(null);

  // Toggle checklist item
  const handleToggle = async (item: ChecklistItem) => {
    if (!canEdit || !item.canToggle) return;

    setLoading(item.id);
    try {
      const result = await updateDocumentChecklist(documentId, {
        [item.id]: !item.completed,
      });

      if (result.success) {
        toast.success("อัปเดทเรียบร้อย");
        router.refresh();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(null);
    }
  };

  // Open upload dialog
  const handleStepClick = (item: ChecklistItem) => {
    if (!canEdit) return;
    
    if (item.completed) return;
    
    if (item.canToggle) {
      handleToggle(item);
    } else if (item.relatedDocType) {
      setSelectedStep(item);
      setUploadDialogOpen(true);
    }
  };

  // Upload file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedStep?.relatedDocType) return;

    const file = files[0];
    setLoading(selectedStep.id);

    try {
      const formData = new FormData();
      formData.set("documentId", documentId);
      formData.set("docType", selectedStep.relatedDocType);
      formData.set("file", file);

      const result = await createSubDocumentWithFile(formData);

      if (result.success) {
        toast.success(`อัปโหลด ${file.name} สำเร็จ`);
        setUploadDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "อัปโหลดไม่สำเร็จ");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-2">
      {/* Compact Stepper Row */}
      <div className="flex items-center gap-2">
        {items.map((item, index) => {
          const Icon = stepIcons[item.id] || FileText;
          const isLoading = loading === item.id;
          const isClickable = canEdit && !item.completed && (item.canToggle || item.relatedDocType);
          
          return (
            <div key={item.id} className="flex items-center">
              {/* Step */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleStepClick(item)}
                  disabled={!isClickable || isLoading}
                  title={item.label}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    item.completed
                      ? "bg-green-500 text-white"
                      : isClickable
                      ? "bg-gray-100 text-gray-500 hover:bg-primary/10 hover:text-primary cursor-pointer"
                      : "bg-gray-100 text-gray-400",
                    isLoading && "animate-pulse"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : item.completed ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </button>
                {/* Label - hidden on mobile */}
                <span className={cn(
                  "mt-1 text-[10px] text-center leading-tight hidden sm:block max-w-[60px] truncate",
                  item.completed ? "text-green-700" : "text-gray-500"
                )}>
                  {item.label.replace("แล้ว", "").replace("มี", "").replace("หลักฐาน", "")}
                </span>
              </div>
              
              {/* Connector Line */}
              {index < items.length - 1 && (
                <div className={cn(
                  "w-4 sm:w-6 h-0.5 mx-1",
                  item.completed ? "bg-green-500" : "bg-gray-200"
                )} />
              )}
            </div>
          );
        })}
        
        {/* Percentage */}
        <span className={cn(
          "ml-auto text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap",
          completionPercent === 100
            ? "bg-green-100 text-green-700"
            : completionPercent >= 50
            ? "bg-primary/10 text-primary"
            : "bg-orange-100 text-orange-700"
        )}>
          {completionPercent}%
        </span>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{selectedStep?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">{selectedStep?.description}</p>
            <label className="block p-8 rounded-lg border-2 border-dashed hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
              <div className="flex flex-col items-center gap-2 text-center">
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-600">
                  คลิกเพื่อเลือกไฟล์
                </span>
                <span className="text-xs text-gray-400">
                  รองรับ: รูปภาพ, PDF
                </span>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
                disabled={loading !== null}
              />
            </label>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
