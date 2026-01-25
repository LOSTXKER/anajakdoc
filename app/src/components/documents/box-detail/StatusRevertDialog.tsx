"use client";

import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BoxStatus } from "@/types";
import { getStatusLabel } from "@/lib/config/status-transitions";

interface StatusRevertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: BoxStatus;
  targetStatus: BoxStatus;
  onConfirm: (reason: string) => Promise<void>;
  isLoading?: boolean;
}

export function StatusRevertDialog({
  open,
  onOpenChange,
  currentStatus,
  targetStatus,
  onConfirm,
  isLoading = false,
}: StatusRevertDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError("กรุณาระบุเหตุผล");
      return;
    }

    setError(null);
    try {
      await onConfirm(reason.trim());
      setReason("");
      onOpenChange(false);
    } catch (err) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setReason("");
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            ย้อนกลับสถานะ
          </DialogTitle>
          <DialogDescription>
            ย้อนกลับจาก "{getStatusLabel(currentStatus)}" เป็น "{getStatusLabel(targetStatus)}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">
              เหตุผลในการย้อนกลับ <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="ระบุเหตุผล เช่น ต้องแก้ไขข้อมูล, เอกสารไม่ถูกต้อง..."
              rows={3}
              className={error ? "border-destructive" : ""}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-700 dark:text-amber-300">
            การย้อนกลับสถานะจะถูกบันทึกไว้ในประวัติกิจกรรม
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !reason.trim()}
            variant="destructive"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังดำเนินการ...
              </>
            ) : (
              "ยืนยันย้อนกลับ"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
