import Link from "next/link";
import { 
  Hourglass, 
  Percent, 
  AlertTriangle, 
  Copy, 
  Users 
} from "lucide-react";
import { AGING_BUCKET_CONFIG } from "@/lib/document-config";
import { cn } from "@/lib/utils";

interface OwnerStats {
  pendingBoxes: number;
  pendingAmount: number;
  whtOutstanding: number;
  whtOverdueCount: number;
  duplicateCount: number;
  reimbursementPending: number;
  agingBuckets: {
    "0-3": number;
    "4-7": number;
    "8-14": number;
    "15+": number;
  };
}

interface OwnerStatsProps {
  stats: OwnerStats;
  formatMoney: (amount: number) => string;
}

export function OwnerStats({ stats, formatMoney }: OwnerStatsProps) {
  return (
    <>
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Pending Boxes */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">กล่องค้าง</span>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.pendingBoxes}</p>
          <p className="text-sm text-muted-foreground mt-1">
            ฿{formatMoney(stats.pendingAmount)}
          </p>
        </div>

        {/* WHT Outstanding */}
        <div className={cn(
          "rounded-xl border p-4",
          stats.whtOverdueCount > 0 
            ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950" 
            : "border-border bg-card"
        )}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">WHT ค้าง</span>
            <Percent className={cn(
              "h-4 w-4",
              stats.whtOverdueCount > 0 ? "text-red-500" : "text-muted-foreground"
            )} />
          </div>
          <p className={cn(
            "text-3xl font-bold",
            stats.whtOverdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-foreground"
          )}>
            ฿{formatMoney(stats.whtOutstanding)}
          </p>
          {stats.whtOverdueCount > 0 && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              <AlertTriangle className="inline h-3 w-3 mr-1" />
              {stats.whtOverdueCount} เกินกำหนด
            </p>
          )}
        </div>

        {/* Possible Duplicates */}
        {stats.duplicateCount > 0 && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-amber-700 dark:text-amber-300">อาจซ้ำ</span>
              <Copy className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">{stats.duplicateCount}</p>
            <Link href="/documents?duplicate=true" className="text-sm text-amber-600 dark:text-amber-400 hover:underline mt-1 inline-block">
              ตรวจสอบ →
            </Link>
          </div>
        )}

        {/* Reimbursement Pending */}
        {stats.reimbursementPending > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">รอคืนเงินพนักงาน</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              ฿{formatMoney(stats.reimbursementPending)}
            </p>
          </div>
        )}
      </div>

      {/* Aging Buckets */}
      <AgingBuckets agingBuckets={stats.agingBuckets} />
    </>
  );
}

interface AgingBucketsProps {
  agingBuckets: OwnerStats["agingBuckets"];
}

function AgingBuckets({ agingBuckets }: AgingBucketsProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="font-medium text-foreground mb-3">อายุกล่องค้าง</h3>
      <div className="grid grid-cols-4 gap-2">
        {(Object.entries(agingBuckets) as [keyof typeof AGING_BUCKET_CONFIG, number][]).map(([bucket, count]) => {
          const config = AGING_BUCKET_CONFIG[bucket];
          return (
            <div 
              key={bucket}
              className={cn(
                "rounded-lg p-3 text-center",
                config.className
              )}
            >
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs">{config.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
