"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Circle, Upload, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { updateDocumentChecklist } from "@/server/actions/document";
import { createSubDocumentWithFile } from "@/server/actions/subdocument";
import type { ChecklistItem } from "@/lib/checklist";
import type { SubDocType } from "@/types";

interface DocumentChecklistProps {
  documentId: string;
  items: ChecklistItem[];
  completionPercent: number;
  canEdit?: boolean;
}

export function DocumentChecklist({
  documentId,
  items,
  completionPercent,
  canEdit = true,
}: DocumentChecklistProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  // Toggle checklist item
  const handleToggle = async (itemId: string, currentValue: boolean) => {
    if (!canEdit) return;

    setLoading(itemId);
    try {
      const result = await updateDocumentChecklist(documentId, {
        [itemId]: !currentValue,
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

  // Upload file
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: SubDocType
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setLoading(docType);

    try {
      const formData = new FormData();
      formData.set("documentId", documentId);
      formData.set("docType", docType);
      formData.set("file", file);

      const result = await createSubDocumentWithFile(formData);

      if (result.success) {
        toast.success(`อัปโหลด ${file.name} สำเร็จ`);
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
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">สถานะการดำเนินการ</h3>
        <Badge
          className={cn(
            completionPercent === 100
              ? "bg-green-100 text-green-700"
              : completionPercent >= 50
              ? "bg-yellow-100 text-yellow-700"
              : "bg-orange-100 text-orange-700"
          )}
        >
          {completionPercent}%
        </Badge>
      </div>

      {/* Progress Bar */}
      <Progress value={completionPercent} className="h-2" />

      {/* Checklist Items */}
      <div className="space-y-2">
        {items.map((item, index) => {
          const isLoading = loading === item.id || loading === item.relatedDocType;
          const isDisabled = !canEdit || isLoading;

          // Check if this item depends on previous items
          const canComplete = item.canToggle
            ? (item.id === "whtSent" 
                ? items.find(i => i.id === "whtIssued")?.completed 
                : true)
            : false;

          return (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                item.completed
                  ? "bg-green-50 border-green-200"
                  : item.required
                  ? "bg-orange-50/50 border-orange-200"
                  : "bg-muted/30 border-border"
              )}
            >
              {/* Checkbox/Status */}
              <div className="mt-0.5">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : item.completed ? (
                  <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                ) : item.canToggle && canComplete ? (
                  <button
                    onClick={() => handleToggle(item.id, item.completed)}
                    disabled={isDisabled}
                    className={cn(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                      isDisabled
                        ? "border-muted-foreground/30 cursor-not-allowed"
                        : "border-primary hover:bg-primary/10 cursor-pointer"
                    )}
                  >
                    {item.completed && <Check className="h-3 w-3 text-primary" />}
                  </button>
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/50" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-medium text-sm",
                      item.completed && "text-green-700"
                    )}
                  >
                    {item.label}
                  </span>
                  {item.required && !item.completed && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1 py-0 text-orange-600 border-orange-200"
                    >
                      จำเป็น
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.description}
                </p>

                {/* Upload Button for doc-related items */}
                {!item.completed && item.relatedDocType && canEdit && (
                  <label className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded border border-dashed cursor-pointer hover:bg-muted/50 transition-colors">
                    <Upload className="h-3 w-3" />
                    <span>อัปโหลด</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      onChange={(e) => handleFileUpload(e, item.relatedDocType!)}
                      className="hidden"
                      disabled={isLoading}
                    />
                  </label>
                )}
              </div>

              {/* Step Number */}
              <div className="text-xs text-muted-foreground font-medium">
                {index + 1}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Message */}
      {completionPercent === 100 && (
        <div className="p-3 rounded-lg bg-green-100 text-green-700 text-sm text-center">
          ✅ เอกสารครบถ้วน พร้อม Export
        </div>
      )}
    </div>
  );
}
