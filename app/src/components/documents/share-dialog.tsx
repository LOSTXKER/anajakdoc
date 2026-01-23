"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Share2, Loader2, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { createShareLink } from "@/server/actions/share";
import type { ShareScope } from "@prisma/client";

interface ShareDialogProps {
  boxId: string;
  boxNumber: string;
  trigger?: React.ReactNode;
}

export function ShareDialog({ boxId, boxNumber, trigger }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: `แชร์ ${boxNumber}`,
    password: "",
    expiresIn: "168", // 7 days default
    maxViews: "",
    showAmounts: true,
    showContacts: true,
    allowDownload: true,
  });

  const handleCreate = async () => {
    setLoading(true);
    try {
      const result = await createShareLink({
        name: formData.name,
        scope: "BOX" as ShareScope,
        boxId,
        password: formData.password || undefined,
        expiresIn: formData.expiresIn ? parseInt(formData.expiresIn) : undefined,
        maxViews: formData.maxViews ? parseInt(formData.maxViews) : undefined,
        showAmounts: formData.showAmounts,
        showContacts: formData.showContacts,
        allowDownload: formData.allowDownload,
      });

      if (result.success) {
        setShareUrl(result.data.shareUrl);
        toast.success("สร้างลิงก์แชร์สำเร็จ");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("คัดลอกลิงก์แล้ว");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setOpen(false);
    // Reset after animation
    setTimeout(() => {
      setShareUrl(null);
      setCopied(false);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => v ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            แชร์
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>แชร์กล่องเอกสาร</DialogTitle>
          <DialogDescription>
            สร้างลิงก์สำหรับแชร์ {boxNumber} ให้บุคคลภายนอก
          </DialogDescription>
        </DialogHeader>

        {!shareUrl ? (
          <>
            <div className="space-y-4 py-4">
              {/* Name */}
              <div className="space-y-2">
                <Label>ชื่อลิงก์</Label>
                <Input
                  placeholder="เช่น สำหรับสรรพากร"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label>รหัสผ่าน (ถ้าต้องการ)</Label>
                <Input
                  type="password"
                  placeholder="ปล่อยว่างถ้าไม่ต้องการ"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              {/* Expiration */}
              <div className="space-y-2">
                <Label>หมดอายุ</Label>
                <Select
                  value={formData.expiresIn}
                  onValueChange={(v) => setFormData({ ...formData, expiresIn: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">1 วัน</SelectItem>
                    <SelectItem value="72">3 วัน</SelectItem>
                    <SelectItem value="168">7 วัน</SelectItem>
                    <SelectItem value="720">30 วัน</SelectItem>
                    <SelectItem value="">ไม่มีกำหนด</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Max Views */}
              <div className="space-y-2">
                <Label>จำนวนครั้งที่ดูได้</Label>
                <Input
                  type="number"
                  placeholder="ไม่จำกัด"
                  value={formData.maxViews}
                  onChange={(e) => setFormData({ ...formData, maxViews: e.target.value })}
                />
              </div>

              {/* Options */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="showAmounts" className="cursor-pointer">แสดงจำนวนเงิน</Label>
                  <Switch
                    id="showAmounts"
                    checked={formData.showAmounts}
                    onCheckedChange={(v) => setFormData({ ...formData, showAmounts: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="showContacts" className="cursor-pointer">แสดงชื่อคู่ค้า</Label>
                  <Switch
                    id="showContacts"
                    checked={formData.showContacts}
                    onCheckedChange={(v) => setFormData({ ...formData, showContacts: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowDownload" className="cursor-pointer">อนุญาตให้ดาวน์โหลด</Label>
                  <Switch
                    id="allowDownload"
                    checked={formData.allowDownload}
                    onCheckedChange={(v) => setFormData({ ...formData, allowDownload: v })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                ยกเลิก
              </Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                สร้างลิงก์
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="py-4 space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">ลิงก์แชร์</p>
              <div className="flex items-center gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button size="icon" variant="outline" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500 dark:text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                ปิด
              </Button>
              <Button className="flex-1" asChild>
                <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  เปิดลิงก์
                </a>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
