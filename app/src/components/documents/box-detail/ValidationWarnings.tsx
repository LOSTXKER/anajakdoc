"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, XCircle, Info, Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  validateBox, 
  getValidationStatusLabel,
  getSeverityColorClass,
  type ValidationResult,
  type ValidationIssue,
  type ValidationSeverity,
} from "@/lib/box-validation";
import type { SerializedBox } from "@/types";

interface ValidationWarningsProps {
  box: SerializedBox;
  onDismiss?: (issueId: string) => void;
  dismissedIssues?: string[];
}

// Icon component mapping
function SeverityIcon({ severity }: { severity: ValidationSeverity }) {
  switch (severity) {
    case "error":
      return <XCircle className="h-4 w-4 text-red-600" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    case "info":
      return <Info className="h-4 w-4 text-blue-600" />;
  }
}

export function ValidationWarnings({ 
  box, 
  onDismiss,
  dismissedIssues = [],
}: ValidationWarningsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Run validation
  const validation = useMemo<ValidationResult>(() => {
    return validateBox(box);
  }, [box]);
  
  // Filter out dismissed issues
  const activeIssues = validation.issues.filter(
    issue => !dismissedIssues.includes(issue.id)
  );
  
  // Don't show if no issues
  if (activeIssues.length === 0) {
    return null;
  }
  
  // Group issues by severity
  const errorIssues = activeIssues.filter(i => i.severity === "error");
  const warningIssues = activeIssues.filter(i => i.severity === "warning");
  const infoIssues = activeIssues.filter(i => i.severity === "info");
  
  // Determine overall status
  const hasErrors = errorIssues.length > 0;
  const hasWarnings = warningIssues.length > 0;
  
  const headerClass = hasErrors 
    ? "bg-red-50 border-red-200" 
    : hasWarnings 
      ? "bg-amber-50 border-amber-200"
      : "bg-blue-50 border-blue-200";
  
  const headerTextClass = hasErrors
    ? "text-red-700"
    : hasWarnings
      ? "text-amber-700"
      : "text-blue-700";

  return (
    <div className="rounded-xl border overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full px-5 py-3 flex items-center justify-between border-b",
          headerClass
        )}
      >
        <div className="flex items-center gap-3">
          {hasErrors ? (
            <XCircle className="h-5 w-5 text-red-600" />
          ) : hasWarnings ? (
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          ) : (
            <Info className="h-5 w-5 text-blue-600" />
          )}
          <div className="text-left">
            <h3 className={cn("font-semibold", headerTextClass)}>
              {hasErrors ? "พบปัญหาที่ต้องแก้ไข" : hasWarnings ? "รายการที่ควรตรวจสอบ" : "แนะนำ"}
            </h3>
            <p className="text-sm text-gray-600">
              {getValidationStatusLabel(validation)}
            </p>
          </div>
        </div>
        
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
      
      {/* Issues List */}
      {isExpanded && (
        <div className="bg-white divide-y">
          {/* Errors first */}
          {errorIssues.map(issue => (
            <IssueRow key={issue.id} issue={issue} onDismiss={onDismiss} />
          ))}
          
          {/* Then warnings */}
          {warningIssues.map(issue => (
            <IssueRow key={issue.id} issue={issue} onDismiss={onDismiss} />
          ))}
          
          {/* Then info */}
          {infoIssues.map(issue => (
            <IssueRow key={issue.id} issue={issue} onDismiss={onDismiss} />
          ))}
        </div>
      )}
    </div>
  );
}

// Individual Issue Row
function IssueRow({ 
  issue, 
  onDismiss,
}: { 
  issue: ValidationIssue; 
  onDismiss?: (id: string) => void;
}) {
  return (
    <div className={cn(
      "px-5 py-3 flex items-start gap-3",
      issue.severity === "error" && "bg-red-50/50",
      issue.severity === "warning" && "bg-amber-50/50",
      issue.severity === "info" && "bg-blue-50/50",
    )}>
      <div className="mt-0.5">
        <SeverityIcon severity={issue.severity} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium text-sm",
          issue.severity === "error" && "text-red-700",
          issue.severity === "warning" && "text-amber-700",
          issue.severity === "info" && "text-blue-700",
        )}>
          {issue.message}
        </p>
        
        {issue.suggestion && (
          <p className="text-xs text-gray-600 mt-0.5">
            → {issue.suggestion}
          </p>
        )}
      </div>
      
      {/* Dismiss button for dismissible issues */}
      {issue.canDismiss && onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-gray-400 hover:text-gray-600"
          onClick={() => onDismiss(issue.id)}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// Summary Badge Component
export function ValidationBadge({ box }: { box: SerializedBox }) {
  const validation = useMemo(() => validateBox(box), [box]);
  
  if (validation.summary.errors === 0 && validation.summary.warnings === 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-600">
        <Check className="h-3 w-3" />
        ตรวจแล้ว
      </span>
    );
  }
  
  if (validation.summary.errors > 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-red-600">
        <XCircle className="h-3 w-3" />
        {validation.summary.errors} ปัญหา
      </span>
    );
  }
  
  return (
    <span className="flex items-center gap-1 text-xs text-amber-600">
      <AlertTriangle className="h-3 w-3" />
      {validation.summary.warnings} ควรตรวจ
    </span>
  );
}
