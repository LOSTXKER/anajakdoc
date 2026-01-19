"use client";

import { useMemo } from "react";

interface TaxCalculationResult {
  /** Original total amount (รวม VAT) */
  totalAmount: number;
  /** Amount before VAT (ยอดก่อน VAT) */
  subtotal: number;
  /** VAT amount */
  vatAmount: number;
  /** WHT amount (หัก ณ ที่จ่าย) */
  whtAmount: number;
  /** Net amount after WHT (ยอดสุทธิ) */
  netAmount: number;
  /** VAT percentage */
  vatPercent: number;
  /** WHT percentage */
  whtPercent: number;
  /** Whether VAT applies */
  hasVat: boolean;
  /** Whether WHT applies */
  hasWht: boolean;
}

/** Type of amount input - whether it includes VAT or not */
export type AmountInputType = "includeVat" | "excludeVat";

interface UseTaxCalculationOptions {
  /** Amount input (as string from form) */
  amount: string;
  /** VAT rate (e.g., 7 for 7%) */
  vatRate: number;
  /** WHT rate (e.g., 3 for 3%) */
  whtRate: number;
  /** Whether WHT is enabled */
  hasWht: boolean;
  /** Type of amount input - default is "includeVat" for backward compatibility */
  amountInputType?: AmountInputType;
}

/**
 * Hook สำหรับคำนวณ VAT และ WHT
 * ใช้แทน logic ที่ซ้ำกันใน document-box-form, document-form, document-edit-form
 * 
 * การคำนวณ:
 * - amountInputType = "includeVat": 
 *   - subtotal = input / (1 + vatRate/100)
 *   - totalAmount = input
 * - amountInputType = "excludeVat":
 *   - subtotal = input
 *   - totalAmount = input * (1 + vatRate/100)
 * - WHT คำนวณจาก subtotal: whtAmount = subtotal * (whtRate/100)
 * - netAmount = totalAmount - whtAmount (ยอดที่ต้องจ่าย/รับจริง)
 */
export function useTaxCalculation({
  amount,
  vatRate,
  whtRate,
  hasWht,
  amountInputType = "includeVat",
}: UseTaxCalculationOptions): TaxCalculationResult {
  return useMemo(() => {
    const inputAmount = parseFloat(amount) || 0;
    
    // Calculate VAT based on input type
    let subtotal: number;
    let vatAmount: number;
    let totalAmount: number;
    
    if (vatRate > 0) {
      if (amountInputType === "includeVat") {
        // User entered total (including VAT) - calculate backwards
        totalAmount = inputAmount;
        subtotal = totalAmount / (1 + vatRate / 100);
        vatAmount = totalAmount - subtotal;
      } else {
        // User entered subtotal (excluding VAT) - calculate forwards
        subtotal = inputAmount;
        vatAmount = subtotal * (vatRate / 100);
        totalAmount = subtotal + vatAmount;
      }
    } else {
      // No VAT - subtotal equals total
      subtotal = inputAmount;
      totalAmount = inputAmount;
      vatAmount = 0;
    }
    
    // Calculate WHT (based on subtotal, not total)
    const whtAmount = hasWht ? subtotal * (whtRate / 100) : 0;
    
    // Net amount = total - WHT deduction
    const netAmount = totalAmount - whtAmount;
    
    return {
      totalAmount: Math.round(totalAmount * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      whtAmount: Math.round(whtAmount * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
      vatPercent: vatRate,
      whtPercent: hasWht ? whtRate : 0,
      hasVat: vatRate > 0,
      hasWht: hasWht && whtRate > 0,
    };
  }, [amount, vatRate, whtRate, hasWht, amountInputType]);
}

/**
 * Calculate VAT from amount (utility function for non-hook usage)
 * @param amount - Input amount
 * @param vatRate - VAT rate percentage
 * @param amountInputType - Whether input includes VAT or not
 */
export function calculateVAT(
  amount: number,
  vatRate: number,
  amountInputType: AmountInputType = "includeVat"
): { subtotal: number; vatAmount: number; totalAmount: number } {
  if (vatRate <= 0) {
    return { subtotal: amount, vatAmount: 0, totalAmount: amount };
  }
  
  let subtotal: number;
  let vatAmount: number;
  let totalAmount: number;
  
  if (amountInputType === "includeVat") {
    totalAmount = amount;
    subtotal = amount / (1 + vatRate / 100);
    vatAmount = totalAmount - subtotal;
  } else {
    subtotal = amount;
    vatAmount = subtotal * (vatRate / 100);
    totalAmount = subtotal + vatAmount;
  }
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
}

/**
 * Calculate WHT from subtotal (utility function for non-hook usage)
 */
export function calculateWHT(
  subtotal: number,
  whtRate: number
): number {
  if (whtRate <= 0) return 0;
  return Math.round(subtotal * (whtRate / 100) * 100) / 100;
}

export default useTaxCalculation;
