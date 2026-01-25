"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Calendar,
  FileText,
  Pencil,
  Check,
  X,
  Loader2,
  Tag,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/formatters";
import { toast } from "sonner";

import { updateBox } from "@/server/actions/box/update-box";

// ==================== Types ====================

interface Contact {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface CostCenter {
  id: string;
  name: string;
  code: string;
}

interface BoxInfoCardProps {
  boxId: string;
  title?: string | null;
  boxDate: string;
  description?: string | null;
  notes?: string | null;
  contact?: { id: string; name: string } | null;
  category?: { id: string; name: string } | null;
  costCenter?: { id: string; name: string; code: string } | null;
  contacts?: Contact[];
  categories?: Category[];
  costCenters?: CostCenter[];
  canEdit?: boolean;
}

// ==================== Display Field Component ====================

interface DisplayFieldProps {
  label: string;
  value: string;
  icon: React.ElementType;
}

function DisplayField({ label, value, icon: Icon }: DisplayFieldProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className={cn(
          "font-medium text-foreground",
          !value && "text-muted-foreground italic"
        )}>
          {value || "ไม่ระบุ"}
        </p>
      </div>
    </div>
  );
}

// ==================== Edit Field Component ====================

interface EditFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ElementType;
  type?: "text" | "textarea" | "date" | "select";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

function EditField({
  label,
  value,
  onChange,
  icon: Icon,
  type = "text",
  options = [],
  placeholder = "",
}: EditFieldProps) {
  const renderInput = () => {
    switch (type) {
      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-[60px] text-sm"
          />
        );
      case "date":
        return (
          <Input
            type="date"
            value={value ? value.split("T")[0] : ""}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 text-sm"
          />
        );
      case "select":
        return (
          <Select value={value || "__none__"} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">ไม่ระบุ</SelectItem>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="h-9 text-sm"
          />
        );
    }
  };

  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        {renderInput()}
      </div>
    </div>
  );
}

// ==================== Main Component ====================

export function BoxInfoCard({
  boxId,
  title,
  boxDate,
  description,
  notes,
  contact,
  category,
  costCenter,
  contacts = [],
  categories = [],
  costCenters = [],
  canEdit = false,
}: BoxInfoCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState(title || "");
  const [formContactId, setFormContactId] = useState(contact?.id || "");
  const [formBoxDate, setFormBoxDate] = useState(boxDate);
  const [formCategoryId, setFormCategoryId] = useState(category?.id || "");
  const [formCostCenterId, setFormCostCenterId] = useState(costCenter?.id || "");
  const [formDescription, setFormDescription] = useState(description || notes || "");

  // Reset form when entering edit mode
  const handleStartEdit = () => {
    setFormTitle(title || "");
    setFormContactId(contact?.id || "");
    setFormBoxDate(boxDate);
    setFormCategoryId(category?.id || "");
    setFormCostCenterId(costCenter?.id || "");
    setFormDescription(description || notes || "");
    setIsEditing(true);
  };

  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false);
  };

  // Save all changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.set("title", formTitle);
      formData.set("contactId", formContactId);
      formData.set("boxDate", formBoxDate);
      formData.set("categoryId", formCategoryId);
      formData.set("costCenterId", formCostCenterId);
      formData.set("description", formDescription);

      const result = await updateBox(boxId, formData);

      if (result.success) {
        toast.success("บันทึกเรียบร้อย");
        setIsEditing(false);
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Prepare options
  const contactOptions = contacts.map((c) => ({ value: c.id, label: c.name }));
  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const costCenterOptions = costCenters.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }));

  // Get display values
  const contactName = contact?.name || "";
  const categoryName = category?.name || "";
  const costCenterDisplay = costCenter ? `${costCenter.code} - ${costCenter.name}` : "";

  return (
    <div className="rounded-2xl border bg-card p-5">
      {/* Header with Edit Button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">ข้อมูลกล่อง</h3>
        {canEdit && !isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStartEdit}
            className="h-8 px-3 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-4 w-4 mr-1.5" />
            แก้ไข
          </Button>
        )}
        {isEditing && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-8 px-3"
            >
              <X className="h-4 w-4 mr-1" />
              ยกเลิก
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 px-3"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1.5" />
              )}
              บันทึก
            </Button>
          </div>
        )}
      </div>

      {/* Fields */}
      <div className="space-y-4">
        {isEditing ? (
          <>
            {/* Edit Mode */}
            <EditField
              label="ชื่อรายการ"
              value={formTitle}
              onChange={setFormTitle}
              icon={FileText}
              placeholder="ระบุชื่อรายการ"
            />

            {contacts.length > 0 && (
              <EditField
                label="ผู้ติดต่อ"
                value={formContactId}
                onChange={setFormContactId}
                icon={Building2}
                type="select"
                options={contactOptions}
                placeholder="เลือกผู้ติดต่อ"
              />
            )}

            <EditField
              label="วันที่"
              value={formBoxDate}
              onChange={setFormBoxDate}
              icon={Calendar}
              type="date"
            />

            {categories.length > 0 && (
              <EditField
                label="หมวดหมู่"
                value={formCategoryId}
                onChange={setFormCategoryId}
                icon={Tag}
                type="select"
                options={categoryOptions}
                placeholder="เลือกหมวดหมู่"
              />
            )}

            {costCenters.length > 0 && (
              <EditField
                label="Cost Center"
                value={formCostCenterId}
                onChange={setFormCostCenterId}
                icon={FolderOpen}
                type="select"
                options={costCenterOptions}
                placeholder="เลือก Cost Center"
              />
            )}

            <div className="pt-4 border-t">
              <EditField
                label="รายละเอียด"
                value={formDescription}
                onChange={setFormDescription}
                icon={FileText}
                type="textarea"
                placeholder="เพิ่มรายละเอียดหรือหมายเหตุ..."
              />
            </div>
          </>
        ) : (
          <>
            {/* Display Mode */}
            <DisplayField
              label="ชื่อรายการ"
              value={title || ""}
              icon={FileText}
            />

            <DisplayField
              label="ผู้ติดต่อ"
              value={contactName}
              icon={Building2}
            />

            <DisplayField
              label="วันที่"
              value={boxDate ? formatDate(boxDate, "long") : ""}
              icon={Calendar}
            />

            {(categories.length > 0 || category) && (
              <DisplayField
                label="หมวดหมู่"
                value={categoryName}
                icon={Tag}
              />
            )}

            {(costCenters.length > 0 || costCenter) && (
              <DisplayField
                label="Cost Center"
                value={costCenterDisplay}
                icon={FolderOpen}
              />
            )}

            <div className="pt-4 border-t">
              <DisplayField
                label="รายละเอียด"
                value={description || notes || ""}
                icon={FileText}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
