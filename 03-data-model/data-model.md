# 🗃️ Data Model

> **Multi-tenant**: ทุก Entity มี `organization_id` เพื่อแยกข้อมูลตามบริษัท
> 
> **Core Concept**: 1 กล่อง (Transaction) = 1 ธุรกรรม → มีหลายเอกสาร (SubDocument) → แต่ละเอกสารมีหลายไฟล์ได้

## ER Diagram Overview

```
                          ┌─────────────────────┐
                          │    Organization     │ ← บริษัท/องค์กร (Multi-tenant root)
                          │  (บริษัท/องค์กร)    │
                          └──────────┬──────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
          ▼                          ▼                          ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      User       │     │   CostCenter    │     │    Contact      │
│ + org_id        │     │ + org_id        │     │ + org_id        │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │                       ▼                       │
         │         ┌─────────────────────────────────────┴───────┐
         │         │              Transaction (กล่อง)             │
         └────────▶│  1 กล่อง = 1 ธุรกรรม (รายจ่าย/รายรับ)       │
                   │  + WHT tracking + Timeline                  │
                   └──────────────────┬──────────────────────────┘
                                      │
                          ┌───────────┴───────────┐
                          ▼                       ▼
              ┌─────────────────┐     ┌─────────────────┐
              │  SubDocument    │     │   Comment       │
              │ (เอกสารในกล่อง) │     │   (พูดคุย)      │
              │ สลิป/ใบกำกับ/WHT│     └─────────────────┘
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  DocumentFile   │
              │  (ไฟล์ของเอกสาร) │
              │  หลายหน้าได้    │
              └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│   WHTTracking   │     │   ActivityLog   │
│ ติดตาม WHT      │     │   ประวัติ       │
└─────────────────┘     └─────────────────┘
```

---

## 3.0 Organization (บริษัท/องค์กร) — Multi-tenant Root

> Entity หลักสำหรับ Multi-tenant: ทุกข้อมูลจะแยกตามบริษัท

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `name` | string | ชื่อบริษัท/องค์กร |
| `slug` | string | URL-friendly identifier (unique) |
| `tax_id` | string | เลขประจำตัวผู้เสียภาษี |
| `address` | text | ที่อยู่ |
| `phone` | string | โทรศัพท์ |
| `email` | string | อีเมลติดต่อ |
| `logo_url` | string | โลโก้บริษัท |
| `settings` | JSON | ตั้งค่าต่างๆ (default VAT, fiscal year start, etc.) |
| `plan` | enum | free \| pro \| enterprise (สำหรับ billing) |
| `is_active` | boolean | สถานะใช้งาน |
| `created_at` | timestamp | วันที่สร้าง |

### Organization Settings (JSON)
```json
{
  "default_vat_type": "vat_7",
  "fiscal_year_start_month": 1,
  "default_currency": "THB",
  "doc_number_prefix": "TXN",
  "require_approval": false,
  "allowed_file_types": ["image/jpeg", "image/png", "application/pdf"]
}
```

---

## 3.0.1 OrganizationMember (สมาชิกในองค์กร)

> เชื่อมระหว่าง User กับ Organization (Many-to-Many + Role)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | FK | บริษัท/องค์กร |
| `user_id` | FK | ผู้ใช้งาน |
| `role` | enum | staff \| accounting \| admin \| owner |
| `is_default` | boolean | เป็นองค์กรหลักของ user นี้หรือไม่ |
| `joined_at` | timestamp | วันที่เข้าร่วม |
| `invited_by` | FK | ผู้เชิญ (nullable) |
| `status` | enum | active \| pending \| suspended |

### Role Permissions

| Role | Create | Review | Export | Settings | Manage Users | Billing |
|------|--------|--------|--------|----------|--------------|---------|
| `staff` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `accounting` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `owner` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 3.1 Transaction (กล่องเอกสาร / ธุรกรรม) ⭐ NEW

