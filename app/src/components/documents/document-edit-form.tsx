"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateDocument } from "@/server/actions/document";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type { DocumentWithRelations } from "@/types";
import type { Category, CostCenter, Contact, DocType, TransactionType, PaymentMethod } from ".prisma/client";

interface DocumentEditFormProps {
  document: DocumentWithRelations;
  categories: Category[];
  costCenters: CostCenter[];
  contacts: Contact[];
}

const docTypeOptions = [
  { value: "SLIP", label: "สลิปโอนเงิน" },
  { value: "RECEIPT", label: "ใบเสร็จ" },
  { value: "TAX_INVOICE", label: "ใบกำกับภาษี" },
  { value: "INVOICE", label: "ใบแจ้งหนี้" },
  { value: "QUOTATION", label: "ใบเสนอราคา" },
  { value: "PURCHASE_ORDER", label: "ใบสั่งซื้อ" },
  { value: "DELIVERY_NOTE", label: "ใบส่งของ" },
  { value: "OTHER", label: "อื่นๆ" },
];

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
  const [docType, setDocType] = useState<DocType>(document.docType);
  const [transactionType, setTransactionType] = useState<TransactionType>(document.transactionType);
  
  const filteredCategories = categories.filter(
    (c) => c.categoryType === (transactionType === "EXPENSE" ? "EXPENSE" : "INCOME")
  );

  const filteredContacts = contacts.filter((c) => {
    if (transactionType === "EXPENSE") {
      return c.contactRole === "VENDOR" || c.contactRole === "BOTH";
    }
    return c.contactRole === "CUSTOMER" || c.contactRole === "BOTH";
  });

  const handleSubmit = async (formData: FormData) => {
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

      <form action={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>แก้ไขเอกสาร</CardTitle>
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
                <Label>ประเภทเอกสาร *</Label>
                <Select
                  name="docType"
                  value={docType}
                  onValueChange={(v) => setDocType(v as DocType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {docTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Doc Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="docNumber">เลขที่เอกสาร *</Label>
                <Input
                  id="docNumber"
                  name="docNumber"
                  defaultValue={document.docNumber}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="docDate">วันที่เอกสาร *</Label>
                <Input
                  id="docDate"
                  name="docDate"
                  type="date"
                  defaultValue={new Date(document.docDate).toISOString().split("T")[0]}
                  required
                />
              </div>
            </div>

            {/* Contact & Category */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  {transactionType === "EXPENSE" ? "ผู้ขาย/คู่ค้า" : "ลูกค้า"}
                </Label>
                <Select name="contactId" defaultValue={document.contactId || ""}>
                  <SelectTrigger>
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

            {/* Amount */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subtotal">ยอดก่อน VAT</Label>
                <Input
                  id="subtotal"
                  name="subtotal"
                  type="number"
                  step="0.01"
                  defaultValue={document.subtotal?.toString() || ""}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vatAmount">VAT</Label>
                <Input
                  id="vatAmount"
                  name="vatAmount"
                  type="number"
                  step="0.01"
                  defaultValue={document.vatAmount?.toString() || ""}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalAmount">ยอดรวมสุทธิ *</Label>
                <Input
                  id="totalAmount"
                  name="totalAmount"
                  type="number"
                  step="0.01"
                  defaultValue={document.totalAmount.toString()}
                  required
                />
              </div>
            </div>

            {/* WHT */}
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

              <div className="space-y-2">
                <Label htmlFor="whtAmount">จำนวน WHT</Label>
                <Input
                  id="whtAmount"
                  name="whtAmount"
                  type="number"
                  step="0.01"
                  defaultValue={document.whtAmount?.toString() || ""}
                  placeholder="0.00"
                />
              </div>
            </div>

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

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">รายละเอียด</Label>
              <Textarea
                id="description"
                name="description"
                rows={2}
                defaultValue={document.description || ""}
                placeholder="รายละเอียดสินค้า/บริการ"
              />
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

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
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
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
