"use client";

import { 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileCheck,
  FileText,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/formatters";

type DocStatusType = "VAT" | "WHT";
type StatusValue = "missing" | "received" | "verified" | "sent";

interface DocStatusCardProps {
  type: DocStatusType;
  status: StatusValue;
  label: string;
  description: string;
  amount?: number;
  rate?: number | null;
}

const STATUS_CONFIG: Record<StatusValue, { 
  icon: typeof CheckCircle2; 
  bgColor: string; 
  iconColor: string;
  borderColor: string;
}> = {
  missing: { 
    icon: Clock, 
    bgColor: "bg-amber-50 dark:bg-amber-950", 
    iconColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  received: { 
    icon: FileCheck, 
    bgColor: "bg-blue-50 dark:bg-blue-950", 
    iconColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  verified: { 
    icon: CheckCircle2, 
    bgColor: "bg-emerald-50 dark:bg-emerald-950", 
    iconColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
  sent: { 
    icon: Send, 
    bgColor: "bg-emerald-50 dark:bg-emerald-950", 
    iconColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
};

const TYPE_CONFIG: Record<DocStatusType, { 
  icon: typeof FileText; 
  label: string;
  color: string;
}> = {
  VAT: { 
    icon: FileCheck, 
    label: "VAT",
    color: "text-emerald-600 dark:text-emerald-400",
  },
  WHT: { 
    icon: FileText, 
    label: "WHT",
    color: "text-purple-600 dark:text-purple-400",
  },
};

export function DocStatusCard({
  type,
  status,
  label,
  description,
  amount,
  rate,
}: DocStatusCardProps) {
  const statusConfig = STATUS_CONFIG[status];
  const typeConfig = TYPE_CONFIG[type];
  const StatusIcon = statusConfig.icon;
  const TypeIcon = typeConfig.icon;

  return (
    <div className={cn(
      "rounded-xl border p-4",
      statusConfig.bgColor,
      statusConfig.borderColor
    )}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
          status === "missing" ? "bg-amber-100 dark:bg-amber-900" :
          status === "received" ? "bg-blue-100 dark:bg-blue-900" :
          "bg-emerald-100 dark:bg-emerald-900"
        )}>
          <StatusIcon className={cn("h-5 w-5", statusConfig.iconColor)} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-semibold", typeConfig.color)}>
              {typeConfig.label}
            </span>
            <span className="text-sm font-medium text-foreground">
              {label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {description}
          </p>
          
          {/* WHT Amount/Rate */}
          {type === "WHT" && (amount || rate) && (
            <div className="flex items-center gap-2 mt-2">
              {rate && (
                <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                  {rate}%
                </span>
              )}
              {amount !== undefined && amount > 0 && (
                <span className="text-xs font-medium text-foreground">
                  ฿{formatMoney(amount)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
