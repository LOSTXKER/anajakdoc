"use client";

import { 
  Calendar, 
  Package, 
  Check,
  FileCheck,
  Receipt,
  Banknote,
  Globe,
  Layers,
  type LucideIcon,
} from "lucide-react";
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
import { ContactInput, type ContactOption } from "@/components/documents/contact-input";
import { cn } from "@/lib/utils";
import type { Category } from ".prisma/client";
import type { BoxType, ExpenseType } from "@/types";

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

interface BoxInfoFormProps {
  boxType: BoxType;
  expenseType: ExpenseType;
  setExpenseType: (v: ExpenseType) => void;
  isMultiPayment: boolean;
  setIsMultiPayment: (v: boolean) => void;
  slipAmount: string;
  categories: Category[];
  contacts: ContactOption[];
  // Form state
  boxDate: string;
  setBoxDate: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  contactName: string;
  selectedContactId: string;
  onContactChange: (value: string, contactId?: string) => void;
  onContactCreated: (contact: ContactOption) => void;
  categoryId: string;
  setCategoryId: (v: string) => void;
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  // Status
  analyzedCount: number;
  hasSlipOnly: boolean;
  hasTaxInvoice: boolean;
}

export function BoxInfoForm({
  boxType,
  expenseType,
  setExpenseType,
  isMultiPayment,
  setIsMultiPayment,
  slipAmount,
  categories,
  contacts,
  boxDate,
  setBoxDate,
  amount,
  setAmount,
  contactName,
  onContactChange,
  onContactCreated,
  categoryId,
  setCategoryId,
  title,
  setTitle,
  description,
  setDescription,
  notes,
  setNotes,
  analyzedCount,
  hasSlipOnly,
  hasTaxInvoice,
}: BoxInfoFormProps) {
  // Filtered categories based on box type
  const filteredCategories = categories.filter(
    c => c.categoryType === (boxType === "EXPENSE" ? "EXPENSE" : "INCOME")
  );

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="px-5 py-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">ข้อมูลกล่อง</h3>
            <p className="text-sm text-gray-500">
              {analyzedCount > 0 ? "AI กรอกให้แล้ว ตรวจสอบและแก้ไขได้" : "กรอกข้อมูลพื้นฐาน"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Expense Type Cards (only for EXPENSE) */}
        {boxType === "EXPENSE" && (
          <div className="space-y-3">
            <Label className="text-base font-medium">ประเภทรายจ่าย</Label>
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
            
            {/* Payment type selection */}
            <div className="mt-4 pt-4 border-t">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">การชำระเงิน</Label>
              <div className="grid grid-cols-2 gap-2">
                {/* Single payment */}
                <button
                  type="button"
                  onClick={() => setIsMultiPayment(false)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all",
                    !isMultiPayment
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    !isMultiPayment ? "bg-primary/10" : "bg-gray-100"
                  )}>
                    <Check className={cn(
                      "h-4 w-4",
                      !isMultiPayment ? "text-primary" : "text-gray-400"
                    )} />
                  </div>
                  <div className="min-w-0">
                    <span className={cn(
                      "block font-medium text-sm",
                      !isMultiPayment ? "text-primary" : "text-gray-700"
                    )}>
                      จ่ายครั้งเดียว
                    </span>
                    <span className="block text-xs text-gray-500">
                      จบในสลิปเดียว
                    </span>
                  </div>
                </button>

                {/* Multi payment */}
                <button
                  type="button"
                  onClick={() => setIsMultiPayment(true)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all",
                    isMultiPayment
                      ? "border-amber-500 bg-amber-50 ring-2 ring-amber-200"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    isMultiPayment ? "bg-amber-100" : "bg-gray-100"
                  )}>
                    <Layers className={cn(
                      "h-4 w-4",
                      isMultiPayment ? "text-amber-600" : "text-gray-400"
                    )} />
                  </div>
                  <div className="min-w-0">
                    <span className={cn(
                      "block font-medium text-sm",
                      isMultiPayment ? "text-amber-700" : "text-gray-700"
                    )}>
                      จ่ายหลายงวด
                    </span>
                    <span className="block text-xs text-gray-500">
                      แบ่งจ่ายหลายครั้ง
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Title */}
        <div className="space-y-2">
          <Label>ชื่อกล่อง</Label>
          <Input
            placeholder="เช่น ค่าบริการ IT ม.ค. 2567"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label>วันที่</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              className="pl-10"
              value={boxDate}
              onChange={(e) => setBoxDate(e.target.value)}
            />
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>
              {isMultiPayment ? "ยอดรวมทั้งหมด *" : `ยอดเงิน ${hasTaxInvoice ? "*" : ""}`}
            </Label>
            {hasSlipOnly && !isMultiPayment && (
              <span className="text-xs text-amber-600">รอใบกำกับ</span>
            )}
          </div>
          
          {/* Show slip amount reference when multi-payment */}
          {isMultiPayment && slipAmount && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-sm">
              <Layers className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="text-amber-700">
                ยอดจากสลิป (งวดแรก): <strong>฿{parseFloat(slipAmount).toLocaleString()}</strong>
              </span>
            </div>
          )}
          
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">฿</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              className="pl-8"
              placeholder={isMultiPayment ? "กรอกยอดรวมทั้งหมด" : (hasSlipOnly ? "รอข้อมูลจากใบกำกับ" : "0.00")}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required={isMultiPayment}
            />
          </div>
          
          {isMultiPayment && (
            <p className="text-xs text-gray-500">
              กรอกยอดรวมที่ต้องจ่ายทั้งหมด ไม่ใช่ยอดงวดแรก
            </p>
          )}
        </div>

        {/* Contact */}
        <div className="space-y-2">
          <Label>{boxType === "EXPENSE" ? "ผู้ติดต่อ / ร้านค้า" : "ลูกค้า"}</Label>
          <ContactInput
            value={contactName}
            onChange={onContactChange}
            contacts={contacts}
            placeholder="พิมพ์ชื่อหรือเลือกจากรายชื่อ..."
            defaultRole={boxType === "EXPENSE" ? "VENDOR" : "CUSTOMER"}
            onContactCreated={onContactCreated}
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>หมวดหมู่</Label>
          <Select value={categoryId || "__none__"} onValueChange={(v) => setCategoryId(v === "__none__" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="เลือกหมวดหมู่ (ถ้ามี)" />
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
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label>รายละเอียด</Label>
          <Textarea
            placeholder="เช่น ค่าบริการ IT เดือนมกราคม..."
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>หมายเหตุ</Label>
          <Textarea
            placeholder="หมายเหตุเพิ่มเติม..."
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
