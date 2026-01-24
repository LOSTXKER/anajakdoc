/**
 * Payment and VAT Configuration
 */

export interface WHTOption {
  value: string;
  rate: number;
  label: string;
}

export const WHT_TYPES: WHTOption[] = [
  { value: "1", rate: 1, label: "1% - ค่าขนส่ง" },
  { value: "2", rate: 2, label: "2% - ค่าโฆษณา" },
  { value: "3", rate: 3, label: "3% - ค่าบริการ/จ้างทำของ" },
  { value: "5", rate: 5, label: "5% - ค่าเช่า" },
];

export function getWHTLabel(rate: number): string {
  const wht = WHT_TYPES.find((w) => w.rate === rate);
  return wht?.label || `${rate}%`;
}

// ==================== VAT Options ====================

export interface VATOption {
  value: string;
  rate: number;
  label: string;
  isInclusive?: boolean;
}

export const VAT_OPTIONS: VATOption[] = [
  { value: "none", rate: 0, label: "ไม่มี VAT" },
  { value: "vat7", rate: 7, label: "VAT 7%" },
  { value: "vat7_inclusive", rate: 7, label: "VAT 7% (รวมใน)", isInclusive: true },
];

// ==================== Payment Methods ====================

export interface PaymentMethodOption {
  value: string;
  label: string;
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  { value: "TRANSFER", label: "โอนเงิน" },
  { value: "CASH", label: "เงินสด" },
  { value: "CREDIT_CARD", label: "บัตรเครดิต" },
  { value: "CHEQUE", label: "เช็ค" },
  { value: "ONLINE", label: "Online" },
];

export function getPaymentMethodLabel(method: string): string {
  const found = PAYMENT_METHODS.find((m) => m.value === method);
  return found?.label || method;
}
