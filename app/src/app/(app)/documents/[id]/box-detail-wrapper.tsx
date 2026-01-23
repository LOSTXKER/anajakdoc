"use client";

import { useRouter } from "next/navigation";
import { BoxDetail } from "@/components/documents/box-detail";
import { submitBox, deleteBox } from "@/server/actions/box";
import type { SerializedBox, TaskType, TaskStatus } from "@/types";

interface TaskItem {
  id: string;
  taskType: TaskType;
  status: TaskStatus;
  title: string;
  description: string | null;
  dueDate: string | null;
  escalationLevel: number;
  assignee: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  } | null;
  createdAt: string;
}

interface BoxDetailWrapperProps {
  box: SerializedBox;
  tasks: TaskItem[];
  contacts: { id: string; name: string }[];
  canEdit: boolean;
  canSend: boolean;
  canDelete: boolean;
}

export function BoxDetailWrapper({ 
  box, 
  tasks,
  contacts,
  canEdit, 
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

  // Refresh page
  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <BoxDetail
      box={box}
      tasks={tasks}
      contacts={contacts}
      canEdit={canEdit}
      canSend={canSend}
      canDelete={canDelete}
      onSendToAccounting={canSend ? handleSendToAccounting : undefined}
      onDelete={canDelete ? handleDelete : undefined}
      onRefresh={handleRefresh}
    />
  );
}
