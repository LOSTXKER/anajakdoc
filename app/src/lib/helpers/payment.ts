/**
 * Payment Helper Functions
 * Utilities for payment status calculation and processing
 */

import { PaymentStatus } from "@prisma/client";

/**
 * Calculate payment status based on amounts
 * Used across multiple payment-related functions
 */
export function calculatePaymentStatus(
  paidAmount: number,
  totalAmount: number
): PaymentStatus {
  if (paidAmount === 0) {
    return PaymentStatus.UNPAID;
  }
  if (paidAmount < totalAmount) {
    return PaymentStatus.PARTIAL;
  }
  if (paidAmount === totalAmount) {
    return PaymentStatus.PAID;
  }
  return PaymentStatus.OVERPAID;
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number | { toNumber: () => number }): string {
  const value = typeof amount === "number" ? amount : amount.toNumber();
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
