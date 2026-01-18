# ⚡ Use Cases ขั้นสูง (Phase 2)

## UC-B: เอกสาร 1 ใบ แยกหลายศูนย์ต้นทุน (Split Allocation)

### สถานการณ์จริง
- ใบเสร็จเดียว แต่ค่าใช้จ่ายต้องกระจายไปหลายแผนก

### แนวทางในระบบ (ไม่ทำบัญชีเต็ม)
- ใช้ **DocumentLine** เป็นตัวแทนการแบ่ง
- แต่ละ line เลือก:
  - cost_center
  - qty / unit_price (หรือ amount)
- ระบบตรวจ:
  - ผลรวม amount ทุก line = ยอดเอกสาร

### Export
- 1 line = 1 แถวใน Excel
- กลุ่มจัดประเภท = `CC:<cost_center>` ตาม line

> **หมายเหตุ:** ยังไม่ทำ split แบบ % เพื่อเลี่ยงความซับซ้อนใน MVP

---

## UC-C: หัก ณ ที่จ่าย (WHT) ระดับเอกสาร/บรรทัด (Lightweight)

### สถานการณ์จริง
- ค่าแรง / ฟรีแลนซ์ / บริการ ต้องหัก ณ ที่จ่าย

### ขอบเขตที่ระบบทำ (ไม่เป็นระบบภาษี)
- Field สำหรับบันทึก WHT:
  - `wht_applicable` (true/false)
  - `wht_rate` (1%, 3%, 5% ฯลฯ)
  - `wht_amount` (optional: คำนวณเพื่ออ้างอิง)
- รองรับทั้งระดับ:
  - **เอกสาร** (ทั้งใบ)
  - **บรรทัด** (บางรายการ)

### Export
- ใส่ค่า WHT ลงคอลัมน์ที่ PEAK รองรับ (ถ้ามี)
- ถ้าไม่รองรับ → export เป็น note/column เพิ่มใน Generic Excel

> **หมายเหตุ:** ไม่ออกเอกสาร ภ.ง.ด. และไม่จัดการการยื่นภาษี

---

## UC-D: การเบิกเงิน / ทดรองจ่าย (Expense Claim — Lightweight)

### เป้าหมาย
- ครอบคลุมกรณีพนักงาน/ผู้บริหารจ่ายก่อนแล้วเบิกคืน โดยไม่ทำระบบเงิน/บัญชีเต็ม

### ข้อมูลที่เพิ่ม (Document-level)
| Field | Type | Description |
|-------|------|-------------|
| `is_claim` | boolean | true/false |
| `claimant_user_id` | FK | ผู้ขอเบิก |
| `claim_amount` | decimal | optional: default = ยอดรวมเอกสาร |
| `claim_status` | enum | submitted → approved → rejected → reimbursed |
| `claim_note` | text | optional |

### Workflow
1. ผู้ใช้ส่งเอกสารและติ๊ก "ขอเบิก"
2. บัญชีตรวจเอกสาร → approve/reject
3. เมื่อโอนเงินคืนแล้ว → ติ๊ก reimbursed (manual)

### ขอบเขตที่ไม่ทำ (Scope Guard)
- ❌ ไม่ทำเงินทดรองคงเหลือ / wallet
- ❌ ไม่ผูกการโอนเงินจริง
- ❌ ไม่ทำหักลบเงินทดรอง

---

## UC-E: เบิกเงิน 1 ครั้งมีหลายเอกสาร (Claim Bundle) + WHT

### สถานการณ์จริง
- ไปทริปหนึ่งครั้ง: มีหลายใบ (สลิป+ใบเสร็จ+ใบกำกับ)
- บางใบเป็น "บริการ/ฟรีแลนซ์" ต้องหัก ณ ที่จ่าย

### แนวทางที่แนะนำ (ไม่บวมเป็นบัญชี)
- เพิ่ม entity ระดับบน: **Claim (หัวเรื่องการเบิก)**
  - `claim_id`, `claimant`, `title`, `cost_center`, `status`
- เอกสารหลายใบผูกกับ claim เดียว: `documents.claim_id`
- สรุปรวมที่ Claim:
  - `total_gross` (รวมก่อนหัก)
  - `total_wht` (รวม WHT)
  - `total_reimburse` = total_gross - total_wht

### Workflow
1. ผู้ใช้สร้าง Claim (หัวเรื่อง) → แนบเอกสารหลายใบเข้า Claim
2. บัญชีรีวิวทีละเอกสาร + WHT ตามเอกสารที่เกี่ยวข้อง
3. ระบบแสดงยอดที่ต้องคืน = รวมเอกสาร - รวม WHT
4. บัญชีโอนคืนเป็นยอดเดียวต่อ Claim → ติ๊ก reimbursed

### หน้าจอ/รายงาน
- **Claims Payable:** รายการที่ต้องโอนคืน
- **Claim Detail Summary:** เอกสารทั้งหมดใน Claim + รวมยอด

### ขอบเขตที่ไม่ทำ
- ❌ ไม่ออก ภ.ง.ด./ใบหักภาษี ณ ที่จ่ายในระบบ
- ❌ ไม่ทำ payment workflow ซับซ้อน (แค่สถานะ)

---

## สรุป Advanced Use Cases

| UC | ชื่อ | ความซับซ้อน | Priority |
|----|------|-------------|----------|
| UC-B | Split Allocation | Medium | P2 |
| UC-C | WHT (หัก ณ ที่จ่าย) | Low-Medium | P1 |
| UC-D | Expense Claim | Low | P1 |
| UC-E | Claim Bundle + WHT | Medium | P2 |

---

## Phase 2 Features อื่นๆ

| Feature | Description |
|---------|-------------|
| OCR/Extraction | ช่วยกรอก (เดาแล้วให้ยืนยัน) |
| Vendor Master | จำร้านเดิมอัตโนมัติ |
| Push + Email Summary | แจ้งเตือนค้างส่ง/Need info |
| LINE Notify | Integration กับ LINE |
| Tags / Labels | ติด tag เพิ่มเติมนอกเหนือจากหมวด |
| Attachments | แนบไฟล์เพิ่มเติม (memo, contract) |
| Currency Support | รองรับหลายสกุลเงิน (USD, EUR) |
| Reports & Analytics | รายงานค่าใช้จ่ายพร้อม chart |
| Data Export / Backup | Export ข้อมูลทั้งหมดเป็น JSON/CSV |
