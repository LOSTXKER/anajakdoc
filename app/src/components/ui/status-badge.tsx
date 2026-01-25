import { cn } from "@/lib/utils";
import { FileEdit, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import type { BoxStatus } from "@/types";

interface StatusBadgeProps {
  status: BoxStatus | string;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<string, { 
  label: string; 
  className: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = {
  // New 4-status system with distinct colors
  DRAFT: { 
    label: "ร่าง", 
    description: "กำลังร่างเอกสาร ยังไม่ได้ส่ง",
    className: "bg-slate-100 text-slate-700 border-slate-300",
    Icon: FileEdit,
  },
  PENDING: { 
    label: "รอตรวจ", 
    description: "ส่งแล้ว รอบัญชีตรวจสอบ",
    className: "bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700",
    Icon: Clock,
  },
  NEED_DOCS: { 
    label: "ขาดเอกสาร", 
    description: "ต้องเพิ่มเอกสารก่อนดำเนินการ",
    className: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700",
    Icon: AlertCircle,
  },
  COMPLETED: { 
    label: "เสร็จสิ้น", 
    description: "ลงบัญชีเรียบร้อยแล้ว",
    className: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
    Icon: CheckCircle2,
  },
};

export function StatusBadge({ status, size = "sm", showIcon = true, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { 
    label: status, 
    className: "bg-muted text-foreground border",
    description: "",
    Icon: FileEdit,
  };
  
  const { Icon } = config;
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <span
      title={config.description}
      className={cn(
        "inline-flex items-center gap-1 font-medium rounded-full border",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        config.className,
        className
      )}
    >
      {showIcon && <Icon className={iconSize} />}
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
