import { cn } from "@/lib/utils";
import type { BoxStatus } from "@/types";

interface StatusBadgeProps {
  status: BoxStatus | string;
  size?: "sm" | "md";
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // New 4-status system
  DRAFT: { 
    label: "ร่าง", 
    className: "bg-slate-100 text-slate-700 border-slate-200" 
  },
  PENDING: { 
    label: "รอตรวจ", 
    className: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" 
  },
  NEED_DOCS: { 
    label: "ขาดเอกสาร", 
    className: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" 
  },
  COMPLETED: { 
    label: "เสร็จสิ้น", 
    className: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" 
  },
};

export function StatusBadge({ status, size = "sm", className }: StatusBadgeProps) {
  const config = statusConfig[status] || { 
    label: status, 
    className: "bg-muted text-foreground border" 
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

export function getStatusLabel(status: string): string {
  return statusConfig[status]?.label || status;
}

export function getStatusClassName(status: string): string {
  return statusConfig[status]?.className || "bg-muted text-foreground border";
}
