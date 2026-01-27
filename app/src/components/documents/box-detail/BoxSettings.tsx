"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Settings2, Loader2, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateBox } from "@/server/actions/box/update";
import type { ExpenseType, PaymentMode, ReimbursementStatus } from "@/types";
import { WHT_RATE_SIMPLE } from "@/lib/constants";

// Contact with vendor defaults (Section 9)
interface ContactWithDefaults {
  id: string;
  name: string;
  taxId?: string | null;
  contactType?: "COMPANY" | "INDIVIDUAL";
  whtApplicable?: boolean;
  defaultWhtRate?: number | null;
  defaultVatRequired?: boolean;
}

interface BoxSettingsProps {
  boxId: string;
  title?: string | null;
  expenseType: ExpenseType | null;
  hasWht: boolean;
  whtRate?: number | null;
  totalAmount: number;
  contactId?: string | null;
  contacts?: ContactWithDefaults[];
  canEdit: boolean;
  // Reimbursement (Section 19)
  paymentMode?: PaymentMode;
  reimbursementStatus?: ReimbursementStatus | null;
}

const EXPENSE_TYPES = [
  { value: "STANDARD", label: "มีใบกำกับภาษี" },
  { value: "NO_VAT", label: "ไม่มีใบกำกับภาษี" },
];

const PAYMENT_MODES = [
  { value: "COMPANY_PAID", label: "บริษัทจ่าย" },
  { value: "EMPLOYEE_ADVANCE", label: "พนักงานสำรองจ่าย" },
];

const REIMBURSEMENT_STATUSES = [
  { value: "PENDING", label: "รอคืนเงิน" },
  { value: "REIMBURSED", label: "คืนเงินแล้ว" },
];

