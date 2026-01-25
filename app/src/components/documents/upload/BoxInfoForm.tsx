"use client";

import { 
  Calendar, 
  Package, 
  Check,
  FileCheck,
  Receipt,
  Percent,
  CreditCard,
  CalendarClock,
  Info,
  Building2,
  User,
  Sparkles,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { BoxType, ExpenseType } from "@/types";
import type { ContactWithDefaults } from "@/server/actions/settings";
import { WHT_RATE_OPTIONS } from "@/lib/constants";
import { PayerSelector, type Payer } from "./PayerSelector";

// Expense type cards for visual selection (Simple: only STANDARD and NO_VAT)
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
    label: "มี VAT", 
    description: "ร้านจด VAT, คำนวณ 7% อัตโนมัติ", 
    icon: FileCheck,
    iconBg: "bg-emerald-100 dark:bg-emerald-900",
    iconColor: "text-emerald-600",
  },
  { 
    value: "NO_VAT", 
    label: "ไม่มี VAT", 
    description: "ร้านไม่จด VAT, บิลเงินสด", 
    icon: Receipt,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
];

interface BoxInfoFormProps {
  boxType: BoxType;
  expenseType: ExpenseType;
  setExpenseType: (v: ExpenseType) => void;
  isMultiPayment: boolean;
  setIsMultiPayment: (v: boolean) => void;
  hasWht: boolean;
  setHasWht: (v: boolean) => void;
  whtRate: string;
  setWhtRate: (v: string) => void;
  // Form state
  boxDate: string;
  setBoxDate: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  // Contact (Section 9 - Smart Guess)
  contacts?: ContactWithDefaults[];
  contactsLoading?: boolean;
  selectedContactId?: string;
  onContactSelect?: (contactId: string) => void;
  // Payers (who pays)
  payers?: { id: string; payerType: "COMPANY" | "PETTY_CASH" | "MEMBER"; memberId?: string; amount: number }[];
  onPayersChange?: (payers: { id: string; payerType: "COMPANY" | "PETTY_CASH" | "MEMBER"; memberId?: string; amount: number }[]) => void;
  members?: { id: string; name: string; visibleName?: string | null }[];
}

