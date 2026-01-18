# 📅 Phases (MVP, Phase 2, Phase 3)

## Overview Timeline

```
┌─────────────────────────────────────────────────────────────────┐
│                        Development Roadmap                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Week 1-2         Week 3-4         Month 2-3        Month 4+    │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐   │
│  │  MVP    │────▶│   MVP   │────▶│ Phase 2 │────▶│ Phase 3 │   │
│  │  Core   │     │Extended │     │         │     │  SaaS   │   │
│  └─────────┘     └─────────┘     └─────────┘     └─────────┘   │
│                                                                 │
│  Multi-tenant   PEAK Ready      เพิ่มความโหด     SaaS Full      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## MVP Core (สัปดาห์ 1-2: ใช้งานได้เลย)

### 🏢 Multi-tenant (Organization) ⭐ ใหม่
| Feature | Description | Priority |
|---------|-------------|----------|
| Organization Entity | บริษัท/องค์กร + settings | P0 |
| Organization CRUD | สร้าง/แก้ไข/ลบองค์กร | P0 |
| Organization Switcher | สลับระหว่างองค์กร | P0 |
| OrganizationMember | สมาชิก + Role per org | P0 |
| Invite Member | เชิญสมาชิกผ่านอีเมล | P0 |
| Data Isolation | แยกข้อมูลตาม organization_id | P0 |

### 🔐 Authentication & Users
| Feature | Description | Priority |
|---------|-------------|----------|
| Login | Email/Password authentication | P0 |
| Roles | Staff / Accounting / Admin / Owner (per org) | P0 |
| User Management | จัดการสมาชิกในองค์กร | P0 |

### 📁 Master Data
| Feature | Description | Priority |
|---------|-------------|----------|
| Cost Center Management | CRUD ศูนย์ต้นทุน/แผนก | P0 |
| Internal Categories | หมวดค่าใช้จ่าย | P0 |

### 📄 Document Management (Expense เท่านั้น)
| Feature | Description | Priority |
|---------|-------------|----------|
| Upload + Storage | รองรับ JPG, PNG, PDF (หลายไฟล์ต่อกล่อง) | P0 |
| Document CRUD | สร้าง/แก้ไข/ลบเอกสาร | P0 |
| Transaction Type | **expense (รายจ่าย)** เท่านั้นใน MVP | P0 |
| Required Fields | ประเภท, วันที่, ร้าน, หมวด, ยอด | P0 |
| Amount Fields | subtotal, vat_amount, total_amount | P0 |
| Fiscal Period Fields | fiscal_year, fiscal_month | P0 |
| Basic Workflow | draft → pending_review → ready_to_export → booked | P0 |

### 🔍 Search & Filter
| Feature | Description | Priority |
|---------|-------------|----------|
| Basic Search | วันที่, ร้าน, ยอด, หมวด, สถานะ | P0 |
| Saved Filters | บันทึก/เรียกใช้ filter ที่ใช้บ่อย | P0 |

### 🛡️ Quality Control
| Feature | Description | Priority |
|---------|-------------|----------|
| Duplicate Detection | checksum + soft match | P0 |
| Comment System | สนทนาระหว่างบัญชีกับคนส่ง | P0 |
| Activity Log | ประวัติการทำงานทุก action | P0 |

### 📅 Fiscal Management
| Feature | Description | Priority |
|---------|-------------|----------|
| Fiscal Period | เปิด/ปิดงวดบัญชี | P0 |
| Period Lock | ล็อคเอกสารในงวดที่ปิด | P0 |

### 📤 Export
| Feature | Description | Priority |
|---------|-------------|----------|
| Generic Excel | Export พื้นฐาน | P0 |
| ZIP Export | Export เอกสารแนบ | P0 |
| Export History | บันทึกประวัติการ export | P0 |

---

## MVP Extended (สัปดาห์ 3-4: PEAK Ready)

### 📋 Document Lines
| Feature | Description | Priority |
|---------|-------------|----------|
| DocumentLine | แตกหลายบรรทัดต่อเอกสาร | P1 |
| Line Details | description, qty, unit_price, amount, vat_rate | P1 |

### 📁 Expense Groups
| Feature | Description | Priority |
|---------|-------------|----------|
| Group CRUD | สร้าง/แก้ไข/ลบกลุ่มเอกสาร | P1 |
| Primary/Supporting | กำหนดเอกสารหลัก vs ประกอบ | P1 |
| Group Export | Export ZIP ทั้ง group | P1 |

### ⚡ Bulk Actions
| Feature | Description | Priority |
|---------|-------------|----------|
| Bulk Approve | อนุมัติหลายรายการพร้อมกัน | P1 |
| Bulk Reject | ปฏิเสธหลายรายการ + เหตุผล | P1 |
| Bulk Export | Export หลายรายการ | P1 |
| Bulk Assign | กำหนดหมวด/ศูนย์ต้นทุน | P1 |
| Bulk Add to Group | เพิ่มเข้า Expense Group | P1 |

### 🔗 PEAK Integration
| Feature | Description | Priority |
|---------|-------------|----------|
| PEAK Account Mapping | Mapping หมวดบริษัท → บัญชี PEAK | P1 |
| Quality Gate | ตรวจข้อมูลก่อน export | P1 |
| PEAK Export Format | ImportExpense format | P1 |

### 📅 Due Date & Status
| Feature | Description | Priority |
|---------|-------------|----------|
| Due Date Tracking | วันครบกำหนด | P1 |
| Due Date Alerts | แจ้งเตือน 7, 3, 1 วัน | P1 |
| Recurring Flag | ค่าใช้จ่ายประจำ | P1 |
| Status: rejected | เอกสารถูกปฏิเสธ | P1 |
| Status: void | ยกเลิกหลังบันทึก | P1 |

---

## Phase 2 (เพิ่มความโหด)

### 📥 Inbound Channels (รับเอกสารผ่านช่องทางอื่น)
| Feature | Description | Priority |
|---------|-------------|----------|
| Email Forward | รับเอกสารผ่าน forward email มาที่ inbox กลาง | P2 |
| LINE Forward | รับเอกสารผ่าน LINE OA | P2 |
| Auto Draft | สร้าง Document draft อัตโนมัติจากไฟล์ที่รับ | P2 |
| Sender Matching | จับคู่ผู้ส่งจาก email/LINE กับ User ในระบบ | P2 |

### 🤖 AI & Automation
| Feature | Description | Priority |
|---------|-------------|----------|
| OCR/Extraction | ดึงข้อมูลจากรูปอัตโนมัติ | P2 |
| Vendor Master | จำร้านเดิม + auto-suggest | P2 |
| Smart Categorization | แนะนำหมวดจากข้อมูล | P2 |
| WHT Rule Engine | กฎแนะนำหัก ณ ที่จ่าย (แนะนำ ไม่บังคับ) | P2 |

### 🔔 Notifications
| Feature | Description | Priority |
|---------|-------------|----------|
| Push Notifications | แจ้งเตือนค้างส่ง/Need info | P2 |
| Email Summary | Daily/Weekly digest | P2 |
| LINE Notify | Integration กับ LINE | P2 |

### 💰 Expense Management
| Feature | Description | Priority |
|---------|-------------|----------|
| Claim Bundle | เบิกเงิน 1 ครั้งมีหลายเอกสาร | P2 |
| WHT (หัก ณ ที่จ่าย) | ระดับเอกสาร/บรรทัด | P2 |

### 📋 Document Exchange Tracking
| Feature | Description | Priority |
|---------|-------------|----------|
| Outgoing Tracking | ติดตามเอกสารที่ต้องส่งออก (หัก ณ ที่จ่ายฝั่งซื้อ) | P2 |
| Incoming Tracking | ติดตามเอกสารที่ต้องรับเข้า (หัก ณ ที่จ่ายฝั่งขาย) | P2 |
| Exchange Status | สถานะ: รอออก → ส่งแล้ว → ยืนยันรับ | P2 |
| Overdue Alerts | แจ้งเตือนค้างส่ง/ค้างรับ | P2 |
| Send Log | บันทึกการส่ง (วันที่/ช่องทาง/หมายเหตุ) | P2 |

### 💵 Income Documents (เอกสารรายรับ) ⭐ ใหม่
| Feature | Description | Priority |
|---------|-------------|----------|
| Transaction Type | เพิ่ม `income` (รายรับ) นอกจาก `expense` | P2 |
| Income Document Types | Invoice, Tax Invoice (ขาย), Receipt (ออกให้ลูกค้า) | P2 |
| Customer Management | Contact type = customer | P2 |
| Payment Status | pending \| paid \| partial \| overdue | P2 |
| Payment Due Date | วันครบกำหนดชำระ + ติดตามการชำระ | P2 |
| Payment Recording | บันทึกการรับชำระ (วันที่/ยอด/วิธี) | P2 |
| Income Dashboard | แยก Dashboard รายรับ (รอชำระ/รับแล้ว/เกินกำหนด) | P2 |
| Payment Reminders | แจ้งเตือนก่อนครบกำหนด/เกินกำหนด | P2 |
| Partial Payment | รองรับรับชำระบางส่วน | P2 |

### 📤 Extended Export
| Feature | Description | Priority |
|---------|-------------|----------|
| Express Template | CSV/XLS ตาม Express | P2 |
| FlowAccount Template | CSV/XLS ตาม FlowAccount | P2 |
| **Income Export** | Export ใบแจ้งหนี้/รายรับ Excel/ZIP | P2 |
| **AR Aging Export** | รายงานลูกหนี้ค้างชำระตามอายุ | P2 |

### 📊 Reports & Analytics
| Feature | Description | Priority |
|---------|-------------|----------|
| Category Report | ค่าใช้จ่ายตามหมวด + chart | P2 |
| Cost Center Report | ค่าใช้จ่ายตามศูนย์ต้นทุน | P2 |
| Monthly/Quarterly | ค่าใช้จ่ายตามช่วงเวลา | P2 |
| VAT Summary | สรุป Input VAT / Output VAT | P2 |
| By Submitter | ค่าใช้จ่ายตามผู้ส่ง | P2 |
| PDF/Excel Export | Export รายงาน | P2 |
| **Income Summary** | สรุปรายรับ: รอชำระ/รับแล้ว/เกินกำหนด | P2 |
| **Customer Aging** | รายงานลูกค้าค้างชำระ | P2 |

### 👥 Contact Management
| Feature | Description | Priority |
|---------|-------------|----------|
| Contact Entity | รวม Vendor + Customer เป็น Contact | P2 |
| Contact Role | แยก vendor / customer / both | P2 |
| Contact Import | Import จาก Excel/PEAK | P2 |

### 🏷️ Extended Features
| Feature | Description | Priority |
|---------|-------------|----------|
| Tags / Labels | ติด tag เพิ่มเติม | P2 |
| Attachments | แนบไฟล์เพิ่มเติม | P2 |
| Currency Support | หลายสกุลเงิน + อัตราแลกเปลี่ยน | P2 |
| Data Export/Backup | Export ทั้งหมดเป็น JSON/CSV | P2 |

---

## Phase 3 (SaaS Full)

> Multi-tenant ย้ายมา MVP แล้ว ✅

### 💳 Billing & Subscription
| Feature | Description | Priority |
|---------|-------------|----------|
| Plans | Free / Pro / Enterprise | P3 |
| Quotas | จำกัดจำนวนเอกสาร/storage | P3 |
| Payment Gateway | Stripe/Omise integration | P3 |
| Invoice Generation | ออกใบแจ้งหนี้อัตโนมัติ | P3 |
| Usage Analytics | Dashboard การใช้งาน | P3 |

### 👥 Advanced Approval Workflow
| Feature | Description | Priority |
|---------|-------------|----------|
| Approval Chain | หัวหน้าอนุมัติค่าใช้จ่าย | P3 |
| Multi-level Approval | หลายขั้นตอน | P3 |
| Delegation | มอบหมายผู้อนุมัติ | P3 |
| Approval Limits | กำหนดวงเงินอนุมัติตาม role | P3 |

### 🔗 API & Integrations
| Feature | Description | Priority |
|---------|-------------|----------|
| Public API | REST API สำหรับ third-party | P3 |
| Webhooks | Event notifications | P3 |
| Zapier/Make | No-code integrations | P3 |

### 🔌 API & Integration
| Feature | Description | Priority |
|---------|-------------|----------|
| REST API | API สาธารณะ | P3 |
| Webhooks | แจ้งเหตุการณ์ไประบบอื่น | P3 |
| Zapier Integration | เชื่อมต่อ no-code | P3 |
| Accounting API Sync | Sync กับ PEAK/Express (ถ้ามี API) | P3 |

---

## Feature Summary by Phase

| Category | MVP Core | MVP Extended | Phase 2 | Phase 3 |
|----------|----------|--------------|---------|---------|
| **Multi-tenant** | **✅ Organization** | - | - | Billing/Plans |
| Auth & Users | ✅ | - | - | - |
| Document CRUD | ✅ | ✅ Lines | ✅ OCR | - |
| Inbound Channels | - | - | ✅ Email/LINE Forward | - |
| Workflow | Basic | Extended | - | Approval Chain |
| Export | Excel + ZIP | PEAK | Express/Flow | API |
| Groups | - | ✅ | ✅ Claim Bundle | - |
| Contacts | Vendor only | - | ✅ Contact (Vendor+Customer) | - |
| WHT | - | - | ✅ Rule Engine + Exchange | - |
| Currency | THB only | - | ✅ Multi-currency | - |
| Income | - | - | ✅ | - |
| Notifications | - | Due Alerts | Push/Email/LINE | - |
| Reports | - | - | ✅ | - |
