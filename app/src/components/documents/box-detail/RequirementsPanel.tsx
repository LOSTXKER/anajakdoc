"use client";

import { useMemo } from "react";
import { 
  CheckCircle2, 
  Circle, 
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  getBoxRequirements, 
  type BoxRequirement,
  type BoxRequirementsInput,
} from "@/lib/config/box-requirements";

// ==================== Types ====================

interface RequirementsPanelProps {
  box: BoxRequirementsInput & {
    id: string;
  };
  onAction?: (requirementId: string, actionType: string) => void;
  className?: string;
}

// ==================== Main Component ====================

export function RequirementsPanel({ box, onAction, className }: RequirementsPanelProps) {
  const requirements = useMemo(() => getBoxRequirements(box), [box]);
  
  const completedCount = requirements.filter(r => r.status === "completed").length;
  const totalCount = requirements.length;
  const allComplete = completedCount === totalCount;
  
  return (
    <div className={cn("rounded-xl border bg-card", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">รายการที่ต้องดำเนินการ</h3>
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            allComplete 
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
          )}>
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>
      
      {/* Requirements List */}
      <div className="divide-y">
        {requirements.map((req) => (
          <RequirementItem 
            key={req.id} 
            requirement={req} 
            onAction={onAction}
          />
        ))}
      </div>
      
      {/* All Complete Message */}
      {allComplete && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border-t border-emerald-100 dark:border-emerald-800">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">ดำเนินการครบทุกรายการแล้ว</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Requirement Item ====================

interface RequirementItemProps {
  requirement: BoxRequirement;
  onAction?: (requirementId: string, actionType: string) => void;
}

function RequirementItem({ requirement, onAction }: RequirementItemProps) {
  const { id, label, description, status, icon: Icon, actionLabel, actionType } = requirement;
  
  const handleAction = () => {
    if (onAction && actionType) {
      onAction(id, actionType);
    }
  };
  
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 transition-colors",
      status === "completed" && "bg-muted/30",
      status === "warning" && "bg-orange-50/50 dark:bg-orange-900/10"
    )}>
      {/* Status Icon */}
      <div className="shrink-0">
        {status === "completed" ? (
          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        ) : status === "warning" ? (
          <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
            <Circle className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          status === "completed" && "text-muted-foreground line-through"
        )}>
          {label}
        </p>
        <p className={cn(
          "text-xs truncate",
          status === "warning" ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"
        )}>
          {description}
        </p>
      </div>
      
      {/* Action Button */}
      {status !== "completed" && actionLabel && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="shrink-0 h-7 text-xs"
          onClick={handleAction}
        >
          {actionLabel}
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      )}
    </div>
  );
}

// ==================== Compact Version for Sidebar ====================

interface RequirementsPanelCompactProps {
  box: BoxRequirementsInput;
  className?: string;
}

export function RequirementsPanelCompact({ box, className }: RequirementsPanelCompactProps) {
  const requirements = useMemo(() => getBoxRequirements(box), [box]);
  
  const pendingItems = requirements.filter(r => r.status === "pending" || r.status === "warning");
  
  if (pendingItems.length === 0) {
    return (
      <div className={cn("flex items-center gap-2 text-emerald-600 dark:text-emerald-400", className)}>
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-sm">ครบทุกรายการ</span>
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-1", className)}>
      {pendingItems.map((req) => (
        <div 
          key={req.id}
          className={cn(
            "flex items-center gap-2 text-xs",
            req.status === "warning" 
              ? "text-orange-600 dark:text-orange-400" 
              : "text-muted-foreground"
          )}
        >
          {req.status === "warning" ? (
            <AlertCircle className="h-3 w-3 shrink-0" />
          ) : (
            <Circle className="h-3 w-3 shrink-0" />
          )}
          <span className="truncate">{req.shortLabel}</span>
        </div>
      ))}
    </div>
  );
}

export default RequirementsPanel;
