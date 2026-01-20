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
  PENDING_REVIEW: { 
    label: "รอตรวจ", 
    className: "bg-sky-100 text-sky-700 border-sky-200" 
  },
  NEED_INFO: { 
    label: "ขอข้อมูลเพิ่ม", 
    className: "bg-amber-100 text-amber-700 border-amber-200" 
  },
  READY_TO_EXPORT: { 
    label: "พร้อม Export", 
    className: "bg-violet-100 text-violet-700 border-violet-200" 
  },
  EXPORTED: { 
    label: "Export แล้ว", 
    className: "bg-purple-100 text-purple-700 border-purple-200" 
  },
  BOOKED: { 
    label: "เสร็จแล้ว", 
    className: "bg-emerald-100 text-emerald-700 border-emerald-200" 
  },
  REJECTED: { 
    label: "ปฏิเสธ", 
    className: "bg-red-100 text-red-700 border-red-200" 
  },
  VOID: { 
    label: "ยกเลิก", 
    className: "bg-red-100 text-red-700 border-red-200" 
  },
};

export function StatusBadge({ status, size = "sm", className }: StatusBadgeProps) {
  const config = statusConfig[status] || { 
    label: status, 
    className: "bg-gray-100 text-gray-700 border-gray-200" 
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
  return statusConfig[status]?.className || "bg-gray-100 text-gray-700 border-gray-200";
}
