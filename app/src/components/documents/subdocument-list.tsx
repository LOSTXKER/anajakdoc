"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Package } from "lucide-react";
import { SubDocumentCard } from "./subdocument-card";
import { SubDocumentForm } from "./subdocument-form";
import type { SerializedSubDocument, TransactionType } from "@/types";

interface SubDocumentListProps {
  documentId: string;
  transactionType: TransactionType;
  subDocuments: SerializedSubDocument[];
  canEdit?: boolean;
}

export function SubDocumentList({
  documentId,
  transactionType,
  subDocuments,
  canEdit = true,
}: SubDocumentListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5" />
          เอกสารในกล่อง
          <span className="text-muted-foreground font-normal text-sm">
            ({subDocuments.length})
          </span>
        </h3>

        {canEdit && (
          <Button onClick={() => setIsFormOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            เพิ่มเอกสาร
          </Button>
        )}
      </div>

      {/* List */}
      {subDocuments.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h4 className="font-medium mb-1">ยังไม่มีเอกสารในกล่อง</h4>
          <p className="text-sm text-muted-foreground mb-4">
            เพิ่มเอกสารต่างๆ เช่น สลิป ใบกำกับภาษี ใบแจ้งหนี้
          </p>
          {canEdit && (
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              เพิ่มเอกสารแรก
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {subDocuments.map((subDoc) => (
            <SubDocumentCard
              key={subDoc.id}
              subDocument={subDoc}
              onEdit={canEdit ? () => {} : undefined}
              onAddFile={canEdit ? () => {} : undefined}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <SubDocumentForm
        documentId={documentId}
        transactionType={transactionType}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
    </div>
  );
}