> **Core Entity**: 1 กล่อง = 1 ธุรกรรม (รายจ่าย/รายรับ) ที่มีเอกสารหลายประเภท

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | FK | **บริษัท/องค์กร (Multi-tenant)** |
| `txn_number` | string | เลขที่กล่อง auto-gen: TXN-YYYYMM-XXXX |
| `transaction_type` | enum | **expense (รายจ่าย) \| income (รายรับ)** |
| `description` | string | คำอธิบาย/ชื่อรายการ เช่น "ค่าบริการ IT เดือน ม.ค." |
| `contact_id` | FK | คู่ค้า/ลูกค้า |
| `cost_center_id` | FK | ศูนย์ต้นทุน |
| `category_id` | FK | หมวดค่าใช้จ่าย |
| `total_amount` | decimal | ยอดรวมทั้งหมด |
| `currency` | string | สกุลเงิน (default: THB) |
| `vat_type` | enum | vat_7 \| no_vat |
| `has_wht` | boolean | มีหัก ณ ที่จ่ายหรือไม่ |
| `wht_amount` | decimal | จำนวน WHT (ถ้ามี) |
| `payment_method` | enum | cash \| transfer \| card \| credit |
| `payment_status` | enum | pending \| paid \| partial \| overdue |
| `txn_date` | date | วันที่ธุรกรรม |
| `due_date` | date | วันครบกำหนด |
| `fiscal_year` | int | ปีบัญชี |
| `fiscal_month` | int | เดือนบัญชี |
| `status` | enum | draft \| pending_review \| need_info \| ready_to_export \| exported \| booked \| rejected \| void |
| `submitted_by` | FK | ผู้สร้างกล่อง |
| `submitted_at` | timestamp | วันที่ส่ง |
| `reviewed_by` | FK | ผู้ตรวจ (บัญชี) |
| `reviewed_at` | timestamp | วันที่ตรวจ |
| `notes` | text | หมายเหตุ |
| `is_complete` | boolean | เอกสารครบหรือยัง |
| `created_at` | timestamp | วันที่สร้าง |
| `updated_at` | timestamp | แก้ไขล่าสุด |

### Transaction Status Flow

```
draft → pending_review → ready_to_export → exported → booked
                      ↘ need_info ↗
                      ↘ rejected
                      ↘ void
```

### ตัวอย่าง

```
Transaction: TXN-202601-0030
├── type: EXPENSE
├── description: "ค่าบริการ IT เดือน ม.ค."
├── contact: บริษัท XYZ จำกัด
├── total_amount: ฿10,700
├── has_wht: false
├── status: pending_review
└── is_complete: true (มีเอกสารครบ)
```

---

## 3.2 SubDocument (เอกสารในกล่อง) ⭐ NEW

> เอกสารแต่ละประเภทภายในกล่อง (1 กล่อง → หลายเอกสาร)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `transaction_id` | FK | **กล่องที่เป็นเจ้าของ** |
| `doc_type` | enum | ประเภทเอกสาร (ดูด้านล่าง) |
| `doc_number` | string | เลขที่เอกสาร (เช่น เลขใบกำกับ) |
| `doc_date` | date | วันที่เอกสาร |
| `amount` | decimal | ยอดเงิน (optional) |
| `vat_amount` | decimal | VAT (optional) |
| `notes` | text | หมายเหตุ |
| `ocr_status` | enum | pending \| processing \| completed \| failed |
| `ocr_result` | JSON | ผลจาก OCR |
| `created_at` | timestamp | วันที่สร้าง |
| `updated_at` | timestamp | แก้ไขล่าสุด |

### DocType Enum

**สำหรับรายจ่าย (Expense):**
| Type | ความหมาย | จำเป็น |
|------|----------|--------|
| `SLIP` | สลิปโอนเงิน/หลักฐานชำระ | ✅ แนะนำ |
| `TAX_INVOICE` | ใบกำกับภาษี | ถ้ามี |
| `INVOICE` | ใบแจ้งหนี้ | ถ้ามี |
| `RECEIPT` | ใบเสร็จรับเงิน | ถ้ามี |
| `WHT_CERT_SENT` | หนังสือหัก ณ ที่จ่าย (เราออก) | ถ้าหัก |
| `CONTRACT` | สัญญา/ใบสั่งซื้อ | ถ้ามี |
| `OTHER` | อื่นๆ | ถ้ามี |

**สำหรับรายรับ (Income):**
| Type | ความหมาย | จำเป็น |
|------|----------|--------|
| `QUOTATION` | ใบเสนอราคา | ถ้ามี |
| `INVOICE` | ใบแจ้งหนี้ (เราออก) | ✅ แนะนำ |
| `RECEIPT` | ใบเสร็จรับเงิน (เราออก) | ✅ แนะนำ |
| `TAX_INVOICE` | ใบกำกับภาษี (เราออก) | ถ้ามี |
| `WHT_CERT_RECEIVED` | หนังสือหัก ณ ที่จ่าย (ถูกหัก) | ถ้าถูกหัก |
| `CONTRACT` | สัญญา | ถ้ามี |
| `OTHER` | อื่นๆ | ถ้ามี |

