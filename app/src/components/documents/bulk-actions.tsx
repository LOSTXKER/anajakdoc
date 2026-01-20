"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  XCircle,
  Download,
  MoreHorizontal,
  Loader2,
  FolderOpen,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { bulkApproveBoxes, bulkRejectBoxes, bulkExportBoxes } from "@/server/actions/bulk";
import type { MemberRole } from ".prisma/client";

interface BulkActionsProps {
  selectedIds: string[];
  onClearSelection: () => void;
  userRole: MemberRole;
}

export function BulkActions({ selectedIds, onClearSelection, userRole }: BulkActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState("");

  const canReview = ["ACCOUNTING", "ADMIN", "OWNER"].includes(userRole);

  const handleAction = (action: "approve" | "reject") => {
    setDialogAction(action);
    setDialogOpen(true);
  };

  const confirmAction = () => {
    if (!dialogAction) return;

    startTransition(async () => {
      const result = dialogAction === "approve"
        ? await bulkApproveBoxes(selectedIds, comment || undefined)
        : await bulkRejectBoxes(selectedIds, comment);

      if (result.success) {
        toast.success(
          dialogAction === "approve"
            ? `อนุมัติ ${result.data?.count || selectedIds.length} รายการเรียบร้อย`
            : `ปฏิเสธ ${result.data?.count || selectedIds.length} รายการเรียบร้อย`
        );
        onClearSelection();
        setDialogOpen(false);
        setComment("");
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleExport = () => {
    startTransition(async () => {
      const result = await bulkExportBoxes(selectedIds);
      if (result.success && result.data?.downloadUrl) {
        toast.success(`Export ${selectedIds.length} รายการเรียบร้อย`);
        window.open(result.data.downloadUrl, "_blank");
        onClearSelection();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  if (selectedIds.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-3 px-4 py-3 bg-background border rounded-xl shadow-xl animate-in slide-in-from-bottom-4">
          <span className="text-sm font-medium">
            เลือก {selectedIds.length} รายการ
          </span>
          
          <div className="h-6 w-px bg-border" />

          {canReview && (
            <>
              <Button
                size="sm"
                onClick={() => handleAction("approve")}
                disabled={isPending}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                อนุมัติ
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction("reject")}
                disabled={isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                ปฏิเสธ
              </Button>
            </>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>

          <div className="h-6 w-px bg-border" />

          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
          >
            ยกเลิก
          </Button>
        </div>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === "approve" ? "อนุมัติเอกสาร" : "ปฏิเสธเอกสาร"}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === "approve"
                ? `ยืนยันการอนุมัติ ${selectedIds.length} รายการ`
                : `กรุณาระบุเหตุผลในการปฏิเสธ ${selectedIds.length} รายการ`}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={dialogAction === "approve" ? "ความคิดเห็น (ถ้ามี)..." : "เหตุผลในการปฏิเสธ..."}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={confirmAction}
              disabled={isPending || (dialogAction === "reject" && !comment.trim())}
              variant={dialogAction === "reject" ? "destructive" : "default"}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ยืนยัน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
