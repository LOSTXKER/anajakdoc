"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Pencil, Trash2, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { createCategory, updateCategory, deleteCategory } from "@/server/actions/settings";
import type { Category } from ".prisma/client";

interface CategoryListProps {
  categories: Category[];
}

export function CategoryList({ categories }: CategoryListProps) {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const expenseCategories = categories.filter((c) => c.categoryType === "EXPENSE");
  const incomeCategories = categories.filter((c) => c.categoryType === "INCOME");

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = editingCategory
        ? await updateCategory(editingCategory.id, formData)
        : await createCategory(formData);

      if (result.success) {
        toast.success(editingCategory ? "แก้ไขหมวดหมู่เรียบร้อย" : "สร้างหมวดหมู่เรียบร้อย");
        setDialogOpen(false);
        setEditingCategory(null);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบหมวดหมู่นี้?")) return;

    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.success) {
        toast.success("ลบหมวดหมู่เรียบร้อย");
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingCategory(null);
    setDialogOpen(true);
  };

  // Render category table
  const renderCategoryTable = (categoryList: Category[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">รหัส</TableHead>
          <TableHead>ชื่อหมวดหมู่</TableHead>
          <TableHead>รหัส PEAK</TableHead>
          <TableHead className="w-[100px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categoryList.map((category) => (
          <TableRow key={category.id} className="group">
            <TableCell>
              <Badge variant="secondary" className="font-mono text-xs">
                {category.code}
              </Badge>
            </TableCell>
            <TableCell className="font-medium">{category.name}</TableCell>
            <TableCell className="text-muted-foreground">
              {category.peakAccountCode || "-"}
            </TableCell>
            <TableCell>
              <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEditDialog(category)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600"
                  onClick={() => handleDelete(category.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="mr-1.5 h-4 w-4" />
              เพิ่มหมวดหมู่
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}
              </DialogTitle>
              <DialogDescription>
                กรอกข้อมูลหมวดหมู่
              </DialogDescription>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">รหัส</Label>
                <Input
                  id="code"
                  name="code"
                  placeholder="เช่น OFC, TRV"
                  defaultValue={editingCategory?.code || ""}
                  className="bg-muted/50 focus:bg-card"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">ชื่อหมวดหมู่</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="เช่น ค่าใช้จ่ายสำนักงาน"
                  defaultValue={editingCategory?.name || ""}
                  className="bg-muted/50 focus:bg-card"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryType">ประเภท</Label>
                <Select 
                  name="categoryType" 
                  defaultValue={editingCategory?.categoryType || "EXPENSE"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXPENSE">รายจ่าย</SelectItem>
                    <SelectItem value="INCOME">รายรับ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="peakAccountCode">รหัสบัญชี PEAK (ถ้ามี)</Label>
                <Input
                  id="peakAccountCode"
                  name="peakAccountCode"
                  placeholder="เช่น 5100-01"
                  defaultValue={editingCategory?.peakAccountCode || ""}
                  className="bg-muted/50 focus:bg-card"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingCategory ? "บันทึก" : "สร้าง"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Expense Categories */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950 flex items-center justify-center">
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">หมวดรายจ่าย</h3>
              <p className="text-sm text-muted-foreground">{expenseCategories.length} หมวดหมู่</p>
            </div>
          </div>

          {expenseCategories.length > 0 ? (
            <div className="rounded-xl border bg-card">
              {renderCategoryTable(expenseCategories)}
            </div>
          ) : (
            <div className="rounded-xl border bg-card p-4">
              <EmptyState
                icon={TrendingDown}
                title="ยังไม่มีหมวดหมู่รายจ่าย"
                className="py-6"
              />
            </div>
          )}
        </div>

        {/* Income Categories */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">หมวดรายรับ</h3>
              <p className="text-sm text-muted-foreground">{incomeCategories.length} หมวดหมู่</p>
            </div>
          </div>

          {incomeCategories.length > 0 ? (
            <div className="rounded-xl border bg-card">
              {renderCategoryTable(incomeCategories)}
            </div>
          ) : (
            <div className="rounded-xl border bg-card p-4">
              <EmptyState
                icon={TrendingUp}
                title="ยังไม่มีหมวดหมู่รายรับ"
                className="py-6"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