### ความสัมพันธ์

```
Transaction: "ค่าบริการ IT เดือน ม.ค." (฿10,700)
├── SubDocument: INVOICE (ใบแจ้งหนี้)
│   └── doc_number: "INV-2026-001"
├── SubDocument: SLIP (สลิปโอนเงิน)
│   └── (ไม่มีเลขที่)
├── SubDocument: TAX_INVOICE (ใบกำกับภาษี)
│   └── doc_number: "TAX-2026-0015"
└── (ไม่มี WHT - ไม่ได้หัก)
```

---

## 3.3 DocumentFile (ไฟล์ของเอกสาร)

> 1 เอกสาร (SubDocument) → หลายไฟล์ได้ (เช่น หน้า-หลัง, หลายหน้า)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `sub_document_id` | FK | **เอกสารที่เป็นเจ้าของ** |
| `file_url` | string | URL ไฟล์ |
| `file_name` | string | ชื่อไฟล์ต้นฉบับ |
| `file_type` | string | ประเภทไฟล์ (image/jpeg, application/pdf) |
| `file_size` | int | ขนาดไฟล์ (bytes) |
| `file_checksum` | string | สำหรับ duplicate detection |
| `page_order` | int | ลำดับหน้า (1, 2, 3...) |
| `is_primary` | boolean | เป็นไฟล์หลัก (แสดง thumbnail) |
| `uploaded_by` | FK | ผู้อัปโหลด |
| `uploaded_at` | timestamp | เวลาอัปโหลด |

### ตัวอย่าง

```
SubDocument: SLIP (สลิปโอนเงิน)
├── [PRIMARY] page1.jpg (หน้าแรก - แสดง thumbnail)
└── page2.jpg (หน้า 2 - ถ้ายาว)

SubDocument: TAX_INVOICE (ใบกำกับภาษี)
└── tax_invoice.pdf (1 ไฟล์)
```

---

## 3.4 WHTTracking (ติดตามหัก ณ ที่จ่าย) ⭐ NEW

> ติดตามสถานะการส่ง/รับหนังสือหัก ณ ที่จ่าย

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `transaction_id` | FK | **กล่องที่เกี่ยวข้อง** |
| `tracking_type` | enum | outgoing (เราส่ง) \| incoming (รอรับ) |
| `wht_amount` | decimal | จำนวนเงินหัก |
| `wht_rate` | decimal | อัตรา (1, 3, 5%) |
| `counterparty_name` | string | ชื่อคู่ค้า |
| `status` | enum | pending \| issued \| sent \| confirmed \| received |
| `issued_date` | date | วันที่ออก |
| `sent_date` | date | วันที่ส่ง |
| `sent_method` | enum | email \| mail \| hand_delivery |
| `confirmed_date` | date | วันที่ยืนยันรับ |
| `received_date` | date | วันที่ได้รับ (ฝั่ง incoming) |
| `sub_document_id` | FK | เอกสาร WHT cert (nullable) |
| `notes` | text | หมายเหตุ |
| `created_at` | timestamp | วันที่สร้าง |
| `updated_at` | timestamp | แก้ไขล่าสุด |

### Status Flow

**Outgoing (WHT ที่เราออก - ต้องส่งให้ผู้รับ):**
```
pending → issued → sent → confirmed
(รอออก)  (ออกแล้ว) (ส่งแล้ว) (ยืนยันรับ)
```

**Incoming (WHT ที่ถูกหัก - รอรับจากลูกค้า):**
```
pending → received
(รอรับ)   (ได้รับแล้ว)
```

### ตัวอย่าง

```
Transaction: "ค่าจ้าง Freelancer" (฿10,000, หัก 3% = ฿300)
└── WHTTracking:
    ├── type: outgoing
    ├── wht_amount: ฿300
    ├── wht_rate: 3%
    ├── counterparty: คุณสมชาย
    ├── status: sent
    ├── sent_date: 15 ม.ค. 2026
    └── sent_method: email
```

---

