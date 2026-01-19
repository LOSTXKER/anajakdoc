/**
 * Centralized formatting utilities
 * ใช้แทน inline functions ที่กระจายอยู่หลายไฟล์
 */

// ==================== Date Formatting ====================

/**
 * Format date to Thai locale
 * @param date - Date string or Date object
 * @param format - "short" | "long" | "full"
 */
export function formatDate(
  date: string | Date,
  format: "short" | "long" | "full" = "short"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return "-";
  }

  switch (format) {
    case "short":
      return d.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "2-digit",
      });
    case "long":
      return d.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    case "full":
      return d.toLocaleString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    default:
      return d.toLocaleDateString("th-TH");
  }
}

/**
 * Format date for input[type="date"]
 */
export function formatDateForInput(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

/**
 * Get today's date formatted for input
 */
export function getTodayForInput(): string {
  return new Date().toISOString().split("T")[0];
}

// ==================== Money Formatting ====================

/**
 * Format number as Thai currency
 * @param amount - Number to format
 * @param options - Formatting options
 */
export function formatMoney(
  amount: number | null | undefined,
  options?: {
    showCurrency?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const {
    showCurrency = false,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options || {};

  const value = amount ?? 0;
  
  const formatted = value.toLocaleString("th-TH", {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  return showCurrency ? `฿${formatted}` : formatted;
}

/**
 * Format as Thai Baht with currency symbol
 */
export function formatCurrency(amount: number | null | undefined): string {
  return formatMoney(amount, { showCurrency: true });
}

/**
 * Parse money string to number
 */
export function parseMoney(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, "");
  return parseFloat(cleaned) || 0;
}

// ==================== File Size Formatting ====================

/**
 * Format file size to human readable string
 * @param bytes - File size in bytes
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ==================== User/String Utilities ====================

/**
 * Get initials from name (max 2 characters)
 * @param name - Full name
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

// ==================== Number Utilities ====================

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Clamp number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
