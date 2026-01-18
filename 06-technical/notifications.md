# 🔔 Notification Strategy

## 7.1 In-App Notifications

### UI Components
- **Badge count**: แสดงบน icon ระฆัง
- **Notification center**: เปิดดูรายการแจ้งเตือนทั้งหมด
- **Real-time update**: ใช้ WebSocket/SSE

### Notification Types

#### Expense (รายจ่าย)
| Type | ผู้รับ | Trigger |
|------|--------|---------|
| เอกสารใหม่รอตรวจ | Accounting | Staff ส่งเอกสาร |
| ถูกขอข้อมูลเพิ่ม | Staff | Accounting ขอ info |
| เอกสาร Approved | Staff | Accounting approve |
| เอกสาร Rejected | Staff | Accounting reject |
| ใกล้ due date | All | 7, 3, 1 วันก่อน |
| ค่าใช้จ่ายประจำ | Staff | ถึงกำหนดส่ง |
| หนังสือหัก ณ ที่จ่ายค้างส่ง | Accounting | ค้าง > 7 วัน |
| หนังสือหัก ณ ที่จ่ายค้างรับ | Accounting | ค้าง > 14 วัน |

#### Income (รายรับ) — Phase 2
| Type | ผู้รับ | Trigger |
|------|--------|---------|
| 💵 ใบแจ้งหนี้ใกล้ครบกำหนด | Accounting | 7, 3, 1 วันก่อนครบกำหนดชำระ |
| 🔴 ใบแจ้งหนี้เกินกำหนดชำระ | Accounting | เกินวัน payment_due_date |
| ✅ รับชำระเงินแล้ว | Accounting | บันทึกรับชำระ |
| ⚠️ ค้างรับชำระนาน | Admin | ค้าง > 30 วัน |
| 📊 สรุปยอดค้างรับประจำสัปดาห์ | Admin | ทุกวันจันทร์ |

### Notification Card

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔔 Notifications                                    [Mark all read] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ● เอกสาร DOC-202601-0001 ถูกขอข้อมูลเพิ่ม                      │
│    สมหญิง (บัญชี) - 10 นาทีก่อน                                  │
│    [ดูเอกสาร]                                                    │
│                                                                 │
│  ○ เอกสาร DOC-202601-0002 ได้รับการอนุมัติแล้ว                  │
│    สมหญิง (บัญชี) - 1 ชั่วโมงก่อน                                │
│                                                                 │
│  ○ ⚠️ ใกล้ถึงกำหนดยื่น VAT เดือน ธ.ค.                          │
│    เหลืออีก 3 วัน                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7.2 Push Notifications (Phase 1)

### Triggers

#### Expense
| Event | Message | Priority |
|-------|---------|----------|
| Need Info | "เอกสาร {doc_number} ถูกขอข้อมูลเพิ่ม" | High |
| Approved | "เอกสาร {doc_number} ได้รับการอนุมัติ" | Normal |
| Rejected | "เอกสาร {doc_number} ถูกปฏิเสธ" | High |
| Due Soon (1 day) | "⚠️ {doc_type} ครบกำหนดพรุ่งนี้" | High |
| Due Soon (3 days) | "{doc_type} ครบกำหนดใน 3 วัน" | Normal |

#### Income (Phase 2)
| Event | Message | Priority |
|-------|---------|----------|
| Payment Due (3 days) | "💵 ใบแจ้งหนี้ {doc_number} ครบกำหนดใน 3 วัน" | Normal |
| Payment Due (1 day) | "⚠️ ใบแจ้งหนี้ {doc_number} ครบกำหนดพรุ่งนี้" | High |
| Payment Overdue | "🔴 ใบแจ้งหนี้ {doc_number} เกินกำหนดชำระ" | High |
| Payment Received | "✅ รับชำระ {doc_number} ยอด ฿{amount}" | Normal |

### Implementation
- **Web Push**: Service Worker + Push API
- **Mobile**: React Native / Flutter push