## 3.5 User (ผู้ใช้งาน)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `email` | string | อีเมล |
| `name` | string | ชื่อ |
| `avatar_url` | string | รูปโปรไฟล์ (optional) |
| `is_active` | boolean | สถานะใช้งาน |
| `created_at` | timestamp | วันที่สร้าง |
| `last_login_at` | timestamp | เข้าใช้ล่าสุด |
| `notification_preferences` | JSON | การตั้งค่าแจ้งเตือน |

### Notification Preferences (JSON)
```json
{
  "channels": ["in_app", "push", "email", "line"],
  "digest_frequency": "realtime" | "daily" | "weekly"
}
```

---

## 3.6 Contact (ผู้ติดต่อ - รวม Vendor + Customer)

> รองรับทั้งฝั่งซื้อ (Vendor) และฝั่งขาย (Customer)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | FK | **บริษัท/องค์กร** |
| `name` | string | ชื่อบริษัท/ร้าน/บุคคล |
| `contact_type` | enum | บุคคล \| นิติบุคคล |
| `contact_role` | enum | vendor \| customer \| both |
| `tax_id_13` | string | เลขประจำตัวผู้เสียภาษี 13 หลัก |
| `branch_no_5` | string | รหัสสาขา 5 หลัก |
| `address` | text | ที่อยู่ |
| `contact_person` | string | ชื่อผู้ติดต่อ |
| `phone` | string | โทรศัพท์ |
| `email` | string | อีเมล |
| `wht_applicable` | boolean | มักมีหัก ณ ที่จ่าย |
| `default_wht_rate` | decimal | อัตราหัก ณ ที่จ่ายเริ่มต้น |
| `default_payment_method` | enum | วิธีชำระเริ่มต้น |
| `default_cost_center_id` | FK | ศูนย์ต้นทุนเริ่มต้น |
| `notes` | text | หมายเหตุ |
| `is_active` | boolean | สถานะใช้งาน |
| `created_at` | timestamp | วันที่สร้าง |

### contact_role
| Role | ความหมาย |
|------|----------|
| `vendor` | คู่ค้าฝั่งซื้อ (เราซื้อของ/จ้างเขา) |
| `customer` | ลูกค้าฝั่งขาย (เขาซื้อของ/จ้างเรา) |
| `both` | ทั้งสองฝั่ง |

---

## 3.7 CostCenter (ศูนย์ต้นทุน / แผนก)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | FK | **บริษัท/องค์กร** |
| `code` | string | รหัสย่อ เช่น "CC-MKT" |
| `name` | string | ชื่อศูนย์ต้นทุน |
| `description` | text | รายละเอียด (optional) |
| `parent_id` | FK | สำหรับ nested structure (optional) |
| `is_active` | boolean | สถานะใช้งาน |
| `created_at` | timestamp | วันที่สร้าง |

---

## 3.8 Category (หมวดค่าใช้จ่าย)

> หมวดที่คนส่งเลือกได้ง่าย ไม่ต้องรู้บัญชี

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | FK | **บริษัท/องค์กร** |
| `name` | string | ชื่อหมวด |
| `description` | text | คำอธิบาย |
| `is_active` | boolean | สถานะใช้งาน |
| `wht_suggestion` | enum | none \| sometimes \| usually (แนะนำ WHT) |
| `default_wht_rate` | decimal | อัตราหัก ณ ที่จ่ายเริ่มต้น (1, 3, 5 %) |

### หมวดตั้งต้นแนะนำ
| หมวด | แนะนำ WHT | หมายเหตุ |
|------|----------|---------|
| ค่าโฆษณาและการตลาด | ⚠️ บางกรณี | ถ้าจ้างทำโฆษณา |
| ค่าเดินทาง / ค่าน้ำมัน | ❌ ไม่มี | - |
| ค่าขนส่ง / โลจิสติกส์ | ⚠️ บางกรณี | ถ้าจ้างบริการขนส่ง |
| ค่าวัตถุดิบ / สินค้า | ❌ ไม่มี | ซื้อของ |
| ค่าแรง / ฟรีแลนซ์ | ✅ มักมี | หัก 3% (บุคคล) |
| ค่าอุปกรณ์สำนักงาน | ❌ ไม่มี | ซื้อของ |
| ค่าซ่อมบำรุง | ✅ มักมี | หัก 3% (บริการ) |
| ค่าเช่า / ค่าสาธารณูปโภค | ⚠️ บางกรณี | ค่าเช่าหัก 5% |
| ค่าซอฟต์แวร์ / Subscription | ⚠️ บางกรณี | ถ้าจ้างพัฒนา |
| ค่าใช้จ่ายเบ็ดเตล็ด | ❌ ไม่มี | - |

