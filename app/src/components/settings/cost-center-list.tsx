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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { createCostCenter, updateCostCenter, deleteCostCenter } from "@/server/actions/settings";
import type { CostCenter } from ".prisma/client";

interface CostCenterListProps {
  costCenters: CostCenter[];
}

export function CostCenterList({ costCenters }: CostCenterListProps) {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null);

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = editingCostCenter
        ? await updateCostCenter(editingCostCenter.id, formData)
        : await createCostCenter(formData);

      if (result.success) {
        toast.success(editingCostCenter ? "แก้ไขศูนย์ต้นทุนเรียบร้อย" : "สร้างศูนย์ต้นทุนเรียบร้อย");
        setDialogOpen(false);
        setEditingCostCenter(null);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบศูนย์ต้นทุนนี้?")) return;

    startTransition(async () => {
      const result = await deleteCostCenter(id);
      if (result.success) {
        toast.success("ลบศูนย์ต้นทุนเรียบร้อย");
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const openEditDialog = (costCenter: CostCenter) => {
    setEditingCostCenter(costCenter);
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingCostCenter(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มศูนย์ต้นทุน
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCostCenter ? "แก้ไขศูนย์ต้นทุน" : "เพิ่มศูนย์ต้นทุนใหม่"}
              </DialogTitle>
              <DialogDescription>
                กรอกข้อมูลศูนย์ต้นทุน
              </DialogDescription>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">รหัส *</Label>
                <Input
                  id="code"
                  name="code"
                  placeholder="เช่น HQ, MKT, IT"
                  defaultValue={editingCostCenter?.code || ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">ชื่อศูนย์ต้นทุน *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="เช่น สำนักงานใหญ่, การตลาด"
                  defaultValue={editingCostCenter?.name || ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">รายละเอียด</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={2}
                  placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                  defaultValue={editingCostCenter?.description || ""}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingCostCenter ? "บันทึก" : "สร้าง"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            ศูนย์ต้นทุนทั้งหมด
          </CardTitle>
          <CardDescription>{costCenters.length} รายการ</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>ชื่อ</TableHead>
                <TableHead>รายละเอียด</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costCenters.map((costCenter) => (
                <TableRow key={costCenter.id}>
                  <TableCell className="font-mono">{costCenter.code}</TableCell>
                  <TableCell className="font-medium">{costCenter.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {costCenter.description || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(costCenter)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(costCenter.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {costCenters.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    ยังไม่มีศูนย์ต้นทุน
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
