# 🏗️ สถาปัตยกรรมระบบ (Multi-system Architecture)

## 9.1 Core Concept

> ระบบนี้เป็น **Document Ops + Normalized Data Layer** ไม่ใช่โปรแกรมบัญชี

### หลักการ
- **ข้อมูลกลางชุดเดียว**: Documents, Lines, Vendors, Categories, Cost Centers
- **ปลายทางบัญชีเป็นแค่ Adapter/Exporter**
- **ไม่ทำบัญชี**: ไม่มี ledger, journal entries, trial balance

### System Boundary

```
┌─────────────────────────────────────────────────────────────────┐
│                    Accounting Document Hub                       │
│                     (This System)                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Core Data Layer                        │   │
│  │  Documents │ Vendors │ Categories │ Cost Centers │ Users │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Export Adapters                        │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │   │
│  │  │ Generic │  │  PEAK   │  │ Express │  │  Flow   │    │   │
│  │  │  Excel  │  │         │  │ (Plan)  │  │ (Plan)  │    │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────┴────────────────────┐
         │                                         │
         ▼                                         ▼
┌─────────────────┐                     ┌─────────────────┐
│   PEAK Account  │                     │ สำนักงานบัญชี   │
│   (External)    │                     │  (External)     │
└─────────────────┘                     └─────────────────┘
```

---

## 9.2 Export Targets (Adapters)

### Current Adapters

| Adapter | Status | Format | Use Case |
|---------|--------|--------|----------|
| **Generic Excel** | ✅ Active | XLSX | ผู้ที่ยังไม่ใช้ระบบบัญชี / ส่งสำนักงานบัญชี |
| **PEAK** | ✅ Active | XLSX (ImportExpense/ImportReceipt) | ผู้ใช้ PEAK |

### Planned Adapters

| Adapter | Status | Format | Use Case |
|---------|--------|--------|----------|
| **Express** | 📋 Planned | CSV/XLS | ผู้ใช้ Express Accounting |
| **FlowAccount** | 📋 Planned | CSV/XLS | ผู้ใช้ FlowAccount |

### Adding New Adapter
```typescript
interface ExportAdapter {
  name: string;
  format: 'xlsx' | 'csv' | 'json';
  
  // Transform documents to target format
  transform(documents: Document[]): ExportData;
  
  // Generate file
  generate(data: ExportData): Buffer;
  
  // Validate before export
  validate(documents: Document[]): ValidationResult;
}
```

> **Key Insight**: การเพิ่มระบบใหม่ = เพิ่ม Exporter ใหม่ ไม่กระทบ Core

---

## 9.3 User Modes

### Mode 1: Standalone Mode
```
┌─────────────────────────────────────────────────────────────────┐
│  ไม่ผูกกับระบบบัญชี                                              │
│  - เก็บเอกสาร + Tag + Search                                    │
│  - Export Excel/ZIP ส่งสำนักงานบัญชี                            │
└─────────────────────────────────────────────────────────────────┘
```

**เหมาะสำหรับ:**
- ธุรกิจที่ใช้สำนักงานบัญชีภายนอก
- ธุรกิจที่ยังไม่มีระบบบัญชี
- ต้องการจัดเก็บเอกสารให้เป็นระเบียบ

### Mode 2: Import/Export Mode
```
┌─────────────────────────────────────────────────────────────────┐
│  เลือกระบบปลายทางตอน Export                                     │
│  - ได้ไฟล์ import-ready ตามระบบที่เลือก                          │
│  - Manual import เข้าระบบบัญชี                                   │
└─────────────────────────────────────────────────────────────────┘
```

**เหมาะสำหรับ:**
- ธุรกิจที่ใช้ PEAK, Express, FlowAccount
- ต้องการลดการคีย์ซ้ำ

