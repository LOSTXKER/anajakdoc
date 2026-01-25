import Link from "next/link";
import { 
  FileEdit,
  Clock, 
  FileQuestion, 
  CheckCircle2, 
  Receipt,
  Percent, 
  AlertTriangle 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountantStats {
  draft: number;
  pending: number;
  needDocs: number;
  completed: number;
  vatMissing: number;
  whtMissing: number;
  overdueTasks: number;
}

interface AccountantStatsProps {
  stats: AccountantStats;
}

export function AccountantStats({ stats }: AccountantStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      <Link 
        href="/documents?tab=draft"
        className="rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
      >
        <div className="flex items-center gap-2 mb-2">
          <FileEdit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300">แบบร่าง</span>
        </div>
        <p className="text-3xl font-bold text-gray-700 dark:text-gray-300">{stats.draft}</p>
      </Link>

      <Link 
        href="/documents?tab=pending"
        className="rounded-xl border border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950 p-4 hover:border-sky-300 dark:hover:border-sky-700 transition-colors"
      >
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <span className="text-sm text-sky-700 dark:text-sky-300">รอตรวจ</span>
        </div>
        <p className="text-3xl font-bold text-sky-700 dark:text-sky-300">{stats.pending}</p>
      </Link>

      <Link 
        href="/documents?tab=tracking"
        className={cn(
          "rounded-xl border p-4 transition-colors",
          stats.needDocs > 0 
            ? "border-amber-200 bg-amber-50 hover:border-amber-300 dark:border-amber-900 dark:bg-amber-950 dark:hover:border-amber-700" 
            : "border-border bg-card hover:border-muted-foreground"
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <FileQuestion className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm text-amber-700 dark:text-amber-300">ขาดเอกสาร</span>
        </div>
        <p className={cn(
          "text-3xl font-bold",
          stats.needDocs > 0 ? "text-amber-700 dark:text-amber-300" : "text-foreground"
        )}>
          {stats.needDocs}
        </p>
      </Link>

      <Link 
        href="/documents?tab=done"
        className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950 p-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
      >
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm text-emerald-700 dark:text-emerald-300">เสร็จแล้ว</span>
        </div>
        <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{stats.completed}</p>
      </Link>

      <Link 
        href="/documents?tab=tracking&filter=vat_missing"
        className={cn(
          "rounded-xl border p-4 transition-colors",
          stats.vatMissing > 0 
            ? "border-yellow-200 bg-yellow-50 hover:border-yellow-300 dark:border-yellow-900 dark:bg-yellow-950 dark:hover:border-yellow-700" 
            : "border-border bg-card hover:border-muted-foreground"
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <Receipt className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <span className="text-sm text-yellow-700 dark:text-yellow-300">ขาด VAT</span>
        </div>
        <p className={cn(
          "text-3xl font-bold",
          stats.vatMissing > 0 ? "text-yellow-700 dark:text-yellow-300" : "text-foreground"
        )}>
          {stats.vatMissing}
        </p>
      </Link>

      <Link 
        href="/documents?tab=tracking&filter=wht_missing"
        className={cn(
          "rounded-xl border p-4 transition-colors",
          stats.whtMissing > 0 
            ? "border-orange-200 bg-orange-50 hover:border-orange-300 dark:border-orange-900 dark:bg-orange-950 dark:hover:border-orange-700" 
            : "border-border bg-card hover:border-muted-foreground"
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <Percent className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <span className="text-sm text-orange-700 dark:text-orange-300">ขาด WHT</span>
        </div>
        <p className={cn(
          "text-3xl font-bold",
          stats.whtMissing > 0 ? "text-orange-700 dark:text-orange-300" : "text-foreground"
        )}>
          {stats.whtMissing}
        </p>
      </Link>

      {stats.overdueTasks > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-700 dark:text-red-300">งานเลยกำหนด</span>
          </div>
          <p className="text-3xl font-bold text-red-700 dark:text-red-300">{stats.overdueTasks}</p>
        </div>
      )}
    </div>
  );
}