export function BoxSettings({
  boxId,
  title,
  expenseType,
  hasWht,
  whtRate,
  totalAmount,
  contactId,
  contacts = [],
  canEdit,
  paymentMode = "COMPANY_PAID",
  reimbursementStatus,
}: BoxSettingsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [formTitle, setFormTitle] = useState(title || "");
  const [formExpenseType, setFormExpenseType] = useState<ExpenseType | "">(expenseType || "");
  const [formHasWht, setFormHasWht] = useState(hasWht);
  const [formWhtRate, setFormWhtRate] = useState(whtRate?.toString() || "3");
  const [formTotalAmount, setFormTotalAmount] = useState(totalAmount.toString());
  const [formContactId, setFormContactId] = useState(contactId || "");
  const [appliedDefaults, setAppliedDefaults] = useState(false);
  // Reimbursement state (Section 19)
  const [formPaymentMode, setFormPaymentMode] = useState<PaymentMode>(paymentMode);
  const [formReimbursementStatus, setFormReimbursementStatus] = useState<ReimbursementStatus | "">(
    reimbursementStatus || ""
  );

  // Reset form when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setFormTitle(title || "");
      setFormExpenseType(expenseType || "");
      setFormHasWht(hasWht);
      setFormWhtRate(whtRate?.toString() || "3");
      setFormTotalAmount(totalAmount.toString());
      setFormContactId(contactId || "");
      setAppliedDefaults(false);
      setFormPaymentMode(paymentMode);
      setFormReimbursementStatus(reimbursementStatus || "");
    }
    setOpen(isOpen);
  };

  // Handle contact change and apply vendor defaults (Section 9.1)
  const handleContactChange = useCallback((newContactId: string) => {
    setFormContactId(newContactId);
    setAppliedDefaults(false);
    
    if (newContactId && newContactId !== "__none__") {
      const contact = contacts.find(c => c.id === newContactId);
      if (contact) {
        // Apply vendor defaults if they exist
        let appliedAny = false;
        
        // Apply WHT defaults
        if (contact.whtApplicable !== undefined) {
          setFormHasWht(contact.whtApplicable);
          appliedAny = true;
        }
        if (contact.defaultWhtRate) {
          setFormWhtRate(contact.defaultWhtRate.toString());
          appliedAny = true;
        }
        
        // Apply VAT defaults
        if (contact.defaultVatRequired !== undefined && contact.defaultVatRequired) {
          setFormExpenseType("STANDARD");
          appliedAny = true;
        }
        
        if (appliedAny) {
          setAppliedDefaults(true);
          toast.info(`ใช้ค่าเริ่มต้นจาก "${contact.name}"`, {
            description: "VAT/WHT ถูกตั้งค่าตามประวัติ",
            icon: <Sparkles className="h-4 w-4 text-amber-500" />,
          });
        }
      }
    }
  }, [contacts]);

  const handleSave = () => {
    startTransition(async () => {
      const formData = new FormData();
      if (formTitle) formData.set("title", formTitle);
      if (formExpenseType) formData.set("expenseType", formExpenseType);
      formData.set("hasWht", formHasWht.toString());
      if (formHasWht && formWhtRate) formData.set("whtRate", formWhtRate);
      if (formTotalAmount) formData.set("totalAmount", formTotalAmount);
      if (formContactId && formContactId !== "__none__") formData.set("contactId", formContactId);
      // Reimbursement (Section 19)
      formData.set("paymentMode", formPaymentMode);
      if (formPaymentMode === "EMPLOYEE_ADVANCE" && formReimbursementStatus) {
        formData.set("reimbursementStatus", formReimbursementStatus);
      }

      const result = await updateBox(boxId, formData);
      
      if (result.success) {
        toast.success("บันทึกการตั้งค่าเรียบร้อย");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  if (!canEdit) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline ml-1.5">ตั้งค่า</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ตั้งค่ากล่อง</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">ชื่อรายการ</Label>
            <Input
              id="title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="เช่น ค่าบริการ IT ม.ค."
            />
          </div>

          {/* Total Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">ยอดรวม (บาท)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formTotalAmount}
              onChange={(e) => setFormTotalAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Contact with Smart Guess indicator */}
          {contacts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>ผู้ติดต่อ</Label>
                {appliedDefaults && (
                  <Badge variant="secondary" className="text-xs gap-1 bg-amber-100 text-amber-700 border-amber-200">
                    <Sparkles className="h-3 w-3" />
                    Smart Guess
                  </Badge>
                )}
              </div>
              <Select value={formContactId || "__none__"} onValueChange={handleContactChange}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกผู้ติดต่อ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">ไม่ระบุ</SelectItem>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <span>{c.name}</span>
                        {(c.whtApplicable || c.defaultVatRequired) && (
                          <Sparkles className="h-3 w-3 text-amber-500" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                เลือกผู้ติดต่อเพื่อใช้ค่า VAT/WHT เริ่มต้นอัตโนมัติ
              </p>
            </div>
          )}

          {/* Expense Type */}
          <div className="space-y-2">
            <Label>ประเภทรายจ่าย</Label>
            <Select value={formExpenseType || "__none__"} onValueChange={(v) => setFormExpenseType(v === "__none__" ? "" : v as ExpenseType)}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกประเภท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">ไม่ระบุ</SelectItem>
                {EXPENSE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* WHT Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="wht-toggle" className="text-base">หัก ณ ที่จ่าย (WHT)</Label>
              <p className="text-sm text-muted-foreground">
                ต้องออกหนังสือรับรองหัก ณ ที่จ่าย
              </p>
            </div>
            <Switch
              id="wht-toggle"
              checked={formHasWht}
              onCheckedChange={setFormHasWht}
            />
          </div>

          {/* WHT Rate */}
          {formHasWht && (
            <div className="space-y-2">
              <Label>อัตราหัก ณ ที่จ่าย</Label>
              <Select value={formWhtRate} onValueChange={setFormWhtRate}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกอัตรา" />
                </SelectTrigger>
                <SelectContent>
                  {WHT_RATE_SIMPLE.map((rate) => (
                    <SelectItem key={rate.value} value={rate.value}>{rate.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Payment Mode (Section 19) */}
          <div className="space-y-2">
            <Label>ประเภทการจ่าย</Label>
            <Select value={formPaymentMode} onValueChange={(v) => setFormPaymentMode(v as PaymentMode)}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกประเภท" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_MODES.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reimbursement Status (only if employee advance) */}
          {formPaymentMode === "EMPLOYEE_ADVANCE" && (
            <div className="space-y-2">
              <Label>สถานะคืนเงิน</Label>
              <Select 
                value={formReimbursementStatus || "__none__"} 
                onValueChange={(v) => setFormReimbursementStatus(v === "__none__" ? "" : v as ReimbursementStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">ไม่ระบุ</SelectItem>
                  {REIMBURSEMENT_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            ยกเลิก
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Check className="h-4 w-4 mr-1.5" />
            )}
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