### Mode 3: Integrated Mode (Future)
```
┌─────────────────────────────────────────────────────────────────┐
│  Sync ผ่าน API (ถ้ามี)                                          │
│  - Sync Contacts / Accounts / Status                            │
│  - Two-way sync                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**เหมาะสำหรับ:**
- ธุรกิจขนาดกลาง-ใหญ่
- ต้องการ automation เต็มรูปแบบ

---

## 9.4 Onboarding Flow

### คำถามเริ่มต้น

```
┌─────────────────────────────────────────────────────────────────┐
│  🎉 ยินดีต้อนรับสู่ Accounting Document Hub                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ปัจจุบันใช้ระบบบัญชีอะไร?                                       │
│                                                                 │
│  ○ ยังไม่ใช้ / ส่งสำนักงานบัญชี                                  │
│  ○ PEAK                                                        │
│  ○ Express                                                     │
│  ○ FlowAccount                                                 │
│  ○ อื่นๆ                                                       │
│                                                                 │
│                                          [ถัดไป]                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### ระบบตั้งค่าตาม Selection

| Selection | Default Exporter | Features |
|-----------|------------------|----------|
| ยังไม่ใช้ | Generic Excel | Basic features |
| PEAK | PEAK ImportExpense | PEAK account mapping |
| Express | Express CSV | Express template (Phase 2) |
| FlowAccount | FlowAccount CSV | FlowAccount template (Phase 2) |

---

## 9.5 Tech Stack

### Stack Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         🚀 Next.js + Supabase Stack                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Frontend + Backend                           │   │
│  │                                                                     │   │
│  │                    Next.js 14+ (App Router)                         │   │
│  │                    ─────────────────────────                         │   │
│  │                    • React 18 (Server Components)                   │   │
│  │                    • TailwindCSS + shadcn/ui                        │   │
│  │                    • Server Actions (API)                           │   │
│  │                    • Edge Runtime                                    │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           Supabase                                   │   │
│  │                                                                     │   │
│  │   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐       │   │
│  │   │   Auth    │  │ PostgreSQL│  │  Storage  │  │Edge Funcs │       │   │
│  │   │           │  │           │  │           │  │           │       │   │
│  │   │• Email    │  │• RLS      │  │• Files    │  │• Webhooks │       │   │
│  │   │• OAuth    │  │• Realtime │  │• Images   │  │• Triggers │       │   │
│  │   │• Magic    │  │• Full-text│  │• PDFs     │  │• Cron     │       │   │
│  │   │  Link     │  │• Triggers │  │           │  │           │       │   │
│  │   └───────────┘  └───────────┘  └───────────┘  └───────────┘       │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15 | Framework (App Router) |
| **React** | 19 | UI Library (Server Components) |
| **TypeScript** | 5+ | Type Safety |
| **Tailwind CSS** | 4 | Styling (ใหม่! CSS-first config) |
| **shadcn/ui** | latest | Component Library |
| **React Hook Form** | 7+ | Form Handling |
| **Zod** | 3+ | Schema Validation |
| **Lucide React** | latest | Icons |

> 💡 **ไม่ใช้** Tanstack Query / Zustand - ใช้ Server Components + Server Actions แทน (เรียบง่ายกว่า)

---

### Backend Stack

| Component | Purpose | Features |
|-----------|---------|----------|
| **Supabase Auth** | Authentication | Email/Password, OAuth (Google) |
| **Prisma** | ORM | Type-safe queries, Migrations, Schema |
| **Supabase Storage** | File Storage | Documents, Images, PDFs |
| **Supabase (Postgres)** | Database | ใช้ผ่าน Prisma |

> 💡 **Prisma แทน Supabase Client** - Type-safe, Schema-first, ดูแลง่าย

---

### Project Structure (Simple & Flat)

