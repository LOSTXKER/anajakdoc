"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Edit2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/formatters";
import type { AggregatedField, FieldSource } from "@/hooks/use-aggregated-data";

interface ConflictResolverProps<T> {
  /** The aggregated field with conflict info */
  field: AggregatedField<T>;
  /** Field label to display */
  label: string;
  /** Type of field for formatting */
  fieldType?: "amount" | "date" | "text";
  /** Current selected/resolved value */
  value: T | undefined;
  /** Callback when value is selected/changed */
  onChange: (value: T) => void;
  /** Whether the field is disabled */
  disabled?: boolean;
}

function formatValue<T>(value: T, fieldType: string = "text"): string {
  if (value === undefined || value === null) return "-";
  
  switch (fieldType) {
    case "amount":
      return `฿${formatMoney(value as number)}`;
    case "date":
      return String(value);
    default:
      return String(value);
  }
}

export function ConflictResolver<T extends string | number>({
  field,
  label,
  fieldType = "text",
  value,
  onChange,
  disabled = false,
}: ConflictResolverProps<T>) {
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");

  // If no conflict, don't show anything special
  if (!field.hasConflict || field.allValues.length <= 1) {
    return null;
  }

  // Get unique values
  const uniqueValues = field.allValues.reduce((acc, curr) => {
    const existing = acc.find(v => {
      if (fieldType === "amount") {
        return Math.abs((v.value as number) - (curr.value as number)) < 0.5;
      }
      return String(v.value).toLowerCase() === String(curr.value).toLowerCase();
    });
    if (!existing) {
      acc.push(curr);
    } else {
      // Merge sources
      existing.sources = existing.sources || [existing.source];
      existing.sources.push(curr.source);
    }
    return acc;
  }, [] as { value: T; source: FieldSource; sources?: FieldSource[] }[]);

  const handleSelect = (selectedValue: T) => {
    setIsCustom(false);
    onChange(selectedValue);
  };

  const handleCustomSubmit = () => {
    if (customValue) {
      if (fieldType === "amount") {
        onChange(parseFloat(customValue) as T);
      } else {
        onChange(customValue as T);
      }
    }
  };

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 text-amber-700">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">พบค่า{label}ต่างกัน</span>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {uniqueValues.map((item, index) => {
          const sources = item.sources || [item.source];
          const isSelected = !isCustom && value === item.value;
          
          return (
            <button
              key={index}
              type="button"
              disabled={disabled}
              onClick={() => handleSelect(item.value)}
              className={cn(
                "w-full flex items-start gap-3 p-2 rounded-lg border text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 bg-white hover:border-gray-300",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Radio indicator */}
              <div className={cn(
                "mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                isSelected ? "border-primary" : "border-gray-300"
              )}>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
              
              {/* Value and sources */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-semibold",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {formatValue(item.value, fieldType)}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {sources.map((source, sourceIdx) => (
                    <span
                      key={sourceIdx}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-gray-100 px-1.5 py-0.5 rounded"
                    >
                      <FileText className="h-2.5 w-2.5" />
                      {source.fileName}
                      <span className="text-gray-400">
                        ({Math.round(source.confidence * 100)}%)
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              )}
            </button>
          );
        })}

        {/* Custom input option */}
        <div className={cn(
          "flex items-start gap-3 p-2 rounded-lg border transition-all",
          isCustom
            ? "border-primary bg-primary/5"
            : "border-gray-200 bg-white"
        )}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsCustom(true)}
            className={cn(
              "mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
              isCustom ? "border-primary" : "border-gray-300",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {isCustom && (
              <div className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Edit2 className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">กรอกเอง</span>
            </div>
            
            {isCustom && (
              <div className="flex gap-2 mt-2">
                <Input
                  type={fieldType === "amount" ? "number" : "text"}
                  step={fieldType === "amount" ? "0.01" : undefined}
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder={`กรอก${label}...`}
                  className="h-8 text-sm"
                  disabled={disabled}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCustomSubmit}
                  disabled={disabled || !customValue}
                >
                  ตกลง
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Simple inline conflict indicator
 * Shows a small warning badge when there's a conflict
 */
interface ConflictBadgeProps {
  hasConflict: boolean;
  onClick?: () => void;
}

export function ConflictBadge({ hasConflict, onClick }: ConflictBadgeProps) {
  if (!hasConflict) return null;
  
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700"
    >
      <AlertTriangle className="h-3 w-3" />
      <span>มีค่าต่างกัน</span>
    </button>
  );
}

/**
 * Field source badge - shows where the value came from
 */
interface SourceBadgeProps {
  source: FieldSource | FieldSource[];
  isUserEdited?: boolean;
}

/**
 * Truncate filename to show only the extension and part of name
 */
function truncateFileName(fileName: string, maxLength: number = 12): string {
  if (fileName.length <= maxLength) return fileName;
  
  const ext = fileName.lastIndexOf(".");
  if (ext > 0) {
    const extension = fileName.slice(ext);
    const name = fileName.slice(0, ext);
    const availableLength = maxLength - extension.length - 2; // -2 for ".."
    if (availableLength > 0) {
      return name.slice(0, availableLength) + ".." + extension;
    }
  }
  return fileName.slice(0, maxLength - 2) + "..";
}

export function SourceBadge({ source, isUserEdited }: SourceBadgeProps) {
  if (isUserEdited) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded shrink-0">
        <Edit2 className="h-2.5 w-2.5 shrink-0" />
        แก้ไขเอง
      </span>
    );
  }
  
  const sources = Array.isArray(source) ? source : [source];
  
  if (sources.length === 0) return null;
  
  // Show first source
  const firstSource = sources[0];
  const displayName = truncateFileName(firstSource.fileName);
  
  return (
    <span 
      className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-gray-100 px-1.5 py-0.5 rounded shrink-0 max-w-[120px]"
      title={firstSource.fileName + (sources.length > 1 ? ` และอีก ${sources.length - 1} ไฟล์` : "")}
    >
      <FileText className="h-2.5 w-2.5 shrink-0" />
      <span className="truncate">{displayName}</span>
      {sources.length > 1 && (
        <span className="text-gray-400 shrink-0">+{sources.length - 1}</span>
      )}
    </span>
  );
}
