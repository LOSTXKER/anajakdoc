"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Building2, Briefcase } from "lucide-react";

export type UserType = "sme" | "firm";

interface UserTypeToggleProps {
  value: UserType;
  onChange: (value: UserType) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function UserTypeToggle({
  value,
  onChange,
  className,
  size = "md",
}: UserTypeToggleProps) {
  const sizeClasses = {
    sm: "h-9 text-sm",
    md: "h-11 text-base",
    lg: "h-12 text-lg",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full bg-white dark:bg-card border-2 border-border shadow-sm p-1",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange("sme")}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full px-4 font-medium transition-all duration-200",
          sizeClasses[size],
          value === "sme"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Building2 className={iconSizes[size]} />
        <span>ธุรกิจ SME</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("firm")}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full px-4 font-medium transition-all duration-200",
          sizeClasses[size],
          value === "firm"
            ? "bg-violet-600 text-white shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Briefcase className={iconSizes[size]} />
        <span>สำนักบัญชี</span>
      </button>
    </div>
  );
}
