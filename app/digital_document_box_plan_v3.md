# Digital Document Box (กล่องเอกสารดิจิตอล) — Detailed Feature Plan + Business Model (V3)

> เวอร์ชันนี้คือ “ละเอียดระดับเอาไปทำ PRD / เอาไปบรีฟ dev / เอาไปขายได้”  
> คอนเซป: Case-based Accounting Workflow สำหรับไทย (VAT + WHT + Export-ready)  
> หลักการ: พนักงานกรอกน้อยสุด, บัญชีไล่สถานะได้, เจ้าของเห็นความเสี่ยงและเงินค้าง

---

## 0) เป้าหมายของระบบ
- เปลี่ยน “เอกสารส่งในไลน์” → เป็น **กล่องงาน (Case)** ที่ติดตามได้
- ลดงาน “ทวงเอกสาร” โดยใช้ **Task + Reminder + Escalation**
- รองรับโลกจริง: เอกสารมาทีหลัง, WHT โคตรเรื่องมาก, ปิดงวดต้องทัน
- ส่งต่อได้จริง: **Export CSV/Excel (Import-ready) + Export Zip Folder (จัดชื่อไฟล์สวยๆ)**

---

## 1) Personas / Roles
### 1.1 พนักงาน (Submitter)
- เป้าหมาย: ส่งเอกสารให้ครบเร็วที่สุด
- ความจริง: ไม่รู้บัญชี ไม่อยากกรอกฟอร์ม
- Success: กด 2 ปุ่ม + อัปโหลด จบ

### 1.2 เจ้าของ (Owner/Approver)
- เป้าหมาย: รู้ว่าเงินออกไปไหน, งานค้างอะไร, เอกสารหายตรงไหน, WHT ค้างเป็นเงินเท่าไหร่
- Success: Dashboard สั้นๆ แต่คุมได้

### 1.3 บัญชี (Accountant/Bookkeeper / Accounting Firm)
- เป้าหมาย: ตรวจเอกสาร, ขอเอกสารเพิ่ม, ปิดงวด, Export ไปลงโปรแกรมบัญชี
- Success: กล่องไม่ตกหล่น, WHT ไม่หาย, Export ใช้ได้จริง

### 1.4 Admin (Workspace Admin)
- เป้าหมาย: ตั้งค่า workspace, role, policy, export profile, storage
- Success: คุมระบบและสิทธิ์ได้

---

## 2) Core UX Principles (ทำให้คนใช้จริง)
### 2.1 “10-Second Upload Rule”
พนักงานทำได้ใน 10 วินาที:
1) ถ่าย/อัปโหลด
2) เลือก VAT (มี/ไม่มี)
3) เลือก WHT (มี/ไม่มี)
4) ส่ง

### 2.2 Progressive Disclosure
- หน้า submit: **ซ่อนความซับซ้อน**
- หน้า accountant: **โชว์เครื่องมือเต็ม**
- ระบบช่วยเดาได้ แต่ **ไม่บังคับกรอก**

### 2.3 Mobile-first
- มือถือเป็น primary
- One-hand upload
- Offline draft (ถ่ายก่อน มีเน็ตค่อยส่ง)

---

## 3) Entities (ของที่ระบบต้องมีแน่ ๆ)
### 3.1 Workspace / Company
- บริษัท 1 แห่ง = 1 workspace (SME mode)
- Accounting firm mode: 1 firm ดูหลาย workspace

### 3.2 Case (Box)
- 1 Case = 1 เหตุการณ์จ่ายเงินจริง
- มีเอกสารหลายไฟล์ หลายวันได้
- มี flag VAT/WHT

### 3.3 Document
- file/image/pdf + metadata (type, uploader, created_at)
- classification (payment slip / receipt / tax invoice / wht cert / other)

### 3.4 Task
- งานติดตามเอกสาร (VAT / WHT / General)
- due_date, status, assignee

### 3.5 Vendor
- ร้านค้า/คู่ค้า
- เก็บ default VAT/WHT + ประวัติการส่งเอกสาร

### 3.6 Booking Entry (Accounting Entry)
- 1 Entry = 1 รายการที่ส่งออกไปลงบัญชี
- 1 Entry **link ได้หลาย case** (Merge/Link)

### 3.7 Period (Accounting Period)
- ใช้ lock งวด
- late docs policy

---

