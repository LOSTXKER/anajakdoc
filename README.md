# 📦 Accounting Document Hub - กล่องเอกสารดิจิทัล

> **"สร้างกล่อง → ใส่เอกสาร → ส่งให้บัญชี"**
>
> ระบบจัดการเอกสารบัญชีที่ทำให้ "คนส่งเอกสาร" ส่งได้ถูกตั้งแต่ต้น และทำให้ "บัญชี" บันทึกได้เร็วขึ้น/ผิดพลาดน้อยลง

---

## 📦 Core Concept: กล่องเอกสารดิจิทัล

```
   📦 "กล่อง" = ธุรกรรม 1 รายการ (รายจ่าย/รายรับ)
   📄 "เอกสาร" = ไฟล์รูป/PDF ที่ใส่ในกล่อง (กี่ไฟล์ก็ได้)
   🏷️ "ป้าย" = ข้อมูลที่ติดบนกล่อง (หมวด, ยอด, วันที่)

   ┌───────────┐       ┌───────────┐       ┌───────────┐
   │    📦     │       │   📦📄    │       │   📦✅    │
   │ สร้างกล่อง │ ───▶  │ ใส่เอกสาร │ ───▶  │ ส่งบัญชี  │
   └───────────┘       └───────────┘       └───────────┘
```

**✨ จุดขาย:**
- 🏢 **Multi-tenant**: รองรับหลายบริษัทตั้งแต่ต้น (สลับองค์กรได้)
- 💰 รองรับทั้ง **รายจ่าย (Expense)** และ **รายรับ (Income)**
- 📄 ใส่หลายไฟล์ในกล่องเดียว (ใบเสร็จหลายหน้า)
- 💾 เก็บไว้ก่อน กลับมาเพิ่มทีหลังได้
- 👥 บัญชีเห็นทุกอย่างในที่เดียว

---

## 📚 สารบัญเอกสาร

### 1. ภาพรวมระบบ
- [👥 ผู้ใช้หลักและบทบาท](./01-overview/users.md)
- [🎯 เป้าหมายและ KPI](./01-overview/goals-kpi.md)

### 2. ฟีเจอร์และ Use Cases
- [📝 Use Cases หลัก (UC-01 to UC-10)](./02-features/use-cases.md)
- [⚡ Use Cases ขั้นสูง (Phase 2)](./02-features/use-cases-advanced.md)

### 3. โครงสร้างข้อมูล
- [🗃️ Data Model](./03-data-model/data-model.md)

### 4. กระบวนการทำงาน
- [🔄 Workflow และสถานะเอกสาร](./04-workflow/workflow.md)

### 5. หน้าจอและ UX
- [📦 Core Concept: กล่องเอกสารดิจิทัล](./05-ux-screens/concept-digital-box.md) ⭐
- [📱 หน้าจอหลัก](./05-ux-screens/screens.md)

### 6. เทคนิค
- [📁 File Management](./06-technical/file-management.md)
- [🔔 Notifications](./06-technical/notifications.md)
- [🏗️ สถาปัตยกรรมระบบ](./06-technical/architecture.md)

### 7. แผนพัฒนา
- [📅 Phases (MVP, Phase 2, Phase 3)](./07-roadmap/phases.md)
- [✅ Implementation Checklist](./07-roadmap/checklist.md)

### 8. ความปลอดภัย
- [🔒 สิทธิ์และความปลอดภัย](./08-security/security.md)

### 9. Business & Marketing
- [🚀 Landing Page Design](./09-business/landing-page.md)
- [💳 Pricing & Packages](./09-business/pricing.md)
- [📊 Revenue Projection](./09-business/revenue-projection.md)

---

## 🚀 Quick Start

### สำหรับ Developer
1. อ่าน [Data Model](./03-data-model/data-model.md) เพื่อเข้าใจโครงสร้างข้อมูล
2. ศึกษา [Workflow](./04-workflow/workflow.md) สำหรับ state management
3. ดู [Checklist](./07-roadmap/checklist.md) สำหรับ task breakdown

### สำหรับ Product/Design
1. อ่าน [Use Cases](./02-features/use-cases.md) เพื่อเข้าใจ requirements
2. ดู [หน้าจอหลัก](./05-ux-screens/screens.md) สำหรับ screen flow
3. ศึกษา [Users](./01-overview/users.md) สำหรับ personas

---

## 📊 Overview Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              📦 กล่องเอกสารดิจิทัล (Document Hub)             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  👤 Staff/CEO/พนักงาน                                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ 1. สร้างกล่อง│───▶│ 2. ใส่เอกสาร│───▶│ 3. ส่งบัญชี │     │
│  │  (Draft)    │    │  (📄📄📄)   │    │             │     │
│  └─────────────┘    └─────────────┘    └──────┬──────┘     │
│                                               │             │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ │
│                                               ▼             │
│  👩‍💼 บัญชี                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ 4. ตรวจกล่อง│───▶│ 5. อนุมัติ  │───▶│ 6. Export   │     │
│  │  + ถามเพิ่ม │    │             │    │  PEAK/Excel │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 Related Resources

- ไฟล์แผนเดิม: [แผนเว็บจัดการเอกสารบัญชี_accounting_document_hub.md](../แผนเว็บจัดการเอกสารบัญชี_accounting_document_hub.md)
