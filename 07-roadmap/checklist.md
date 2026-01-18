# ✅ Implementation Checklist

## Week 1-2: MVP Core

### 🏗️ Project Setup
- [ ] Setup project (Next.js + Supabase หรือ tech stack ที่เลือก)
- [ ] Configure ESLint, Prettier, TypeScript
- [ ] Setup CI/CD pipeline
- [ ] Configure environment variables
- [ ] Setup development database

### 🏢 Multi-tenant (Organization) ⭐ MVP
- [ ] **Organization entity + CRUD**
  - [ ] Organization table + settings JSON
  - [ ] Create organization flow
  - [ ] Organization settings page
  - [ ] Logo upload
- [ ] **Organization Switcher**
  - [ ] Header dropdown component
  - [ ] Switch organization action
  - [ ] Remember last organization
- [ ] **OrganizationMember**
  - [ ] Member list page
  - [ ] Invite member via email
  - [ ] Accept/Reject invitation flow
  - [ ] Change member role
  - [ ] Remove member
- [ ] **Data Isolation**
  - [ ] Add organization_id to all tables
  - [ ] Row Level Security (RLS) policies
  - [ ] API middleware for org context

### 🔐 Authentication & Users
- [ ] Auth + Email/Password login
- [ ] Login page
- [ ] Protected routes
- [ ] User profile page
- [ ] **User Roles (per Organization)**
  - [ ] staff / accounting / admin / owner
  - [ ] Role-based permissions
  - [ ] Permission checks in UI/API

### 📁 Master Data
- [ ] **Cost Center management (CRUD)**
  - [ ] Cost center list page
  - [ ] Create cost center form
  - [ ] Edit cost center form
  - [ ] Activate/Deactivate cost center
- [ ] **Internal Categories**
  - [ ] Category list page
  - [ ] Create category form
  - [ ] Edit category form
  - [ ] Seed default categories

### 📤 Upload & Storage (Multi-file Support)
- [ ] Configure storage (S3/R2/Supabase Storage)
- [ ] File upload component (รองรับหลายไฟล์)
- [ ] DocumentFile entity (เก็บหลายไฟล์ต่อกล่อง)
- [ ] Image preview
- [ ] PDF preview
- [ ] File validation (type, size)
- [ ] Auto compression for large images
- [ ] ลากเรียงลำดับไฟล์ (page order)
- [ ] ตั้งไฟล์หลัก (is_primary)

### 📦 Document CRUD (กล่องเอกสาร) — MVP: Expense เท่านั้น
- [ ] Document list page (แยกแท็บ ร่าง/ส่งแล้ว)
- [ ] Document create form — **Record First Flow**
  - [ ] **Step 0: เลือก transaction_type** (expense เท่านั้นใน MVP)
  - [ ] Step 1: สร้างกล่อง (เลือกประเภท + หมวด + ร้าน)
  - [ ] Step 2: ใส่เอกสาร (อัปโหลดหลายไฟล์)
  - [ ] Step 3: กรอกยอด + วันที่
  - [ ] Step 4: ยืนยัน + ส่งบัญชี
- [ ] Draft List (กล่องที่ยังไม่เสร็จ)
- [ ] Document detail page (แสดงหลายไฟล์)
- [ ] Document edit form
- [ ] **Amount fields (subtotal, vat_amount, total_amount)**
  - [ ] VAT calculation (7% / no VAT)
  - [ ] Auto-calculate from subtotal
- [ ] **Fiscal period fields (fiscal_year, fiscal_month)**
  - [ ] Auto-fill from doc_date
  - [ ] Allow manual override

### 🔍 Search & Filter
- [ ] Search input
- [ ] Filter by status
- [ ] Filter by date range
- [ ] Filter by vendor
- [ ] Filter by category
- [ ] Filter by cost center
- [ ] Filter by submitter

