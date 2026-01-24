/**
 * WHT (Withholding Tax) Constants
 * 
 * Single source of truth for Withholding Tax rate configurations.
 * Thai law requires different WHT rates based on the type of payment:
 * - 1% for advertising expenses
 * - 2% for transportation
 * - 3% for services and contracted work
 * - 5% for rental
 * 
 * @module constants/wht
 */

/**
 * Complete WHT rate definitions with value, label, and Thai description.
 * Used as the base for generating other option formats.
 * 
 * @example
 * WHT_RATES.find(r => r.value === "3")?.description // "ค่าบริการ/จ้างทำของ"
 */
export const WHT_RATES = [
  { value: "1", label: "1%", description: "ค่าโฆษณา" },
  { value: "2", label: "2%", description: "ค่าขนส่ง" },
  { value: "3", label: "3%", description: "ค่าบริการ/จ้างทำของ" },
  { value: "5", label: "5%", description: "ค่าเช่า" },
] as const;

/**
 * WHT options for dropdowns that need detailed labels.
 * Format: "3% - ค่าบริการ/จ้างทำของ"
 * 
 * @example
 * <Select>
 *   {WHT_RATE_OPTIONS.map(opt => (
 *     <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
 *   ))}
 * </Select>
 */
export const WHT_RATE_OPTIONS = WHT_RATES.map((rate) => ({
  value: rate.value,
  label: `${rate.label} - ${rate.description}`,
}));

/**
 * WHT options for compact dropdowns (percentage only).
 * Format: "3%"
 * 
 * @example
 * <Select>
 *   {WHT_RATE_SIMPLE.map(opt => (
 *     <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
 *   ))}
 * </Select>
 */
export const WHT_RATE_SIMPLE = WHT_RATES.map((rate) => ({
  value: rate.value,
  label: rate.label,
}));

/**
 * Type-safe WHT rate value type.
 * Can only be "1" | "2" | "3" | "5"
 */
export type WhtRateValue = (typeof WHT_RATES)[number]["value"];