```
📁 document-hub/
│
├── 📁 app/                          # Next.js App Router
│   ├── 📁 (auth)/                   # Auth routes
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── 📁 (app)/                    # Protected routes
│   │   ├── layout.tsx               # App shell (sidebar, header)
│   │   ├── page.tsx                 # Dashboard
│   │   ├── 📁 documents/
│   │   │   ├── page.tsx             # List
│   │   │   ├── new/page.tsx         # Create
│   │   │   └── [id]/page.tsx        # Detail
│   │   ├── 📁 inbox/page.tsx        # Accounting inbox
│   │   └── 📁 settings/page.tsx     # Settings
│   │
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Landing page
│   └── globals.css                  # Tailwind 4 (CSS-first)
│
├── 📁 components/                   # React components
│   ├── 📁 ui/                       # shadcn/ui (auto-generated)
│   ├── document-card.tsx            # Flat structure!
│   ├── document-form.tsx
│   ├── file-upload.tsx
│   ├── sidebar.tsx
│   └── header.tsx
│
├── 📁 server/                       # Server-side code
│   ├── 📁 actions/                  # Server Actions
│   │   ├── documents.ts
│   │   ├── auth.ts
│   │   └── upload.ts
│   ├── 📁 queries/                  # Database queries
│   │   ├── documents.ts
│   │   └── organizations.ts
│   └── db.ts                        # Prisma client
│
├── 📁 lib/                          # Utilities (minimal!)
│   ├── utils.ts                     # cn(), formatDate(), etc.
│   ├── validations.ts               # Zod schemas (รวมไว้ที่เดียว)
│   └── supabase.ts                  # Storage client only
│
├── 📁 prisma/                       # Prisma ORM
│   ├── schema.prisma                # Database schema
│   ├── migrations/                  # SQL migrations
│   └── seed.ts                      # Seed data
│
├── middleware.ts                    # Auth middleware
├── next.config.ts
├── postcss.config.mjs               # Tailwind 4
├── tsconfig.json
└── package.json
```

> 💡 **หลักการ**: Flat is better than nested. ไฟล์ไหนใช้ที่เดียว ก็วางไว้ที่เดียว

---

### Key Libraries (Minimal!)

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    
    "@prisma/client": "^6.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "@supabase/ssr": "^0.5.0",
    
    "react-hook-form": "^7.0.0",
    "zod": "^3.0.0",
    "@hookform/resolvers": "^3.0.0",
    
    "lucide-react": "latest",
    "date-fns": "^4.0.0",
    "xlsx": "^0.18.0",
    "clsx": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "prisma": "^6.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0"
  }
}
```

> 💡 **ลดลง 40%!** ไม่มี Tanstack Query, Zustand, tailwind-merge, cva - ใช้ Server Components + clsx แทน

---

### External Services

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| **Vercel** | Hosting (Next.js) | 100GB bandwidth/month |
| **Supabase** | BaaS | 500MB DB, 1GB Storage, 50K MAU |
| **Resend** | Email | 3,000 emails/month |
| **Google Cloud Vision** | OCR (Phase 2) | 1,000 images/month |
| **Upstash Redis** | Queue/Rate Limit | 10K commands/day |

---

### Environment Variables

```env
# .env.local

# Database (Prisma)
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres

# Supabase (Auth + Storage only)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> 💡 แค่ 4 env vars สำหรับเริ่มต้น!

---

## 9.6 Code Principles (หลักการเขียนโค้ด)

### 🎯 Keep It Simple

```
❌ ไม่ทำ                           ✅ ทำ
───────────────────────────────────────────────────────────────
Custom state management           Server Components + Props
Complex caching                   Next.js built-in cache
Separate API layer                Server Actions
Multiple utility files            One utils.ts
Deep folder nesting               Flat structure
Abstract everything               Abstract when needed (3+ uses)
```

### 📁 File Organization

```typescript
// ❌ ไม่ดี: โฟลเดอร์ซ้อนเยอะ
components/
  documents/
    cards/
      DocumentCard/
        index.tsx
        styles.ts
        types.ts

// ✅ ดี: Flat และตรงไปตรงมา
components/
  document-card.tsx
```

### 🔄 Data Fetching

```typescript
// ❌ ไม่ดี: ใช้ Client Component + useEffect + useState
'use client'
export function DocumentList() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch('/api/documents')
      .then(res => res.json())
      .then(setDocs)
      .finally(() => setLoading(false))
  }, [])
  
  if (loading) return <Spinner />
  return <List data={docs} />
}

// ✅ ดี: Server Component (ง่ายกว่า เร็วกว่า)
export async function DocumentList() {
  const docs = await getDocuments()
  return <List data={docs} />
}
```

### 📝 Form Handling

```typescript
// ❌ ไม่ดี: ซับซ้อนเกินไป
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { ... },
  mode: 'onBlur',
  reValidateMode: 'onChange',
})

// ✅ ดี: เรียบง่าย
const form = useForm<FormData>({
  resolver: zodResolver(schema),
})
```

### 🎨 Styling (Tailwind 4)

