import Link from "next/link";
import { 
  Send, 
  Eye, 
  FileQuestion, 
  CheckCircle2, 
  Percent, 
  AlertTriangle 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountantStats {
  inbox: number;
  inReview: number;
  needMoreDocs: number;
  readyToBook: number;
  whtPending: number;
  overdueTasks: number;
}

interface AccountantStatsProps {
  stats: AccountantStats;
}

export function AccountantStats({ stats }: AccountantStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      <Link 
        href="/documents?status=SUBMITTED"
        className="rounded-xl border border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950 p-4 hover:border-sky-300 dark:hover:border-sky-700 transition-colors"
      >
        <div className="flex items-center gap-2 mb-2">
          <Send className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <span className="text-sm text-sky-700 dark:text-sky-300">Inbox</span>
        </div>
        <p className="text-3xl font-bold text-sky-700 dark:text-sky-300">{stats.inbox}</p>
      </Link>

      <Link 
        href="/documents?status=IN_REVIEW"
        className="rounded-xl border border-border bg-card p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
      >
        <div className="flex items-center gap-2 mb-2">
          <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-muted-foreground">กำลังตรวจ</span>
        </div>
        <p className="text-3xl font-bold text-foreground">{stats.inReview}</p>
      </Link>

      <Link 
        href="/documents?status=NEED_MORE_DOCS"
        className={cn(
          "rounded-xl border p-4 transition-colors",
          stats.needMoreDocs > 0 
            ? "border-amber-200 bg-amber-50 hover:border-amber-300 dark:border-amber-900 dark:bg-amber-950 dark:hover:border-amber-700" 
            : "border-border bg-card hover:border-muted-foreground"
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <FileQuestion className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm text-amber-700 dark:text-amber-300">ขอเอกสาร</span>
        </div>
        <p className={cn(
          "text-3xl font-bold",
          stats.needMoreDocs > 0 ? "text-amber-700 dark:text-amber-300" : "text-foreground"
        )}>
          {stats.needMoreDocs}
        </p>
      </Link>

      <Link 
        href="/documents?status=READY_TO_BOOK"
        className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950 p-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
      >
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm text-emerald-700 dark:text-emerald-300">พร้อมลง</span>
        </div>
        <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{stats.readyToBook}</p>
      </Link>

      <Link 
        href="/documents?status=WHT_PENDING"
        className={cn(
          "rounded-xl border p-4 transition-colors",
          stats.whtPending > 0 
            ? "border-orange-200 bg-orange-50 hover:border-orange-300 dark:border-orange-900 dark:bg-orange-950 dark:hover:border-orange-700" 
            : "border-border bg-card hover:border-muted-foreground"
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <Percent className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <span className="text-sm text-orange-700 dark:text-orange-300">รอ WHT</span>
        </div>
        <p className={cn(
          "text-3xl font-bold",
          stats.whtPending > 0 ? "text-orange-700 dark:text-orange-300" : "text-foreground"
        )}>
          {stats.whtPending}
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
