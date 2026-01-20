"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { toast } from "sonner";
import { createWhtTracking } from "@/server/actions/wht-tracking";
import type { WhtType } from "@/types";

interface Contact {
  id: string;
  name: string;
}

interface WHTTrackingFormProps {
  boxId: string;
  defaultTrackingType?: WhtType;
  contacts: Contact[];
  defaultContactId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const whtRates = [
  { value: "1", label: "1% - ค่าขนส่ง" },
  { value: "2", label: "2% - ค่าโฆษณา" },
  { value: "3", label: "3% - ค่าบริการ/ค่าจ้าง" },
  { value: "5", label: "5% - ค่าเช่า" },
];

export function WHTTrackingForm({
  boxId,
  defaultTrackingType = "OUTGOING",
  contacts,
  defaultContactId,
  open,
  onOpenChange,
  onSuccess,
}: WHTTrackingFormProps) {
  const [isPending, startTransition] = useTransition();
  const [trackingType, setTrackingType] = useState<WhtType>(defaultTrackingType);
  const [whtRate, setWhtRate] = useState("3");
  const [whtAmount, setWhtAmount] = useState("");
  const [contactId, setContactId] = useState(defaultContactId || "");
  const [counterpartyName, setCounterpartyName] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!whtAmount || parseFloat(whtAmount) <= 0) {
      toast.error("กรุณากรอกยอดหัก ณ ที่จ่าย");
      return;
    }

    if (!contactId && !counterpartyName) {
      toast.error("กรุณาเลือกคู่ค้าหรือกรอกชื่อ");
      return;
    }

    startTransition(async () => {
      const result = await createWhtTracking({
        boxId,
        type: trackingType,
        amount: parseFloat(whtAmount),
        rate: parseFloat(whtRate),
        contactId: contactId || undefined,
        notes: notes || undefined,
      });

      if (result.success) {
        toast.success("สร้างรายการ WHT เรียบร้อย");
        // Reset form
        setWhtAmount("");
        setNotes("");
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>เพิ่มการติดตามหัก ณ ที่จ่าย</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tracking Type */}
          <div className="space-y-2">
            <Label>ประเภท</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={trackingType === "OUTGOING" ? "default" : "outline"}
                onClick={() => setTrackingType("OUTGOING")}
                className="justify-start"
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                ต้องส่งออก
              </Button>
              <Button
                type="button"
                variant={trackingType === "INCOMING" ? "default" : "outline"}
                onClick={() => setTrackingType("INCOMING")}
                className="justify-start"
              >
                <ArrowDownLeft className="h-4 w-4 mr-2" />
                รอรับเข้า
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {trackingType === "OUTGOING" 
                ? "หนังสือหัก ณ ที่จ่ายที่เราต้องออกและส่งให้คู่ค้า"
                : "หนังสือหัก ณ ที่จ่ายที่เรารอรับจากลูกค้า"}
            </p>
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <Label>{trackingType === "OUTGOING" ? "คู่ค้า/ผู้รับ" : "ลูกค้า/ผู้ส่ง"}</Label>
            {contacts.length > 0 ? (
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกจากรายชื่อ..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- พิมพ์ชื่อเอง --</SelectItem>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            
            {!contactId && (
              <Input
                value={counterpartyName}
                onChange={(e) => setCounterpartyName(e.target.value)}
                placeholder="พิมพ์ชื่อคู่ค้า/ลูกค้า"
              />
            )}
          </div>

          {/* WHT Rate */}
          <div className="space-y-2">
            <Label>อัตราหัก ณ ที่จ่าย</Label>
            <Select value={whtRate} onValueChange={setWhtRate}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {whtRates.map((rate) => (
                  <SelectItem key={rate.value} value={rate.value}>
                    {rate.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* WHT Amount */}
          <div className="space-y-2">
            <Label>ยอดหัก ณ ที่จ่าย (บาท) *</Label>
            <Input
              type="number"
              step="0.01"
              value={whtAmount}
              onChange={(e) => setWhtAmount(e.target.value)}
              placeholder="0.00"
              required
            />
            <p className="text-xs text-muted-foreground">
              ยอดที่หักแล้ว = ยอดก่อน VAT × {whtRate}%
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>หมายเหตุ</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              สร้างรายการ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