```css
/* app/globals.css - Tailwind 4 CSS-first */
@import "tailwindcss";

/* Custom theme */
@theme {
  --color-primary: oklch(0.7 0.15 250);
  --color-secondary: oklch(0.6 0.1 200);
  --radius-default: 0.5rem;
}
```

```tsx
// ❌ ไม่ดี: ใช้ CVA + tailwind-merge ทุกที่
import { cva } from 'class-variance-authority'
import { twMerge } from 'tailwind-merge'

const buttonVariants = cva('px-4 py-2', {
  variants: {
    variant: {
      primary: 'bg-primary text-white',
      secondary: 'bg-secondary',
    },
  },
})

// ✅ ดี: clsx + Tailwind ธรรมดา
import { clsx } from 'clsx'

function Button({ variant = 'primary', className, ...props }) {
  return (
    <button
      className={clsx(
        'px-4 py-2 rounded-default',
        variant === 'primary' && 'bg-primary text-white',
        variant === 'secondary' && 'bg-secondary',
        className
      )}
      {...props}
    />
  )
}
```

---

## 9.6 Database Schema Overview

```sql
-- Multi-tenant ⭐
organizations           -- บริษัท/องค์กร (Multi-tenant root)
organization_members    -- สมาชิก + Role per org

-- Core tables (ทุกตารางมี organization_id)
documents          -- กล่องเอกสารหลัก (1 กล่อง = 1 ธุรกรรม)
document_files     -- ไฟล์ในกล่อง (รองรับหลายไฟล์ต่อกล่อง) ⭐
document_lines     -- รายการย่อย (split allocation)
expense_groups     -- กลุ่มเอกสาร

-- Master data (per organization)
users              -- ผู้ใช้งาน (global, can belong to multiple orgs)
cost_centers       -- ศูนย์ต้นทุน (per org)
internal_categories -- หมวดค่าใช้จ่าย (per org)
contacts           -- คู่ค้า/ลูกค้า (per org) ⭐

-- PEAK integration
peak_accounts               -- ผังบัญชี PEAK
category_account_mappings   -- Mapping หมวด → บัญชี

-- Communication
comments           -- ความคิดเห็น
activity_logs      -- ประวัติการทำงาน

-- System
fiscal_periods     -- งวดบัญชี
saved_filters      -- ฟิลเตอร์ที่บันทึก
export_histories   -- ประวัติการ export

-- Phase 2
tags               -- ป้ายกำกับ
document_tags      -- เชื่อม document-tag
attachments        -- ไฟล์แนบเพิ่มเติม
document_exchanges -- ติดตามเอกสารส่ง-รับ (WHT) ⭐
wht_rules          -- กฎแนะนำ WHT อัตโนมัติ ⭐
claims             -- การขอเบิกเงิน (รวมหลายเอกสาร) ⭐
inbound_channels   -- ช่องทางรับเอกสาร (Email/LINE) ⭐
inbound_messages   -- ข้อความที่รับเข้ามา ⭐
```

---

## 9.7 Roadmap การรองรับหลายระบบ

### Phase 1: Foundation
- ✅ Generic Excel Export
- ✅ PEAK ImportExpense Format
- ✅ Core document management

### Phase 2: Extended Export
- 📋 Express Exporter
- 📋 FlowAccount Exporter
- 📋 Custom template builder

### Phase 3: Integration
- 📋 API Integration (ถ้าระบบปลายทางเปิด API)
- 📋 Two-way sync
- 📋 Webhook notifications

---

## 9.8 Deployment Architecture

