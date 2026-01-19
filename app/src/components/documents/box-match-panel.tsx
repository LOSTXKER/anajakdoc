"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Package,
  Plus,
  Check,
  ChevronRight,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/formatters";
import type { DocumentBoxMatch } from "@/server/actions/ai-classify";

interface BoxMatchPanelProps {
  matches: DocumentBoxMatch[];
  suggestedAction: "add_to_existing" | "create_new";
  reason: string;
  onSelectBox: (documentId: string) => void;
  onCreateNew: () => void;
  isLoading?: boolean;
}

export function BoxMatchPanel({
  matches,
  suggestedAction,
  reason,
  onSelectBox,
  onCreateNew,
  isLoading,
}: BoxMatchPanelProps) {
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(
    suggestedAction === "add_to_existing" && matches[0] ? matches[0].documentId : null
  );

  const handleSelectBox = (id: string) => {
    setSelectedBoxId(id);
  };

  const handleConfirm = () => {
    if (selectedBoxId) {
      onSelectBox(selectedBoxId);
    }
  };

  if (matches.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI แนะนำ</h3>
            <p className="text-sm text-gray-500">{reason}</p>
          </div>
        </div>

        <Button onClick={onCreateNew} className="w-full" disabled={isLoading}>
          <Plus className="mr-2 h-4 w-4" />
          สร้างกล่องใหม่
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI พบกล่องที่อาจตรงกัน</h3>
            <p className="text-sm text-gray-500">{reason}</p>
          </div>
        </div>
      </div>

      {/* Match List */}
      <div className="p-3 space-y-2">
        {matches.map((match) => (
          <button
            key={match.documentId}
            type="button"
            onClick={() => handleSelectBox(match.documentId)}
            className={cn(
              "w-full p-3 rounded-lg border-2 text-left transition-all",
              selectedBoxId === match.documentId
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            <div className="flex items-start gap-3">
              {/* Selection indicator */}
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                  selectedBoxId === match.documentId
                    ? "border-primary bg-primary text-white"
                    : "border-gray-300"
                )}
              >
                {selectedBoxId === match.documentId && (
                  <Check className="h-3 w-3" />
                )}
              </div>

              {/* Box info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">
                    {match.docNumber}
                  </span>
                  <span
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded font-medium",
                      match.matchScore >= 70
                        ? "bg-green-100 text-green-700"
                        : match.matchScore >= 50
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-700"
                    )}
                  >
                    {match.matchScore}% match
                  </span>
                </div>

                {match.contactName && (
                  <p className="text-sm text-gray-600 truncate">
                    {match.contactName}
                  </p>
                )}

                {match.amount !== undefined && match.amount > 0 && (
                  <p className="text-sm font-medium text-primary">
                    ฿{formatMoney(match.amount)}
                  </p>
                )}

                {/* Match reasons */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {match.matchReasons.map((reason, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>

              <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
            </div>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t bg-gray-50 space-y-2">
        <Button
          onClick={handleConfirm}
          className="w-full"
          disabled={!selectedBoxId || isLoading}
        >
          <Package className="mr-2 h-4 w-4" />
          เพิ่มเข้ากล่องที่เลือก
        </Button>

        <Button
          variant="outline"
          onClick={onCreateNew}
          className="w-full"
          disabled={isLoading}
        >
          <Plus className="mr-2 h-4 w-4" />
          สร้างกล่องใหม่แทน
        </Button>
      </div>

      {/* Tip */}
      <div className="px-5 py-3 bg-blue-50 border-t border-blue-100">
        <div className="flex gap-2 text-xs text-blue-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>
            AI วิเคราะห์จากชื่อผู้ติดต่อ ยอดเงิน และวันที่
            ตรวจสอบก่อนเพิ่มเอกสาร
          </p>
        </div>
      </div>
    </div>
  );
}
