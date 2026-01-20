# 📦 Extended Use Cases - ครอบคลุมทุกสถานการณ์จริง

> **เป้าหมาย**: รองรับทุก use case ในชีวิตจริง สำหรับทั้งเจ้าของธุรกิจเล็กและสำนักงานบัญชี

---

## 📑 สารบัญ

1. [Document Types ทั้งหมด](#1-document-types-ทั้งหมด)
2. [Transaction Types](#2-transaction-types)
3. [Expense Expectations](#3-expense-expectations)
4. [Relationship Patterns](#4-relationship-patterns)
5. [Use Cases ครบทุกกรณี](#5-use-cases-ครบทุกกรณี)
6. [Export Formats](#6-export-formats)
7. [Data Model Updates](#7-data-model-updates)
8. [UI/UX Updates](#8-uiux-updates)

---

# 1. Document Types ทั้งหมด

## 1.1 หลักฐานการจ่ายเงิน (Payment Evidence)

| Type Code | ชื่อไทย | รายละเอียด | มี VAT? |
|-----------|---------|------------|---------|
| `SLIP_TRANSFER` | สลิปโอนเงิน | โอนผ่านธนาคาร/พร้อมเพย์ | ❌ |
| `SLIP_CHEQUE` | สำเนาเช็ค | จ่ายเป็นเช็ค | ❌ |
| `BANK_STATEMENT` | Statement ธนาคาร | หลักฐานจาก bank | ❌ |
| `CREDIT_CARD_STATEMENT` | Statement บัตรเครดิต | รายการจากบัตร | ❌ |
| `PAYPAL_RECEIPT` | Paypal/Stripe Receipt | Online payment | ❌ |
| `PETTY_CASH_VOUCHER` | ใบสำคัญจ่ายเงินสด | Petty cash | ❌ |
| `CASH_PAYMENT` | หลักฐานจ่ายเงินสด | ไม่มีสลิป | ❌ |

## 1.2 หลักฐานรายจ่าย (Expense Evidence)

| Type Code | ชื่อไทย | รายละเอียด | มี VAT? |
|-----------|---------|------------|---------|
| `TAX_INVOICE` | ใบกำกับภาษี | เครม VAT ได้ | ✅ 7% |
| `TAX_INVOICE_ABB` | ใบกำกับภาษีอย่างย่อ | ยอด < ฿1,000 | ✅ 7% |
| `RECEIPT` | ใบเสร็จรับเงิน | ร้านจด VAT แต่ออกใบเสร็จ | ❌ |
| `CASH_RECEIPT` | บิลเงินสด | ร้านไม่จด VAT | ❌ |
| `INVOICE` | ใบแจ้งหนี้ | ยังไม่จ่าย | - |
| `DELIVERY_NOTE` | ใบส่งของ | หลักฐานรับของ | ❌ |
| `FOREIGN_INVOICE` | Invoice ต่างประเทศ | สั่งซื้อต่างประเทศ | ❌ |
| `CUSTOMS_FORM` | ใบขนสินค้า | นำเข้า | มี VAT นำเข้า |
| `NO_RECEIPT` | ไม่มีหลักฐาน + เหตุผล | ค่าเดินทาง, ค่าจอดรถ | ❌ |

## 1.3 เอกสารปรับปรุง (Adjustment Documents)

| Type Code | ชื่อไทย | รายละเอียด |
|-----------|---------|------------|
| `CREDIT_NOTE` | ใบลดหนี้ | Vendor ลดราคา/คืนเงิน |
| `DEBIT_NOTE` | ใบเพิ่มหนี้ | ต้องจ่ายเพิ่ม |
| `CANCELLATION` | ใบยกเลิก | ยกเลิก order |
| `REFUND_RECEIPT` | หลักฐานคืนเงิน | ได้รับเงินคืน |

## 1.4 หนังสือหัก ณ ที่จ่าย (WHT)

| Type Code | ชื่อไทย | รายละเอียด |
|-----------|---------|------------|
| `WHT_CERT_SENT` | WHT ที่เราส่งให้ผู้รับ | เราหักเขา |
| `WHT_CERT_RECEIVED` | WHT ที่เราได้รับกลับ | Signed copy |
| `WHT_CERT_INCOMING` | WHT ที่เขาหักเรา | ลูกค้าหักเรา |

## 1.5 เอกสารราชการ/ภาษี

| Type Code | ชื่อไทย | รายละเอียด |
|-----------|---------|------------|
| `TAX_PAYMENT_SLIP` | ใบนำส่งภาษี | ภ.พ.30, ภ.ง.ด.3/53 |
| `TAX_RECEIPT` | ใบเสร็จภาษี | หลักฐานจ่ายภาษี |
| `SSO_PAYMENT` | ใบนำส่งประกันสังคม | สปส. 1-10 |
| `GOVT_RECEIPT` | ใบเสร็จราชการ | ค่าธรรมเนียมต่างๆ |

## 1.6 เอกสารอื่นๆ

| Type Code | ชื่อไทย | รายละเอียด |
|-----------|---------|------------|
| `CONTRACT` | สัญญา | สัญญาจ้าง/ซื้อ |
| `QUOTATION` | ใบเสนอราคา | Quote |
| `PURCHASE_ORDER` | ใบสั่งซื้อ | PO |
| `CLAIM_FORM` | ใบเบิกเงิน | พนักงานเบิก |
| `APPROVAL_DOC` | เอกสารอนุมัติ | ลายเซ็นอนุมัติ |
| `OTHER` | อื่นๆ | ไม่เข้าหมวด |

---

# 2. Transaction Types

## 2.1 ประเภทธุรกรรมหลัก

```typescript
enum TransactionType {
  // === EXPENSES (รายจ่าย) ===
  EXPENSE_STANDARD = "expense_standard",      // จ่ายปกติ (โอน + ใบกำกับ + WHT)
  EXPENSE_NO_VAT = "expense_no_vat",          // จ่าย ไม่มี VAT (ร้านไม่จด)
  EXPENSE_CASH = "expense_cash",              // จ่ายสด/Petty Cash
  EXPENSE_NO_RECEIPT = "expense_no_receipt",  // ไม่มีหลักฐาน
  EXPENSE_FOREIGN = "expense_foreign",        // จ่ายต่างประเทศ
  EXPENSE_IMPORT = "expense_import",          // นำเข้าสินค้า
  
  // === RECURRING (ประจำ) ===
  EXPENSE_RECURRING = "expense_recurring",    // ค่าใช้จ่ายประจำ
  EXPENSE_UTILITY = "expense_utility",        // ค่าน้ำ/ไฟ/เน็ต
  EXPENSE_RENT = "expense_rent",              // ค่าเช่า
  EXPENSE_SUBSCRIPTION = "expense_subscription", // Subscription
  
  // === PAYROLL/HR ===
  EXPENSE_SALARY = "expense_salary",          // เงินเดือน
  EXPENSE_SSO = "expense_sso",                // ประกันสังคม
  EXPENSE_REIMBURSEMENT = "expense_reimbursement", // เบิกคืนพนักงาน
  
  // === TAX/GOVERNMENT ===
  EXPENSE_TAX_VAT = "expense_tax_vat",        // จ่าย VAT
  EXPENSE_TAX_WHT = "expense_tax_wht",        // จ่ายนำส่ง WHT
  EXPENSE_TAX_CIT = "expense_tax_cit",        // ภาษีนิติบุคคล
  EXPENSE_GOVT_FEE = "expense_govt_fee",      // ค่าธรรมเนียมราชการ
  
  // === BANK FEES ===
  EXPENSE_BANK_FEE = "expense_bank_fee",      // ค่าธรรมเนียมธนาคาร
  EXPENSE_FX_FEE = "expense_fx_fee",          // ค่า FX
  EXPENSE_INTEREST = "expense_interest",       // ดอกเบี้ย
  
  // === ADJUSTMENTS ===
  ADJUSTMENT_REFUND = "adjustment_refund",    // ได้เงินคืน
  ADJUSTMENT_CREDIT = "adjustment_credit",    // Credit Note
  ADJUSTMENT_DEBIT = "adjustment_debit",      // Debit Note
  ADJUSTMENT_CANCEL = "adjustment_cancel",    // ยกเลิก
  
  // === INCOME (รายรับ) - Phase 2 ===
  INCOME_STANDARD = "income_standard",
  INCOME_SERVICE = "income_service",
  INCOME_PRODUCT = "income_product",
  
  // === INTER-COMPANY ===
  INTERCOMPANY = "intercompany",              // ระหว่างบริษัทในเครือ
}
```

## 2.2 Transaction Type → Expected Documents

```typescript
const TRANSACTION_EXPECTATIONS: Record<TransactionType, DocumentExpectation> = {
  expense_standard: {
    required: ["SLIP_TRANSFER", "TAX_INVOICE"],
    optional: ["WHT_CERT_SENT", "INVOICE"],
    vatExpected: true,
    whtPossible: true,
  },
  expense_no_vat: {
    required: ["SLIP_TRANSFER"],
    optional: ["CASH_RECEIPT", "RECEIPT"],
    vatExpected: false,
    whtPossible: false,
  },
  expense_cash: {
    required: [], // อาจไม่มี slip
    optional: ["PETTY_CASH_VOUCHER", "CASH_RECEIPT"],
    vatExpected: false,
    whtPossible: false,
  },
  expense_no_receipt: {
    required: [], // ไม่มีเอกสาร
    optional: [],
    vatExpected: false,
    whtPossible: false,
    requiresReason: true, // ต้องมีเหตุผล
  },
  expense_foreign: {
    required: ["SLIP_TRANSFER", "FOREIGN_INVOICE"],
    optional: ["BANK_STATEMENT"],
    vatExpected: false,
    whtPossible: false,
    hasForeignCurrency: true,
  },
  expense_import: {
    required: ["FOREIGN_INVOICE", "CUSTOMS_FORM", "SLIP_TRANSFER"],
    optional: ["DELIVERY_NOTE"],
    vatExpected: true, // VAT นำเข้า
    whtPossible: false,
  },
  expense_recurring: {
    required: ["SLIP_TRANSFER", "TAX_INVOICE"],
    optional: ["CONTRACT"],
    vatExpected: true,
    whtPossible: true,
    isRecurring: true,
  },
  expense_utility: {
    required: ["SLIP_TRANSFER", "TAX_INVOICE"],
    optional: [],
    vatExpected: true,
    whtPossible: false,
  },
  expense_bank_fee: {
    required: ["BANK_STATEMENT"],
    optional: [],
    vatExpected: false,
    whtPossible: false,
    noInvoiceExpected: true,
  },
  expense_reimbursement: {
    required: ["CLAIM_FORM", "SLIP_TRANSFER"],
    optional: ["TAX_INVOICE", "CASH_RECEIPT"],
    vatExpected: "depends", // ขึ้นกับใบเสร็จที่แนบ
    whtPossible: false,
  },
  expense_tax_vat: {
    required: ["TAX_PAYMENT_SLIP", "SLIP_TRANSFER"],
    optional: ["TAX_RECEIPT"],
    vatExpected: false,
    whtPossible: false,
  },
  adjustment_refund: {
    required: ["REFUND_RECEIPT"],
    optional: ["CREDIT_NOTE"],
    isRefund: true,
  },
  // ... อื่นๆ
};
```

---

# 3. Expense Expectations

## 3.1 ระบบ "คาดหวัง" เอกสาร

```typescript
interface DocumentExpectation {
  // เอกสารที่ต้องมี (incomplete ถ้าไม่มี)
  required: DocType[];
  
  // เอกสารที่อาจมี (ไม่บังคับ)
  optional: DocType[];
  
  // คาดว่ามี VAT ไหม
  vatExpected: boolean | "depends";
  
  // อาจมี WHT ไหม
  whtPossible: boolean;
  
  // ต้องมีเหตุผลถ้าไม่มีเอกสาร
  requiresReason?: boolean;
  
  // ไม่คาดว่าจะมี Invoice (เช่น bank fee)
  noInvoiceExpected?: boolean;
  
  // เป็น recurring
  isRecurring?: boolean;
  
  // มี foreign currency
  hasForeignCurrency?: boolean;
}
```

## 3.2 UI: เลือกประเภทค่าใช้จ่าย

```
┌─────────────────────────────────────────────────────────────────┐
│  📦 สร้างกล่อง - เลือกประเภท                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  💳 การจ่ายเงิน                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ◉ จ่ายปกติ (มีใบกำกับภาษี)                               │   │
│  │   → รอ: สลิป + ใบกำกับ + WHT (ถ้ามี)                     │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ○ จ่าย ไม่มีใบกำกับ (ร้านไม่จด VAT)                      │   │
│  │   → รอ: สลิป + บิลเงินสด (optional)                     │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ○ จ่ายสด (Petty Cash)                                   │   │
│  │   → รอ: ใบสำคัญจ่าย + บิล (optional)                    │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ○ ไม่มีหลักฐาน (ค่าเดินทาง, ค่าจอดรถ)                   │   │
│  │   → ใส่เหตุผล                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🌍 ต่างประเทศ                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ○ จ่ายต่างประเทศ (USD/EUR)                               │   │
│  │   → รอ: สลิป + Invoice ต่างประเทศ                       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ○ นำเข้าสินค้า                                           │   │
│  │   → รอ: Invoice + ใบขน + VAT นำเข้า                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🔄 ค่าใช้จ่ายประจำ                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ○ ค่าเช่า/Subscription                                   │   │
│  │ ○ ค่าน้ำ/ไฟ/เน็ต                                         │   │
│  │ ○ ค่าธรรมเนียมธนาคาร                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  👤 เบิกจ่าย                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ○ พนักงานสำรองจ่าย (Reimbursement)                       │   │
│  │   → รอ: ใบเบิก + บิล + สลิปคืนให้พนักงาน                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🏛️ ภาษี/ราชการ                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ○ จ่าย VAT (ภ.พ.30)                                      │   │
│  │ ○ จ่ายนำส่ง WHT (ภ.ง.ด.3/53)                             │   │
│  │ ○ ประกันสังคม                                            │   │
│  │ ○ ค่าธรรมเนียมราชการ                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🔄 ปรับปรุง                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ○ ได้เงินคืน (Refund)                                    │   │
│  │ ○ Credit Note / Debit Note                               │   │
│  │ ○ ยกเลิก Order                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                                            [ยกเลิก] [ต่อไป →]   │
└─────────────────────────────────────────────────────────────────┘
```

---

# 4. Relationship Patterns

## 4.1 รองรับ 1:N และ N:1

```typescript
// กล่อง 1 = สลิป N ใบ (จ่ายหลายครั้ง)
interface TransactionPayments {
  transactionId: string;
  payments: SubDocument[]; // type = SLIP_*
  totalPaid: number;
  expectedAmount: number;
  paymentStatus: "unpaid" | "partial" | "paid" | "overpaid";
}

// กล่อง 1 = Invoice N ใบ (จ่ายรวม)
interface TransactionInvoices {
  transactionId: string;
  invoices: SubDocument[]; // type = TAX_INVOICE | INVOICE
  totalInvoiced: number;
}
```

## 4.2 Matching Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│  Relationship Types                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1️⃣:1️⃣ ปกติ                                                     │
│  ┌─────────┐         ┌─────────┐                               │
│  │ สลิป 1   │ ═══════ │ Invoice │                               │
│  │ ฿10,000 │         │ ฿10,000 │                               │
│  └─────────┘         └─────────┘                               │
│                                                                 │
│  1️⃣:N จ่ายรวม (1 สลิป = หลาย Invoice)                           │
│  ┌─────────┐         ┌─────────┐                               │
│  │ สลิป 1   │ ═══════ │ Invoice1│                               │
│  │ ฿30,000 │ ═══════ │ Invoice2│                               │
│  │         │ ═══════ │ Invoice3│                               │
│  └─────────┘         └─────────┘                               │
│                                                                 │
│  N:1️⃣ จ่ายแยก (หลายสลิป = 1 Invoice)                           │
│  ┌─────────┐         ┌─────────┐                               │
│  │ สลิป 1   │ ═══════ │         │                               │
│  │ ฿5,000  │         │ Invoice │                               │
│  ├─────────┤ ═══════ │ ฿10,000 │                               │
│  │ สลิป 2   │         │         │                               │
│  │ ฿5,000  │         └─────────┘                               │
│  └─────────┘                                                   │
│                                                                 │
│  N:M ซับซ้อน (Advance + Balance + Adjustments)                 │
│  ┌─────────┐         ┌─────────┐                               │
│  │ มัดจำ    │ ═══════ │ Invoice │                               │
│  │ ฿5,000  │         │ ฿10,000 │                               │
│  ├─────────┤ ═══════ │         │                               │
│  │ จ่ายเหลือ│         │         │                               │
│  │ ฿4,700  │         └─────────┘                               │
│  ├─────────┤                                                   │
│  │ WHT     │ (หัก ฿300)                                        │
│  │ ฿300    │                                                   │
│  └─────────┘                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 4.3 UI: Matching (Manual Override)

```
┌─────────────────────────────────────────────────────────────────┐
│  📤 อัปใบกำกับภาษี - ฿10,700                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🤖 AI พบกล่องที่อาจตรงกัน:                                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ◉ 📦 #TXN-0012 | บริษัท ABC | ฿10,700 | 15 ม.ค.        │   │
│  │   └── 💳 มีสลิป ฿10,700                                 │   │
│  │   └── Match: 95% (ยอดตรง + ชื่อตรง)                     │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ○ 📦 #TXN-0010 | บริษัท ABC | ฿5,350 | 10 ม.ค.         │   │
│  │   └── 💳 มีสลิป ฿5,350                                  │   │
│  │   └── Match: 40% (ชื่อตรง แต่ยอดไม่ตรง)                 │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ○ รวมหลายกล่อง (Batch payment)                          │   │
│  │   └── เลือกกล่องที่ต้องการรวม                           │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ○ 🆕 สร้างกล่องใหม่                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ⚠️ ยอดไม่ตรง? อาจเป็น:                                         │
│  • จ่ายหลายครั้ง (งวด)                                          │
│  • หัก WHT แล้ว                                                 │
│  • มี Credit Note                                               │
│                                                                 │
│                                     [ยกเลิก]  [✓ ยืนยัน]       │
└─────────────────────────────────────────────────────────────────┘
```

---

# 5. Use Cases ครบทุกกรณี

## 5.1 การจ่ายเงินพื้นฐาน

### UC-PAY-01: จ่ายปกติ (Standard)
```
Flow: สลิป → ใบกำกับ → WHT (ถ้ามี)
Documents: SLIP_TRANSFER + TAX_INVOICE + WHT_CERT_SENT
```

### UC-PAY-02: จ่ายไม่มี VAT
```
Scenario: ร้านไม่จด VAT
Flow: สลิป → บิลเงินสด (optional)
Documents: SLIP_TRANSFER + CASH_RECEIPT (optional)
```

### UC-PAY-03: จ่ายสด (Petty Cash)
```
Scenario: จ่ายเงินสดจาก Petty Cash
Flow: ใบสำคัญจ่าย → บิล (ถ้ามี)
Documents: PETTY_CASH_VOUCHER + CASH_RECEIPT
```

### UC-PAY-04: ไม่มีหลักฐาน
```
Scenario: ค่าแท็กซี่, ค่าจอดรถ, ค่าทิป
Flow: กรอกรายละเอียด + เหตุผล
Documents: NO_RECEIPT (with reason)
```

## 5.2 การจ่ายซับซ้อน

### UC-PAY-05: จ่ายล่วงหน้า (Deposit)
```
Scenario: มัดจำ 50% → รอของ → จ่ายที่เหลือ
Flow: สลิป#1 (มัดจำ) → สลิป#2 (ส่วนที่เหลือ) → ใบกำกับ
Documents: SLIP_TRANSFER x2 + TAX_INVOICE
Relationship: N:1 (หลายสลิป = 1 Invoice)
```

### UC-PAY-06: จ่ายเป็นงวด (Installment)
```
Scenario: สินค้า ฿100k จ่าย 4 งวด
Flow: สลิป#1 → สลิป#2 → สลิป#3 → สลิป#4 → ใบกำกับ
Documents: SLIP_TRANSFER x4 + TAX_INVOICE
Track: ยอดจ่ายแล้ว vs ยอดรวม
```

### UC-PAY-07: จ่ายรวมหลาย Invoice (Batch)
```
Scenario: Supplier ส่ง 5 Invoice รวมจ่ายสิ้นเดือน
Flow: Invoice x5 → สลิปเดียว
Documents: TAX_INVOICE x5 + SLIP_TRANSFER x1
Relationship: 1:N (1 สลิป = หลาย Invoice)
```

### UC-PAY-08: จ่ายบางส่วน (Partial)
```
Scenario: Invoice ฿10k แต่จ่ายแค่ ฿6k ก่อน
Flow: สลิป ฿6k → (ค้างอยู่) → สลิป ฿4k → ใบกำกับ
Track: ยอดค้าง ฿4k
```

## 5.3 การคืนเงิน/ปรับปรุง

### UC-ADJ-01: Refund / คืนเงิน
```
Scenario: สินค้ามีปัญหา ได้เงินคืน
Flow: กล่องเดิม → เพิ่ม Credit Note → สลิปรับคืน
Documents: CREDIT_NOTE + REFUND_RECEIPT
Link: เชื่อมกับกล่องจ่ายเดิม
```

### UC-ADJ-02: Credit Note (ลดราคา)
```
Scenario: Vendor แก้ราคาให้ ออก CN
Flow: กล่องเดิม → เพิ่ม Credit Note
Documents: CREDIT_NOTE
Effect: ลดยอดในกล่อง
```

### UC-ADJ-03: Debit Note (จ่ายเพิ่ม)
```
Scenario: ต้องจ่ายเพิ่มเติม
Flow: กล่องเดิม → เพิ่ม Debit Note → สลิปจ่ายเพิ่ม
Documents: DEBIT_NOTE + SLIP_TRANSFER
```

### UC-ADJ-04: โอนผิด → ขอคืน
```
Scenario: โอน ฿10k ผิดบัญชี ได้คืน
Flow: สลิปโอนผิด → สลิปรับคืน → สลิปโอนใหม่
Documents: SLIP_TRANSFER (wrong) + REFUND_RECEIPT + SLIP_TRANSFER (correct)
```

### UC-ADJ-05: ยกเลิก Order
```
Scenario: จ่ายแล้ว แต่ cancel order
Flow: กล่องเดิม → Mark cancelled → รอ refund
Documents: CANCELLATION + REFUND_RECEIPT
Status: cancelled
```

## 5.4 เบิกจ่าย/Reimbursement

### UC-REIMB-01: พนักงานสำรองจ่าย
```
Scenario: พนักงานจ่ายค่าอาหารลูกค้า → เบิกคืน
Flow: ใบเบิก + บิล → อนุมัติ → สลิปคืนให้พนักงาน
Documents: CLAIM_FORM + CASH_RECEIPT/TAX_INVOICE + SLIP_TRANSFER (to employee)
```

### UC-REIMB-02: เบิกค่าเดินทาง
```
Scenario: ค่าแท็กซี่ ค่าน้ำมัน ค่าทางด่วน
Flow: ใบเบิก + บิล (บางอันไม่มี) → อนุมัติ → สลิปคืน
Documents: CLAIM_FORM + mixed receipts
```

### UC-REIMB-03: Petty Cash Top-up
```
Scenario: เติม Petty Cash
Flow: ใบสรุป Petty Cash → สลิปเติม
Documents: PETTY_CASH_VOUCHER (summary) + SLIP_TRANSFER
```

## 5.5 ค่าใช้จ่ายประจำ

### UC-REC-01: ค่าเช่าสำนักงาน
```
Scenario: ฿50k/เดือน
Flow: ใบแจ้งหนี้ → สลิป → ใบกำกับ
Documents: INVOICE + SLIP_TRANSFER + TAX_INVOICE
Recurring: true, template available
```

### UC-REC-02: ค่า Subscription
```
Scenario: Software, Cloud service
Flow: Statement/Receipt → (อาจเป็น USD)
Documents: FOREIGN_INVOICE or CREDIT_CARD_STATEMENT
Foreign: true (if USD)
```

### UC-REC-03: ค่าไฟ/น้ำ/เน็ต
```
Scenario: Utility bills
Flow: ใบแจ้งหนี้ → สลิป → ใบกำกับ
Documents: TAX_INVOICE + SLIP_TRANSFER
```

## 5.6 ภาษี/รัฐบาล

### UC-TAX-01: จ่าย VAT รายเดือน
```
Scenario: ภ.พ.30
Flow: ใบนำส่ง → สลิป → ใบเสร็จ
Documents: TAX_PAYMENT_SLIP + SLIP_TRANSFER + TAX_RECEIPT
```

### UC-TAX-02: จ่าย WHT (ภ.ง.ด.3/53)
```
Scenario: นำส่งภาษีหัก ณ ที่จ่าย
Flow: ใบนำส่ง → สลิป → ใบเสร็จ
Documents: TAX_PAYMENT_SLIP + SLIP_TRANSFER + TAX_RECEIPT
Link: เชื่อมกับ WHT ที่หักไว้
```

### UC-TAX-03: ประกันสังคม
```
Scenario: สปส. 1-10
Flow: ใบนำส่ง → สลิป
Documents: SSO_PAYMENT + SLIP_TRANSFER
```

## 5.7 ต่างประเทศ

### UC-FX-01: จ่าย USD/EUR
```
Scenario: Software จากต่างประเทศ
Flow: สลิป (THB) → Invoice (USD)
Documents: SLIP_TRANSFER + FOREIGN_INVOICE + BANK_STATEMENT
Track: Exchange rate, FX fee
```

### UC-FX-02: นำเข้าสินค้า
```
Scenario: สั่งของจาก China
Flow: Invoice ต่างประเทศ → ใบขน → VAT นำเข้า → สลิป
Documents: FOREIGN_INVOICE + CUSTOMS_FORM + TAX_INVOICE (VAT import)
```

### UC-FX-03: Paypal/Stripe
```
Scenario: ค่าบริการ online
Flow: Statement → (convert to THB)
Documents: PAYPAL_RECEIPT
No Thai invoice expected
```

## 5.8 ค่าธรรมเนียมธนาคาร

### UC-BANK-01: ค่าโอนเงิน
```
Scenario: ฿25-฿150/รายการ
Flow: Auto-deduct from account
Documents: BANK_STATEMENT (no invoice)
```

### UC-BANK-02: ค่าธรรมเนียมรายปี
```
Scenario: บัตรเครดิต, บัญชี
Flow: Statement
Documents: CREDIT_CARD_STATEMENT or BANK_STATEMENT
```

### UC-BANK-03: ดอกเบี้ยเงินกู้
```
Scenario: สินเชื่อธุรกิจ
Flow: ใบแจ้งหนี้ → สลิป
Documents: INVOICE (from bank) + SLIP_TRANSFER
```

## 5.9 สัญญา/โปรเจค

### UC-PROJ-01: Milestone payments
```
Scenario: จ่ายตาม phase งาน
Flow: Contract → Invoice per milestone → Slip per milestone
Documents: CONTRACT + (INVOICE + SLIP_TRANSFER) x N
Track: Progress vs payments
```

### UC-PROJ-02: Retention
```
Scenario: หัก 5% รอรับประกัน
Flow: Invoice เต็ม → จ่าย 95% → (รอ) → จ่าย 5%
Documents: TAX_INVOICE + SLIP_TRANSFER (95%) + SLIP_TRANSFER (5% later)
Track: Retention amount & release date
```

## 5.10 กรณีผิดปกติ

### UC-ERR-01: Invoice หาย
```
Scenario: Vendor ออกใบใหม่
Flow: ขอ duplicate → แนบ + หมายเหตุ
Documents: TAX_INVOICE (duplicate) + NOTE
```

### UC-ERR-02: สลิปหาย
```
Scenario: ไม่ได้ save ไว้
Flow: ขอ Bank statement แทน
Documents: BANK_STATEMENT (แทน SLIP_TRANSFER)
```

### UC-ERR-03: ยอดไม่ตรง
```
Scenario: Invoice ฿10,700 โอน ฿10,000
Flow: ตามจ่ายส่วนต่าง หรือ CN
Resolution: Partial payment + follow up OR Credit Note
```

### UC-ERR-04: Double payment
```
Scenario: จ่ายซ้ำโดยไม่ตั้งใจ
Flow: Detect duplicate → ขอ Refund
Documents: SLIP_TRANSFER (duplicate) → REFUND_RECEIPT
```

---

# 6. Export Formats

## 6.1 รองรับหลาย Format

| Format | Target | Fields |
|--------|--------|--------|
| Generic Excel | สำนักงานบัญชีทั่วไป | Full data |
| Generic CSV | Import เข้าระบบอื่น | Configurable |
| PEAK | ผู้ใช้ PEAK | PEAK format |
| Express | ผู้ใช้ Express | Express format |
| FlowAccount | ผู้ใช้ FlowAccount | FA format |
| QuickBooks | ผู้ใช้ QB | IIF/CSV |

## 6.2 Export Fields

```typescript
interface ExportRecord {
  // === Basic ===
  txn_number: string;
  txn_date: Date;
  description: string;
  
  // === Amount ===
  total_amount: number;
  vat_amount: number;
  net_amount: number;
  wht_amount: number;
  paid_amount: number;
  
  // === Contact ===
  contact_name: string;
  contact_tax_id: string;
  contact_type: "individual" | "company";
  
  // === Classification ===
  category_code: string;
  category_name: string;
  cost_center_code: string;
  cost_center_name: string;
  
  // === Document Refs ===
  invoice_number: string;
  invoice_date: Date;
  receipt_number: string;
  
  // === WHT ===
  wht_type: string; // ภ.ง.ด.3 / ภ.ง.ด.53
  wht_rate: number;
  wht_status: string;
  
  // === Foreign Currency (if any) ===
  foreign_currency: string;
  foreign_amount: number;
  exchange_rate: number;
  
  // === Accounting (for advanced) ===
  debit_account: string;
  credit_account: string;
  
  // === Files ===
  file_urls: string[];
}
```

## 6.3 Export UI

```
┌─────────────────────────────────────────────────────────────────┐
│  📤 Export ข้อมูล                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📅 ช่วงเวลา                                                     │
│  [เดือน ม.ค. 2569 ▼]                                            │
│                                                                 │
│  📊 รายการ: 25 กล่อง (✅ ครบเอกสาร 20 | ⏳ ไม่ครบ 5)            │
│                                                                 │
│  ⚠️ มี 5 รายการที่เอกสารไม่ครบ                                   │
│  [ดูรายการ] [Export เฉพาะที่ครบ]                                │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  📁 Format                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ◉ Excel (Generic) - สำหรับสำนักงานบัญชี                  │   │
│  │ ○ CSV - Import เข้าระบบอื่น                              │   │
│  │ ○ PEAK Format                                            │   │
│  │ ○ Express Format                                         │   │
│  │ ○ ZIP (Excel + ไฟล์เอกสารทั้งหมด)                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ⚙️ Options                                                      │
│  ☑️ รวมไฟล์เอกสาร (แนบไฟล์ใน ZIP)                               │
│  ☑️ แยก sheet ตามหมวด                                           │
│  ☐ รวมรายการไม่ครบเอกสาร                                        │
│                                                                 │
│                                     [ยกเลิก]  [📥 Export]       │
└─────────────────────────────────────────────────────────────────┘
```

---

# 7. Data Model Updates

## 7.1 Extended Transaction

```prisma
model Transaction {
  id                String   @id @default(cuid())
  organizationId    String
  
  // === Basic ===
  txnNumber         String   // TXN-YYYYMM-XXXX
  transactionType   TransactionType
  description       String
  
  // === Amount ===
  totalAmount       Decimal
  vatAmount         Decimal?
  netAmount         Decimal?
  whtAmount         Decimal?
  paidAmount        Decimal  @default(0)
  
  // === Expectations ===
  vatExpected       Boolean  @default(true)
  whtExpected       Boolean  @default(false)
  
  // === Foreign Currency ===
  hasForeignCurrency Boolean @default(false)
  foreignCurrency    String?  // USD, EUR, etc.
  foreignAmount      Decimal?
  exchangeRate       Decimal?
  
  // === Status ===
  status            TransactionStatus
  paymentStatus     PaymentStatus  // unpaid, partial, paid, overpaid
  documentStatus    DocumentStatus // incomplete, complete
  
  // === No Receipt ===
  noReceiptReason   String?  // ถ้าไม่มีเอกสาร
  
  // === Recurring ===
  isRecurring       Boolean  @default(false)
  recurringTemplateId String?
  
  // === Relations ===
  contact           Contact?  @relation(fields: [contactId], references: [id])
  contactId         String?
  category          Category? @relation(fields: [categoryId], references: [id])
  categoryId        String?
  costCenter        CostCenter? @relation(fields: [costCenterId], references: [id])
  costCenterId      String?
  
  subDocuments      SubDocument[]
  whtTracking       WHTTracking[]
  comments          Comment[]
  
  // === Linked Transactions ===
  linkedFromId      String?  // ถ้าเป็น refund/adjustment
  linkedFrom        Transaction? @relation("LinkedTransactions", fields: [linkedFromId], references: [id])
  linkedTo          Transaction[] @relation("LinkedTransactions")
  
  // === Audit ===
  createdBy         String
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum TransactionType {
  expense_standard
  expense_no_vat
  expense_cash
  expense_no_receipt
  expense_foreign
  expense_import
  expense_recurring
  expense_utility
  expense_rent
  expense_subscription
  expense_salary
  expense_sso
  expense_reimbursement
  expense_tax_vat
  expense_tax_wht
  expense_tax_cit
  expense_govt_fee
  expense_bank_fee
  expense_fx_fee
  expense_interest
  adjustment_refund
  adjustment_credit
  adjustment_debit
  adjustment_cancel
  income_standard
  income_service
  income_product
  intercompany
}

enum PaymentStatus {
  unpaid
  partial
  paid
  overpaid
  refunded
}

enum DocumentStatus {
  incomplete
  complete
  not_applicable
}
```

## 7.2 Extended SubDocument

```prisma
model SubDocument {
  id              String   @id @default(cuid())
  transactionId   String
  
  // === Type ===
  docType         DocType
  
  // === Details ===
  docNumber       String?  // เลขที่เอกสาร
  docDate         DateTime?
  amount          Decimal?
  vatAmount       Decimal?
  
  // === Foreign Currency ===
  foreignCurrency String?
  foreignAmount   Decimal?
  exchangeRate    Decimal?
  
  // === Notes ===
  notes           String?
  
  // === Files ===
  files           SubDocumentFile[]
  
  // === Audit ===
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  transaction     Transaction @relation(fields: [transactionId], references: [id])
}

enum DocType {
  // Payment Evidence
  SLIP_TRANSFER
  SLIP_CHEQUE
  BANK_STATEMENT
  CREDIT_CARD_STATEMENT
  PAYPAL_RECEIPT
  PETTY_CASH_VOUCHER
  CASH_PAYMENT
  
  // Expense Evidence
  TAX_INVOICE
  TAX_INVOICE_ABB
  RECEIPT
  CASH_RECEIPT
  INVOICE
  DELIVERY_NOTE
  FOREIGN_INVOICE
  CUSTOMS_FORM
  NO_RECEIPT
  
  // Adjustments
  CREDIT_NOTE
  DEBIT_NOTE
  CANCELLATION
  REFUND_RECEIPT
  
  // WHT
  WHT_CERT_SENT
  WHT_CERT_RECEIVED
  WHT_CERT_INCOMING
  
  // Government
  TAX_PAYMENT_SLIP
  TAX_RECEIPT
  SSO_PAYMENT
  GOVT_RECEIPT
  
  // Other
  CONTRACT
  QUOTATION
  PURCHASE_ORDER
  CLAIM_FORM
  APPROVAL_DOC
  OTHER
}
```

## 7.3 Recurring Template

```prisma
model RecurringTemplate {
  id              String   @id @default(cuid())
  organizationId  String
  
  name            String   // "ค่าเช่าสำนักงาน"
  transactionType TransactionType
  
  // === Default Values ===
  description     String
  totalAmount     Decimal
  contactId       String?
  categoryId      String?
  costCenterId    String?
  
  // === Schedule ===
  frequency       RecurringFrequency // monthly, quarterly, yearly
  dayOfMonth      Int?     // 1-31
  
  // === Status ===
  isActive        Boolean  @default(true)
  lastCreated     DateTime?
  nextDue         DateTime?
  
  transactions    Transaction[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum RecurringFrequency {
  monthly
  quarterly
  yearly
}
```

---

# 8. UI/UX Updates

## 8.1 Unmatched Documents Pool

```
┌─────────────────────────────────────────────────────────────────┐
│  ❓ เอกสารที่ยังไม่ได้จับคู่                          5 รายการ   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  💳 สลิป ฿3,500 | 20 ม.ค. | โอนให้ XYZ                          │
│     └── AI ไม่พบกล่องที่ตรงกัน                                  │
│     └── [🔗 เลือกกล่อง]  [📦 สร้างกล่องใหม่]                   │
│                                                                 │
│  📋 ใบกำกับ ฿8,200 | 18 ม.ค. | ร้าน ABC                         │
│     └── AI พบ 2 กล่องที่อาจตรงกัน                               │
│     └── [🔗 ดูตัวเลือก]  [📦 สร้างกล่องใหม่]                   │
│                                                                 │
│  📋 Statement Paypal $45.00 | 15 ม.ค.                           │
│     └── ไม่มี Thai invoice                                     │
│     └── [📦 สร้างกล่องใหม่ (ต่างประเทศ)]                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 8.2 Payment Tracking

```
┌─────────────────────────────────────────────────────────────────┐
│  📦 ค่าบริการ IT - Phase 1                        #TXN-2501-0012│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  💰 ยอดรวม: ฿100,000                                            │
│                                                                 │
│  📊 สถานะการจ่าย                                                 │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░ 60%                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 💳 มัดจำ 50%        │ ฿50,000  │ 10 ม.ค. │ ✅ จ่ายแล้ว │   │
│  │ 💳 งวด 2 (10%)      │ ฿10,000  │ 20 ม.ค. │ ✅ จ่ายแล้ว │   │
│  │ 💳 งวด 3 (40%)      │ ฿40,000  │ -       │ ⏳ รอจ่าย   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ยอดจ่ายแล้ว: ฿60,000 | ยอดค้าง: ฿40,000                        │
│                                                                 │
│  [+ เพิ่มการจ่ายเงิน]                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 8.3 Recurring Management

```
┌─────────────────────────────────────────────────────────────────┐
│  🔄 รายการประจำ                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ค่าใช้จ่ายประจำเดือนที่ต้องดำเนินการ:                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🏢 ค่าเช่าสำนักงาน        │ ฿50,000 │ ทุกวันที่ 1      │   │
│  │    └── ม.ค.: ✅ | ก.พ.: ⏳ รอสร้าง                      │   │
│  │    └── [สร้างกล่อง ก.พ.]                               │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 💡 ค่าไฟฟ้า               │ ~฿8,500 │ ทุกวันที่ 15     │   │
│  │    └── ม.ค.: ✅ | ก.พ.: ⏳ รอบิล                        │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 🌐 ค่า AWS                 │ $150    │ ทุกวันที่ 3      │   │
│  │    └── ม.ค.: ✅ | ก.พ.: ⏳ รอ statement                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [+ เพิ่มรายการประจำ]                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# 9. Summary

## รองรับ Use Cases

| Category | Use Cases | Status |
|----------|-----------|--------|
| การจ่ายพื้นฐาน | 4 types | ✅ Planned |
| การจ่ายซับซ้อน | 4 types (deposit, installment, batch, partial) | ✅ Planned |
| การคืนเงิน/ปรับปรุง | 5 types | ✅ Planned |
| เบิกจ่าย | 3 types | ✅ Planned |
| ค่าใช้จ่ายประจำ | 3 types | ✅ Planned |
| ภาษี/รัฐบาล | 3 types | ✅ Planned |
| ต่างประเทศ | 3 types | ✅ Planned |
| ค่าธรรมเนียมธนาคาร | 3 types | ✅ Planned |
| สัญญา/โปรเจค | 2 types | ✅ Planned |
| กรณีผิดปกติ | 4 types | ✅ Planned |

## Export Formats

| Format | Target | Status |
|--------|--------|--------|
| Excel (Generic) | สำนักงานบัญชี | ✅ Active |
| CSV | Import ระบบอื่น | ✅ Planned |
| PEAK | ผู้ใช้ PEAK | ✅ Active |
| Express | ผู้ใช้ Express | 📋 Planned |
| FlowAccount | ผู้ใช้ FlowAccount | 📋 Planned |
| ZIP + Files | ส่งไฟล์ครบ | ✅ Active |

## Target Users

| User Type | Features |
|-----------|----------|
| เจ้าของธุรกิจเล็ก | Simple UI, AI auto-classify, Quick upload |
| สำนักงานบัญชี | Multi-org, Batch export, Full tracking, Reports |

---

*Last updated: January 2026*