```
                              Users
                                │
                                ▼
                    ┌─────────────────────┐
                    │       Vercel        │
                    │    (Edge Network)   │
                    │                     │
                    │  • CDN              │
                    │  • SSL              │
                    │  • DDoS Protection  │
                    └──────────┬──────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         Vercel (Next.js)                             │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │  Server         │  │   API Routes    │  │   Middleware    │      │
│  │  Components     │  │   (Optional)    │  │   (Auth Check)  │      │
│  │  (SSR)          │  │                 │  │                 │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
           │                    │                    │
           │                    │                    │
           ▼                    ▼                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                            Supabase                                   │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │                 │  │                 │  │                 │      │
│  │   PostgreSQL    │  │    Storage      │  │  Edge Functions │      │
│  │                 │  │                 │  │                 │      │
│  │  • Documents    │  │  • PDFs         │  │  • OCR          │      │
│  │  • Users        │  │  • Images       │  │  • Notifications│      │
│  │  • Orgs         │  │  • Exports      │  │  • Export Gen   │      │
│  │  • RLS Policies │  │                 │  │  • Cron Jobs    │      │
│  │                 │  │                 │  │                 │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐                           │
│  │                 │  │                 │                           │
│  │      Auth       │  │    Realtime     │                           │
│  │                 │  │                 │                           │
│  │  • Email/Pass   │  │  • Doc Updates  │                           │
│  │  • OAuth        │  │  • Comments     │                           │
│  │  • Magic Link   │  │  • Notifications│                           │
│  │                 │  │                 │                           │
│  └─────────────────┘  └─────────────────┘                           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       External Services                               │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │     Resend      │  │  Google Vision  │  │     Upstash     │      │
│  │     (Email)     │  │     (OCR)       │  │     (Redis)     │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 9.9 Prisma Schema

### Core Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// Multi-tenant
// ============================================

model Organization {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  members   OrganizationMember[]
  documents Document[]
  contacts  Contact[]
  categories Category[]
  costCenters CostCenter[]
}

model OrganizationMember {
  id             String   @id @default(cuid())
  organizationId String
  userId         String
  role           Role     @default(STAFF)
  isDefault      Boolean  @default(false)
  createdAt      DateTime @default(now())

  organization Organization @relation(fields: [organizationId], references: [id])
  user         User         @relation(fields: [userId], references: [id])

  @@unique([organizationId, userId])
}

enum Role {
  OWNER
  ADMIN
  ACCOUNTING
  STAFF
}

// ============================================
// Users
// ============================================

model User {
  id        String   @id // Supabase Auth ID
  email     String   @unique
  name      String?
  avatarUrl String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  memberships  OrganizationMember[]
  documents    Document[]
  comments     Comment[]
}

// ============================================
// Documents
// ============================================

model Document {
  id              String   @id @default(cuid())
  docNumber       String
  organizationId  String
  submittedById   String
  
  // Type
  docType         DocType
  transactionType TransactionType @default(EXPENSE)
  
  // Dates
  docDate         DateTime
  dueDate         DateTime?
  
  // Money
  totalAmount     Decimal  @db.Decimal(12, 2)
  vatAmount       Decimal? @db.Decimal(12, 2)
  
  // Relations
  contactId       String?
  categoryId      String?
  costCenterId    String?
  
  // Status
  status          DocStatus @default(DRAFT)
  paymentStatus   PaymentStatus?
  
  // Meta
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id])
  submittedBy  User         @relation(fields: [submittedById], references: [id])
  contact      Contact?     @relation(fields: [contactId], references: [id])
  category     Category?    @relation(fields: [categoryId], references: [id])
  costCenter   CostCenter?  @relation(fields: [costCenterId], references: [id])
  
  files    DocumentFile[]
  comments Comment[]

  @@index([organizationId])
  @@index([status])
  @@index([docDate])
}

enum DocType {
  SLIP
  RECEIPT
  TAX_INVOICE
  INVOICE
  OTHER
}

enum TransactionType {
  EXPENSE
  INCOME
}

enum DocStatus {
  DRAFT
  PENDING_REVIEW
  NEED_INFO
  READY_TO_EXPORT
  EXPORTED
  BOOKED
  REJECTED
  VOID
}

enum PaymentStatus {
  PENDING
  PAID
  PARTIAL
  OVERDUE
}

model DocumentFile {
  id         String   @id @default(cuid())
  documentId String
  fileName   String
  filePath   String   // Supabase Storage path
  fileSize   Int
  mimeType   String
  isPrimary  Boolean  @default(false)
  createdAt  DateTime @default(now())

  document Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
}

// ============================================
// Master Data
// ============================================

model Contact {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  taxId          String?
  type           ContactType @default(VENDOR)
  createdAt      DateTime @default(now())

  organization Organization @relation(fields: [organizationId], references: [id])
  documents    Document[]

  @@index([organizationId])
}

enum ContactType {
  VENDOR
  CUSTOMER
  BOTH
}

model Category {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  code           String?
  createdAt      DateTime @default(now())

  organization Organization @relation(fields: [organizationId], references: [id])
  documents    Document[]

  @@index([organizationId])
}

model CostCenter {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  code           String?
  createdAt      DateTime @default(now())

  organization Organization @relation(fields: [organizationId], references: [id])
  documents    Document[]

  @@index([organizationId])
}

// ============================================
// Comments
// ============================================

model Comment {
  id         String   @id @default(cuid())
  documentId String
  userId     String
  content    String
  createdAt  DateTime @default(now())

  document Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id])
}
```