export function BoxInfoForm({
  boxType,
  expenseType,
  setExpenseType,
  isMultiPayment,
  setIsMultiPayment,
  hasWht,
  setHasWht,
  whtRate,
  setWhtRate,
  boxDate,
  setBoxDate,
  amount,
  setAmount,
  title,
  setTitle,
  description,
  setDescription,
  notes,
  setNotes,
  // Contact (Section 9)
  contacts = [],
  contactsLoading = false,
  selectedContactId = "",
  onContactSelect,
  // Payers
  payers = [],
  onPayersChange,
  members = [],
}: BoxInfoFormProps) {
  const selectedContact = contacts.find(c => c.id === selectedContactId);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">ข้อมูลกล่อง</h3>
            <p className="text-sm text-muted-foreground">กรอกข้อมูลพื้นฐาน</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Contact Selector - Smart Guess (Section 9) */}
        {onContactSelect && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium flex items-center gap-2">
                {boxType === "EXPENSE" ? "ผู้ขาย/ร้านค้า" : "ลูกค้า"}
                {selectedContact && (selectedContact.defaultVatRequired || selectedContact.whtApplicable) && (
                  <span className="inline-flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                    <Sparkles className="h-3 w-3" />
                    Smart Guess
                  </span>
                )}
              </Label>
            </div>
            <Select 
              value={selectedContactId} 
              onValueChange={onContactSelect}
              disabled={contactsLoading}
            >
              <SelectTrigger className="h-11">
                {contactsLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังโหลด...
                  </div>
                ) : (
                  <SelectValue placeholder={`เลือก${boxType === "EXPENSE" ? "ผู้ขาย" : "ลูกค้า"}...`} />
                )}
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    <div className="flex items-center gap-2">
                      {contact.contactType === "COMPANY" ? (
                        <Building2 className="h-4 w-4 text-blue-500" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span>{contact.name}</span>
                      {(contact.defaultVatRequired || contact.whtApplicable) && (
                        <Sparkles className="h-3 w-3 text-amber-500" />
                      )}
                    </div>
                  </SelectItem>
                ))}
                {contacts.length === 0 && !contactsLoading && (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    ยังไม่มีรายชื่อ
                  </div>
                )}
              </SelectContent>
            </Select>
            
            {/* Show contact defaults info */}
            {selectedContact && (selectedContact.defaultVatRequired || selectedContact.whtApplicable) && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700 dark:text-amber-400">
                  <p className="font-medium">ตั้งค่าอัตโนมัติจากประวัติ:</p>
                  <ul className="mt-1 space-y-0.5">
                    {selectedContact.defaultVatRequired && (
                      <li>• ใบกำกับภาษี (VAT)</li>
                    )}
                    {selectedContact.whtApplicable && (
                      <li>• หัก ณ ที่จ่าย {selectedContact.defaultWhtRate}%</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

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
                        : "border bg-card"
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
                        isSelected ? "text-primary" : "text-foreground"
                      )}>
                        {card.label}
                      </span>
                      <span className="block text-xs text-muted-foreground truncate">
                        {card.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* WHT (หัก ณ ที่จ่าย) - only show when STANDARD (has tax invoice) */}
            {expenseType === "STANDARD" && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-start gap-3 p-3 rounded-xl border bg-muted/50">
                  <Checkbox
                    id="hasWht"
                    checked={hasWht}
                    onCheckedChange={(checked) => setHasWht(checked === true)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <label htmlFor="hasWht" className="block font-medium text-sm text-foreground cursor-pointer">
                      มีหัก ณ ที่จ่าย (WHT)
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      เลือกถ้ารายการนี้ต้องออกหนังสือรับรองหัก ณ ที่จ่าย
                    </p>
                    
                    {/* Rate selector - show when hasWht is true */}
                    {hasWht && (
                      <div className="mt-3">
                        <Label className="text-xs text-muted-foreground">อัตราหัก ณ ที่จ่าย</Label>
                        <Select value={whtRate} onValueChange={setWhtRate}>
                          <SelectTrigger className="mt-1 h-9">
                            <SelectValue placeholder="เลือกอัตรา..." />
                          </SelectTrigger>
                          <SelectContent>
                            {WHT_RATE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <div className="flex items-center gap-2">
                                  <Percent className="h-3 w-3 text-purple-500" />
                                  <span>{opt.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Type Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">รูปแบบการชำระ</Label>
          <div className="grid grid-cols-2 gap-2">
            {/* Single payment */}
            <button
              type="button"
              onClick={() => setIsMultiPayment(false)}
              className={cn(
                "relative flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                "hover:border-primary/50 hover:bg-primary/5",
                !isMultiPayment
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border bg-card"
              )}
            >
              {!isMultiPayment && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                !isMultiPayment ? "bg-primary/10" : "bg-emerald-100 dark:bg-emerald-900"
              )}>
                <CreditCard className={cn(
                  "h-5 w-5",
                  !isMultiPayment ? "text-primary" : "text-emerald-600"
                )} />
              </div>
              <div className="min-w-0 pr-4">
                <span className={cn(
                  "block font-medium text-sm",
                  !isMultiPayment ? "text-primary" : "text-foreground"
                )}>
                  จ่ายครั้งเดียว
                </span>
                <span className="block text-xs text-muted-foreground">
                  จบในครั้งเดียว
                </span>
              </div>
            </button>

            {/* Multi payment */}
            <button
              type="button"
              onClick={() => setIsMultiPayment(true)}
              className={cn(
                "relative flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                "hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950",
                isMultiPayment
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-950 ring-2 ring-amber-200 dark:ring-amber-800"
                  : "border bg-card"
              )}
            >
              {isMultiPayment && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                isMultiPayment ? "bg-amber-100 dark:bg-amber-900" : "bg-amber-100 dark:bg-amber-900"
              )}>
                <CalendarClock className={cn(
                  "h-5 w-5",
                  isMultiPayment ? "text-amber-600" : "text-amber-600"
                )} />
              </div>
              <div className="min-w-0 pr-4">
                <span className={cn(
                  "block font-medium text-sm",
                  isMultiPayment ? "text-amber-700 dark:text-amber-400" : "text-foreground"
                )}>
                  แบ่งจ่ายหลายงวด
                </span>
                <span className="block text-xs text-muted-foreground">
                  บัญชีติดตามยอดค้าง
                </span>
              </div>
            </button>
          </div>
          
          {/* Info note for multi-payment */}
          {isMultiPayment && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                กรุณากรอก<strong>ยอดรวมทั้งหมด</strong>ของรายการนี้ (ไม่ใช่ยอดงวดแรก) 
                เพื่อให้บัญชีติดตามยอดค้างชำระได้ถูกต้อง
              </p>
            </div>
          )}
        </div>

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
              {isMultiPayment ? "ยอดรวมทั้งหมด *" : "ยอดเงิน"}
            </Label>
            {isMultiPayment && (
              <span className="text-xs text-amber-600 font-medium">
                ยอดคำสั่งซื้อทั้งหมด
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">฿</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              className={cn(
                "pl-8",
                isMultiPayment && "border-amber-300 focus:border-amber-500 focus:ring-amber-500"
              )}
              placeholder={isMultiPayment ? "กรอกยอดรวมทั้งหมด" : "0.00"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required={isMultiPayment}
            />
          </div>
          {isMultiPayment && !amount && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              * กรุณากรอกยอดรวมที่ต้องจ่ายทั้งหมด
            </p>
          )}
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

        {/* Payer Selector (who pays) - only for EXPENSE */}
        {boxType === "EXPENSE" && onPayersChange && (
          <div className="pt-4 border-t">
            <PayerSelector
              totalAmount={parseFloat(amount) || 0}
              payers={payers as Payer[]}
              onPayersChange={onPayersChange}
              members={members}
            />
          </div>
        )}
      </div>
    </div>
  );
}
