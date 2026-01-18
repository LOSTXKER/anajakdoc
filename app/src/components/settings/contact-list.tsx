"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2, Building2, User } from "lucide-react";
import { toast } from "sonner";
import { createContact, updateContact, deleteContact } from "@/server/actions/settings";
import type { Contact } from ".prisma/client";

interface ContactListProps {
  contacts: Contact[];
}

const roleLabels = {
  VENDOR: "ผู้ขาย",
  CUSTOMER: "ลูกค้า",
  BOTH: "ทั้งสอง",
};

const roleColors = {
  VENDOR: "bg-red-100 text-red-700",
  CUSTOMER: "bg-green-100 text-green-700",
  BOTH: "bg-blue-100 text-blue-700",
};

export function ContactList({ contacts }: ContactListProps) {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = editingContact
        ? await updateContact(editingContact.id, formData)
        : await createContact(formData);

      if (result.success) {
        toast.success(editingContact ? "แก้ไขผู้ติดต่อเรียบร้อย" : "สร้างผู้ติดต่อเรียบร้อย");
        setDialogOpen(false);
        setEditingContact(null);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบผู้ติดต่อนี้?")) return;

    startTransition(async () => {
      const result = await deleteContact(id);
      if (result.success) {
        toast.success("ลบผู้ติดต่อเรียบร้อย");
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const openEditDialog = (contact: Contact) => {
    setEditingContact(contact);
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingContact(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มผู้ติดต่อ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingContact ? "แก้ไขผู้ติดต่อ" : "เพิ่มผู้ติดต่อใหม่"}
              </DialogTitle>
              <DialogDescription>
                กรอกข้อมูลผู้ติดต่อ
              </DialogDescription>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactType">ประเภท</Label>
                  <Select 
                    name="contactType" 
                    defaultValue={editingContact?.contactType || "COMPANY"}
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
                    name="contactRole" 
                    defaultValue={editingContact?.contactRole || "VENDOR"}
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
                  defaultValue={editingContact?.name || ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId">เลขประจำตัวผู้เสียภาษี</Label>
                <Input
                  id="taxId"
                  name="taxId"
                  placeholder="0123456789012"
                  defaultValue={editingContact?.taxId || ""}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="02-xxx-xxxx"
                    defaultValue={editingContact?.phone || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="contact@company.com"
                    defaultValue={editingContact?.email || ""}
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
                  defaultValue={editingContact?.address || ""}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingContact ? "บันทึก" : "สร้าง"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ</TableHead>
                <TableHead>เลขประจำตัวผู้เสียภาษี</TableHead>
                <TableHead>บทบาท</TableHead>
                <TableHead>เบอร์โทร</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {contact.contactType === "COMPANY" ? (
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">{contact.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {contact.taxId || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge className={roleColors[contact.contactRole]}>
                      {roleLabels[contact.contactRole]}
                    </Badge>
                  </TableCell>
                  <TableCell>{contact.phone || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(contact)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(contact.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {contacts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    ยังไม่มีผู้ติดต่อ
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
