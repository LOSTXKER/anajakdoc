"use client";

import { Check, Percent, type LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { WHT_RATE_OPTIONS } from "@/lib/constants";
import type { ExpenseType } from "@/types";

interface ExpenseTypeCard {
  value: ExpenseType;
  label: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

interface ExpenseTypeSelectorProps {
  value: ExpenseType;
  onChange: (value: ExpenseType) => void;
  options: ExpenseTypeCard[];
  hasWht: boolean;
  onWhtChange: (hasWht: boolean) => void;
  whtRate: string;
  onWhtRateChange: (rate: string) => void;
}

export function ExpenseTypeSelector({
  value,
  onChange,
  options,
  hasWht,
  onWhtChange,
  whtRate,
  onWhtRateChange,
}: ExpenseTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">ประเภทรายจ่าย</Label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((card) => {
          const isSelected = value === card.value;
          const Icon = card.icon;
          return (
            <button
              key={card.value}
              type="button"
              onClick={() => onChange(card.value)}
              className={cn(
                "relative flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                "hover:border-primary/50 hover:bg-primary/5",
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border bg-card"
              )}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              
              {/* Icon */}
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                isSelected ? "bg-primary/10" : card.iconBg
              )}>
                <Icon className={cn(
                  "h-5 w-5",
                  isSelected ? "text-primary" : card.iconColor
                )} />
              </div>
              
              {/* Text */}
              <div className="min-w-0 pr-4">
                <span className={cn(
                  "block font-medium text-sm truncate",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {card.label}
                </span>
                <span className="block text-xs text-muted-foreground truncate">
                  {card.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* WHT (หัก ณ ที่จ่าย) - only show when STANDARD (has tax invoice) */}
      {value === "STANDARD" && (
        <WhtSection
          hasWht={hasWht}
          onWhtChange={onWhtChange}
          whtRate={whtRate}
          onWhtRateChange={onWhtRateChange}
        />
      )}
    </div>
  );
}

interface WhtSectionProps {
  hasWht: boolean;
  onWhtChange: (hasWht: boolean) => void;
  whtRate: string;
  onWhtRateChange: (rate: string) => void;
}

function WhtSection({ hasWht, onWhtChange, whtRate, onWhtRateChange }: WhtSectionProps) {
  return (
    <div className="mt-4 pt-4 border-t">
      <div className="flex items-start gap-3 p-3 rounded-xl border bg-muted/50">
        <Checkbox
          id="hasWht"
          checked={hasWht}
          onCheckedChange={(checked) => onWhtChange(checked === true)}
          className="mt-0.5"
        />
        <div className="flex-1">
          <label htmlFor="hasWht" className="block font-medium text-sm text-foreground cursor-pointer">
            มีหัก ณ ที่จ่าย (WHT)
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            เลือกถ้ารายการนี้ต้องออกหนังสือรับรองหัก ณ ที่จ่าย
          </p>
          
          {/* Rate selector - show when hasWht is true */}
          {hasWht && (
            <div className="mt-3">
              <Label className="text-xs text-muted-foreground">อัตราหัก ณ ที่จ่าย</Label>
              <Select value={whtRate} onValueChange={onWhtRateChange}>
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue placeholder="เลือกอัตรา..." />
                </SelectTrigger>
                <SelectContent>
                  {WHT_RATE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <Percent className="h-3 w-3 text-purple-500" />
                        <span>{opt.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