## 4) Minimal Input (พนักงานต้องกรอกอะไรบ้าง)
### Required
- VAT: มี / ไม่มี
- WHT: มี / ไม่มี
- แนบเอกสารอย่างน้อย 1 ไฟล์

### Optional (แต่ช่วยบัญชี)
- ยอดรวม (ระบบ OCR ช่วยได้)
- แท็ก (เช่น ของเข้าคลัง/ค่าน้ำมัน/ค่าโฆษณา/อื่นๆ)
- หมายเหตุ 1 บรรทัด

### Smart Guess (ไม่บังคับ)
- “ร้านนี้ปกติมี VAT ใช่ไหม?” [ใช่] [ไม่ใช่]
- “ร้านนี้โดนหัก ณ ที่จ่ายใช่ไหม?” [ใช่] [ไม่ใช่]

---

## 5) Status Engine (State Machine)
### 5.1 Main Status (ทุก case)
1. Draft — สร้างไว้ยังไม่ส่ง
2. Submitted — ส่งเข้าคิวบัญชีแล้ว
3. In Review — บัญชีกำลังตรวจ
4. Need More Docs — ขาดเอกสาร/ข้อมูล
5. Ready to Book — ครบเงื่อนไขพร้อมลงบัญชี
6. Bookable (WHT Pending) — ลงบัญชีได้ แต่ WHT ตามต่อ (สำคัญ)
7. Booked — ลงบัญชีแล้ว
8. Archived — ปิดงาน/เก็บ
9. Locked — งวดปิดแล้ว ห้ามแก้ (ยกเว้น admin policy)

### 5.2 Sub-status / Flags
#### VAT
- vat_required: boolean
- vat_doc_status: missing | received | verified
- vat_verified_at, vat_verified_by

#### WHT
- wht_required: boolean
- wht_rate: optional (1/3/5%)
- wht_amount: optional
- wht_doc_status: missing | request_sent | received | verified
- wht_due_date: date
- wht_overdue: boolean

#### Duplicate / Fraud-lite
- possible_duplicate: boolean
- duplicate_reason: text (hash match / same amount+date+vendor)

#### Reimbursement
- payment_mode: company_paid | employee_advance
- reimbursement_status: none | pending | reimbursed (optional tracking)

### 5.3 Transition Rules (ย่อ)
- Draft → Submitted (submitter/owner/accountant)
- Submitted → In Review (accountant)
- In Review → Need More Docs (accountant/owner)
- Need More Docs → Submitted (submitter ตอบกลับ)
- In Review → Ready to Book (accountant เมื่อครบ)
- In Review → Bookable (WHT Pending) (accountant เมื่อจะปิดงวด)
- Ready/Bookable → Booked (accountant)
- Booked → Archived (accountant/admin)
- Any → Locked (accountant/admin เมื่อปิดงวด)

---

## 6) Task System (ตัวทำให้ “ทวงเอกสาร” หายไป)
### 6.1 Task Types
- VAT Invoice Task: ขอ/รับ/verify ใบกำกับภาษี
- WHT Certificate Task: ขอ/รับ/verify หนังสือรับรองหัก ณ ที่จ่าย
- General Missing Doc Task: ขอใบเสร็จ/เอกสารอื่น

### 6.2 Task Status
- open → in_progress → done
- overdue (computed)
- cancelled (optional)

### 6.3 Auto-create Rules
- ถ้า case.vat_required = true → สร้าง VAT task = open
- ถ้า case.wht_required = true → สร้าง WHT task = open + ตั้ง due_date (policy)

---

## 7) Auto Reminder & Escalation (ทวงแทนคน)
### Default Policy (ปรับได้ต่อ workspace)
- Day 0: ส่งคำขอเอกสาร (Request sent)
- Day 3: เตือน submitter
- Day 7: escalate owner + amber flag
- Day 14: overdue + red flag + dashboard highlight

### Channels
- In-app notifications (MVP)
- Email (Phase 2)
- LINE OA / Webhook (Phase 3/Integrations)

---

## 8) Case Linking / Merge (ของจริงมาก)
### 8.1 Link Case → Booking Entry
ใช้เมื่อ:
- จ่ายครั้งเดียว แต่เอกสารแยกหลายกล่อง
- หรือจ่ายหลายครั้งรวมเป็นบิลเดียว

### 8.2 Merge Rules
- 1 Booking Entry สามารถรวมหลาย case
- Export สามารถเลือก “ตาม entry” หรือ “ตาม case”

---