### User Preferences
```json
{
  "push_enabled": true,
  "push_events": {
    "need_info": true,
    "approved": false,
    "rejected": true,
    "due_soon": true
  }
}
```

---

## 7.3 Email Summary (Phase 2)

### Daily Digest
**Subject**: 📊 สรุปเอกสารประจำวัน - {date}

```
เอกสารที่ต้องดำเนินการ:
- รอตรวจ: 5 รายการ
- ขอข้อมูลเพิ่ม: 3 รายการ
- ใกล้ due date: 2 รายการ

[ดูรายละเอียดในระบบ]
```

### Weekly Report
**Subject**: 📈 รายงานประจำสัปดาห์ - Week {week_number}

```
สรุปสัปดาห์:
- เอกสารเข้าใหม่: 45 รายการ
- บันทึกแล้ว: 42 รายการ
- อัตราสำเร็จ: 93%

Top Categories:
1. ค่าโฆษณา - 15 รายการ (฿45,000)
2. ค่าเดินทาง - 12 รายการ (฿8,500)
3. ค่าวัตถุดิบ - 10 รายการ (฿125,000)

[ดูรายงานฉบับเต็ม]
```

### Email Preferences
```json
{
  "email_enabled": true,
  "digest_frequency": "daily", // daily | weekly | none
  "send_time": "08:00"
}
```

---

## 7.4 LINE Notify (Phase 2)

### Data Structure Support
```sql
-- User table
line_notify_token VARCHAR(255) NULL,
notification_preferences JSONB DEFAULT '{
  "channels": ["in_app"],
  "digest_frequency": "realtime"
}'
```

### LINE Message Format
```
📄 เอกสารใหม่รอตรวจ

เลขที่: DOC-202601-0001
ประเภท: ใบเสร็จ
ร้าน: 7-Eleven
ยอด: ฿150

ผู้ส่ง: สมชาย
เวลา: 12 ม.ค. 2026 10:30

🔗 ดูรายละเอียด: https://app.example.com/docs/xxx
```

### Implementation Steps
1. สมัคร LINE Notify Service
2. User เชื่อม LINE account
3. เก็บ token ใน user profile
4. ส่ง notification ตาม events

---

## 7.5 Notification Preferences UI

```
┌─────────────────────────────────────────────────────────────────┐
│  🔔 การตั้งค่าการแจ้งเตือน                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📱 In-App Notifications                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [✓] เปิดใช้งาน                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🔔 Push Notifications                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [✓] เปิดใช้งาน                                          │   │
│  │                                                         │   │
│  │ แจ้งเตือนเมื่อ:                                          │   │
│  │ [✓] เอกสารถูกขอข้อมูลเพิ่ม                               │   │
│  │ [ ] เอกสารได้รับการอนุมัติ                               │   │
│  │ [✓] เอกสารถูกปฏิเสธ                                     │   │
│  │ [✓] ใกล้ถึงกำหนดยื่น                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📧 Email Summary (Phase 2)                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ความถี่: [Daily ▼]                                      │   │
│  │ เวลาส่ง: [08:00 ▼]                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  💬 LINE Notify (Phase 2)                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [เชื่อมต่อ LINE Account]                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7.6 Notification Queue

### Architecture
```
┌─────────┐     ┌─────────┐     ┌─────────────────┐
│ Event   │────▶│ Queue   │────▶│ Notification    │
│ Trigger │     │ (Redis) │     │ Workers         │
└─────────┘     └─────────┘     └────────┬────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
             ┌───────────┐       ┌───────────┐       ┌───────────┐
             │ In-App    │       │ Push      │       │ Email     │
             │ (DB save) │       │ (FCM/APNs)│       │ (SendGrid)│
             └───────────┘       └───────────┘       └───────────┘
```

### Queue Priority
| Priority | Events |
|----------|--------|
| High | need_info, rejected, due_1day |
| Normal | approved, due_3day, due_7day |
| Low | digest, weekly_report |