### Prisma Client (Singleton)

```typescript
// server/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
```

> 💡 **ทำไมใช้ Prisma?**
> - Type-safe queries (autocomplete!)
> - Schema เป็น single source of truth
> - Migration ง่าย
> - ไม่ต้องเขียน SQL เอง

---

## 9.10 Server Actions (Simple Pattern)

### Queries (Read)

```typescript
// server/queries/documents.ts
import { db } from '@/server/db'
import { getUser } from '@/server/auth'

// ง่าย! ไม่ต้อง cache เอง Next.js จัดการให้
export async function getDocuments(organizationId: string) {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  return db.document.findMany({
    where: { organizationId },
    include: {
      contact: true,
      category: true,
      files: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getDocument(id: string) {
  return db.document.findUnique({
    where: { id },
    include: {
      contact: true,
      category: true,
      costCenter: true,
      files: true,
      comments: {
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}
```

### Actions (Write)

```typescript
// server/actions/documents.ts
'use server'

import { db } from '@/server/db'
import { getUser } from '@/server/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Schema รวมไว้ในไฟล์เดียวกัน (ไม่ต้องแยก)
const CreateSchema = z.object({
  organizationId: z.string(),
  docType: z.enum(['SLIP', 'RECEIPT', 'TAX_INVOICE', 'INVOICE']),
  docDate: z.coerce.date(),
  totalAmount: z.coerce.number().positive(),
  contactId: z.string().optional(),
  categoryId: z.string().optional(),
  notes: z.string().optional(),
})

export async function createDocument(formData: FormData) {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  // Parse & validate
  const data = CreateSchema.parse(Object.fromEntries(formData))

  // Generate doc number (simple!)
  const count = await db.document.count({
    where: { organizationId: data.organizationId },
  })
  const docNumber = `DOC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`

  // Create
  const doc = await db.document.create({
    data: {
      ...data,
      docNumber,
      submittedById: user.id,
      status: 'DRAFT',
    },
  })

  revalidatePath('/documents')
  return doc
}

export async function updateDocumentStatus(
  id: string,
  status: 'PENDING_REVIEW' | 'READY_TO_EXPORT' | 'NEED_INFO'
) {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const doc = await db.document.update({
    where: { id },
    data: { status },
  })

  revalidatePath(`/documents/${id}`)
  revalidatePath('/inbox')
  return doc
}
```

### File Upload

```typescript
// server/actions/upload.ts
'use server'

import { db } from '@/server/db'
import { createClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function uploadFile(documentId: string, formData: FormData) {
  const file = formData.get('file') as File
  if (!file) throw new Error('No file')

  const supabase = createClient()
  const path = `${documentId}/${Date.now()}-${file.name}`

  // Upload to Supabase Storage
  const { error } = await supabase.storage
    .from('documents')
    .upload(path, file)

  if (error) throw error

  // Save to database via Prisma
  await db.documentFile.create({
    data: {
      documentId,
      fileName: file.name,
      filePath: path,
      fileSize: file.size,
      mimeType: file.type,
    },
  })

  revalidatePath(`/documents/${documentId}`)
}
```

### Using in Components

```tsx
// app/(app)/documents/new/page.tsx
import { createDocument } from '@/server/actions/documents'

export default function NewDocumentPage() {
  return (
    <form action={createDocument}>
      <input name="organizationId" type="hidden" value="..." />
      
      <select name="docType">
        <option value="SLIP">สลิป</option>
        <option value="RECEIPT">ใบเสร็จ</option>
        <option value="TAX_INVOICE">ใบกำกับภาษี</option>
      </select>
      
      <input name="docDate" type="date" />
      <input name="totalAmount" type="number" step="0.01" />
      <textarea name="notes" />
      
      <button type="submit">สร้างกล่องเอกสาร</button>
    </form>
  )
}
```

