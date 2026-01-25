/**
 * Application Constants
 * Centralized place for magic numbers and commonly used values
 */

// ==================== Tax Rates ====================

export const DEFAULT_WHT_RATE = 3;
export const DEFAULT_WHT_RATE_PERCENT = 0.03;
export const VAT_RATE = 7;
export const VAT_DIVISOR = 107; // For VAT-inclusive calculation: amount * 7 / 107

// ==================== Pagination ====================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ==================== Cache Control ====================

export const CACHE_CONTROL_ONE_HOUR = "3600";

// ==================== Default Values ====================

export const DEFAULT_DOC_TYPE = "OTHER";
export const DEFAULT_AMOUNT = "0";
export const DEFAULT_AMOUNT_NUMBER = 0;

// ==================== Share Link Expiry (hours) ====================

export const SHARE_EXPIRY_OPTIONS = {
  ONE_DAY: 24,
  THREE_DAYS: 72,
  SEVEN_DAYS: 168,
  THIRTY_DAYS: 720,
} as const;

// ==================== File Upload ====================

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

// ==================== Date Calculations ====================

export const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
export const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

// ==================== WHT Tracking ====================

export const WHT_DEFAULT_DUE_DAYS = 7; // Days after box date
