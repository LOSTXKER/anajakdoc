"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  FileQuestion,
  BookCheck,
  Archive,
} from "lucide-react";
import { toast } from "sonner";
import { 
  bulkApproveBoxes, 
  bulkRejectBoxes, 
  bulkExportBoxes,
  bulkRequestDocs,
  bulkMarkReady,
  bulkMarkBooked,
} from "@/server/actions/bulk";
import type { MemberRole } from ".prisma/client";

interface BulkActionsProps {
  selectedIds: string[];
  onClearSelection: () => void;
  userRole: MemberRole;
}

export function BulkActions({ selectedIds, onClearSelection, userRole }: BulkActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"approve" | "reject" | "request_docs" | null>(null);
  const [comment, setComment] = useState("");

  const canReview = ["ACCOUNTING", "ADMIN", "OWNER"].includes(userRole);

  const handleAction = (action: "approve" | "reject" | "request_docs") => {
    setDialogAction(action);
    setDialogOpen(true);
  };

  const confirmAction = () => {
    if (!dialogAction) return;

    startTransition(async () => {
      let result;
      
      if (dialogAction === "approve") {
        result = await bulkApproveBoxes(selectedIds, comment || undefined);
      } else if (dialogAction === "reject") {
        result = await bulkRejectBoxes(selectedIds, comment);
      } else if (dialogAction === "request_docs") {
        result = await bulkRequestDocs(selectedIds, comment);
      }

      if (result?.success) {
        const messages = {
          approve: `อนุมัติ ${result.data?.count || selectedIds.length} รายการเรียบร้อย`,
          reject: `ปฏิเสธ ${result.data?.count || selectedIds.length} รายการเรียบร้อย`,
          request_docs: `ส่งขอเอกสาร ${result.data?.count || selectedIds.length} รายการเรียบร้อย`,
        };
        toast.success(messages[dialogAction]);
        onClearSelection();
        setDialogOpen(false);
        setComment("");
        router.refresh();
      } else {
        toast.error(result?.error || "เกิดข้อผิดพลาด");
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

  const handleMarkReady = () => {
    startTransition(async () => {
      const result = await bulkMarkReady(selectedIds);
      if (result.success) {
        toast.success(`ทำเครื่องหมาย ${result.data?.count} รายการเป็น Ready to Book`);
        onClearSelection();
        router.refresh();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleMarkBooked = () => {
    startTransition(async () => {
      const result = await bulkMarkBooked(selectedIds);
      if (result.success) {
        toast.success(`ลงบัญชี ${result.data?.count} รายการเรียบร้อย`);
        onClearSelection();
        router.refresh();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  if (selectedIds.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 px-4 py-3 bg-background border rounded-xl shadow-xl animate-in slide-in-from-bottom-4">
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
                onClick={() => handleAction("request_docs")}
                disabled={isPending}
              >
                <FileQuestion className="mr-2 h-4 w-4" />
                ขอเอกสาร
              </Button>
              
              {/* More Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" disabled={isPending}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleMarkReady}>
                    <BookCheck className="mr-2 h-4 w-4" />
                    ทำเครื่องหมาย Ready
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleMarkBooked}>
                    <Archive className="mr-2 h-4 w-4" />
                    ลงบัญชีแล้ว
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleAction("reject")} className="text-red-600">
                    <XCircle className="mr-2 h-4 w-4" />
                    ปฏิเสธ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
              {dialogAction === "approve" ? "อนุมัติเอกสาร" : 
               dialogAction === "reject" ? "ปฏิเสธเอกสาร" : "ขอเอกสารเพิ่มเติม"}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === "approve"
                ? `ยืนยันการอนุมัติ ${selectedIds.length} รายการ`
                : dialogAction === "reject"
                ? `กรุณาระบุเหตุผลในการปฏิเสธ ${selectedIds.length} รายการ`
                : `ระบุเอกสารที่ต้องการ สำหรับ ${selectedIds.length} รายการ`}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={
              dialogAction === "approve" ? "ความคิดเห็น (ถ้ามี)..." : 
              dialogAction === "reject" ? "เหตุผลในการปฏิเสธ..." :
              "ระบุเอกสารที่ต้องการ เช่น ใบกำกับภาษี, หนังสือรับรองหัก ณ ที่จ่าย..."
            }
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
              disabled={isPending || (dialogAction !== "approve" && !comment.trim())}
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
