"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BoxDetailView } from "@/components/documents/box-detail";
import { updateBox, submitBox, addFileToBox, deleteBoxFile, reviewBox, toggleChecklistItem, deleteBox } from "@/server/actions/box";
import { extractDocumentData } from "@/server/actions/ai-classify";
import { toast } from "sonner";
import type { SerializedBox, DocType } from "@/types";
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
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [pendingToggleId, setPendingToggleId] = useState<string | undefined>();

  // Toggle edit mode
  const handleToggleEdit = () => {
    setIsEditing(!isEditing);
  };

  // Save changes
  const handleSave = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateBox(box.id, formData);
      if (result.success) {
        toast.success("บันทึกสำเร็จ");
        setIsEditing(false);
        router.refresh();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  // Send to accounting
  const handleSendToAccounting = () => {
    startTransition(async () => {
      const result = await submitBox(box.id);
      if (result.success) {
        toast.success("ส่งบัญชีสำเร็จ");
        router.refresh();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  // Review actions
  const handleReview = (action: "approve" | "reject" | "need_info") => {
    startTransition(async () => {
      const result = await reviewBox(box.id, action);
      if (result.success) {
        toast.success(
          action === "approve" ? "อนุมัติเรียบร้อย" :
          action === "reject" ? "ปฏิเสธเรียบร้อย" : "ส่งขอข้อมูลเพิ่มแล้ว"
        );
        router.refresh();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList, docType?: DocType) => {
    startTransition(async () => {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Create form data
        const formData = new FormData();
        formData.append("file", file);
        
        // If docType specified, use it; otherwise try AI classification
        if (docType) {
          formData.append("docType", docType);
        } else {
          // Try AI classification
          try {
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
              reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(",")[1]);
              };
              reader.readAsDataURL(file);
            });
            
            const base64 = await base64Promise;
            const classifyResult = await extractDocumentData(base64, file.type);
            
            if (classifyResult.success && classifyResult.data?.type) {
              formData.append("docType", classifyResult.data.type);
              
              // Also add extracted data if available
              if (classifyResult.data.amount) {
                formData.append("amount", classifyResult.data.amount.toString());
              }
              if (classifyResult.data.vatAmount) {
                formData.append("vatAmount", classifyResult.data.vatAmount.toString());
              }
            } else {
              formData.append("docType", "OTHER");
            }
          } catch {
            formData.append("docType", "OTHER");
          }
        }

        const result = await addFileToBox(box.id, formData);
        
        if (result.success) {
          toast.success(`อัปโหลด ${file.name} สำเร็จ`);
        } else {
          toast.error(result.error || `อัปโหลด ${file.name} ไม่สำเร็จ`);
        }
      }
      
      router.refresh();
    });
  };

  // Handle file delete
  const handleDeleteFile = (fileId: string) => {
    if (!confirm("ต้องการลบไฟล์นี้?")) return;
    
    startTransition(async () => {
      const result = await deleteBoxFile(box.id, fileId);
      if (result.success) {
        toast.success("ลบไฟล์สำเร็จ");
        router.refresh();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  // Handle toggle checklist item
  const handleToggleItem = (itemId: string) => {
    setPendingToggleId(itemId);
    startTransition(async () => {
      const result = await toggleChecklistItem(box.id, itemId);
      if (result.success) {
        toast.success(result.message || "อัปเดตสถานะสำเร็จ");
        router.refresh();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
      setPendingToggleId(undefined);
    });
  };

  // Handle delete box
  const handleDelete = () => {
    if (!confirm("ต้องการลบกล่องเอกสารนี้? การลบไม่สามารถย้อนกลับได้")) return;
    
    startTransition(async () => {
      const result = await deleteBox(box.id);
      if (result.success) {
        toast.success("ลบกล่องเอกสารสำเร็จ");
        // deleteBox already redirects to /documents
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <BoxDetailView
      box={box}
      categories={categories}
      contacts={contacts}
      costCenters={costCenters}
      isEditing={isEditing}
      isPending={isPending}
      onToggleEdit={handleToggleEdit}
      onSave={handleSave}
      onSendToAccounting={handleSendToAccounting}
      onReview={handleReview}
      onFileUpload={handleFileUpload}
      onDeleteFile={handleDeleteFile}
      onToggleItem={handleToggleItem}
      onDelete={handleDelete}
      isPendingToggle={pendingToggleId}
      canEdit={canEdit}
      canSend={canSend}
      canReview={canReview}
      canDelete={canDelete}
    />
  );
}
