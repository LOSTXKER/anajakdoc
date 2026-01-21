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
    className: "bg-blue-100 text-blue-700 border-blue-200" 
  },
  NEED_MORE_DOCS: { 
    label: "ขอเอกสารเพิ่ม", 
    className: "bg-amber-100 text-amber-700 border-amber-200" 
  },
  READY_TO_BOOK: { 
    label: "พร้อมลงบัญชี", 
    className: "bg-emerald-100 text-emerald-700 border-emerald-200" 
  },
  WHT_PENDING: { 
    label: "รอ WHT", 
    className: "bg-orange-100 text-orange-700 border-orange-200" 
  },
  BOOKED: { 
    label: "ลงบัญชีแล้ว", 
    className: "bg-teal-100 text-teal-700 border-teal-200" 
  },
  ARCHIVED: { 
    label: "เก็บแล้ว", 
    className: "bg-gray-100 text-gray-700 border-gray-200" 
  },
  LOCKED: { 
    label: "ล็อค", 
    className: "bg-violet-100 text-violet-700 border-violet-200" 
  },
  CANCELLED: { 
    label: "ยกเลิก", 
    className: "bg-red-100 text-red-700 border-red-200" 
  },
  // Legacy aliases for backward compatibility
  PENDING_REVIEW: { 
    label: "รอตรวจ", 
    className: "bg-sky-100 text-sky-700 border-sky-200" 
  },
  NEED_INFO: { 
    label: "ขอข้อมูลเพิ่ม", 
    className: "bg-amber-100 text-amber-700 border-amber-200" 
  },
  APPROVED: { 
    label: "อนุมัติ", 
    className: "bg-emerald-100 text-emerald-700 border-emerald-200" 
  },
  EXPORTED: { 
    label: "Export แล้ว", 
    className: "bg-purple-100 text-purple-700 border-purple-200" 
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
