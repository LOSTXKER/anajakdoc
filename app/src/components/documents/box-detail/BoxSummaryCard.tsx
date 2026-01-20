"use client";

import {
  Package,
  Calendar,
  Building2,
  FolderOpen,
  Briefcase,
  Check,
  FileCheck,
  Receipt,
  Banknote,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/lib/formatters";
import { getBoxTypeConfig, getExpenseTypeLabel } from "@/lib/document-config";
import type { SerializedBox, ExpenseType } from "@/types";
import type { Category, Contact, CostCenter } from ".prisma/client";

// Expense type cards for visual selection
const EXPENSE_TYPE_CARDS: { 
  value: ExpenseType; 
  label: string; 
  description: string; 
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}[] = [
  { 
    value: "STANDARD", 
    label: "มีใบกำกับภาษี", 
    description: "ขอคืน VAT ได้", 
    icon: FileCheck,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  { 
    value: "NO_VAT", 
    label: "ไม่มีใบกำกับภาษี", 
    description: "บิลเงินสด / ร้านไม่จด VAT", 
    icon: Receipt,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
  { 
    value: "PETTY_CASH", 
    label: "เบิกเงินสดย่อย", 
    description: "ค่าใช้จ่ายเล็กน้อย", 
    icon: Banknote,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  { 
    value: "FOREIGN", 
    label: "จ่ายต่างประเทศ", 
    description: "สกุลเงินอื่น เช่น USD", 
    icon: Globe,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
];

interface BoxSummaryCardProps {
  box: SerializedBox;
  categories: Category[];
  contacts: Contact[];
  costCenters: CostCenter[];
  isEditing: boolean;
  // Form state
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  vatAmount: string;
  setVatAmount: (v: string) => void;
  whtAmount: string;
  setWhtAmount: (v: string) => void;
  expenseType: ExpenseType;
  setExpenseType: (v: ExpenseType) => void;
  hasVat: boolean; // Read-only, computed from expenseType
  boxDate: string;
  setBoxDate: (v: string) => void;
  categoryId: string;
  setCategoryId: (v: string) => void;
  contactId: string;
  setContactId: (v: string) => void;
  costCenterId: string;
  setCostCenterId: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
}

export function BoxSummaryCard({
  box,
  categories,
  contacts,
  costCenters,
  isEditing,
  title,
  setTitle,
  description,
  setDescription,
  amount,
  setAmount,
  vatAmount,
  setVatAmount,
  whtAmount,
  setWhtAmount,
  expenseType,
  setExpenseType,
  hasVat,
  boxDate,
  setBoxDate,
  categoryId,
  setCategoryId,
  contactId,
  setContactId,
  costCenterId,
  setCostCenterId,
  notes,
  setNotes,
}: BoxSummaryCardProps) {
  const boxTypeConfig = getBoxTypeConfig(box.boxType);

  // Filter categories by box type
  const filteredCategories = categories.filter(
    c => c.categoryType === (box.boxType === "EXPENSE" ? "EXPENSE" : "INCOME")
  );

  // Filter contacts
  const filteredContacts = contacts.filter(c => {
    if (box.boxType === "EXPENSE") {
      return c.contactRole === "VENDOR" || c.contactRole === "BOTH";
    }
    return c.contactRole === "CUSTOMER" || c.contactRole === "BOTH";
  });

  return (
    <div className="rounded-xl border bg-white p-5">
      {/* Type Badge & Title */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className={boxTypeConfig.badgeClass}>
              {boxTypeConfig.label}
            </Badge>
            {(isEditing ? expenseType : box.expenseType) && (
              <Badge variant="outline">
                {getExpenseTypeLabel(isEditing ? expenseType : box.expenseType!)}
              </Badge>
            )}
          </div>
          {isEditing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ชื่อกล่อง (เช่น ค่าบริการ IT ม.ค.)"
              className="text-xl font-semibold text-gray-900 border-0 border-b rounded-none px-0 h-auto py-1 focus-visible:ring-0 focus-visible:border-primary"
            />
          ) : (
            <h1 className="text-xl font-semibold text-gray-900">
              {box.title || box.description || `${boxTypeConfig.label}`}
            </h1>
          )}
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* ยอดรวม */}
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", boxTypeConfig.bgLight)}>
            <Package className={cn("h-5 w-5", boxTypeConfig.iconColor)} />
          </div>
          <div>
            <p className="text-sm text-gray-500">ยอดรวม</p>
            {isEditing ? (
              <div className="relative">
                <span className={cn("absolute left-0 top-1/2 -translate-y-1/2 font-bold", boxTypeConfig.amountColor)}>฿</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className={cn("text-lg font-bold border-0 border-b rounded-none pl-4 pr-0 h-auto py-0.5 w-28 focus-visible:ring-0 focus-visible:border-primary", boxTypeConfig.amountColor)}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            ) : (
              <p className={cn("text-lg font-bold", boxTypeConfig.amountColor)}>
                {box.totalAmount > 0 ? `฿${formatMoney(box.totalAmount)}` : "รอยอด"}
              </p>
            )}
          </div>
        </div>

        {/* วันที่ */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">วันที่</p>
            {isEditing ? (
              <Input
                type="date"
                className="border-0 border-b rounded-none px-0 h-auto py-0.5 font-medium focus-visible:ring-0 focus-visible:border-primary"
                value={boxDate}
                onChange={(e) => setBoxDate(e.target.value)}
              />
            ) : (
              <p className="font-medium text-gray-900">
                {new Date(box.boxDate).toLocaleDateString("th-TH", { 
                  day: "numeric", month: "short", year: "numeric" 
                })}
              </p>
            )}
          </div>
        </div>

        {/* ร้านค้า/ลูกค้า */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
            <Building2 className={cn("h-5 w-5", box.contact || isEditing ? "text-gray-600" : "text-gray-400")} />
          </div>
          <div>
            <p className="text-sm text-gray-500">
              {box.boxType === "EXPENSE" ? "ร้านค้า" : "ลูกค้า"}
            </p>
            {isEditing ? (
              <Select value={contactId || "__none__"} onValueChange={(v) => setContactId(v === "__none__" ? "" : v)}>
                <SelectTrigger className="border-0 border-b rounded-none px-0 h-auto py-0.5 font-medium focus:ring-0 w-auto min-w-24">
                  <SelectValue placeholder="ไม่ระบุ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">ไม่ระบุ</SelectItem>
                  {filteredContacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : box.contact ? (
              <p className="font-medium text-gray-900">{box.contact.name}</p>
            ) : (
              <p className="text-sm text-gray-400">ไม่ระบุ</p>
            )}
          </div>
        </div>

        {/* หมวดหมู่ */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
            <FolderOpen className={cn("h-5 w-5", box.category || isEditing ? "text-gray-600" : "text-gray-400")} />
          </div>
          <div>
            <p className="text-sm text-gray-500">หมวดหมู่</p>
            {isEditing ? (
              <Select value={categoryId || "__none__"} onValueChange={(v) => setCategoryId(v === "__none__" ? "" : v)}>
                <SelectTrigger className="border-0 border-b rounded-none px-0 h-auto py-0.5 font-medium focus:ring-0 w-auto min-w-24">
                  <SelectValue placeholder="ไม่ระบุ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">ไม่ระบุ</SelectItem>
                  {filteredCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : box.category ? (
              <p className="font-medium text-gray-900">{box.category.name}</p>
            ) : (
              <p className="text-sm text-gray-400">ไม่ระบุ</p>
            )}
          </div>
        </div>

        {/* Cost Center */}
        {(costCenters.length > 0 || box.costCenter) && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <Briefcase className={cn("h-5 w-5", box.costCenter || isEditing ? "text-gray-600" : "text-gray-400")} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Cost Center</p>
              {isEditing ? (
                <Select value={costCenterId || "__none__"} onValueChange={(v) => setCostCenterId(v === "__none__" ? "" : v)}>
                  <SelectTrigger className="border-0 border-b rounded-none px-0 h-auto py-0.5 font-medium focus:ring-0 w-auto min-w-24">
                    <SelectValue placeholder="ไม่ระบุ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">ไม่ระบุ</SelectItem>
                    {costCenters.map((cc) => (
                      <SelectItem key={cc.id} value={cc.id}>
                        {cc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : box.costCenter ? (
                <p className="font-medium text-gray-900">{box.costCenter.name}</p>
              ) : (
                <p className="text-sm text-gray-400">ไม่ระบุ</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Description & Notes */}
      {isEditing ? (
        <div className="mt-4 space-y-3">
          <div>
            <Label className="text-sm text-gray-500">รายละเอียด</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม..."
              rows={2}
              className="mt-1 border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary resize-none"
            />
          </div>
          <div>
            <Label className="text-sm text-gray-500">หมายเหตุ</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="หมายเหตุภายใน..."
              rows={2}
              className="mt-1 border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary resize-none"
            />
          </div>
        </div>
      ) : (box.description || box.notes) ? (
        <div className="mt-4 space-y-2">
          {box.description && (
            <p className="text-sm text-gray-600">{box.description}</p>
          )}
          {box.notes && (
            <div className="p-3 rounded-lg bg-gray-50 border">
              <p className="text-sm text-gray-600">{box.notes}</p>
            </div>
          )}
        </div>
      ) : null}

      {/* Expense Type - Edit mode */}
      {isEditing && box.boxType === "EXPENSE" ? (
        <div className="mt-4 pt-4 border-t space-y-3">
          <Label className="text-sm text-gray-500">ประเภทรายจ่าย</Label>
          <div className="grid grid-cols-2 gap-2">
            {EXPENSE_TYPE_CARDS.map((card) => {
              const isSelected = expenseType === card.value;
              const Icon = card.icon;
              return (
                <button
                  key={card.value}
                  type="button"
                  onClick={() => setExpenseType(card.value)}
                  className={cn(
                    "relative flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                    "hover:border-primary/50 hover:bg-primary/5",
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-gray-200 bg-white"
                  )}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  
                  {/* Icon */}
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    isSelected ? "bg-primary/10" : card.iconBg
                  )}>
                    <Icon className={cn(
                      "h-5 w-5",
                      isSelected ? "text-primary" : card.iconColor
                    )} />
                  </div>
                  
                  {/* Text */}
                  <div className="min-w-0 pr-4">
                    <span className={cn(
                      "block font-medium text-sm truncate",
                      isSelected ? "text-primary" : "text-gray-900"
                    )}>
                      {card.label}
                    </span>
                    <span className="block text-xs text-gray-500 truncate">
                      {card.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* VAT Amount (only when hasVat) */}
          {hasVat && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
              <Check className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-sm text-green-700">ขอคืน VAT ได้</span>
              <div className="ml-auto relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-green-600 text-sm">฿</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="border-0 border-b border-green-300 rounded-none pl-4 pr-0 h-auto py-0.5 text-sm w-24 focus-visible:ring-0 focus-visible:border-green-500 bg-transparent"
                  value={vatAmount}
                  onChange={(e) => setVatAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          )}
        </div>
      ) : (box.vatAmount > 0 || box.hasVat) ? (
        <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
          <div className="flex items-center gap-2 text-green-700">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">
              VAT ฿{formatMoney(box.vatAmount)} (ขอคืน VAT ได้)
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
