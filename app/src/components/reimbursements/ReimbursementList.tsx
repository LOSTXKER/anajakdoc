"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Building2,
  ExternalLink,
  Loader2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

import {
  markAsReimbursed,
  revertReimbursement,
  type ReimbursementItem,
} from "@/server/actions/reimbursement";

// ==================== Types ====================

interface ReimbursementListProps {
  items: ReimbursementItem[];
  showCompleted?: boolean;
}

// ==================== Component ====================

export function ReimbursementList({ items, showCompleted = false }: ReimbursementListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [note, setNote] = useState("");

  const pendingItems = items.filter((i) => i.reimbursementStatus === "PENDING");
  const completedItems = items.filter((i) => i.reimbursementStatus === "REIMBURSED");
  const displayItems = showCompleted ? completedItems : pendingItems;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(pendingItems.map((i) => i.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleReimburse = () => {
    if (selectedIds.size === 0) return;

    startTransition(async () => {
      const result = await markAsReimbursed(Array.from(selectedIds), note || undefined);
      if (result.success) {
        toast.success(result.message);
        setSelectedIds(new Set());
        setNote("");
        setDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleRevert = (id: string) => {
    startTransition(async () => {
      const result = await revertReimbursement(id);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatMoney = (amount: number) => {
    return amount.toLocaleString("th-TH", { minimumFractionDigits: 2 });
  };

  const getMemberName = (item: ReimbursementItem) => {
    if (!item.member) return "ไม่ระบุ";
    return item.member.visibleName || item.member.user.name || item.member.user.email;
  };

  if (displayItems.length === 0) {
    return (
      <EmptyState
        icon={showCompleted ? CheckCircle2 : Clock}
        title={showCompleted ? "ยังไม่มีรายการที่คืนแล้ว" : "ไม่มีรายการรอคืนเงิน"}
        description={
          showCompleted
            ? "รายการที่คืนเงินแล้วจะแสดงที่นี่"
            : "เมื่อมีสมาชิกสำรองจ่าย รายการจะแสดงที่นี่"
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Batch action bar (only for pending) */}
      {!showCompleted && selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-sm">
            เลือก <strong>{selectedIds.size}</strong> รายการ
          </span>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            คืนเงินที่เลือก
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {!showCompleted && (
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      pendingItems.length > 0 &&
                      selectedIds.size === pendingItems.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead>เลขกล่อง</TableHead>
              <TableHead>สมาชิก</TableHead>
              <TableHead>ธนาคาร</TableHead>
              <TableHead className="text-right">ยอดเงิน</TableHead>
              <TableHead>วันที่</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayItems.map((item) => (
              <TableRow key={item.id} className="group">
                {!showCompleted && (
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={(checked) =>
                        handleSelectOne(item.id, checked as boolean)
                      }
                    />
                  </TableCell>
                )}
                <TableCell>
                  <Link
                    href={`/documents/${item.box.id}`}
                    className="flex items-center gap-1.5 text-primary hover:underline"
                  >
                    {item.box.boxNumber}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                  {item.box.title && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.box.title}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <span className="font-medium">{getMemberName(item)}</span>
                </TableCell>
                <TableCell>
                  {item.member?.bankName ? (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{item.member.bankName}</span>
                      {item.member.bankAccount && (
                        <span className="text-muted-foreground">
                          ({item.member.bankAccount})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  ฿{formatMoney(item.amount)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(showCompleted && item.reimbursedAt ? item.reimbursedAt : item.createdAt)}
                </TableCell>
                <TableCell>
                  {showCompleted ? (
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        คืนแล้ว
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        onClick={() => handleRevert(item.id)}
                        disabled={isPending}
                        title="ยกเลิกการคืนเงิน"
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={() => {
                        setSelectedIds(new Set([item.id]));
                        setDialogOpen(true);
                      }}
                      disabled={isPending}
                    >
                      คืนเงิน
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Reimburse Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการคืนเงิน</DialogTitle>
            <DialogDescription>
              คืนเงิน {selectedIds.size} รายการ รวม ฿
              {formatMoney(
                items
                  .filter((i) => selectedIds.has(i.id))
                  .reduce((sum, i) => sum + i.amount, 0)
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Show selected items */}
            <div className="max-h-40 overflow-y-auto space-y-2">
              {items
                .filter((i) => selectedIds.has(i.id))
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm"
                  >
                    <div>
                      <span className="font-medium">{item.box.boxNumber}</span>
                      <span className="mx-2 text-muted-foreground">•</span>
                      <span>{getMemberName(item)}</span>
                    </div>
                    <span className="font-medium">฿{formatMoney(item.amount)}</span>
                  </div>
                ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">หมายเหตุ (ไม่บังคับ)</Label>
              <Textarea
                id="note"
                placeholder="เช่น เลขที่อ้างอิงการโอน, วันที่โอน..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
            </div>
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
