"use client";

import Image from "next/image";
import {
  FileText,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ExtractedFile {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "analyzing" | "done" | "error";
  error?: string;
}

interface FileAnalysisCardProps {
  file: ExtractedFile;
  onRemove: () => void;
}

export function FileAnalysisCard({ 
  file,
  onRemove, 
}: FileAnalysisCardProps) {
  const { preview } = file;

  const isImage = file.file.type.startsWith("image/");
  const isPdf = file.file.type === "application/pdf";
  
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
          {isImage && preview ? (
            <Image
              src={preview}
              alt={file.file.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className={cn("h-8 w-8", isPdf ? "text-red-500" : "text-muted-foreground")} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{file.file.name}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatFileSize(file.file.size)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-start gap-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
