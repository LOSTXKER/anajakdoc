"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  FileSpreadsheet,
  Star,
  Lock,
  Loader2,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { 
  createExportProfile, 
  updateExportProfile, 
  deleteExportProfile,
  type ExportProfileData,
  type ExportColumn,
} from "@/server/actions/export-profile";

// Available fields for export (defined locally to avoid "use server" export issues)
const EXPORT_FIELDS = [
  { field: "boxNumber", label: "เลขที่เอกสาร", type: "string" },
  { field: "boxDate", label: "วันที่", type: "date" },
  { field: "title", label: "รายการ", type: "string" },
  { field: "totalAmount", label: "ยอดรวม", type: "number" },
  { field: "vatAmount", label: "VAT", type: "number" },
  { field: "whtAmount", label: "WHT", type: "number" },
  { field: "paidAmount", label: "ยอดจ่าย", type: "number" },
  { field: "contactName", label: "คู่ค้า", type: "string" },
  { field: "contactTaxId", label: "เลขผู้เสียภาษี", type: "string" },
  { field: "categoryName", label: "หมวดหมู่", type: "string" },
  { field: "categoryCode", label: "รหัสหมวด", type: "string" },
  { field: "costCenterName", label: "ศูนย์ต้นทุน", type: "string" },
  { field: "costCenterCode", label: "รหัสศูนย์ต้นทุน", type: "string" },
  { field: "status", label: "สถานะ", type: "string" },
  { field: "description", label: "รายละเอียด", type: "string" },
  { field: "notes", label: "หมายเหตุ", type: "string" },
  { field: "externalRef", label: "อ้างอิงภายนอก", type: "string" },
  { field: "paymentMode", label: "วิธีจ่าย", type: "string" },
  { field: "createdByName", label: "ผู้สร้าง", type: "string" },
  { field: "createdAt", label: "วันที่สร้าง", type: "date" },
] as const;

interface ExportProfileListProps {
  profiles: ExportProfileData[];
}

export function ExportProfileList({ profiles }: ExportProfileListProps) {
  const [isPending, startTransition] = useTransition();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ExportProfileData | null>(null);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createExportProfile(formData);
      if (result.success) {
        toast.success("สร้าง Profile สำเร็จ");
        setIsCreateOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleSetDefault = async (id: string) => {
    startTransition(async () => {
      const result = await updateExportProfile(id, { isDefault: true });
      if (result.success) {
        toast.success("ตั้งเป็นค่าเริ่มต้นแล้ว");
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบ Profile นี้?")) return;

    startTransition(async () => {
      const result = await deleteExportProfile(id);
      if (result.success) {
        toast.success("ลบ Profile แล้ว");
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Export Profiles</h3>
          <p className="text-sm text-muted-foreground">
            กำหนดรูปแบบและคอลัมน์สำหรับการ Export ข้อมูล
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              สร้าง Profile
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>สร้าง Export Profile ใหม่</DialogTitle>
                <DialogDescription>
                  เลือกรูปแบบพื้นฐานและปรับแต่งตามต้องการ
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">ชื่อ Profile *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="เช่น PEAK Import 2024"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">รายละเอียด</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="อธิบายการใช้งาน..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baseProfile">รูปแบบพื้นฐาน</Label>
                  <Select name="baseProfile" defaultValue="GENERIC">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GENERIC">ทั่วไป (Generic)</SelectItem>
                      <SelectItem value="PEAK">PEAK Accounting</SelectItem>
                      <SelectItem value="FLOWACCOUNT">FlowAccount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isDefault">ตั้งเป็นค่าเริ่มต้น</Label>
                  <Switch id="isDefault" name="isDefault" value="true" />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  สร้าง
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Profile Table */}
      {profiles.length === 0 ? (
        <div className="rounded-xl border bg-card p-6">
          <EmptyState
            icon={FileSpreadsheet}
            title="ยังไม่มี Export Profile"
            description="สร้าง Profile เพื่อ export ข้อมูลในรูปแบบที่ต้องการ"
            action={
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                สร้าง Profile แรก
              </Button>
            }
          />
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ Profile</TableHead>
                <TableHead>รายละเอียด</TableHead>
                <TableHead className="text-center">คอลัมน์</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{profile.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[250px]">
                    <p className="truncate">{profile.description || "-"}</p>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="text-xs">
                      {profile.columns.length}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {profile.isDefault && (
                        <Badge variant="secondary" className="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs gap-1">
                          <Star className="h-3 w-3 fill-amber-500" />
                          ค่าเริ่มต้น
                        </Badge>
                      )}
                      {profile.isSystem && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Lock className="h-3 w-3" />
                          ระบบ
                        </Badge>
                      )}
                      {!profile.isDefault && !profile.isSystem && (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingProfile(profile)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          แก้ไขคอลัมน์
                        </DropdownMenuItem>
                        {!profile.isDefault && (
                          <DropdownMenuItem onClick={() => handleSetDefault(profile.id)}>
                            <Star className="mr-2 h-4 w-4" />
                            ตั้งเป็นค่าเริ่มต้น
                          </DropdownMenuItem>
                        )}
                        {!profile.isSystem && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(profile.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              ลบ
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <ProfileEditDialog
        profile={editingProfile}
        open={!!editingProfile}
        onOpenChange={(open) => !open && setEditingProfile(null)}
      />
    </div>
  );
}

// Edit Dialog Component
function ProfileEditDialog({
  profile,
  open,
  onOpenChange,
}: {
  profile: ExportProfileData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [columns, setColumns] = useState<ExportColumn[]>(profile?.columns || []);

  // Reset columns when profile changes
  if (profile && columns !== profile.columns && !isPending) {
    setColumns(profile.columns);
  }

  const handleAddColumn = (field: string) => {
    const fieldDef = EXPORT_FIELDS.find((f) => f.field === field);
    if (!fieldDef) return;

    setColumns((prev) => [
      ...prev,
      {
        field,
        header: fieldDef.label,
        order: prev.length + 1,
      },
    ]);
  };

  const handleRemoveColumn = (field: string) => {
    setColumns((prev) => prev.filter((c) => c.field !== field));
  };

  const handleSave = () => {
    if (!profile) return;

    startTransition(async () => {
      const result = await updateExportProfile(profile.id, { columns });
      if (result.success) {
        toast.success("บันทึกสำเร็จ");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  const availableFields = EXPORT_FIELDS.filter(
    (f) => !columns.some((c) => c.field === f.field)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>แก้ไขคอลัมน์: {profile?.name}</DialogTitle>
          <DialogDescription>
            เลือกและจัดเรียงคอลัมน์สำหรับการ Export
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
          {/* Selected Columns */}
          <div>
            <Label className="text-sm font-medium">คอลัมน์ที่เลือก</Label>
            <div className="mt-2 space-y-2">
              {columns.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                  ยังไม่ได้เลือกคอลัมน์
                </p>
              ) : (
                columns.map((col, index) => (
                  <div
                    key={col.field}
                    className="flex items-center gap-2 p-2 border rounded-lg bg-card"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-sm">{col.header}</span>
                    <span className="text-xs text-muted-foreground">{col.field}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveColumn(col.field)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Available Fields */}
          <div>
            <Label className="text-sm font-medium">เพิ่มคอลัมน์</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {availableFields.map((field) => (
                <Button
                  key={field.field}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => handleAddColumn(field.field)}
                >
                  <Plus className="mr-2 h-3 w-3" />
                  {field.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
