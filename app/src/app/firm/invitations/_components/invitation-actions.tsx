"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import { acceptFirmInvitation, rejectFirmInvitation, type FirmInvitationData } from "@/server/actions/firm-relation";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface InvitationActionsProps {
  invitation: FirmInvitationData;
}

export function InvitationActions({ invitation }: InvitationActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAccept = () => {
    startTransition(async () => {
      const result = await acceptFirmInvitation(invitation.id);
      if (result.success) {
        toast.success("ตอบรับคำเชิญสำเร็จ", {
          description: `คุณเริ่มดูแล ${invitation.organizationName} แล้ว`,
        });
        router.refresh();
      } else {
        toast.error("เกิดข้อผิดพลาด", {
          description: result.error,
        });
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const result = await rejectFirmInvitation(invitation.id);
      if (result.success) {
        toast.success("ปฏิเสธคำเชิญแล้ว");
        router.refresh();
      } else {
        toast.error("เกิดข้อผิดพลาด", {
          description: result.error,
        });
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleReject}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <X className="h-4 w-4 mr-1" />
            ปฏิเสธ
          </>
        )}
      </Button>
      <Button
        size="sm"
        onClick={handleAccept}
        disabled={isPending}
        className="bg-violet-600 hover:bg-violet-700"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Check className="h-4 w-4 mr-1" />
            ตอบรับ
          </>
        )}
      </Button>
    </div>
  );
}
