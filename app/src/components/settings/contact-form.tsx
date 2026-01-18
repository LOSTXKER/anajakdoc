"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [contactType, setContactType] = useState(contact?.contactType || "COMPANY");
  const [contactRole, setContactRole] = useState(contact?.contactRole || defaultRole);

  const handleSubmit = async (formData: FormData) => {
    // Add the select values to formData
    formData.set("contactType", contactType);
    formData.set("contactRole", contactRole);

    startTransition(async () => {
      const result = contact
        ? await updateContact(contact.id, formData)
        : await createContact(formData);

      if (result.success) {
        toast.success(contact ? "แก้ไขผู้ติดต่อเรียบร้อย" : "สร้างผู้ติดต่อเรียบร้อย");
        if (onSuccess && result.data) {
          onSuccess(result.data);
        } else if (onSuccess && contact) {
          onSuccess({ id: contact.id, name: formData.get("name") as string });
        }
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactType">ประเภท</Label>
          <Select 
            value={contactType}
            onValueChange={(value) => setContactType(value as "COMPANY" | "INDIVIDUAL")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="COMPANY">นิติบุคคล</SelectItem>
              <SelectItem value="INDIVIDUAL">บุคคล</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactRole">บทบาท</Label>
          <Select 
            value={contactRole}
            onValueChange={(value) => setContactRole(value as "VENDOR" | "CUSTOMER" | "BOTH")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VENDOR">ผู้ขาย/คู่ค้า</SelectItem>
              <SelectItem value="CUSTOMER">ลูกค้า</SelectItem>
              <SelectItem value="BOTH">ทั้งสอง</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">ชื่อ *</Label>
        <Input
          id="name"
          name="name"
          placeholder="ชื่อบริษัท หรือ ชื่อ-นามสกุล"
          defaultValue={contact?.name || ""}
          required
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="taxId">เลขประจำตัวผู้เสียภาษี</Label>
        <Input
          id="taxId"
          name="taxId"
          placeholder="0123456789012"
          defaultValue={contact?.taxId || ""}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
          <Input
            id="phone"
            name="phone"
            placeholder="02-xxx-xxxx"
            defaultValue={contact?.phone || ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">อีเมล</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="contact@company.com"
            defaultValue={contact?.email || ""}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">ที่อยู่</Label>
        <Textarea
          id="address"
          name="address"
          rows={2}
          placeholder="ที่อยู่สำหรับออกเอกสาร"
          defaultValue={contact?.address || ""}
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            ยกเลิก
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {contact ? "บันทึก" : "สร้างผู้ติดต่อ"}
        </Button>
      </div>
    </form>
  );
}
