# Box Requirements & Status Redesign Plan

> **วันที่สร้าง:** 26 มกราคม 2026  
> **สถานะ:** Draft  
> **ผู้รับผิดชอบ:** Development Team

---

## สารบัญ

1. [ภาพรวมโปรเจกต์](#1-ภาพรวมโปรเจกต์)
2. [ปัญหาปัจจุบัน](#2-ปัญหาปัจจุบัน)
3. [ระบบสถานะใหม่](#3-ระบบสถานะใหม่)
4. [ระบบติดตามเอกสาร](#4-ระบบติดตามเอกสาร)
5. [UI Design](#5-ui-design)
6. [Technical Implementation](#6-technical-implementation)
7. [Migration Plan](#7-migration-plan)
8. [Checklist](#8-checklist)

---

## 1. ภาพรวมโปรเจกต์

### เป้าหมาย

รื้อระบบติดตามเอกสารและสถานะกล่องใหม่ทั้งหมด เพื่อ:

1. **Consolidate Logic** - รวม logic ที่กระจายอยู่หลายไฟล์ให้อยู่ที่เดียว
2. **Clear UI** - ผู้ใช้รู้ชัดเจนว่าต้องทำอะไรต่อ
3. **Maintainable** - ง่ายต่อการเพิ่ม/แก้ไข requirements
4. **Real-world Ready** - รองรับ workflow การทำงานจริง

### ขอบเขต

- แยกตาม **Expense Type** (STANDARD, NO_VAT, PETTY_CASH, FOREIGN)
- ติดตาม **เอกสารที่ต้องมี** ในแต่ละประเภท
- ใช้ **Global Config** (เหมือนกันทุก Organization)
- Redesign ทั้ง **Data Model + UI + Logic**

---

## 2. ปัญหาปัจจุบัน

### 2.1 Logic กระจายหลายไฟล์

| ไฟล์ | หน้าที่ | ปัญหา |
|------|--------|-------|
| `src/lib/document-requirements.ts` | Required docs per type | ซ้ำซ้อน |
| `src/lib/checklist.ts` | Checklist items + completion | แยกจาก requirements |
| `src/lib/config/expense-type-config.ts` | Config with requiredDocs | Define ซ้ำ |
| `src/lib/config/doc-type-config.ts` | Doc type metadata | OK |

### 2.2 สถานะไม่ครอบคลุม

**ปัจจุบัน (4 สถานะ):**
```
DRAFT → PENDING → NEED_DOCS → COMPLETED
```

**ปัญหา:**
- ไม่มี `REJECTED` - กรณีปฏิเสธเอกสาร
- ไม่มี `VOID` - กรณียกเลิกหลังบันทึก
- `COMPLETED` รวม exported + booked - ไม่แยกขั้นตอน
- ไม่มีการ track ว่า "พร้อม export" แต่ยังไม่ได้ export

### 2.3 UI ไม่ชัดเจน

- ผู้ใช้ไม่รู้ว่าต้องทำอะไรต่อ
- ไม่มี "Next Actions" section
- Process bar ไม่ได้แสดงตำแหน่งใน workflow ชัดเจน

---

## 3. ระบบสถานะใหม่

### 3.1 Status Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DOCUMENT LIFECYCLE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────┐      ┌─────────────────┐      ┌─────────────────┐            │
│   │  DRAFT  │─────▶│ PENDING_REVIEW  │─────▶│ READY_TO_EXPORT │            │
│   │ แบบร่าง  │      │    รอตรวจ       │      │   พร้อม Export  │            │
│   └─────────┘      └────────┬────────┘      └────────┬────────┘            │
│                             │                        │                      │
│                             │                        ▼                      │
│                             │               ┌─────────────────┐            │
│                             │               │    EXPORTED     │            │
│                             │               │  Export แล้ว    │            │
│                             │               └────────┬────────┘            │
│                             │                        │                      │
│                             ▼                        ▼                      │
│                    ┌─────────────────┐      ┌─────────────────┐            │
│                    │  NEED_ACTION    │      │     BOOKED      │            │
│                    │  ขอดำเนินการ    │      │   บันทึกแล้ว    │            │
│                    └────────┬────────┘      └────────┬────────┘            │
│                             │                        │                      │
│                             │                        ▼                      │
│                    ┌────────┴────────┐      ┌─────────────────┐            │
│                    │    REJECTED     │      │      VOID       │            │
│                    │     ปฏิเสธ      │      │     ยกเลิก      │            │
│                    └─────────────────┘      └─────────────────┘            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Status Definition (8 สถานะ)

| # | Status | Thai | Description | Who Can See | Who Can Act |
|---|--------|------|-------------|-------------|-------------|
| 1 | `DRAFT` | แบบร่าง | กำลังกรอกข้อมูล/อัปโหลดเอกสาร | Staff, Accounting | Staff |
| 2 | `PENDING_REVIEW` | รอตรวจสอบ | ส่งให้บัญชีแล้ว รอตรวจ | Staff, Accounting | Accounting |
| 3 | `NEED_ACTION` | ขอดำเนินการ | บัญชีขอข้อมูลเพิ่ม/แก้ไข | Staff, Accounting | Staff |
| 4 | `READY_TO_EXPORT` | พร้อม Export | ตรวจสอบแล้ว พร้อมส่งออก | Accounting | Accounting |
| 5 | `EXPORTED` | Export แล้ว | Export ไฟล์แล้ว รอบันทึกเข้าระบบ | Accounting | Accounting |
| 6 | `BOOKED` | บันทึกแล้ว | บันทึกเข้าระบบบัญชีแล้ว | All | Admin only |
| 7 | `REJECTED` | ปฏิเสธ | ถูกปฏิเสธ ใช้ไม่ได้ | Staff, Accounting | - |
| 8 | `VOID` | ยกเลิก | ยกเลิกหลังบันทึกแล้ว | All | Admin only |

### 3.3 Status Transitions

```typescript
const STATUS_TRANSITIONS = {
  DRAFT: {
    advance: ['PENDING_REVIEW'],
    revert: [],
    delete: true,
  },
  PENDING_REVIEW: {
    advance: ['READY_TO_EXPORT', 'NEED_ACTION', 'REJECTED'],
    revert: ['DRAFT'],  // Staff ถอนกลับ
  },
  NEED_ACTION: {
    advance: ['PENDING_REVIEW'],  // ส่งตรวจอีกครั้ง
    revert: ['REJECTED'],
  },
  READY_TO_EXPORT: {
    advance: ['EXPORTED'],
    revert: ['NEED_ACTION', 'PENDING_REVIEW'],
  },
  EXPORTED: {
    advance: ['BOOKED'],
    revert: ['READY_TO_EXPORT'],
  },
  BOOKED: {
    advance: ['VOID'],  // Admin only
    revert: ['EXPORTED'],  // Admin only
  },
  REJECTED: {
    advance: [],
    revert: ['PENDING_REVIEW'],  // Accounting ยกเลิกการปฏิเสธ
    delete: true,
  },
  VOID: {
    advance: [],
    revert: [],  // Final state
  },
};
```

### 3.4 Status Colors & Icons

| Status | Icon | Light BG | Light Text | Dark BG | Dark Text |
|--------|------|----------|------------|---------|-----------|
| DRAFT | ⚪ | `slate-100` | `slate-700` | `slate-800` | `slate-300` |
| PENDING_REVIEW | 🔵 | `blue-100` | `blue-700` | `blue-900/50` | `blue-300` |
| NEED_ACTION | 🟠 | `orange-100` | `orange-700` | `orange-900/50` | `orange-300` |
| READY_TO_EXPORT | 🟢 | `emerald-100` | `emerald-700` | `emerald-900/50` | `emerald-300` |
| EXPORTED | 🔷 | `cyan-100` | `cyan-700` | `cyan-900/50` | `cyan-300` |
| BOOKED | 🟣 | `purple-100` | `purple-700` | `purple-900/50` | `purple-300` |
| REJECTED | 🔴 | `red-100` | `red-700` | `red-900/50` | `red-300` |
| VOID | ⚫ | `gray-200` | `gray-600` | `gray-800` | `gray-400` |

---

## 4. ระบบติดตามเอกสาร

### 4.1 Unified Requirements Config

```typescript
// src/lib/config/box-requirements.ts

interface RequirementItem {
  id: string;
  type: 'document' | 'action' | 'confirmation';
  label: string;
  description: string;
  required: boolean;
  // For document type
  docTypes?: DocType[];  // doc types that satisfy this
  // For action/confirmation type
  actionId?: string;     // e.g., "confirm_paid", "send_wht"
  // Dependencies
  dependsOn?: string[];  // requirement IDs that must complete first
}

interface ExpenseTypeRequirements {
  label: string;
  description: string;
  icon: LucideIcon;
  colorClass: string;
  requirements: RequirementItem[];
  conditionalRequirements: {
    hasVat?: RequirementItem[];
    hasWht?: RequirementItem[];
  };
}
```

### 4.2 Requirements by Expense Type

#### STANDARD (มีใบกำกับภาษี)

| # | ID | Type | Label | Required | Matching DocTypes |
|---|-----|------|-------|----------|-------------------|
| 1 | `tax_invoice` | document | ใบกำกับภาษี | ✓ | TAX_INVOICE, TAX_INVOICE_ABB |
| 2 | `payment_proof` | document | หลักฐานการชำระเงิน | ✓ | SLIP_TRANSFER, SLIP_CHEQUE, BANK_STATEMENT |
| 3 | `wht_doc` | document | หนังสือหัก ณ ที่จ่าย | ✓ (if hasWht) | WHT_SENT |
| 4 | `wht_sent` | confirmation | ส่ง WHT ให้คู่ค้าแล้ว | ✓ (if hasWht) | - |
| 5 | `wht_confirmed` | confirmation | คู่ค้ายืนยันรับ WHT | ✗ | - |

#### NO_VAT (ไม่มีใบกำกับภาษี)

| # | ID | Type | Label | Required | Matching DocTypes |
|---|-----|------|-------|----------|-------------------|
| 1 | `cash_receipt` | document | บิลเงินสด/ใบเสร็จ | ✓ | CASH_RECEIPT, RECEIPT, OTHER |
| 2 | `payment_proof` | document | หลักฐานการชำระเงิน | ✓ | SLIP_TRANSFER, SLIP_CHEQUE, BANK_STATEMENT |
| 3 | `no_receipt_confirm` | confirmation | ยืนยันไม่มีบิล | ✗ | - (alternative to cash_receipt) |

#### PETTY_CASH (เบิกเงินสดย่อย)

| # | ID | Type | Label | Required | Matching DocTypes |
|---|-----|------|-------|----------|-------------------|
| 1 | `confirm_paid` | confirmation | จ่ายเงินสดแล้ว | ✓ | - |
| 2 | `petty_cash_voucher` | document | ใบสำคัญจ่าย/บิล | ✗ | PETTY_CASH_VOUCHER, CASH_RECEIPT |

#### FOREIGN (จ่ายต่างประเทศ)

| # | ID | Type | Label | Required | Matching DocTypes |
|---|-----|------|-------|----------|-------------------|
| 1 | `foreign_invoice` | document | Invoice ต่างประเทศ | ✓ | FOREIGN_INVOICE |
| 2 | `payment_proof` | document | หลักฐานการชำระเงิน | ✓ | SLIP_TRANSFER, BANK_STATEMENT, ONLINE_RECEIPT |

### 4.3 Requirement Service

```typescript
// src/lib/services/box-requirements.service.ts

class BoxRequirementsService {
  // Get all requirements for a box
  getRequirements(box: Box): RequirementItem[]
  
  // Check status of each requirement
  checkRequirements(box: Box, files: Document[]): RequirementStatus[]
  
  // Get next actions for user
  getNextActions(box: Box, files: Document[]): NextAction[]
  
  // Calculate completion percentage
  getCompletionStatus(box: Box, files: Document[]): { 
    percent: number;
    isComplete: boolean;
    completedCount: number;
    totalRequired: number;
  }
  
  // Check if can submit for review
  canSubmitForReview(box: Box, files: Document[]): {
    canSubmit: boolean;
    missingRequirements: RequirementItem[];
  }
}
```

---

## 5. UI Design

### 5.1 Box Detail Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ← กลับ                                              [แก้ไข] [ลบ] [⋮]       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ BOX HEADER ───────────────────────────────────────────────────────────┐ │
│  │  ┌────────┐   BOX-202601-0042                                          │ │
│  │  │  📄    │   ค่าจ้างออกแบบเว็บไซต์                                     │ │
│  │  │ 15,000 │                                                            │ │
│  │  └────────┘   [EXPENSE] [มี VAT ✓] [มี WHT 3%]                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─ STATUS HERO + PROCESS BAR ────────────────────────────────────────────┐ │
│  │  (ดูรายละเอียดด้านล่าง)                                                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐   │
│  │  LEFT COLUMN                    │  │  RIGHT COLUMN                   │   │
│  │  - Requirements Panel           │  │  - Box Info                     │   │
│  │  - Document Checklist           │  │  - Amount Details               │   │
│  │  - Next Actions                 │  │  - Contact Info                 │   │
│  │                                 │  │  - Activity Log                 │   │
│  └─────────────────────────────────┘  └─────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Status Hero Section

แต่ละสถานะแสดงต่างกัน:

#### DRAFT

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚪ แบบร่าง                                                     │
│                                                                 │
│  กำลังกรอกข้อมูลและอัปโหลดเอกสาร                                │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  📋 ก่อนส่งบัญชี ต้องมี:                                   │  │
│  │  ✅ ใบกำกับภาษี                                           │  │
│  │  ⭕ หลักฐานการชำระเงิน                                    │  │
│  │  ⭕ หนังสือหัก ณ ที่จ่าย                                   │  │
│  │  ยังขาด 2 รายการ                                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [ ✏️ แก้ไขข้อมูล ]  [ 📤 อัปโหลดเอกสาร ]                        │
│  ─────────────────────────────────────────────────────────────  │
│  [ ▶️ ส่งให้บัญชีตรวจสอบ ]  ← disabled ถ้าเอกสารไม่ครบ          │
└─────────────────────────────────────────────────────────────────┘
```

#### PENDING_REVIEW (Staff View)

```
┌─────────────────────────────────────────────────────────────────┐
│  🔵 รอตรวจสอบ                                                   │
│                                                                 │
│  ส่งให้บัญชีตรวจสอบเมื่อ 16 ม.ค. 2026 เวลา 14:30                │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ⏳ รอบัญชีตรวจสอบ                                         │  │
│  │     โดยปกติใช้เวลา 1-2 วันทำการ                            │  │
│  │     อยู่ในคิว: ลำดับที่ 5                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [ ↩️ ยกเลิกการส่ง ]                                            │
└─────────────────────────────────────────────────────────────────┘
```

#### PENDING_REVIEW (Accounting View)

```
┌─────────────────────────────────────────────────────────────────┐
│  🔵 รอตรวจสอบ                                                   │
│                                                                 │
│  ส่งโดย: สมชาย ใจดี - 16 ม.ค. 2026                              │
│  รอตรวจ: 1 วัน 3 ชั่วโมง                                        │
│                                                                 │
│  ┌─ REVIEW CHECKLIST ───────────────────────────────────────┐   │
│  │  ☑️  ข้อมูลครบถ้วน                                        │   │
│  │  ☑️  ใบกำกับภาษีถูกต้อง                                   │   │
│  │  ☑️  สลิปตรงกับยอดเงิน                                    │   │
│  │  ☐  WHT rate ถูกต้อง                                      │   │
│  │  ☐  หมวดค่าใช้จ่ายเหมาะสม                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [ ✅ อนุมัติ ]  [ ❓ ขอข้อมูลเพิ่ม ]  [ ❌ ปฏิเสธ ]              │
└─────────────────────────────────────────────────────────────────┘
```

#### NEED_ACTION

```
┌─────────────────────────────────────────────────────────────────┐
│  🟠 ขอดำเนินการ                                                 │
│                                                                 │
│  บัญชีขอข้อมูลเพิ่มเติม                                         │
│                                                                 │
│  ┌─ MESSAGE FROM ACCOUNTING ────────────────────────────────┐   │
│  │  💬 "ใบกำกับภาษีไม่ชัด กรุณาอัปโหลดใหม่                    │   │
│  │      และขอสลิปโอนเงินด้วยครับ"                            │   │
│  │                                                          │   │
│  │  โดย: คุณวิภา (บัญชี) - 17 ม.ค. 2026                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ สิ่งที่ต้องทำ ──────────────────────────────────────────┐   │
│  │  ⭕ อัปโหลดใบกำกับภาษีใหม่                                 │   │
│  │  ⭕ อัปโหลดสลิปโอนเงิน                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [ 📤 อัปโหลดเอกสาร ]  [ 💬 ตอบกลับ ]                            │
│  ─────────────────────────────────────────────────────────────  │
│  [ ▶️ ส่งให้บัญชีตรวจอีกครั้ง ]                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### READY_TO_EXPORT

```
┌─────────────────────────────────────────────────────────────────┐
│  🟢 พร้อม Export                                                │
│                                                                 │
│  ตรวจสอบแล้ว พร้อมส่งออกข้อมูล                                  │
│  อนุมัติโดย: คุณวิภา - 18 ม.ค. 2026                             │
│                                                                 │
│  ┌─ EXPORT OPTIONS ─────────────────────────────────────────┐   │
│  │  เลือกรูปแบบ Export:                                      │   │
│  │  ○ PEAK Accounting                                       │   │
│  │  ○ Excel (Generic)                                       │   │
│  │  ○ ZIP (เอกสารทั้งหมด)                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [ 📥 Export ]  [ ↩️ ส่งกลับให้ Staff แก้ไข ]                    │
└─────────────────────────────────────────────────────────────────┘
```

#### EXPORTED

```
┌─────────────────────────────────────────────────────────────────┐
│  🔷 Export แล้ว                                                 │
│                                                                 │
│  Export เมื่อ 19 ม.ค. 2026 เวลา 11:30                           │
│  รูปแบบ: PEAK Accounting                                        │
│                                                                 │
│  ┌─ EXPORT HISTORY ─────────────────────────────────────────┐   │
│  │  📄 peak_export_20260119.xlsx  [📥 ดาวน์โหลด]             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ⏳ รอบันทึกเข้าระบบบัญชี                                  │  │
│  │     กรุณานำไฟล์ไป import ใน PEAK แล้วกดยืนยัน              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [ ✅ บันทึกเข้าระบบบัญชีแล้ว ]  [ 📥 Export อีกครั้ง ]          │
└─────────────────────────────────────────────────────────────────┘
```

#### BOOKED

```
┌─────────────────────────────────────────────────────────────────┐
│  🟣 บันทึกแล้ว                                                  │
│                                                                 │
│  บันทึกเข้าระบบบัญชีเมื่อ 20 ม.ค. 2026                          │
│  โดย: คุณวิภา (บัญชี)                                           │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ✅ รายการนี้เสร็จสมบูรณ์แล้ว                               │  │
│  │  📊 บันทึกในงวด: มกราคม 2026                               │  │
│  │  🔒 งวดบัญชี: เปิดอยู่                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ SUMMARY ────────────────────────────────────────────────┐   │
│  │  ยอดบันทึก          ฿15,000.00                           │   │
│  │  VAT ขอคืน          ฿   981.31                           │   │
│  │  WHT หัก ณ ที่จ่าย   ฿   450.00                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [ 📄 ดูเอกสาร ]  [ 📥 ดาวน์โหลด ]                               │
│  🔒 Admin: [ ↩️ ยกเลิกการบันทึก ]  [ ⛔ Void รายการ ]           │
└─────────────────────────────────────────────────────────────────┘
```

#### REJECTED

```
┌─────────────────────────────────────────────────────────────────┐
│  🔴 ปฏิเสธ                                                      │
│                                                                 │
│  รายการนี้ถูกปฏิเสธ                                             │
│                                                                 │
│  ┌─ REJECTION REASON ───────────────────────────────────────┐   │
│  │  ❌ "เอกสารปลอม / ไม่ใช่ค่าใช้จ่ายของบริษัท"              │   │
│  │  โดย: คุณวิภา (บัญชี) - 17 ม.ค. 2026                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ⚠️ รายการนี้จะไม่ถูกนำไปบันทึกบัญชี                            │
│                                                                 │
│  [ 💬 ส่งข้อความถึงบัญชี ]  [ 🗑️ ลบรายการ ]                      │
└─────────────────────────────────────────────────────────────────┘
```

#### VOID

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚫ ยกเลิก                                                      │
│                                                                 │
│  รายการนี้ถูกยกเลิกหลังจากบันทึกบัญชีแล้ว                       │
│                                                                 │
│  ┌─ VOID REASON ────────────────────────────────────────────┐   │
│  │  ⛔ "ลูกค้าขอคืนเงิน - ออก CN แล้ว"                       │   │
│  │  โดย: Admin (สมศักดิ์) - 25 ม.ค. 2026                     │   │
│  │  เอกสารอ้างอิง: CN-202601-0005                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🔒 รายการนี้ถูกล็อก ไม่สามารถแก้ไขได้                          │
│                                                                 │
│  [ 📄 ดูเอกสาร ]  [ 📜 ดูประวัติ ]                               │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Process Timeline

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌─ PROCESS TIMELINE ─────────────────────────────────────────┐ │
│  │                                                            │ │
│  │   ✅────────●────────○────────○────────○────────○          │ │
│  │                                                            │ │
│  │  แบบร่าง  รอตรวจ  พร้อมExport  Exported  บันทึกแล้ว        │ │
│  │  15 ม.ค.  16 ม.ค.                                          │ │
│  │                                                            │ │
│  │  ─────────────────────────────────────────────────────     │ │
│  │                                                            │ │
│  │  📍 ตำแหน่งปัจจุบัน: รอตรวจสอบ (ขั้นตอนที่ 2/6)             │ │
│  │  ⏱️  อยู่ในสถานะนี้: 1 วัน 3 ชั่วโมง                        │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

Process Bar States:
┌──────────────┬──────┬─────────────┬──────────────────────────┐
│ State        │ Icon │ Color       │ Description              │
├──────────────┼──────┼─────────────┼──────────────────────────┤
│ Completed    │ ✅   │ Green       │ ผ่านขั้นตอนนี้แล้ว        │
│ Current      │ ●    │ Blue+Pulse  │ ขั้นตอนปัจจุบัน          │
│ Upcoming     │ ○    │ Gray        │ ยังไม่ถึง                │
│ Need Action  │ ⚠️   │ Orange      │ ต้องดำเนินการ            │
│ Rejected     │ ❌   │ Red         │ ถูกปฏิเสธ                │
└──────────────┴──────┴─────────────┴──────────────────────────┘
```

### 5.4 Requirements Panel

```
┌─────────────────────────────────────────────────────────────────┐
│  📋 เอกสารและสิ่งที่ต้องทำ                                      │
│                                                                 │
│  ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░  3/5 (60%)      │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  🟠 ยังขาด 2 รายการ กรุณาดำเนินการเพื่อส่งบัญชี            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  📄 เอกสารที่ต้องมี                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ✅  ใบกำกับภาษี                                            │  │
│  │     เอกสารหลักสำหรับขอคืน VAT                              │  │
│  │     ┌────────────────────────────────────────────────┐    │  │
│  │     │ 🖼️ invoice.pdf   [ใบกำกับภาษี▼]  [👁][🗑]      │    │  │
│  │     └────────────────────────────────────────────────┘    │  │
│  │     [+ เพิ่มไฟล์]                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ⭕  หลักฐานการชำระเงิน                         *จำเป็น    │  │
│  │     สลิปโอนเงิน, เช็ค หรือ Statement                      │  │
│  │                                                           │  │
│  │     ┌─────────────────────────────────────────────────┐   │  │
│  │     │  📤 ลากไฟล์มาวาง หรือคลิกเพื่ออัปโหลด            │   │  │
│  │     └─────────────────────────────────────────────────┘   │  │
│  │                                                           │  │
│  │     ─── หรือ ───                                          │  │
│  │     [ 💵 จ่ายเงินสดแล้ว (ไม่มีสลิป) ]                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  📝 การดำเนินการเรื่องหัก ณ ที่จ่าย (WHT 3%)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ⭕  อัปโหลดหนังสือหัก ณ ที่จ่าย                  *จำเป็น   │  │
│  │     หนังสือรับรองการหักภาษี ณ ที่จ่าย 3%                   │  │
│  │     [ 📤 อัปโหลด ]                                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ⚪  ส่งหนังสือหัก ณ ที่จ่ายให้คู่ค้า            (รอขั้นก่อน) │  │
│  │     ยืนยันว่าส่งให้คู่ค้าแล้ว                              │  │
│  │     [ ✅ ยืนยัน - ส่งแล้ว ]  ← disabled                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  📎 เอกสารประกอบ (ไม่บังคับ)                         [▼ ขยาย]  │
│     ใบเสนอราคา, ใบสั่งซื้อ, สัญญา, ใบส่งของ                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📋 สิ่งที่ต้องทำต่อ                                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  [ 📤 อัปโหลดสลิป ]  [ 📤 อัปโหลด WHT ]                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.5 Box Info Panel

```
┌─────────────────────────────────────────────────────────────────┐
│  📝 ข้อมูลรายการ                                     [แก้ไข]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ชื่อรายการ                                                     │
│  ค่าจ้างออกแบบเว็บไซต์                                          │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  💰 ยอดเงิน                                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ยอดก่อน VAT        ฿14,018.69                            │  │
│  │  VAT 7%             ฿   981.31                            │  │
│  │  ──────────────────────────────                           │  │
│  │  ยอดรวม             ฿15,000.00                            │  │
│  │  หัก ณ ที่จ่าย 3%   ฿   450.00                            │  │
│  │  ──────────────────────────────                           │  │
│  │  ยอดจ่ายจริง        ฿14,550.00                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  📅 วันที่                                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  วันที่เอกสาร       15 ม.ค. 2026                          │  │
│  │  วันที่ชำระเงิน     16 ม.ค. 2026                          │  │
│  │  งวดบัญชี           มกราคม 2026                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  🏢 คู่ค้า                                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ┌────┐  บริษัท ดีไซน์สตูดิโอ จำกัด                       │  │
│  │  │ 🏢 │  เลขประจำตัว: 0105556012345                       │  │
│  │  └────┘  📧 contact@design.co.th                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  🏷️ การจัดหมวดหมู่                                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  หมวดค่าใช้จ่าย     ค่าบริการ/ค่าจ้าง                      │  │
│  │  ศูนย์ต้นทุน        ฝ่ายการตลาด                           │  │
│  │  วิธีชำระ           โอนเงิน                               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  📝 หมายเหตุ                                                    │
│  ค่าออกแบบ Landing Page โปรโมชั่น Q1                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.6 Activity Log

```
┌─────────────────────────────────────────────────────────────────┐
│  📜 ประวัติการดำเนินการ                             [ดูทั้งหมด] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ● 16 ม.ค. 14:30 - ส่งให้บัญชีตรวจสอบ                           │
│    โดย สมชาย ใจดี                                               │
│                                                                 │
│  ● 16 ม.ค. 14:25 - อัปโหลดหนังสือหัก ณ ที่จ่าย                  │
│    โดย สมชาย ใจดี                                               │
│                                                                 │
│  ● 15 ม.ค. 10:00 - อัปโหลดสลิปโอนเงิน                           │
│    โดย สมชาย ใจดี                                               │
│                                                                 │
│  ● 15 ม.ค. 09:45 - สร้างรายการ                                  │
│    โดย สมชาย ใจดี                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.7 Mobile Layout

```
┌───────────────────────────────┐
│  ← กลับ           [⋮]        │
├───────────────────────────────┤
│                               │
│  BOX-202601-0042              │
│  ค่าจ้างออกแบบเว็บไซต์         │
│  ┌─────────────────────────┐  │
│  │   💰 ฿15,000.00         │  │
│  │   EXPENSE | มีใบกำกับ    │  │
│  └─────────────────────────┘  │
│                               │
├───────────────────────────────┤
│  PROCESS (Vertical)           │
│  ✅ แบบร่าง      15 ม.ค.      │
│  │                            │
│  ● รอตรวจสอบ    16 ม.ค.      │
│  │  ⏳ รอบัญชีตรวจ            │
│  │                            │
│  ○ พร้อม Export               │
│  ○ Exported                   │
│  ○ บันทึกแล้ว                 │
│                               │
├───────────────────────────────┤
│  📋 เอกสาร         3/5 (60%)  │
│  ████████████░░░░░░░░░░░░░░░  │
│  🟠 ยังขาด 2 รายการ           │
│                               │
│  ✅ ใบกำกับภาษี               │
│  ✅ สลิปโอนเงิน               │
│  ✅ หนังสือหัก ณ ที่จ่าย       │
│  ⭕ ส่ง WHT ให้คู่ค้า *จำเป็น  │
│  ⚪ คู่ค้ายืนยันรับ            │
│                               │
├───────────────────────────────┤
│  📝 ข้อมูล        [แก้ไข]     │
│  วันที่   15 ม.ค. 2026        │
│  คู่ค้า   ดีไซน์สตูดิโอ        │
│  หมวด    ค่าบริการ            │
│                               │
├───────────────────────────────┤
│  📜 ประวัติ       [ดูทั้งหมด]  │
│  ● 16 ม.ค. ส่งให้บัญชี        │
│  ● 15 ม.ค. สร้างรายการ        │
└───────────────────────────────┘
```

---

## 6. Technical Implementation

### 6.1 Files to Create

| File | Description |
|------|-------------|
| `src/lib/config/box-requirements.ts` | Unified requirements config |
| `src/lib/config/box-status.ts` | Status definitions & transitions |
| `src/lib/services/box-requirements.service.ts` | Requirement checking logic |
| `src/components/documents/box-detail/StatusHero.tsx` | Status display component |
| `src/components/documents/box-detail/ProcessTimeline.tsx` | Process bar component |
| `src/components/documents/box-detail/RequirementsPanel.tsx` | Requirements checklist |
| `src/components/documents/box-detail/BoxInfoPanel.tsx` | Box info display |
| `src/components/documents/box-detail/ActivityLog.tsx` | Activity history |

### 6.2 Files to Modify

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Update BoxStatus enum (add new statuses) |
| `src/types/index.ts` | Update TypeScript types |
| `src/lib/config/status-transitions.ts` | Update transition rules |
| `src/components/documents/box-detail/BoxDetail.tsx` | Use new components |
| `src/server/actions/box/review.ts` | Update status change logic |

### 6.3 Files to Deprecate

| File | Replacement |
|------|-------------|
| `src/lib/document-requirements.ts` | `box-requirements.ts` |
| `src/lib/checklist.ts` | `box-requirements.service.ts` |
| `src/components/documents/box-detail/DocumentChecklist.tsx` | `RequirementsPanel.tsx` |

### 6.4 Database Migration

```sql
-- Update BoxStatus enum
ALTER TYPE "BoxStatus" ADD VALUE 'PENDING_REVIEW';
ALTER TYPE "BoxStatus" ADD VALUE 'NEED_ACTION';
ALTER TYPE "BoxStatus" ADD VALUE 'READY_TO_EXPORT';
ALTER TYPE "BoxStatus" ADD VALUE 'EXPORTED';
ALTER TYPE "BoxStatus" ADD VALUE 'BOOKED';
ALTER TYPE "BoxStatus" ADD VALUE 'REJECTED';
ALTER TYPE "BoxStatus" ADD VALUE 'VOID';

-- Migrate existing data
UPDATE "Box" SET status = 'PENDING_REVIEW' WHERE status = 'PENDING';
UPDATE "Box" SET status = 'NEED_ACTION' WHERE status = 'NEED_DOCS';
UPDATE "Box" SET status = 'BOOKED' WHERE status = 'COMPLETED';

-- Remove old values (after migration)
-- ALTER TYPE "BoxStatus" DROP VALUE 'PENDING';
-- ALTER TYPE "BoxStatus" DROP VALUE 'NEED_DOCS';
-- ALTER TYPE "BoxStatus" DROP VALUE 'COMPLETED';

-- Add new fields for status tracking
ALTER TABLE "Box" ADD COLUMN "statusMessage" TEXT;
ALTER TABLE "Box" ADD COLUMN "statusChangedBy" TEXT;
ALTER TABLE "Box" ADD COLUMN "statusChangedAt" TIMESTAMP;
```

---

## 7. Migration Plan

### Phase 1: Setup (1-2 days)

- [ ] Create new config files (`box-requirements.ts`, `box-status.ts`)
- [ ] Create requirement service (`box-requirements.service.ts`)
- [ ] Update Prisma schema with new statuses
- [ ] Create database migration script

### Phase 2: UI Components (2-3 days)

- [ ] Create `StatusHero.tsx` component
- [ ] Create `ProcessTimeline.tsx` component
- [ ] Create `RequirementsPanel.tsx` component
- [ ] Create `BoxInfoPanel.tsx` component
- [ ] Create `ActivityLog.tsx` component

### Phase 3: Integration (1-2 days)

- [ ] Update `BoxDetail.tsx` to use new components
- [ ] Update status transition logic in server actions
- [ ] Update role-based permissions for each status

### Phase 4: Testing & Cleanup (1-2 days)

- [ ] Test all status transitions
- [ ] Test requirements checking for all expense types
- [ ] Test mobile responsiveness
- [ ] Remove deprecated files
- [ ] Update documentation

---

## 8. Checklist

### Requirements Config
- [ ] Define requirements for STANDARD expense type
- [ ] Define requirements for NO_VAT expense type
- [ ] Define requirements for PETTY_CASH expense type
- [ ] Define requirements for FOREIGN expense type
- [ ] Define conditional requirements (hasVat, hasWht)

### Status System
- [ ] Define all 8 statuses
- [ ] Define status transitions
- [ ] Define role permissions per status
- [ ] Define status colors and icons

### UI Components
- [ ] StatusHero component with all status variants
- [ ] ProcessTimeline component
- [ ] RequirementsPanel component
- [ ] BoxInfoPanel component
- [ ] ActivityLog component
- [ ] Mobile responsive layouts

### Server Logic
- [ ] Status transition validation
- [ ] Requirement checking service
- [ ] Permission checking per status
- [ ] Activity logging on status change

### Database
- [ ] Create migration for new statuses
- [ ] Migrate existing data
- [ ] Add status tracking fields

### Testing
- [ ] Unit tests for requirement service
- [ ] Integration tests for status transitions
- [ ] E2E tests for full workflow
- [ ] Mobile testing

---

## Appendix

### A. Status Icon Reference

| Status | Emoji | Lucide Icon |
|--------|-------|-------------|
| DRAFT | ⚪ | `Circle` |
| PENDING_REVIEW | 🔵 | `Clock` |
| NEED_ACTION | 🟠 | `AlertCircle` |
| READY_TO_EXPORT | 🟢 | `CheckCircle` |
| EXPORTED | 🔷 | `Download` |
| BOOKED | 🟣 | `BookCheck` |
| REJECTED | 🔴 | `XCircle` |
| VOID | ⚫ | `Ban` |

### B. Requirement Status Icons

| Status | Icon | Description |
|--------|------|-------------|
| Complete | ✅ | มีเอกสาร/ยืนยันแล้ว |
| Pending | ⭕ | ยังไม่มี (จำเป็น) |
| Waiting | ⚪ | รอขั้นตอนก่อนหน้า |
| Optional | 🟡 | ไม่บังคับ |
