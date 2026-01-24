"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, XCircle, Loader2 } from "lucide-react";
import { cancelFirmInvitation, terminateFirmRelation, type FirmRelationData } from "@/server/actions/firm-relation";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface FirmRelationActionsProps {
  relation: FirmRelationData;
}

export function FirmRelationActions({ relation }: FirmRelationActionsProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelFirmInvitation(relation.id);
      if (result.success) {
        toast.success("ยกเลิกคำเชิญสำเร็จ");
        router.refresh();
      } else {
        toast.error("เกิดข้อผิดพลาด", {
          description: result.error,
        });
      }
    });
  };

  const handleTerminate = () => {
    startTransition(async () => {
      const result = await terminateFirmRelation(relation.id);
      if (result.success) {
        toast.success("ยกเลิกการดูแลสำเร็จ");
        setShowConfirm(false);
        router.refresh();
      } else {
        toast.error("เกิดข้อผิดพลาด", {
          description: result.error,
        });
      }
    });
  };

  // Don't show actions for terminated relations
  if (relation.status === "TERMINATED") {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {relation.status === "PENDING" ? (
            <DropdownMenuItem
              onClick={handleCancel}
              disabled={isPending}
              className="text-red-600"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              ยกเลิกคำเชิญ
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setShowConfirm(true)}
              className="text-red-600"
            >
              <XCircle className="h-4 w-4 mr-2" />
              ยกเลิกการดูแล
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันยกเลิกการดูแล?</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการยกเลิกให้ {relation.firmName} ดูแลธุรกิจของคุณหรือไม่?
              สำนักบัญชีจะไม่สามารถเข้าถึงข้อมูลของคุณได้อีกต่อไป
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTerminate}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังดำเนินการ...
                </>
              ) : (
                "ยืนยันยกเลิก"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
