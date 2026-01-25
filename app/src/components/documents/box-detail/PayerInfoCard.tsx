"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Wallet,
  User,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { markAsReimbursed } from "@/server/actions/reimbursement";

// ==================== Types ====================

interface PayerInfo {
  id: string;
  payerType: "COMPANY" | "PETTY_CASH" | "MEMBER";
  amount: number;
  reimbursementStatus: "NONE" | "PENDING" | "REIMBURSED";
  reimbursedAt: string | null;
  member: {
    id: string;
    visibleName: string | null;
    bankName: string | null;
    bankAccount: string | null;
    user: {
      name: string | null;
      email: string;
    };
  } | null;
}

interface PayerInfoCardProps {
  payers: PayerInfo[];
  canEdit?: boolean;
}

// ==================== Config ====================

const PAYER_TYPE_CONFIG = {
  COMPANY: {
    label: "บัญชีบริษัท",
    icon: Building2,
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  PETTY_CASH: {
    label: "เงินสดย่อย",
    icon: Wallet,
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  MEMBER: {
    label: "สมาชิก",
    icon: User,
    className: "bg-violet-50 text-violet-700 border-violet-200",
  },
};

const REIMBURSEMENT_STATUS_CONFIG = {
  NONE: {
    label: "ไม่ต้องคืน",
    icon: CheckCircle2,
    className: "bg-slate-100 text-slate-600",
  },
  PENDING: {
    label: "รอคืนเงิน",
    icon: Clock,
    className: "bg-amber-100 text-amber-700",
  },
  REIMBURSED: {
    label: "คืนแล้ว",
    icon: CheckCircle2,
    className: "bg-emerald-100 text-emerald-700",
  },
};

// ==================== Component ====================

export function PayerInfoCard({ payers, canEdit = false }: PayerInfoCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPayer, setSelectedPayer] = useState<PayerInfo | null>(null);
  const [note, setNote] = useState("");

  const formatMoney = (amount: number) => {
    return amount.toLocaleString("th-TH", { minimumFractionDigits: 2 });
  };

  const getMemberName = (payer: PayerInfo) => {
    if (!payer.member) return "ไม่ระบุ";
    return payer.member.visibleName || payer.member.user.name || payer.member.user.email;
  };

  const handleReimburse = () => {
    if (!selectedPayer) return;

    startTransition(async () => {
      const result = await markAsReimbursed([selectedPayer.id], note || undefined);
      if (result.success) {
        toast.success(result.message);
        setDialogOpen(false);
        setSelectedPayer(null);
        setNote("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const pendingCount = payers.filter(
    (p) => p.payerType === "MEMBER" && p.reimbursementStatus === "PENDING"
  ).length;

  if (payers.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border bg-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          ผู้จ่ายเงิน
          {pendingCount > 0 && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
              รอคืน {pendingCount}
            </Badge>
          )}
        </h3>
        {pendingCount > 0 && (
          <Link href="/reimbursements" className="text-xs text-primary hover:underline flex items-center gap-1">
            ดูทั้งหมด
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Payers List */}
      <div className="space-y-3">
        {payers.map((payer) => {
          const typeConfig = PAYER_TYPE_CONFIG[payer.payerType];
          const Icon = typeConfig.icon;
          const statusConfig = REIMBURSEMENT_STATUS_CONFIG[payer.reimbursementStatus];
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={payer.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", typeConfig.className)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {payer.payerType === "MEMBER" ? getMemberName(payer) : typeConfig.label}
                    </span>
                    {payer.payerType === "MEMBER" && (
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", statusConfig.className)}>
                        <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                        {statusConfig.label}
                      </Badge>
                    )}
                  </div>
                  {payer.payerType === "MEMBER" && payer.member?.bankName && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {payer.member.bankName} {payer.member.bankAccount}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-medium">฿{formatMoney(payer.amount)}</span>
                {canEdit &&
                  payer.payerType === "MEMBER" &&
                  payer.reimbursementStatus === "PENDING" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setSelectedPayer(payer);
                        setDialogOpen(true);
                      }}
                    >
                      คืนเงิน
                    </Button>
                  )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reimburse Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการคืนเงิน</DialogTitle>
            <DialogDescription>
              {selectedPayer && (
                <>
                  คืนเงินให้ <strong>{getMemberName(selectedPayer)}</strong> จำนวน{" "}
                  <strong>฿{formatMoney(selectedPayer.amount)}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedPayer?.member?.bankName && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="text-muted-foreground">โอนเข้าบัญชี</p>
              <p className="font-medium">
                {selectedPayer.member.bankName} {selectedPayer.member.bankAccount}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="note">หมายเหตุ (ไม่บังคับ)</Label>
            <Textarea
              id="note"
              placeholder="เช่น เลขที่อ้างอิงการโอน..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleReimburse} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ยืนยันคืนเงิน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
