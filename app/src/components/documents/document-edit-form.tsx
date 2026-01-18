"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateDocument } from "@/server/actions/document";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Loader2,
  Save,
  Package,
  Calendar,
  DollarSign,
  Building2,
  FolderOpen,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type { SerializedDocument } from "@/types";
import type { Category, CostCenter, Contact, TransactionType } from ".prisma/client";

interface DocumentEditFormProps {
  document: SerializedDocument;
  categories: Category[];
  costCenters: CostCenter[];
  contacts: Contact[];
}

const paymentMethodOptions = [
  { value: "CASH", label: "เงินสด" },
  { value: "TRANSFER", label: "โอน" },
  { value: "CREDIT_CARD", label: "บัตรเครดิต" },
  { value: "CHEQUE", label: "เช็ค" },
  { value: "OTHER", label: "อื่นๆ" },
];

export function DocumentEditForm({
  document,
  categories,
  costCenters,
  contacts,
}: DocumentEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Form state
  const [transactionType, setTransactionType] = useState<TransactionType>(document.transactionType);
  const [hasWht, setHasWht] = useState(document.hasWht || false);
  const [hasValidVat, setHasValidVat] = useState(document.hasValidVat || false);
  
  // Amount state
  const [subtotal, setSubtotal] = useState(document.subtotal.toString());
  const [vatAmount, setVatAmount] = useState(document.vatAmount.toString());
  const [whtAmount, setWhtAmount] = useState(document.whtAmount.toString());

  const filteredCategories = categories.filter(
    (c) => c.categoryType === (transactionType === "EXPENSE" ? "EXPENSE" : "INCOME")
  );

  const filteredContacts = contacts.filter((c) => {
    if (transactionType === "EXPENSE") {
      return c.contactRole === "VENDOR" || c.contactRole === "BOTH";
    }
    return c.contactRole === "CUSTOMER" || c.contactRole === "BOTH";
  });

  // Calculate total
  const calculateTotal = useCallback(() => {
    const sub = parseFloat(subtotal) || 0;
    const vat = parseFloat(vatAmount) || 0;
    const wht = parseFloat(whtAmount) || 0;
    return (sub + vat - wht).toFixed(2);
  }, [subtotal, vatAmount, whtAmount]);

  const handleSubmit = async (formData: FormData) => {
    formData.set("totalAmount", calculateTotal());
    formData.set("hasWht", hasWht.toString());
    formData.set("hasValidVat", hasValidVat.toString());

    startTransition(async () => {
      const result = await updateDocument(document.id, formData);
      if (result.success) {
        toast.success("บันทึกเรียบร้อย");
        router.push(`/documents/${document.id}`);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/documents/${document.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับ
          </Link>
        </Button>
      </div>

      <form action={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              แก้ไขกล่องเอกสาร
            </CardTitle>
            <CardDescription>
              แก้ไขข้อมูลพื้นฐานของธุรกรรม
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Transaction Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ประเภทรายการ *</Label>
                <Select
                  name="transactionType"
                  value={transactionType}
                  onValueChange={(v) => setTransactionType(v as TransactionType)}
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
                <Label htmlFor="docNumber">เลขที่กล่อง</Label>
                <Input
                  id="docNumber"
                  value={document.docNumber}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            {/* Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="docDate">วันที่ธุรกรรม *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="docDate"
                    name="docDate"
                    type="date"
                    className="pl-10"
                    defaultValue={document.docDate.split("T")[0]}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">วันครบกำหนด</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    className="pl-10"
                    defaultValue={document.dueDate?.split("T")[0] || ""}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact & Category */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  {transactionType === "EXPENSE" ? "ผู้ขาย/คู่ค้า" : "ลูกค้า"}
                </Label>
                <Select name="contactId" defaultValue={document.contactId || ""}>
                  <SelectTrigger>
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="เลือก..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredContacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>หมวดหมู่</Label>
                <Select name="categoryId" defaultValue={document.categoryId || ""}>
                  <SelectTrigger>
                    <FolderOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="เลือก..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        [{cat.code}] {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cost Center */}
            <div className="space-y-2">
              <Label>ศูนย์ต้นทุน</Label>
              <Select name="costCenterId" defaultValue={document.costCenterId || ""}>
                <SelectTrigger>
                  <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="เลือก..." />
                </SelectTrigger>
                <SelectContent>
                  {costCenters.map((cc) => (
                    <SelectItem key={cc.id} value={cc.id}>
                      [{cc.code}] {cc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">รายละเอียดธุรกรรม</Label>
              <Textarea
                id="description"
                name="description"
                rows={2}
                defaultValue={document.description || ""}
                placeholder="รายละเอียดสินค้า/บริการ"
              />
            </div>
          </CardContent>
        </Card>

        {/* Amount */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              ยอดเงิน
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Amount inputs */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subtotal">ยอดก่อน VAT *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">฿</span>
                  <Input
                    id="subtotal"
                    name="subtotal"
                    type="number"
                    step="0.01"
                    className="pl-8"
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
                    className="pl-8"
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
                    className="pl-8"
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

            {/* WHT Rate */}
            {hasWht && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="whtRate">อัตรา WHT (%)</Label>
                  <Input
                    id="whtRate"
                    name="whtRate"
                    type="number"
                    step="0.01"
                    defaultValue={document.whtRate?.toString() || ""}
                    placeholder="เช่น 3"
                  />
                </div>
              </div>
            )}

            {/* Payment */}
            <div className="space-y-2">
              <Label>วิธีการชำระ</Label>
              <Select name="paymentMethod" defaultValue={document.paymentMethod || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือก..." />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
                rows={2}
                defaultValue={document.notes || ""}
                placeholder="หมายเหตุเพิ่มเติม"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" asChild>
            <Link href={`/documents/${document.id}`}>ยกเลิก</Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            บันทึก
          </Button>
        </div>
      </form>
    </div>
  );
}
