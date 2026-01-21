"use client";

import { useRouter } from "next/navigation";
import { BoxDetailSimple } from "@/components/documents/box-detail/BoxDetailSimple";
import { submitBox, reviewBox, deleteBox } from "@/server/actions/box";
import type { SerializedBox } from "@/types";
import type { Category, Contact, CostCenter } from ".prisma/client";

interface BoxDetailWrapperProps {
  box: SerializedBox;
  categories: Category[];
  contacts: Contact[];
  costCenters: CostCenter[];
  canEdit: boolean;
  canSend: boolean;
  canReview: boolean;
  canDelete: boolean;
}

export function BoxDetailWrapper({ 
  box, 
  categories,
  contacts,
  costCenters,
  canEdit, 
  canSend,
  canReview,
  canDelete,
}: BoxDetailWrapperProps) {
  const router = useRouter();

  // Send to accounting
  const handleSendToAccounting = async () => {
    const result = await submitBox(box.id);
    if (!result.success) {
      throw new Error(result.error || "เกิดข้อผิดพลาด");
    }
    router.refresh();
  };

  // Review actions
  const handleReview = async (action: "approve" | "reject" | "need_info") => {
    const result = await reviewBox(box.id, action);
    if (!result.success) {
      throw new Error(result.error || "เกิดข้อผิดพลาด");
    }
    router.refresh();
  };

  // Handle delete box
  const handleDelete = async () => {
    if (!confirm("ต้องการลบกล่องเอกสารนี้? การลบไม่สามารถย้อนกลับได้")) {
      throw new Error("cancelled");
    }
    
    const result = await deleteBox(box.id);
    if (!result.success) {
      throw new Error(result.error || "เกิดข้อผิดพลาด");
    }
    // deleteBox already redirects to /documents
  };

  return (
    <BoxDetailSimple
      box={box}
      canEdit={canEdit}
      canSend={canSend}
      canReview={canReview}
      canDelete={canDelete}
      onSendToAccounting={canSend ? handleSendToAccounting : undefined}
      onReview={canReview ? handleReview : undefined}
      onDelete={canDelete ? handleDelete : undefined}
    />
  );
}
