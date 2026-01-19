"use client";

import { useRouter } from "next/navigation";
import { useTransition, useRef } from "react";
import { BoxDetailView } from "@/components/documents/box-detail-view";
import { submitDocument } from "@/server/actions/document";
import { toast } from "sonner";
import type { SerializedDocument } from "@/types";

interface BoxDetailWrapperProps {
  document: SerializedDocument;
  canEdit: boolean;
  canSend: boolean;
}

export function BoxDetailWrapper({ 
  document, 
  canEdit, 
  canSend 
}: BoxDetailWrapperProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = () => {
    router.push(`/documents/${document.id}/edit`);
  };

  const handleSendToAccounting = () => {
    startTransition(async () => {
      const result = await submitDocument(document.id);
      if (result.success) {
        toast.success("ส่งบัญชีสำเร็จ");
        router.refresh();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleAddDocument = () => {
    // Navigate to edit page for adding documents
    router.push(`/documents/${document.id}/edit`);
  };

  const handleViewFile = (fileId: string) => {
    // Find file and open in new tab
    const file = document.subDocuments?.flatMap(sub => sub.files || [])
      .find(f => f.id === fileId);
    if (file?.publicUrl) {
      window.open(file.publicUrl, "_blank");
    }
  };

  return (
    <BoxDetailView
      document={document}
      onEdit={canEdit ? handleEdit : undefined}
      onSendToAccounting={canSend ? handleSendToAccounting : undefined}
      onAddDocument={canEdit ? handleAddDocument : undefined}
      onViewFile={handleViewFile}
      canEdit={canEdit}
      canSend={canSend}
    />
  );
}
