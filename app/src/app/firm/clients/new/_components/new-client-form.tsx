"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface NewClientFormProps {
  firmId: string;
}

export function NewClientForm({ firmId }: NewClientFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      firmId,
      name: formData.get("name") as string,
      taxId: formData.get("taxId") as string,
      address: formData.get("address") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
    };

    try {
      const res = await fetch("/api/firm/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.success) {
        toast.success("สร้าง Client สำเร็จ");
        router.push("/firm/clients");
        router.refresh();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Business Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          ชื่อธุรกิจ <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="บริษัท ตัวอย่าง จำกัด"
          required
        />
      </div>

      {/* Tax ID */}
      <div className="space-y-2">
        <Label htmlFor="taxId">เลขประจำตัวผู้เสียภาษี</Label>
        <Input
          id="taxId"
          name="taxId"
          placeholder="0123456789012"
          maxLength={13}
        />
        <p className="text-xs text-muted-foreground">
          เลข 13 หลัก (ไม่บังคับ)
        </p>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">ที่อยู่</Label>
        <Textarea
          id="address"
          name="address"
          placeholder="123/45 ถ.ตัวอย่าง แขวงตัวอย่าง เขตตัวอย่าง กรุงเทพฯ 10110"
          rows={3}
        />
      </div>

      {/* Phone & Email */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="02-xxx-xxxx"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">อีเมล</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="contact@example.com"
          />
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-lg bg-violet-50 dark:bg-violet-900/20 p-4 text-sm">
        <p className="font-medium text-violet-700 dark:text-violet-300 mb-1">
          สิ่งที่จะเกิดขึ้น:
        </p>
        <ul className="list-disc list-inside text-violet-600 dark:text-violet-400 space-y-1">
          <li>ระบบจะสร้างธุรกิจใหม่และเชื่อมกับสำนักบัญชีของคุณ</li>
          <li>คุณสามารถกำหนดนักบัญชีที่รับผิดชอบได้ภายหลัง</li>
          <li>ลูกค้าสามารถเข้าระบบและอัปโหลดเอกสารเองได้</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          ยกเลิก
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-violet-600 hover:bg-violet-700">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          สร้าง Client
        </Button>
      </div>
    </form>
  );
}
