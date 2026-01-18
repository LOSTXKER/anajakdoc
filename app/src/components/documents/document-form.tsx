"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDocument, updateDocument } from "@/server/actions/document";
import { quickCreateContact } from "@/server/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Package,
  FileText,
  Calendar,
  DollarSign,
  Building2,
  FolderOpen,
  Users,
  Loader2,
  Save,
  Send,
  ArrowLeft,
  Receipt,
  CreditCard,
  FileCheck,
  Plus,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import type { Category, CostCenter, Contact, Document, DocType } from ".prisma/client";
import Link from "next/link";

interface DocumentFormProps {
  transactionType: "EXPENSE" | "INCOME";
  categories: Category[];
  costCenters: CostCenter[];
  contacts: Contact[];
  document?: Document;
}

const docTypeOptions = {
  EXPENSE: [
    { value: "SLIP", label: "สลิปโอนเงิน", icon: CreditCard },
    { value: "RECEIPT", label: "ใบเสร็จรับเงิน", icon: Receipt },
    { value: "TAX_INVOICE", label: "ใบกำกับภาษี", icon: FileCheck },
    { value: "INVOICE", label: "ใบแจ้งหนี้", icon: FileText },
    { value: "OTHER", label: "อื่นๆ", icon: FileText },
  ],
  INCOME: [
    { value: "INVOICE", label: "ใบแจ้งหนี้", icon: FileText },
    { value: "TAX_INVOICE", label: "ใบกำกับภาษี", icon: FileCheck },
    { value: "RECEIPT", label: "ใบเสร็จรับเงิน", icon: Receipt },
    { value: "QUOTATION", label: "ใบเสนอราคา", icon: FileText },
    { value: "OTHER", label: "อื่นๆ", icon: FileText },
  ],
};

const paymentMethods = [
  { value: "TRANSFER", label: "โอนเงิน" },
  { value: "CASH", label: "เงินสด" },
  { value: "CREDIT_CARD", label: "บัตรเครดิต" },
  { value: "CHEQUE", label: "เช็ค" },
  { value: "OTHER", label: "อื่นๆ" },
];