---

## 3.9 Comment (ความคิดเห็น / สนทนาในกล่อง)

> ใช้สื่อสารระหว่างบัญชีกับคนส่ง

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `transaction_id` | FK | **กล่องที่เกี่ยวข้อง** |
| `user_id` | FK | ผู้ comment |
| `content` | text | ข้อความ |
| `is_internal` | boolean | true = บัญชีเห็นเท่านั้น, false = ทุกคนเห็น |
| `created_at` | timestamp | วันที่สร้าง |

### Use Cases
- บัญชีถามข้อมูลเพิ่ม: "กล่องนี้เป็นค่าอะไรครับ?"
- คนส่งตอบ: "ค่าขนส่งสินค้าไปลูกค้า"
- Internal note: "ต้องเช็ค VAT กับสรรพากร" (คนส่งไม่เห็น)

---

## 3.10 ActivityLog (ประวัติการทำงาน)

> บันทึกทุก action ที่เกิดขึ้นกับกล่อง (Timeline)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `transaction_id` | FK | **กล่อง** |
| `sub_document_id` | FK | เอกสารที่เกี่ยวข้อง (nullable) |
| `user_id` | FK | ผู้ทำ action |
| `action_type` | enum | (ดูด้านล่าง) |
| `action_details` | JSON | รายละเอียดเพิ่มเติม |
| `created_at` | timestamp | เวลาที่เกิด action |

### Action Types
| Type | ความหมาย |
|------|----------|
| `transaction_created` | สร้างกล่อง |
| `sub_document_added` | เพิ่มเอกสาร |
| `sub_document_updated` | แก้ไขเอกสาร |
| `file_uploaded` | อัปโหลดไฟล์ |
| `status_changed` | เปลี่ยนสถานะ |
| `commented` | เพิ่ม comment |
| `wht_updated` | อัปเดต WHT tracking |
| `exported` | Export ข้อมูล |

### ตัวอย่าง Timeline
```
Timeline กล่อง TXN-202601-0030:
├── 5 ม.ค. 10:30 │ สมชาย สร้างกล่อง
├── 5 ม.ค. 10:32 │ สมชาย เพิ่มใบแจ้งหนี้
├── 10 ม.ค. 14:00 │ สมชาย เพิ่มสลิปโอนเงิน
├── 13 ม.ค. 09:15 │ สมชาย เพิ่มใบกำกับภาษี
├── 13 ม.ค. 09:20 │ สมชาย ส่งให้บัญชี
├── 13 ม.ค. 11:00 │ สมหญิง (บัญชี) อนุมัติ
└── 15 ม.ค. 14:00 │ สมหญิง Export ไป PEAK
```

---

## 3.11 FiscalPeriod (งวดบัญชี)

> จัดการการปิดงวดบัญชีรายเดือน/ปี

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | FK | **บริษัท/องค์กร** |
| `year` | int | ปี เช่น 2026 |
| `month` | int | เดือน 1-12 |
| `status` | enum | open \| closing \| closed |
| `closed_at` | timestamp | วันที่ปิดงวด |
| `closed_by` | FK | ผู้ปิดงวด |
| `notes` | text | หมายเหตุ |

### สถานะ
| Status | ความหมาย |
|--------|----------|
| `open` | เปิดรับเอกสาร |
| `closing` | กำลังปิดงวด (ตรวจสอบอยู่) |
| `closed` | ปิดแล้ว ห้ามแก้ไข |

---

## 3.12 SavedFilter (ฟิลเตอร์ที่บันทึกไว้)

> บันทึก filter ที่ใช้บ่อยเพื่อเรียกใช้ซ้ำ

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | FK | **บริษัท/องค์กร** |
| `user_id` | FK | เจ้าของ filter |
| `name` | string | ชื่อ filter เช่น "ค่าโฆษณา เดือนนี้" |
| `filter_config` | JSON | เก็บ criteria ทั้งหมด |
| `is_shared` | boolean | true = ทุกคนเห็น, false = ส่วนตัว |
| `is_default` | boolean | true = โหลดอัตโนมัติ |
| `created_at` | timestamp | วันที่สร้าง |

