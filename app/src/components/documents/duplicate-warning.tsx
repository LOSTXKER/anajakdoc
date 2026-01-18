"use client";

import Link from "next/link";
import { AlertTriangle, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DuplicateWarning } from "@/server/actions/file";

interface DuplicateWarningProps {
  warnings: DuplicateWarning[];
  onDismiss?: (index: number) => void;
}

export function DuplicateWarningAlert({ warnings, onDismiss }: DuplicateWarningProps) {
  if (warnings.length === 0) return null;

  return (
    <div className="space-y-2">
      {warnings.map((warning, index) => (
        <div
          key={`${warning.documentId}-${index}`}
          className={`flex items-start gap-3 p-4 rounded-lg border ${
            warning.type === "exact"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          <AlertTriangle className={`h-5 w-5 shrink-0 ${
            warning.type === "exact" ? "text-red-500" : "text-amber-500"
          }`} />
          <div className="flex-1 min-w-0">
            <p className="font-medium">
              {warning.type === "exact" ? "⚠️ ไฟล์ซ้ำ" : "⚠️ อาจเป็นเอกสารซ้ำ"}
            </p>
            <p className="text-sm mt-0.5">{warning.message}</p>
            <Link
              href={`/documents/${warning.documentId}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-sm font-medium mt-2 hover:underline"
            >
              ดูเอกสาร {warning.docNumber}
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          {onDismiss && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => onDismiss(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