## 9) Vendor Memory + Smart Guess + Learning System
### 9.1 Vendor Directory (เก็บร้านที่ซื้อบ่อย)
- ชื่อร้าน / เลขผู้เสียภาษี (optional)
- default_vat_required
- default_wht_required + rate
- SLA แบบประสบการณ์ (ส่งช้า/เร็ว)

### 9.2 Learning System (Self-improving)
- เรียนรู้จากการ verify/แก้ flags ของ accountant
- ปรับ smart guess และ vendor defaults ให้แม่นขึ้น

---

## 10) WHT Tracking (Key Selling Point)
### 10.1 Fields แนะนำ
- wht_amount (จำนวนเงินหัก)
- wht_rate (อัตรา)
- wht_due_date (วันที่ควรได้รับเอกสาร)
- wht_doc_status + overdue flag

### 10.2 Dashboard ที่ต้องมี
- WHT Outstanding (THB) รวมทั้งหมด
- WHT overdue list (เรียงตามค้างนาน)
- WHT by vendor / by submitter / by company (firm mode)

---

## 11) Export System (จุดขายหลัก ต้อง “ใช้ได้จริง”)
### 11.1 Accounting Export (CSV/Excel)
#### Generic Columns (ขั้นต่ำ)
- entry_id, case_id(s)
- company_id / company_name
- paid_date
- amount_total
- vat_required, vat_doc_status
- wht_required, wht_doc_status, wht_amount
- vendor_name (optional)
- payment_mode (company_paid / employee_advance)
- project / cost_center (optional)
- status
- doc_paths (ใน zip) หรือ doc_links (signed URL)
- notes

#### Export Profiles (Upsell)
- PEAK-first
- FlowAccount-first
- Express-first
> ทำเป็น “Export Profile” ให้เลือกได้ต่อ workspace

### 11.2 Folder Export (Zip Bundle)
โครงสร้างแนะนำ:
- YYYY/MM/
  - ENTRY_000123_vendor_amount/
    - 01_payment_slip.jpg
    - 02_receipt.jpg
    - 03_tax_invoice.pdf
    - 04_wht_cert.pdf
    - summary.xlsx
    - summary.json

summary.* มี:
- metadata entry/case
- file list + type + uploaded_at
- VAT/WHT status + verification info
- duplicate flags + reimbursement info (ถ้ามี)

### 11.3 Export Scope
- ตามเดือน / งวด
- ตามสถานะ (Ready/Bookable/Booked)
- ตามบริษัท (firm mode)

---

## 12) Period Lock + Late Docs
### 12.1 Lock Period
- ปิดงวดแล้ว “แก้/ลบ/แทนที่” เอกสารไม่ได้
- ทำได้แค่ “เพิ่ม late doc” + audit log

### 12.2 Late Document Handling
- ถ้า Booked แล้วเอกสารมาเพิ่ม:
  - flag = late_doc
  - สร้าง task ให้ verify
  - หรือ route ไป next period review (policy)

---

## 13) Search / Filters / Bulk Actions
### Filters (บัญชีต้องมี)
- status, VAT yes/no, WHT yes/no
- aging buckets (0-3 / 4-7 / 8-14 / 15+)
- vendor, submitter, amount range
- overdue only, possible duplicate only
- reimbursement pending

### Bulk Actions (Phase 2+)
- bulk request docs
- bulk mark ready
- bulk export
- bulk assign reviewer

---

## 14) Dashboards (ตัวทำให้ owner จ่ายรายเดือน)
### Owner Dashboard
- กล่องค้างทั้งหมด + aging
- ยอดเงินค้างเอกสาร
- WHT outstanding (THB) + overdue
- เงินค้าง reimbursement (ถ้ามี)
- possible duplicate count

### Accountant Dashboard
- Inbox (Submitted)
- Need More Docs queue
- Overdue WHT queue
- Ready/Bookable queue (พร้อม export)

### Firm Dashboard (Accounting Firm)
- Multi-company overview
- SLA/KPI per client
- WHT outstanding per client
- client health score (optional)

---

## 15) External Share / Auditor Mode
- Share link แบบ read-only
- กำหนด expire ได้
- เลือก scope: case/entry/month
- เหมาะสำหรับ auditor / สรรพากร / ที่ปรึกษา

---

## 16) Evidence & Legal-grade Integrity
- Immutable audit log หลัง Booked/Locked
- Timestamp + actor ทุก event
- Hash เอกสารสำหรับยืนยันความคงเดิม
- Export audit log ได้ (optional)

