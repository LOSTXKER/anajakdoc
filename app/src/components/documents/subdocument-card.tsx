"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Receipt,
  FileCheck,
  FileWarning,
  File,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { SerializedSubDocument } from "@/types";
import { SubDocType } from "@/types";
import { deleteSubDocument } from "@/server/actions/subdocument";

interface SubDocumentCardProps {
  subDocument: SerializedSubDocument;
  onEdit?: () => void;
  onAddFile?: () => void;
}

const subDocTypeConfig: Record<SubDocType, { label: string; icon: typeof FileText; color: string }> = {
  SLIP: { label: "สลิปโอนเงิน", icon: Receipt, color: "bg-blue-100 text-blue-700" },
  TAX_INVOICE: { label: "ใบกำกับภาษี", icon: FileCheck, color: "bg-green-100 text-green-700" },
  INVOICE: { label: "ใบแจ้งหนี้", icon: FileText, color: "bg-purple-100 text-purple-700" },
  RECEIPT: { label: "ใบเสร็จรับเงิน", icon: Receipt, color: "bg-cyan-100 text-cyan-700" },
  WHT_CERT_SENT: { label: "หัก ณ ที่จ่าย (ออก)", icon: FileWarning, color: "bg-orange-100 text-orange-700" },
  WHT_CERT_RECEIVED: { label: "หัก ณ ที่จ่าย (รับ)", icon: FileWarning, color: "bg-amber-100 text-amber-700" },
  QUOTATION: { label: "ใบเสนอราคา", icon: FileText, color: "bg-indigo-100 text-indigo-700" },
  CONTRACT: { label: "สัญญา/ใบสั่งซื้อ", icon: File, color: "bg-slate-100 text-slate-700" },
  OTHER: { label: "อื่นๆ", icon: File, color: "bg-gray-100 text-gray-700" },
};

export function SubDocumentCard({ subDocument, onEdit, onAddFile }: SubDocumentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const config = subDocTypeConfig[subDocument.docType] || subDocTypeConfig.OTHER;
  const Icon = config.icon;
  const primaryFile = subDocument.files.find(f => f.isPrimary) || subDocument.files[0];

  const handleDelete = async () => {
    if (!confirm("ต้องการลบเอกสารนี้หรือไม่?")) return;
    
    setIsDeleting(true);
    const result = await deleteSubDocument(subDocument.id);
    setIsDeleting(false);

    if (result.success) {
      toast.success("ลบเอกสารเรียบร้อย");
    } else {
      toast.error(result.error || "เกิดข้อผิดพลาด");
    }
  };

  const openPreview = (url: string) => {
    setPreviewUrl(url);
    setPreviewOpen(true);
  };

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Thumbnail */}
            <div 
              className="relative w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
              onClick={() => primaryFile && openPreview(primaryFile.fileUrl)}
            >
              {primaryFile ? (
                primaryFile.mimeType.startsWith("image/") ? (
                  <Image
                    src={primaryFile.fileUrl}
                    alt={primaryFile.fileName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              
              {/* File count badge */}
              {subDocument.files.length > 1 && (
                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                  +{subDocument.files.length - 1}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={config.color}>
                    <Icon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {primaryFile && (
                      <DropdownMenuItem onClick={() => openPreview(primaryFile.fileUrl)}>
                        <Eye className="h-4 w-4 mr-2" />
                        ดูไฟล์
                      </DropdownMenuItem>
                    )}
                    {onAddFile && (
                      <DropdownMenuItem onClick={onAddFile}>
                        <Upload className="h-4 w-4 mr-2" />
                        เพิ่มไฟล์
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem onClick={onEdit}>
                        <Edit className="h-4 w-4 mr-2" />
                        แก้ไข
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      ลบ
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Doc number & date */}
              {(subDocument.docNumber || subDocument.docDate) && (
                <div className="mt-2 text-sm text-muted-foreground">
                  {subDocument.docNumber && <span>{subDocument.docNumber}</span>}
                  {subDocument.docNumber && subDocument.docDate && <span className="mx-1">•</span>}
                  {subDocument.docDate && (
                    <span>{new Date(subDocument.docDate).toLocaleDateString("th-TH")}</span>
                  )}
                </div>
              )}

              {/* Amount */}
              {subDocument.amount !== null && (
                <div className="mt-1 font-medium">
                  ฿{subDocument.amount.toLocaleString()}
                </div>
              )}

              {/* Notes */}
              {subDocument.notes && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                  {subDocument.notes}
                </p>
              )}

              {/* File count */}
              <div className="mt-2 text-xs text-muted-foreground">
                {subDocument.files.length} ไฟล์
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{config.label}</span>
              <Button variant="ghost" size="icon" onClick={() => setPreviewOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="relative w-full h-[70vh] bg-muted rounded-lg overflow-auto">
              {previewUrl.endsWith(".pdf") ? (
                <iframe src={previewUrl} className="w-full h-full" />
              ) : (
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-contain"
                />
              )}
            </div>
          )}
          
          {/* File thumbnails */}
          {subDocument.files.length > 1 && (
            <div className="flex gap-2 overflow-x-auto py-2">
              {subDocument.files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => setPreviewUrl(file.fileUrl)}
                  className={`relative w-16 h-16 rounded border-2 overflow-hidden flex-shrink-0 ${
                    previewUrl === file.fileUrl ? "border-primary" : "border-transparent"
                  }`}
                >
                  {file.mimeType.startsWith("image/") ? (
                    <Image
                      src={file.fileUrl}
                      alt={file.fileName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
