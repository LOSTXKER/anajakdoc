"use client";

import Image from "next/image";
import {
  FileText,
  Plus,
  Eye,
  Trash2,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getDocTypeLabel } from "@/lib/utils";
import type { DocType } from "@/types";

interface FileItem {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  createdAt: string | Date;
  docType: DocType;
}

interface FileListProps {
  files: FileItem[];
  canEdit: boolean;
  onTriggerFileUpload: () => void;
  onDeleteFile?: (fileId: string) => void;
}

// Get background color for doc type
const getDocTypeBgClass = (docType: DocType) => {
  if (docType === "TAX_INVOICE" || docType === "TAX_INVOICE_ABB") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (docType === "SLIP_TRANSFER" || docType === "SLIP_CHEQUE") {
    return "bg-blue-100 text-blue-700";
  }
  if (docType.startsWith("WHT_")) {
    return "bg-amber-100 text-amber-700";
  }
  if (docType === "INVOICE" || docType === "RECEIPT") {
    return "bg-purple-100 text-purple-700";
  }
  return "bg-gray-100 text-gray-600";
};

export function FileList({
  files,
  canEdit,
  onTriggerFileUpload,
  onDeleteFile,
}: FileListProps) {
  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          ไฟล์ในกล่อง ({files.length} ไฟล์)
        </h3>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={onTriggerFileUpload}>
            <Plus className="h-4 w-4 mr-1" />
            เพิ่มเอกสาร
          </Button>
        )}
      </div>

      {files.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Upload className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-500">ยังไม่มีไฟล์</p>
          {canEdit && (
            <Button variant="outline" size="sm" className="mt-3" onClick={onTriggerFileUpload}>
              <Plus className="h-4 w-4 mr-1" />
              เพิ่มเอกสาร
            </Button>
          )}
        </div>
      ) : (
        <div className="divide-y">
          {files.map((file) => (
            <div key={file.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
              {/* File Preview */}
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                {file.fileUrl && file.mimeType?.startsWith("image/") ? (
                  <Image
                    src={file.fileUrl}
                    alt={file.fileName}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <FileText className={cn(
                    "h-5 w-5",
                    file.mimeType === "application/pdf" ? "text-red-500" : "text-gray-400"
                  )} />
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.fileName}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className={cn(
                    "px-1.5 py-0.5 rounded",
                    getDocTypeBgClass(file.docType)
                  )}>
                    {getDocTypeLabel(file.docType)}
                  </span>
                  {file.createdAt && (
                    <span>
                      {new Date(file.createdAt).toLocaleDateString("th-TH", {
                        day: "numeric", month: "short"
                      })}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {file.fileUrl && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => window.open(file.fileUrl, "_blank")}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                {canEdit && onDeleteFile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-500"
                    onClick={() => onDeleteFile(file.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
