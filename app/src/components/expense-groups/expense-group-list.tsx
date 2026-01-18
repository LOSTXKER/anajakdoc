"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2, FolderOpen, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createExpenseGroup, deleteExpenseGroup } from "@/server/actions/expense-group";
import Link from "next/link";

// Serialized types (Decimal -> number, Date -> string)
interface SerializedExpenseGroup {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  documents: {
    id: string;
    docNumber: string;
    totalAmount: number;
    status: string;
  }[];
  _count: { documents: number };
}

interface ExpenseGroupListProps {
  groups: SerializedExpenseGroup[];
}

export function ExpenseGroupList({ groups }: ExpenseGroupListProps) {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreate = async (formData: FormData) => {
    startTransition(async () => {
      const result = await createExpenseGroup(formData);
      if (result.success) {
        toast.success("สร้างกลุ่มค่าใช้จ่ายเรียบร้อย");
        setDialogOpen(false);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบกลุ่มนี้?")) return;
    
    startTransition(async () => {
      const result = await deleteExpenseGroup(id);
      if (result.success) {
        toast.success("ลบกลุ่มเรียบร้อย");
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              สร้างกลุ่มใหม่
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>สร้างกลุ่มค่าใช้จ่าย</DialogTitle>
              <DialogDescription>
                รวมเอกสารหลายรายการเป็นกลุ่มเพื่อเบิกจ่ายพร้อมกัน
              </DialogDescription>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">ชื่อกลุ่ม *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="เช่น ค่าใช้จ่ายเดือน ม.ค. 2567"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">รายละเอียด</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="รายละเอียดเพิ่มเติม..."
                  rows={2}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  สร้างกลุ่ม
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium">ยังไม่มีกลุ่มค่าใช้จ่าย</p>
            <p className="text-muted-foreground text-center max-w-md mt-1">
              สร้างกลุ่มเพื่อรวมเอกสารหลายรายการเข้าด้วยกัน ทำให้การเบิกจ่ายสะดวกขึ้น
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => {
            const total = group.documents.reduce(
              (sum, doc) => sum + doc.totalAmount,
              0
            );

            return (
              <Card key={group.id} className="relative group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FolderOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{group.name}</CardTitle>
                        <CardDescription>
                          {group._count.documents} เอกสาร
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(group.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {group.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {group.description}
                    </p>
                  )}
                  
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">ยอดรวม</p>
                    <p className="text-xl font-bold">
                      ฿{total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {group.documents.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {group.documents.slice(0, 3).map((doc) => (
                        <Link
                          key={doc.id}
                          href={`/documents/${doc.id}`}
                          className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{doc.docNumber}</span>
                          </div>
                          <span className="text-muted-foreground">
                            ฿{doc.totalAmount.toLocaleString()}
                          </span>
                        </Link>
                      ))}
                      {group.documents.length > 3 && (
                        <p className="text-xs text-center text-muted-foreground">
                          +{group.documents.length - 3} รายการ
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