### ตัวอย่าง filter_config
```json
{
  "status": ["pending_review", "need_info"],
  "category_id": "abc123",
  "date_range": "this_month",
  "transaction_type": "expense"
}
```

---

## 3.13 ExportHistory (ประวัติการ Export)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | FK | **บริษัท/องค์กร** |
| `exported_by` | FK | ผู้ export |
| `exported_at` | timestamp | เวลา export |
| `export_type` | enum | excel \| peak \| zip \| pdf |
| `export_format` | enum | generic \| peak_expense \| peak_receipt |
| `filter_used` | JSON | criteria ที่ใช้ export |
| `transaction_count` | int | จำนวนกล่องที่ export |
| `transaction_ids` | array | IDs ของกล่องที่ export |
| `file_url` | string | ลิงก์ไฟล์ (expire หลัง 7 วัน) |
| `notes` | text | หมายเหตุ |

---

## 3.14 Notification (การแจ้งเตือน)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | FK | **บริษัท/องค์กร** |
| `user_id` | FK | ผู้รับแจ้งเตือน |
| `type` | enum | ประเภทแจ้งเตือน |
| `title` | string | หัวข้อ |
| `message` | string | รายละเอียด |
| `data` | JSON | ข้อมูลเพิ่มเติม (transaction_id, etc.) |
| `is_read` | boolean | อ่านแล้วหรือยัง |
| `read_at` | timestamp | เวลาที่อ่าน |
| `created_at` | timestamp | วันที่สร้าง |

### Notification Types
| Type | ความหมาย |
|------|----------|
| `TRANSACTION_SUBMITTED` | มีกล่องใหม่รอตรวจ |
| `TRANSACTION_REVIEWED` | กล่องถูกอนุมัติ |
| `TRANSACTION_NEED_INFO` | กล่องถูกขอข้อมูลเพิ่ม |
| `TRANSACTION_REJECTED` | กล่องถูกปฏิเสธ |
| `WHT_DUE_SOON` | WHT ใกล้ครบกำหนด |
| `WHT_OVERDUE` | WHT เลยกำหนด |
| `DOCUMENT_DUE_SOON` | เอกสารใกล้ครบกำหนด |
| `SYSTEM_ALERT` | แจ้งเตือนระบบ |

---

## 📐 Complete Data Model Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       Organization                              │
│  (บริษัท/องค์กร - Multi-tenant Root)                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
     ┌─────────────────────┼─────────────────────┐
     │                     │                     │
     ▼                     ▼                     ▼
┌──────────┐        ┌──────────┐         ┌──────────┐
│   User   │        │ Contact  │         │ Category │
└────┬─────┘        └────┬─────┘         └────┬─────┘
     │                   │                    │
     │                   └──────────┬─────────┘
     │                              │
     │                              ▼
     │              ┌───────────────────────────────┐
     └─────────────▶│        Transaction            │◀── CostCenter
                    │      (กล่องเอกสาร)             │
                    │  1 กล่อง = 1 ธุรกรรม          │
                    └───────────────┬───────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
         ▼                          ▼                          ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   SubDocument   │     │   WHTTracking   │     │    Comment      │
│ (เอกสารในกล่อง) │     │ (ติดตาม WHT)    │     │   (สนทนา)       │
│ สลิป/ใบกำกับ/WHT│     └─────────────────┘     └─────────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  DocumentFile   │
│ (ไฟล์ของเอกสาร) │
│ หลายหน้าได้     │
└─────────────────┘
```

---

## 🔄 Migration จาก Model เดิม

หากต้องการ migrate จาก model เดิม:

```sql
-- 1. Rename Document → Transaction
ALTER TABLE documents RENAME TO transactions;
ALTER TABLE transactions RENAME COLUMN doc_number TO txn_number;

-- 2. Create SubDocument table
CREATE TABLE sub_documents (
  id UUID PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id),
  doc_type VARCHAR(50),
  doc_number VARCHAR(100),
  ...
);

-- 3. Move DocumentFile to reference SubDocument
ALTER TABLE document_files RENAME COLUMN document_id TO sub_document_id;

-- 4. Create WHTTracking table
CREATE TABLE wht_trackings (...);
```
