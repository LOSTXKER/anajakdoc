"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createContact, updateContact } from "@/server/actions/settings";
import type { Contact } from ".prisma/client";

interface ContactFormProps {
  contact?: Contact | null;
  defaultRole?: "VENDOR" | "CUSTOMER" | "BOTH";
  onSuccess?: (contact: { id: string; name: string }) => void;
  onCancel?: () => void;
}

export function ContactForm({ 
  contact, 
  defaultRole = "VENDOR",
  onSuccess, 
  onCancel 
}: ContactFormProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(contact?.name || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("กรุณากรอกชื่อ");
      return;
    }

    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("contactRole", defaultRole);
    
    // Auto-detect type from name
    const isCompany = name.includes("บริษัท") || 
                     name.includes("ห้างหุ้นส่วน") || 
                     name.includes("จำกัด") ||
                     name.includes("Co.,") ||
                     name.includes("Ltd") ||
                     name.includes("Inc");
    formData.set("contactType", isCompany ? "COMPANY" : "INDIVIDUAL");

    startTransition(async () => {
      const result = contact
        ? await updateContact(contact.id, formData)
        : await createContact(formData);

      if (result.success) {
        toast.success(contact ? "แก้ไขเรียบร้อย" : "เพิ่มเรียบร้อย");
        if (onSuccess) {
          const resultWithData = result as { data?: { id: string; name: string } };
          if (resultWithData.data?.id && resultWithData.data?.name) {
            onSuccess(resultWithData.data);
          } else if (contact) {
            onSuccess({ id: contact.id, name: name.trim() });
          }
        }
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="พิมพ์ชื่อผู้ติดต่อ..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        autoFocus
        className="text-lg"
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            ยกเลิก
          </Button>
        )}
        <Button type="submit" disabled={isPending || !name.trim()}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {contact ? "บันทึก" : "เพิ่ม"}
        </Button>
      </div>
    </form>
  );
}
