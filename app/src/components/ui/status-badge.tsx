import { cn } from "@/lib/utils";
import type { BoxStatus } from "@/types";

interface StatusBadgeProps {
  status: BoxStatus | string;
  size?: "sm" | "md";
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT: { 
    label: "ร่าง", 
    className: "bg-slate-100 text-slate-700 border-slate-200" 
  },
  SUBMITTED: { 
    label: "ส่งแล้ว", 
    className: "bg-sky-100 text-sky-700 border-sky-200" 
  },
  IN_REVIEW: { 
    label: "กำลังตรวจ", 
    className: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" 
  },
  NEED_MORE_DOCS: { 
    label: "ขอเอกสารเพิ่ม", 
    className: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" 
  },
  READY_TO_BOOK: { 
    label: "พร้อมลงบัญชี", 
    className: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" 
  },
  WHT_PENDING: { 
    label: "รอ WHT", 
    className: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800" 
  },
  BOOKED: { 
    label: "ลงบัญชีแล้ว", 
    className: "bg-teal-100 text-teal-700 border-teal-200" 
  },
  ARCHIVED: { 
    label: "เก็บแล้ว", 
    className: "bg-muted text-foreground border" 
  },
  LOCKED: { 
    label: "ล็อค", 
    className: "bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800" 
  },
  CANCELLED: { 
    label: "ยกเลิก", 
    className: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800" 
  },
  // Legacy aliases for backward compatibility
  PENDING_REVIEW: { 
    label: "รอตรวจ", 
    className: "bg-sky-100 text-sky-700 border-sky-200" 
  },
  NEED_INFO: { 
    label: "ขอข้อมูลเพิ่ม", 
    className: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" 
  },
  APPROVED: { 
    label: "อนุมัติ", 
    className: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" 
  },
  EXPORTED: { 
    label: "Export แล้ว", 
    className: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800" 
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
