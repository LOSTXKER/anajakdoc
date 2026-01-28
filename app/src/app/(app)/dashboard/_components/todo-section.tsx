"use client";

import Link from "next/link";
import { 
  AlertTriangle, 
  FileQuestion, 
  Clock, 
  CheckCircle2,
  Percent,
  Receipt,
  Copy,
  ListTodo,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TodoSectionProps {
  stats: {
    draft: number;
    pending: number;
    needDocs: number;
    completed: number;
    vatMissing: number;
    whtMissing: number;
    overdueTasks: number;
  };
  ownerStats?: {
    whtOverdueCount: number;
    duplicateCount: number;
  };
}

interface TodoItem {
  id: string;
  icon: React.ElementType;
  label: string;
  count: number;
  href: string;
  priority: "high" | "medium" | "low";
  colorClass: string;
  iconClass: string;
}

export function TodoSection({ stats, ownerStats }: TodoSectionProps) {
  // Build todo items dynamically based on stats
  const todoItems: TodoItem[] = [];

  // High priority items (red/orange)
  if (ownerStats?.whtOverdueCount && ownerStats.whtOverdueCount > 0) {
    todoItems.push({
      id: "wht-overdue",
      icon: AlertTriangle,
      label: "WHT เกินกำหนด",
      count: ownerStats.whtOverdueCount,
      href: "/documents?tab=tracking&filter=wht_overdue",
      priority: "high",
      colorClass: "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
      iconClass: "text-red-500",
    });
  }

  if (stats.overdueTasks > 0) {
    todoItems.push({
      id: "overdue-tasks",
      icon: AlertTriangle,
      label: "งานเลยกำหนด",
      count: stats.overdueTasks,
      href: "/tasks?filter=overdue",
      priority: "high",
      colorClass: "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
      iconClass: "text-red-500",
    });
  }

  if (ownerStats?.duplicateCount && ownerStats.duplicateCount > 0) {
    todoItems.push({
      id: "duplicates",
      icon: Copy,
      label: "อาจซ้ำกัน",
      count: ownerStats.duplicateCount,
      href: "/documents?duplicate=true",
      priority: "high",
      colorClass: "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800",
      iconClass: "text-orange-500",
    });
  }

  // Medium priority items (amber/yellow)
  if (stats.needDocs > 0) {
    todoItems.push({
      id: "need-docs",
      icon: FileQuestion,
      label: "ขาดเอกสาร",
      count: stats.needDocs,
      href: "/documents?tab=tracking",
      priority: "medium",
      colorClass: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800",
      iconClass: "text-amber-500",
    });
  }

  if (stats.vatMissing > 0) {
    todoItems.push({
      id: "vat-missing",
      icon: Receipt,
      label: "ขาด VAT",
      count: stats.vatMissing,
      href: "/documents?tab=tracking&filter=vat_missing",
      priority: "medium",
      colorClass: "text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800",
      iconClass: "text-yellow-500",
    });
  }

  if (stats.whtMissing > 0) {
    todoItems.push({
      id: "wht-missing",
      icon: Percent,
      label: "ขาด WHT",
      count: stats.whtMissing,
      href: "/documents?tab=tracking&filter=wht_missing",
      priority: "medium",
      colorClass: "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800",
      iconClass: "text-orange-500",
    });
  }

  // Low priority items (blue/gray)
  if (stats.pending > 0) {
    todoItems.push({
      id: "pending",
      icon: Clock,
      label: "รอตรวจสอบ",
      count: stats.pending,
      href: "/documents?tab=pending",
      priority: "low",
      colorClass: "text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950 border-sky-200 dark:border-sky-800",
      iconClass: "text-sky-500",
    });
  }

  if (stats.draft > 0) {
    todoItems.push({
      id: "draft",
      icon: ListTodo,
      label: "แบบร่าง",
      count: stats.draft,
      href: "/documents?tab=draft",
      priority: "low",
      colorClass: "text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700",
      iconClass: "text-slate-500",
    });
  }

  // If nothing to do, show completion message
  if (todoItems.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-emerald-100 dark:bg-emerald-900 p-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="font-medium text-emerald-800 dark:text-emerald-200">ทุกอย่างเรียบร้อย!</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">ไม่มีงานค้างที่ต้องทำ</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">สิ่งที่ต้องทำ</h3>
          <Badge variant="secondary" className="ml-auto">
            {todoItems.length}
          </Badge>
        </div>
      </div>
      <div className="divide-y divide-border">
        {todoItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
            )}
          >
            <div className={cn(
              "rounded-lg p-2 border",
              item.colorClass
            )}>
              <item.icon className={cn("h-4 w-4", item.iconClass)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
            </div>
            <Badge 
              variant="secondary" 
              className={cn(
                "shrink-0",
                item.priority === "high" && "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
                item.priority === "medium" && "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
                item.priority === "low" && "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              )}
            >
              {item.count}
            </Badge>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