### 🛡️ Quality Control
- [ ] **Duplicate detection**
  - [ ] File checksum calculation
  - [ ] Soft match (amount + vendor + date)
  - [ ] Warning UI on duplicate
- [ ] **Comment system (พูดคุยในเอกสาร)**
  - [ ] Comment list in document detail
  - [ ] Add comment form
  - [ ] Internal only toggle
  - [ ] Notification on new comment
- [ ] **Activity log (ประวัติการทำงาน)**
  - [ ] Log all actions
  - [ ] Activity timeline UI
  - [ ] Filter by action type

### 🔖 Saved Filters
- [ ] **Saved Filters (บันทึก/เรียกใช้ filter)**
  - [ ] Save current filter
  - [ ] Saved filter list
  - [ ] Apply saved filter
  - [ ] Set default filter
  - [ ] Share filter (optional)

### 📅 Fiscal Period
- [ ] **Fiscal Period management (เปิด/ปิดงวด)**
  - [ ] Fiscal period list
  - [ ] Open/Close period
  - [ ] Period summary (doc count, total amount)
  - [ ] Lock documents in closed period

### 📤 Export
- [ ] **Generic Excel export**
  - [ ] Select documents
  - [ ] Generate Excel file
  - [ ] Download file
- [ ] **ZIP export (documents)**
  - [ ] Select documents
  - [ ] Generate ZIP with files
  - [ ] Download ZIP
- [ ] **Export History (บันทึกประวัติ export)**
  - [ ] Log every export
  - [ ] Export history list
  - [ ] Re-download file (if not expired)

---

## Week 3-4: MVP Extended

### 📋 Document Lines
- [ ] **DocumentLine (multi-line)**
  - [ ] Add line item UI
  - [ ] Edit line item
  - [ ] Remove line item
  - [ ] Auto-calculate totals
  - [ ] Validate sum = document total

### 📁 Expense Groups
- [ ] **Expense Group (CRUD + assign docs)**
  - [ ] Group list page
  - [ ] Create group form
  - [ ] Group detail page
  - [ ] Add documents to group
  - [ ] Remove documents from group
- [ ] **Primary/Supporting doc designation**
  - [ ] Set primary document
  - [ ] Visual indicator for primary
- [ ] **Export Group as ZIP**
  - [ ] Export group button
  - [ ] Generate ZIP with all docs
  - [ ] Include summary file

### ⚡ Bulk Actions
- [ ] **Bulk selection UI**
  - [ ] Select all / deselect all
  - [ ] Select range (shift+click)
- [ ] **Bulk Actions**
  - [ ] Bulk Approve → ready_to_export
  - [ ] Bulk Reject → rejected + reason
  - [ ] Bulk Export (Excel + ZIP)
  - [ ] Bulk Assign (category/cost center)
  - [ ] Bulk Add to Group

### 🔗 PEAK Integration
- [ ] **PEAK account mapping**
  - [ ] Import PEAK chart of accounts
  - [ ] Map category → PEAK account
  - [ ] Mapping UI
- [ ] **PEAK export format**
  - [ ] ImportExpense template
  - [ ] Import Receipt template (optional)
- [ ] **Quality gate**
  - [ ] Validate before export
  - [ ] Show missing fields
  - [ ] Block export if incomplete

### 📅 Due Date & Status
- [ ] **Due date tracking**
  - [ ] Due date field in document
  - [ ] Due date in document list
- [ ] **Due date notifications**
  - [ ] 7 days before
  - [ ] 3 days before
  - [ ] 1 day before
  - [ ] Overdue notification
- [ ] **Recurring expense flag**
  - [ ] is_recurring toggle
  - [ ] recurring_cycle field
  - [ ] Recurring reminder dashboard
- [ ] **Status: rejected**
  - [ ] Reject button + reason
  - [ ] Rejected status UI
- [ ] **Status: void**
  - [ ] Void button (admin only)
  - [ ] Void reason required
  - [ ] Void status UI

