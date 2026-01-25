"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { ContactForm } from "./ContactForm";
import type { Contact } from ".prisma/client";

// Serialized contact from server (Decimal converted to number)
type SerializedContact = Omit<Contact, 'defaultWhtRate'> & {
  defaultWhtRate: number | null;
  _count: { boxes: number };
};

interface ContactListProps {
  contacts: SerializedContact[];
}

export function ContactList({ contacts }: ContactListProps) {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<SerializedContact | null>(null);
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

  const openEditDialog = (contact: SerializedContact) => {
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาผู้ติดต่อ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card"
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

      {/* Contact Table */}
      {filteredContacts.length > 0 ? (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">ประเภท</TableHead>
                <TableHead>ชื่อ</TableHead>
                <TableHead>เลขประจำตัวผู้เสียภาษี</TableHead>
                <TableHead className="text-center">เอกสาร</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id} className="group">
                  <TableCell>
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                      {contact.contactType === "COMPANY" ? (
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{contact.name}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.taxId || "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {contact._count.boxes > 0 ? (
                      <Badge variant="secondary" className="text-xs">
                        {contact._count.boxes}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-4">
          {search ? (
            <p className="text-center text-muted-foreground py-8">ไม่พบ &quot;{search}&quot;</p>
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
      
      {contacts.length > 0 && (
        <p className="text-sm text-muted-foreground">
          ทั้งหมด {contacts.length} รายชื่อ
        </p>
      )}
    </div>
  );
}