> 💡 **ง่ายมาก!** Form → Server Action → Prisma → Done

---

## 9.11 Authentication (Simple)

### Auth Helper

```typescript
// server/auth.ts
import { createClient } from '@/lib/supabase'
import { db } from '@/server/db'
import { cache } from 'react'

// cache() = เรียกกี่ครั้งก็ได้ใน request เดียวกัน query แค่ครั้งเดียว
export const getUser = cache(async () => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // Get user from our database
  return db.user.findUnique({
    where: { id: user.id },
    include: {
      memberships: {
        include: { organization: true },
      },
    },
  })
})

export const getCurrentOrg = cache(async () => {
  const user = await getUser()
  if (!user) return null

  // Find default org
  const defaultMembership = user.memberships.find(m => m.isDefault)
  return defaultMembership?.organization ?? user.memberships[0]?.organization
})
```

### Supabase Client (Simple)

```typescript
// lib/supabase.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### Middleware (Minimal)

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes
  if (!user && request.nextUrl.pathname.startsWith('/(app)')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
```

### Using in Pages

```tsx
// app/(app)/page.tsx
import { getUser, getCurrentOrg } from '@/server/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const org = await getCurrentOrg()
  if (!org) redirect('/onboarding')

  return (
    <div>
      <h1>สวัสดี {user.name}</h1>
      <p>องค์กร: {org.name}</p>
    </div>
  )
}
```

> 💡 **ง่ายมาก!** 3 ไฟล์: `auth.ts`, `supabase.ts`, `middleware.ts`

---

## 9.12 Summary: ทำไมถึงเรียบง่าย?

### Stack Comparison

```
┌─────────────────────────────────────────────────────────────────┐
│              ❌ Complex Stack          ✅ Our Stack             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend:                                                      │
│  React Query + Zustand + CVA   →   Server Components only      │
│  + tailwind-merge + 10 libs    →   clsx + shadcn/ui            │
│                                                                 │
│  Backend:                                                       │
│  Express + Controllers +       →   Server Actions              │
│  Services + Repositories       →   + Prisma queries            │
│                                                                 │
│  Database:                                                      │
│  Raw SQL + manual types        →   Prisma (auto types)         │
│                                                                 │
│  Auth:                                                          │
│  Custom auth + sessions        →   Supabase Auth               │
│                                                                 │
│  Files:                                                         │
│  S3 + presigned URLs + CDN     →   Supabase Storage            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Files Count

```
ทั้งโปรเจค MVP จะมีประมาณ:

📁 app/           ~20 files (pages)
📁 components/    ~15 files (UI)
📁 server/        ~10 files (actions + queries)
📁 lib/           ~3 files (utils)
📁 prisma/        ~2 files (schema + seed)
─────────────────────────────
รวม              ~50 files

เทียบกับ complex stack: 150-200 files
```

### Development Commands

```bash
# Setup
pnpm create next-app document-hub --typescript --tailwind --app
cd document-hub
pnpm add @prisma/client @supabase/supabase-js @supabase/ssr
pnpm add react-hook-form zod @hookform/resolvers lucide-react date-fns clsx
pnpm add -D prisma @tailwindcss/postcss tailwindcss

# Init Prisma
npx prisma init

# After writing schema
npx prisma migrate dev --name init
npx prisma generate

# Run dev
pnpm dev
```

### Key Principles

| หลักการ | ทำไม |
|---------|------|
| **Server Components First** | ไม่ต้องจัดการ loading states |
| **Server Actions** | ไม่ต้องสร้าง API layer |
| **Prisma** | Type-safe, migration ง่าย |
| **Flat Structure** | หาไฟล์ง่าย, ไม่ต้องนึกว่าอยู่ไหน |
| **Minimal Libraries** | ดูแลง่าย, อัพเดทง่าย |
| **Tailwind 4 CSS-first** | ไม่ต้อง config JS |

### Quick Start Checklist

- [ ] Clone template
- [ ] `pnpm install`
- [ ] Copy `.env.example` → `.env.local`
- [ ] Fill Supabase credentials
- [ ] `npx prisma migrate dev`
- [ ] `pnpm dev`
- [ ] 🎉 Done!

> **เวลาในการ setup: ~15 นาที**