export function DocumentForm({
  transactionType,
  categories,
  costCenters,
  contacts: initialContacts,
  document,
}: DocumentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [docType, setDocType] = useState<DocType>(document?.docType || "RECEIPT");
  const [hasWht, setHasWht] = useState(document?.hasWht || false);
  const [hasValidVat, setHasValidVat] = useState(document?.hasValidVat || false);

  // Contact state
  const [contacts, setContacts] = useState<Array<{ id: string; name: string }>>(initialContacts);
  const [selectedContactId, setSelectedContactId] = useState(document?.contactId || "");
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [isCreatingContact, setIsCreatingContact] = useState(false);

  // Calculate totals
  const [subtotal, setSubtotal] = useState(document?.subtotal?.toString() || "");
  const [vatAmount, setVatAmount] = useState(document?.vatAmount?.toString() || "0");
  const [whtAmount, setWhtAmount] = useState(document?.whtAmount?.toString() || "0");

  // Quick create contact handler
  async function handleQuickCreateContact() {
    if (!newContactName.trim()) {
      toast.error("กรุณากรอกชื่อผู้ติดต่อ");
      return;
    }

    setIsCreatingContact(true);
    try {
      const role = transactionType === "EXPENSE" ? "VENDOR" : "CUSTOMER";
      const result = await quickCreateContact(newContactName, role);
      
      if (result.success && result.data) {
        // Add to local contacts list
        setContacts(prev => [...prev, result.data!]);
        // Select the new contact
        setSelectedContactId(result.data.id);
        // Close dialog and reset
        setShowAddContact(false);
        setNewContactName("");
        toast.success(`เพิ่ม "${result.data.name}" เรียบร้อย`);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการสร้างผู้ติดต่อ");
    } finally {
      setIsCreatingContact(false);
    }
  }

  const calculateTotal = () => {
    const sub = parseFloat(subtotal) || 0;
    const vat = parseFloat(vatAmount) || 0;
    const wht = parseFloat(whtAmount) || 0;
    return (sub + vat - wht).toFixed(2);
  };

  async function handleSubmit(formData: FormData) {
    setError(null);
    
    // Add calculated total
    formData.set("totalAmount", calculateTotal());
    formData.set("transactionType", transactionType);
    formData.set("hasWht", hasWht.toString());
    formData.set("hasValidVat", hasValidVat.toString());

    startTransition(async () => {
      const result = document
        ? await updateDocument(document.id, formData)
        : await createDocument(formData);

      if (!result.success) {
        setError(result.error || "เกิดข้อผิดพลาด");
        toast.error(result.error || "เกิดข้อผิดพลาด");
      } else {
        toast.success(document ? "อัปเดตเอกสารเรียบร้อย" : "สร้างเอกสารเรียบร้อย");
        const data = result.data as { id: string } | undefined;
        if (!document && data?.id) {
          router.push(`/documents/${data.id}`);
        }
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/documents">
          <ArrowLeft className="mr-2 h-4 w-4" />
          กลับ
        </Link>
      </Button>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Document Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            ประเภทเอกสาร
          </CardTitle>
          <CardDescription>เลือกประเภทเอกสารที่ต้องการบันทึก</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {docTypeOptions[transactionType].map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDocType(option.value as DocType)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                    docType === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Icon className={`h-6 w-6 ${docType === option.value ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-medium ${docType === option.value ? "text-primary" : ""}`}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
          <input type="hidden" name="docType" value={docType} />
        </CardContent>
      </Card>

      {/* Step 2: Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            รายละเอียดเอกสาร
          </CardTitle>
          <CardDescription>กรอกข้อมูลเอกสาร</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date & Reference */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="docDate">วันที่เอกสาร *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="docDate"
                  name="docDate"
                  type="date"
                  className="pl-10"
                  defaultValue={document?.docDate?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="externalRef">เลขที่เอกสาร (ถ้ามี)</Label>
              <Input
                id="externalRef"
                name="externalRef"
                placeholder="เช่น INV-2024-001"
                defaultValue={document?.externalRef || ""}
              />
            </div>
          </div>

          <Separator />

          {/* Category & Cost Center */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoryId">หมวดหมู่ *</Label>
              <Select name="categoryId" defaultValue={document?.categoryId || ""}>
                <SelectTrigger>
                  <FolderOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="costCenterId">ศูนย์ต้นทุน</Label>
              <Select name="costCenterId" defaultValue={document?.costCenterId || ""}>
                <SelectTrigger>
                  <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="เลือกศูนย์ต้นทุน" />
                </SelectTrigger>
                <SelectContent>
                  {costCenters.map((cc) => (
                    <SelectItem key={cc.id} value={cc.id}>
                      {cc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <Label htmlFor="contactId">
              {transactionType === "EXPENSE" ? "ผู้ขาย/ร้านค้า" : "ลูกค้า"}
            </Label>
            <div className="flex gap-2">
              <Select 
                name="contactId" 
                value={selectedContactId}
                onValueChange={setSelectedContactId}
              >
                <SelectTrigger className="flex-1">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder={transactionType === "EXPENSE" ? "เลือกผู้ขาย" : "เลือกลูกค้า"} />
                </SelectTrigger>
                <SelectContent>
                  {contacts.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      ยังไม่มีผู้ติดต่อ
                    </div>
                  ) : (
                    contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="icon" title="เพิ่มผู้ติดต่อใหม่">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      เพิ่ม{transactionType === "EXPENSE" ? "ผู้ขาย/ร้านค้า" : "ลูกค้า"}ใหม่
                    </DialogTitle>
                    <DialogDescription>
                      เพิ่มผู้ติดต่อแบบด่วน สามารถแก้ไขรายละเอียดเพิ่มเติมได้ภายหลังในหน้าตั้งค่า
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="newContactName">ชื่อ{transactionType === "EXPENSE" ? "ผู้ขาย/ร้านค้า" : "ลูกค้า"} *</Label>
                      <Input
                        id="newContactName"
                        placeholder={transactionType === "EXPENSE" ? "เช่น บริษัท ABC จำกัด" : "เช่น คุณสมชาย"}
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleQuickCreateContact();
                          }
                        }}
                        autoFocus
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddContact(false);
                        setNewContactName("");
                      }}
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      type="button"
                      onClick={handleQuickCreateContact}
                      disabled={isCreatingContact || !newContactName.trim()}
                    >
                      {isCreatingContact ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          กำลังสร้าง...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          เพิ่มผู้ติดต่อ
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {contacts.length === 0 && (
              <p className="text-xs text-muted-foreground">
                ยังไม่มีผู้ติดต่อ กดปุ่ม <UserPlus className="inline h-3 w-3" /> เพื่อเพิ่มผู้ติดต่อใหม่
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">รายละเอียด</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="รายละเอียดเพิ่มเติม..."
              rows={3}
              defaultValue={document?.description || ""}
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Amount */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            ยอดเงิน
          </CardTitle>
          <CardDescription>กรอกยอดเงินและภาษี</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount inputs */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subtotal">ยอดก่อน VAT *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">฿</span>
                <Input
                  id="subtotal"
                  name="subtotal"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-8"
                  placeholder="0.00"
                  value={subtotal}
                  onChange={(e) => setSubtotal(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vatAmount">VAT</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">฿</span>
                <Input
                  id="vatAmount"
                  name="vatAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-8"
                  placeholder="0.00"
                  value={vatAmount}
                  onChange={(e) => setVatAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="whtAmount">หัก ณ ที่จ่าย</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">฿</span>
                <Input
                  id="whtAmount"
                  name="whtAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-8"
                  placeholder="0.00"
                  value={whtAmount}
                  onChange={(e) => setWhtAmount(e.target.value)}
                  disabled={!hasWht}
                />
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
            <span className="font-medium">ยอดรวมสุทธิ</span>
            <span className="text-2xl font-bold text-primary">
              ฿{parseFloat(calculateTotal()).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <Separator />

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>มีใบกำกับภาษีที่ถูกต้อง</Label>
                <p className="text-sm text-muted-foreground">สามารถนำไปหัก VAT ได้</p>
              </div>
              <Switch
                checked={hasValidVat}
                onCheckedChange={setHasValidVat}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>มีหัก ณ ที่จ่าย</Label>
                <p className="text-sm text-muted-foreground">ต้องออกหนังสือรับรองหัก ณ ที่จ่าย</p>
              </div>
              <Switch
                checked={hasWht}
                onCheckedChange={setHasWht}
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">วิธีชำระเงิน</Label>
            <Select name="paymentMethod" defaultValue={document?.paymentMethod || "TRANSFER"}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกวิธีชำระ" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">หมายเหตุ</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="หมายเหตุเพิ่มเติม..."
              rows={2}
              defaultValue={document?.notes || ""}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" asChild>
          <Link href="/documents">ยกเลิก</Link>
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              บันทึกแบบร่าง
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
