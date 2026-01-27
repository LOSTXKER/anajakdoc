"use client";

import { useRouter } from "next/navigation";
import { BoxDetail } from "@/components/documents/box-detail";
import { submitBox, deleteBox } from "@/server/actions/box";
import type { SerializedBox } from "@/types";
import type { CommentData } from "@/server/actions/comment";
import type { AuditLogEntry } from "@/server/actions/audit";

interface PayerInfo {
  id: string;
  payerType: "COMPANY" | "PETTY_CASH" | "MEMBER";
  amount: number;
  reimbursementStatus: "NONE" | "PENDING" | "REIMBURSED";
  reimbursedAt: string | null;
  member: {
    id: string;
    visibleName: string | null;
    bankName: string | null;
    bankAccount: string | null;
    user: {
      name: string | null;
      email: string;
    };
  } | null;
}

interface BoxDetailWrapperProps {
  box: SerializedBox;
  contacts: { id: string; name: string }[];
  comments: CommentData[];
  activities: AuditLogEntry[];
  payers?: PayerInfo[];
  currentUserId: string;
  isAdmin: boolean;
  canEdit: boolean;
  canEditDetails: boolean;
  canSend: boolean;
  canDelete: boolean;
}

export function BoxDetailWrapper({ 
  box, 
  contacts,
  comments,
  activities,
  payers = [],
  currentUserId,
  isAdmin,
  canEdit,
  canEditDetails,
  canSend,
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
    <BoxDetail
      box={box}
      contacts={contacts}
      comments={comments}
      activities={activities}
      payers={payers}
      currentUserId={currentUserId}
      isAdmin={isAdmin}
      canEdit={canEdit}
      canEditDetails={canEditDetails}
      canSend={canSend}
      canDelete={canDelete}
      onSendToAccounting={canSend ? handleSendToAccounting : undefined}
      onDelete={canDelete ? handleDelete : undefined}
    />
  );
}