---

## Phase 2 — Advanced Features

### 💵 Income Documents (เอกสารรายรับ) ⭐ ใหม่
- [ ] เพิ่ม `transaction_type` field (expense | income)
- [ ] Income document types (invoice, tax_invoice_sell, receipt_issued)
- [ ] Customer management (Contact type = customer)
- [ ] Payment tracking fields
  - [ ] payment_status (pending | paid | partial | overdue)
  - [ ] payment_due_date
  - [ ] paid_date
  - [ ] paid_amount
- [ ] Income Dashboard
  - [ ] แยกแท็บ: รอชำระ / รับแล้ว / เกินกำหนด
  - [ ] Summary cards (ยอดรวมแต่ละสถานะ)
  - [ ] วันค้างรับ counter
- [ ] Payment Recording
  - [ ] Modal บันทึกรับชำระ
  - [ ] รองรับรับบางส่วน (partial payment)
  - [ ] วิธีรับชำระ (โอน/เงินสด/เช็ค)
- [ ] Payment Reminders
  - [ ] แจ้งเตือนก่อนครบกำหนด (3 วัน)
  - [ ] แจ้งเตือนเกินกำหนด
- [ ] Income Reports
  - [ ] รายงานรายรับตามช่วงเวลา
  - [ ] รายงานลูกค้าค้างชำระ
- [ ] Income Export
  - [ ] Export ใบแจ้งหนี้ Excel
  - [ ] Export AR Aging
- [ ] Transaction Type Filter
  - [ ] แท็บ: ทั้งหมด / รายจ่าย / รายรับ
  - [ ] Filter: สถานะชำระ (สำหรับ Income)
- [ ] Income Notifications
  - [ ] แจ้งเตือนใกล้ครบกำหนดชำระ
  - [ ] แจ้งเตือนเกินกำหนดชำระ
  - [ ] แจ้งเตือนรับชำระแล้ว

### 🤖 OCR & AI
- [ ] OCR service integration
- [ ] Field extraction (amount, date, vendor)
- [ ] Confidence score
- [ ] Manual review/correction

### 📧 Inbound Channels
- [ ] Email Forward setup
- [ ] LINE OA integration
- [ ] Auto draft creation
- [ ] Sender matching

### 💰 Claim & WHT
- [ ] Claim Bundle (UC-E)
- [ ] WHT tracking (UC-10)
- [ ] WHT Rule Engine
- [ ] Document Exchange tracking

### 💱 Multi-Currency
- [ ] Currency field
- [ ] Exchange rate input/API
- [ ] THB conversion
- [ ] Multi-currency reports

---

## Data ที่ต้องเตรียม

### ก่อนเริ่มพัฒนา
- [ ] ลิสต์หมวดค่าใช้จ่ายบริษัท (Internal Categories)
- [ ] รายชื่อศูนย์ต้นทุน/แผนก (ถ้ามี)
- [ ] รายชื่อผู้ใช้งาน + role

### ก่อน PEAK Export
- [ ] Import ผังบัญชีปลายทาง (เช่น PEAK COA)
- [ ] Import Contacts (Excel)
- [ ] กำหนด Default Price Type / VAT
- [ ] เตรียม Template Export (Generic / PEAK)

---

## Definition of Done

### For each feature:
- [ ] Code implemented
- [ ] Unit tests written (if applicable)
- [ ] Manual testing passed
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Deployed to staging

### For each phase:
- [ ] All features completed
- [ ] End-to-end testing passed
- [ ] Performance acceptable
- [ ] Security review passed
- [ ] User acceptance testing
- [ ] Deployed to production

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| OCR accuracy low | Phase 2, start with manual input |
| PEAK format changes | Export as generic Excel first |
| Storage costs | Monitor usage, set quotas |
| User adoption | Simple mobile-first UI, training |
| Data loss | Daily backups, audit logs |
