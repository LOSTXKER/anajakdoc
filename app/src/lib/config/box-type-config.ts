/**
 * Box Type Configuration
 * 
 * Provides styling and display configuration for different box types
 * (EXPENSE, INCOME, ADJUSTMENT) used throughout the application.
 * 
 * @module config/box-type-config
 */

import {
  TrendingUp,
  TrendingDown,
  Repeat,
  type LucideIcon,
} from "lucide-react";
import type { BoxType } from "@/types";

/**
 * Configuration object for a box type's visual styling
 */
export interface BoxTypeConfig {
  /** Thai label for the box type */
  label: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Tailwind classes for colored container */
  colorClass: string;
  /** Tailwind classes for badge styling */
  badgeClass: string;
  /** Tailwind classes for icon color */
  iconColor: string;
  /** Tailwind classes for light background */
  bgLight: string;
  /** Tailwind classes for amount text color */
  amountColor: string;
}

/**
 * Complete configuration map for all box types.
 * 
 * @example
 * const config = BOX_TYPE_CONFIG.EXPENSE;
 * console.log(config.label); // "รายจ่าย"
 */
export const BOX_TYPE_CONFIG: Record<BoxType, BoxTypeConfig> = {
  EXPENSE: {
    label: "รายจ่าย",
    icon: TrendingDown,
    colorClass: "bg-rose-100 text-rose-700 border-rose-200",
    badgeClass: "bg-rose-100 text-rose-700",
    iconColor: "text-rose-500",
    bgLight: "bg-rose-50",
    amountColor: "text-rose-600",
  },
  INCOME: {
    label: "รายรับ",
    icon: TrendingUp,
    colorClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    badgeClass: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300",
    iconColor: "text-emerald-500",
    bgLight: "bg-emerald-50 dark:bg-emerald-950",
    amountColor: "text-emerald-600",
  },
  ADJUSTMENT: {
    label: "ปรับปรุง",
    icon: Repeat,
    colorClass: "bg-purple-100 text-purple-700 border-purple-200",
    badgeClass: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
    iconColor: "text-purple-500",
    bgLight: "bg-purple-50 dark:bg-purple-950",
    amountColor: "text-purple-600",
  },
};

/**
 * Get complete configuration for a specific box type.
 * 
 * @param type - The box type (EXPENSE, INCOME, or ADJUSTMENT)
 * @returns BoxTypeConfig object with all styling properties
 * 
 * @example
 * const config = getBoxTypeConfig("EXPENSE");
 * const Icon = config.icon;
 * return <Icon className={config.iconColor} />;
 */
export function getBoxTypeConfig(type: BoxType): BoxTypeConfig {
  // Fallback for unknown types
  const fallback: BoxTypeConfig = {
    label: type || "ไม่ทราบ",
    icon: Repeat,
    colorClass: "bg-gray-100 text-gray-700 border-gray-200",
    badgeClass: "bg-gray-100 text-gray-700",
    iconColor: "text-gray-500",
    bgLight: "bg-gray-50",
    amountColor: "text-gray-600",
  };
  return BOX_TYPE_CONFIG[type] || fallback;
}

/**
 * Get the Thai display label for a box type.
 * 
 * @param type - The box type
 * @returns Thai language label string
 * 
 * @example
 * getBoxTypeLabel("EXPENSE") // "รายจ่าย"
 * getBoxTypeLabel("INCOME")  // "รายรับ"
 */
export function getBoxTypeLabel(type: BoxType): string {
  return BOX_TYPE_CONFIG[type]?.label || type || "ไม่ทราบ";
}
