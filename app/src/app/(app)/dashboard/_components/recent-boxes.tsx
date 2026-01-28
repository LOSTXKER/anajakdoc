import Link from "next/link";
import { Package, Plus, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getBoxTypeConfig, getBoxStatusConfig } from "@/lib/document-config";
import { cn } from "@/lib/utils";
import type { BoxType, BoxStatus } from "@/types";

interface RecentBox {
  id: string;
  boxNumber: string;
  boxType: BoxType;
  status: BoxStatus;
  totalAmount: { toNumber(): number };
  createdAt: Date;
  contact: { name: string } | null;
}

interface RecentBoxesProps {
  boxes: RecentBox[];
}

export function RecentBoxes({ boxes }: RecentBoxesProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">กล่องล่าสุด</h3>
        <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
          <Link href="/documents">
            ดูทั้งหมด
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>

      {boxes.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={Package}
            title="ยังไม่มีกล่องเอกสาร"
            action={
              <Button size="sm" asChild>
                <Link href="/documents/new">
                  <Plus className="mr-1.5 h-4 w-4" />
                  สร้างกล่องแรก
                </Link>
              </Button>
            }
            className="py-6"
          />
        </div>
      ) : (
        <div className="divide-y divide-border">
          {boxes.map((box) => (
            <BoxItem key={box.id} box={box} />
          ))}
        </div>
      )}
    </div>
  );
}

function BoxItem({ box }: { box: RecentBox }) {
  const config = getBoxTypeConfig(box.boxType);
  const statusConfig = getBoxStatusConfig(box.status);
  const isIncome = box.boxType === "INCOME";

  return (
    <Link
      href={`/documents/${box.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
    >
      <div className={cn(
        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
        isIncome 
          ? "bg-emerald-100 dark:bg-emerald-900" 
          : "bg-rose-100 dark:bg-rose-900"
      )}>
        {isIncome 
          ? <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          : <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground">{box.boxNumber}</span>
          <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", statusConfig.className)}>
            {statusConfig.labelShort}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {box.contact?.name || "-"}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className={cn(
          "text-sm font-semibold",
          isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
        )}>
          {isIncome ? "+" : "-"}฿{box.totalAmount.toNumber().toLocaleString()}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {new Date(box.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
        </p>
      </div>
    </Link>
  );
}
