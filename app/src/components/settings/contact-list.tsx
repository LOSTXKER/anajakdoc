"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Building2, User, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { deleteContact } from "@/server/actions/settings";
import { ContactForm } from "./contact-form";
import type { Contact } from ".prisma/client";

type ContactWithCount = Contact & {
  _count: { boxes: number };
};

interface ContactListProps {
  contacts: ContactWithCount[];
}

export function ContactList({ contacts }: ContactListProps) {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactWithCount | null>(null);
  const [search, setSearch] = useState("");

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`ต้องการลบ "${name}"?`)) return;

    startTransition(async () => {
      const result = await deleteContact(id);
      if (result.success) {
        toast.success("ลบเรียบร้อย");
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const openEditDialog = (contact: ContactWithCount) => {
    setEditingContact(contact);
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingContact(null);
    setDialogOpen(true);
  };

  const handleFormSuccess = () => {
    setDialogOpen(false);
    setEditingContact(null);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="ค้นหาผู้ติดต่อ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="mr-1.5 h-4 w-4" />
              เพิ่ม
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingContact ? "แก้ไขผู้ติดต่อ" : "เพิ่มผู้ติดต่อ"}
              </DialogTitle>
            </DialogHeader>
            <ContactForm
              contact={editingContact}
              onSuccess={handleFormSuccess}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Contact List */}
      <div className="rounded-xl border bg-white divide-y">
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => (
            <div key={contact.id} className="group flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                {contact.contactType === "COMPANY" ? (
                  <Building2 className="h-5 w-5 text-gray-500" />
                ) : (
                  <User className="h-5 w-5 text-gray-500" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{contact.name}</p>
                {contact.taxId && (
                  <p className="text-sm text-gray-500">เลขที่ {contact.taxId}</p>
                )}
              </div>
              
              {contact._count.boxes > 0 && (
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 shrink-0">
                  {contact._count.boxes} เอกสาร
                </span>
              )}
              
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
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
                  className="h-8 w-8 text-red-500 hover:text-red-600"
                  onClick={() => handleDelete(contact.id, contact.name)}
                  disabled={isPending || contact._count.boxes > 0}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4">
            {search ? (
              <p className="text-center text-gray-500 py-8">ไม่พบ &quot;{search}&quot;</p>
            ) : (
              <EmptyState
                icon={Users}
                title="ยังไม่มีผู้ติดต่อ"
                description="เพิ่มรายชื่อที่ใช้บ่อยเพื่อความสะดวก"
                action={
                  <Button size="sm" onClick={openCreateDialog}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    เพิ่มผู้ติดต่อ
                  </Button>
                }
              />
            )}
          </div>
        )}
      </div>
      
      {contacts.length > 0 && (
        <p className="text-sm text-gray-400 text-center">
          {contacts.length} รายชื่อ
        </p>
      )}
    </div>
  );
}
