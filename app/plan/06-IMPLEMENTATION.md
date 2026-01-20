# 06 - Implementation Plan

## 🎯 เป้าหมาย

สร้างระบบ Document Hub ที่:
- อัปเอกสารง่าย (AI จัดให้)
- ติดตามเอกสารได้ (รู้ว่าขาดอะไร)
- Export ได้ (ส่งสำนักงานบัญชี)

---

## 📋 Phase 1: Foundation (สัปดาห์ 1-2)

### 1.1 Database Schema

- [ ] สร้าง/อัปเดต Prisma Schema
  - [ ] Box model
  - [ ] Document model
  - [ ] DocumentFile model
  - [ ] Payment model
  - [ ] WhtTracking model
- [ ] Run migration
- [ ] Seed data (test)

### 1.2 Core API (Server Actions)

- [ ] Box CRUD
  - [ ] createBox
  - [ ] getBox / getBoxes
  - [ ] updateBox
  - [ ] deleteBox
- [ ] Document CRUD
  - [ ] addDocument
  - [ ] getDocuments
  - [ ] updateDocument
  - [ ] deleteDocument
- [ ] File Upload
  - [ ] uploadFile (Supabase Storage)
  - [ ] deleteFile

### 1.3 Basic UI

- [ ] หน้า Dashboard
- [ ] หน้า List กล่อง
- [ ] หน้า Box Detail
- [ ] Form สร้างกล่อง
- [ ] Upload Component

---

## 📋 Phase 2: Core Features (สัปดาห์ 3-4)

### 2.1 AI Integration

- [ ] OCR Service (OpenAI Vision)
  - [ ] อ่านรูป → ดึงข้อมูล
  - [ ] แยกประเภทเอกสาร
- [ ] Matching Service
  - [ ] หา Box ที่อาจตรงกัน
  - [ ] Calculate match score

### 2.2 Document Tracking

- [ ] คำนวณ docStatus (complete/incomplete)
- [ ] ตาม ExpenseType → รู้ว่าต้องมีเอกสารอะไร
- [ ] แสดง % ความครบถ้วน

### 2.3 WHT Tracking

- [ ] WhtTracking CRUD
- [ ] Status flow (pending → issued → sent → confirmed)
- [ ] WHT Dashboard

---

## 📋 Phase 3: Export & Polish (สัปดาห์ 5-6)

### 3.1 Export System

- [ ] Excel Export
- [ ] CSV Export
- [ ] ZIP (Excel + Files)
- [ ] PEAK Format (optional)

### 3.2 UX Improvements

- [ ] Drag & Drop upload
- [ ] Image preview
- [ ] Keyboard shortcuts
- [ ] Mobile responsive

### 3.3 Polish

- [ ] Error handling
- [ ] Loading states
- [ ] Empty states
- [ ] Notifications

---

## 🗂️ File Structure

```
app/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login, Register
│   │   └── (app)/           # Protected routes
│   │       ├── page.tsx     # Dashboard
│   │       ├── boxes/       # Box list & detail
│   │       │   ├── page.tsx
│   │       │   └── [id]/
│   │       │       └── page.tsx
│   │       ├── wht/         # WHT Tracking
│   │       ├── export/      # Export page
│   │       └── settings/    # Settings
│   │
│   ├── components/
│   │   ├── boxes/           # Box components
│   │   │   ├── box-card.tsx
│   │   │   ├── box-detail.tsx
│   │   │   ├── box-form.tsx
│   │   │   └── box-list.tsx
│   │   ├── documents/       # Document components
│   │   │   ├── document-card.tsx
│   │   │   ├── document-upload.tsx
│   │   │   └── document-preview.tsx
│   │   ├── upload/          # Upload components
│   │   │   ├── dropzone.tsx
│   │   │   └── ai-result.tsx
│   │   └── ui/              # shadcn components
│   │
│   ├── server/
│   │   ├── actions/         # Server Actions
│   │   │   ├── box.ts
│   │   │   ├── document.ts
│   │   │   └── export.ts
│   │   └── queries/         # Database queries
│   │       ├── box.ts
│   │       └── document.ts
│   │
│   ├── lib/
│   │   ├── ai/              # AI/OCR services
│   │   │   ├── ocr.ts
│   │   │   └── matching.ts
│   │   ├── export/          # Export utilities
│   │   │   ├── excel.ts
│   │   │   └── csv.ts
│   │   └── utils.ts
│   │
│   └── prisma/
│       └── schema.prisma
```

---

## ✅ Checklist รายวัน

### Day 1-2: Database
- [ ] ออกแบบ Schema สุดท้าย
- [ ] สร้าง Prisma models
- [ ] Run migration
- [ ] Test with seed data

### Day 3-4: Box CRUD
- [ ] Server Actions: createBox, getBox, updateBox
- [ ] UI: หน้า list, หน้า detail
- [ ] UI: Form สร้าง/แก้ไข

### Day 5-6: Document CRUD
- [ ] Server Actions: addDocument, deleteDocument
- [ ] UI: Upload component
- [ ] UI: Document list in box

### Day 7-8: File Upload
- [ ] Supabase Storage setup
- [ ] Upload function
- [ ] Preview function

### Day 9-10: AI OCR
- [ ] OpenAI Vision integration
- [ ] Parse response
- [ ] UI: แสดงผล AI

### Day 11-12: Tracking
- [ ] Document status calculation
- [ ] WHT tracking
- [ ] UI: Progress indicators

### Day 13-14: Export
- [ ] Excel export
- [ ] CSV export
- [ ] ZIP with files

---

## 🔧 Tech Notes

### Prisma Commands

```bash
# Generate client
npx prisma generate

# Create migration
npx prisma migrate dev --name init

# Reset database
npx prisma migrate reset

# Open studio
npx prisma studio
```

### Server Action Template

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createBox(data: CreateBoxInput) {
  const box = await prisma.box.create({
    data: {
      ...data,
      organizationId: /* from session */,
      createdBy: /* from session */,
    },
  });
  
  revalidatePath("/boxes");
  return box;
}
```

### File Upload Template

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function uploadFile(file: File, path: string) {
  const { data, error } = await supabase.storage
    .from("documents")
    .upload(path, file);
    
  if (error) throw error;
  return data.path;
}
```

---

## 🚀 เริ่มต้น

```bash
# 1. ไปที่ folder app
cd app

# 2. Install dependencies (ถ้ายังไม่ได้)
npm install

# 3. Setup environment
cp .env.example .env.local
# แก้ไข .env.local

# 4. Run migration
npx prisma migrate dev

# 5. Start dev server
npm run dev
```

---

*พร้อมเริ่ม implement!*