---

## 17) Duplicate / Fraud-lite Detection
- ตรวจ hash ของไฟล์ (exact match)
- ตรวจ similarity (optional) + amount/date/vendor heuristic
- แสดง flag “Possible Duplicate” ให้ owner/accountant ตรวจ

---

## 18) Cost Center / Project Tracking
- Field เสริม: project_id / cost_center_id (เลือกจาก list)
- ไม่บังคับพนักงาน
- ใช้ใน export + dashboard + firm reporting

---

## 19) Reimbursement Mode
- payment_mode: company_paid | employee_advance
- reimbursement_status: pending | reimbursed (optional)
- dashboard เงินค้างคืนพนักงาน
- export support

---

## 20) Benchmark & Insight Layer (SaaS Mode)
- Insight แบบ anonymized:
  - average WHT aging
  - vendor doc SLA
  - first-pass completion benchmark
- ใช้ทำ marketing/retention: “คุณดีกว่าค่าเฉลี่ยตลาด X%”

---

## 21) Accounting Assistant (Vision)
- Suggest หมวดค่าใช้จ่าย/ประเภทเอกสาร/flags จากประวัติ
- Explain ว่า case นี้ติดตรงไหน ต้องทำอะไรต่อ
- ไม่ใช่ auto-book แต่เป็น “copilot”

---

## 22) Multi-tenant & Accounting Firm Mode
- 1 workspace = 1 บริษัท
- firm account access หลาย workspace ได้
- เชิญ client/firm แบบสองทาง (invite model)

---

## 23) Phase Roadmap (คุม scope)
### MVP (ขายได้ทันที)
- Case + Upload (mobile-first)
- VAT/WHT flags + basic tasks
- Status engine + Need More Docs
- WHT tracking basic + dashboard
- Export CSV + Export Zip
- Search/filter basic
- Roles/permissions basic

### Phase 2 (Upsell)
- OCR extraction
- vendor defaults + smart guess
- auto reminder + escalation
- bulk actions
- period lock basic
- duplicate detection (heuristic)
- reimbursement tracking basic

### Phase 3 (Enterprise/Firm)
- multi-client dashboard
- SLA/KPI reporting
- white-label portal
- export profile builder
- integrations (LINE OA/webhooks/accounting connectors)
- evidence/audit export + advanced duplicate detection
- benchmark/insight layer

---

## 24) Business Model (Subscription)
### Customer Segments
1) SME ใช้เอง
2) Accounting firm ดูแลหลายลูกค้า
3) Employees = ผู้ใช้หลัก แต่ไม่จ่าย

### Pricing Levers (คันโยกขึ้นราคา)
- จำนวน workspace (บริษัท)
- จำนวน case/เดือน
- จำนวนผู้ใช้
- จำนวน WHT case/เดือน (คิดแยกได้)
- storage (GB)
- export profiles (generic ฟรี / profiles เฉพาะคิดเงิน)
- OCR credits (ต่อหน้าเอกสาร)
- external share / auditor mode (add-on)
- white-label (firm/enterprise)

### Package ตัวอย่าง (โครง)
**Starter (SME)**
- 1 workspace, 10 users
- 200 cases/เดือน, storage 10GB
- generic export + zip

**Pro (SME)**
- 1 workspace, 30 users
- 1,000 cases/เดือน, storage 50GB
- vendor defaults + smart guess
- export profiles (PEAK/Flow/Express)

**Accounting Firm**
- เริ่ม 10 workspaces (clients)
- multi-client dashboard + KPI
- เพิ่ม client เป็นขั้นบันได
- white-label / auditor share เป็น add-on

Add-ons:
- OCR credits
- extra storage
- custom export profile
- white-label
- benchmark insights (enterprise)

---

## 25) KPI (วัดผล/ทำการตลาดได้)
- WHT outstanding (THB) ลดลงเท่าไหร่
- average aging ต่อ case
- first-pass completion rate
- export/import success rate
- SLA compliance (firm)
- duplicate flags caught
- reimbursement pending amount

---

## 26) Value Proposition
“เลิกส่งเอกสารบัญชีในไลน์แบบมั่ว ๆ — ให้พนักงานโยนเข้ากล่องง่าย ๆ แล้วบัญชีไล่สถานะ + ตาม VAT/WHT จน Export ลงโปรแกรมบัญชีได้ทันที”
