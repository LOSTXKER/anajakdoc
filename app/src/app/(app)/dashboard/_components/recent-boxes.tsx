import Link from "next/link";
import { Package, Plus, ArrowRight } from "lucide-react";
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
    <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">กล่องล่าสุด</h3>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/documents">
            ดูทั้งหมด
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {boxes.length === 0 ? (
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
          className="py-10"
        />
      ) : (
        <div className="space-y-2">
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

  return (
    <Link
      href={`/documents/${box.id}`}
      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted transition-colors"
    >
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config.bgLight)}>
        <Package className={cn("h-5 w-5", config.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{box.boxNumber}</span>
          <Badge variant="secondary" className={cn("text-xs", statusConfig.className)}>
            {statusConfig.labelShort}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {box.contact?.name || "-"} • ฿{box.totalAmount.toNumber().toLocaleString()}
        </p>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">
        {new Date(box.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
      </span>
    </Link>
  );
}
