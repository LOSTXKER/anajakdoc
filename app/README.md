# 📦 กล่องเอกสารดิจิทัล (Accounting Document Hub)

> **"สร้างกล่อง → ใส่เอกสาร → ส่งให้บัญชี"**
>
> ระบบจัดการเอกสารบัญชีที่ทำให้ "คนส่งเอกสาร" ส่งได้ถูกตั้งแต่ต้น และทำให้ "บัญชี" บันทึกได้เร็วขึ้น/ผิดพลาดน้อยลง

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS 4 + shadcn/ui
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- Supabase project (for auth & storage)

## 🛠️ Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/document_hub"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# AI - Gemini (for document classification)
GEMINI_API_KEY="your-gemini-api-key"
```

> **💡 Get Gemini API Key**: https://aistudio.google.com/apikey

### 3. Setup database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, register)
│   ├── (app)/             # Protected routes
│   │   ├── dashboard/     # Dashboard
│   │   ├── documents/     # Document management
│   │   ├── inbox/         # Accounting inbox
│   │   └── settings/      # Settings
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   └── documents/        # Document-specific components
├── lib/                   # Utilities
│   ├── supabase/         # Supabase clients
│   ├── validations/      # Zod schemas
│   └── utils.ts          # Helper functions
├── server/               # Server-side code
│   ├── actions/          # Server Actions
│   └── queries/          # Database queries
├── types/                # TypeScript types
└── middleware.ts         # Auth middleware
```

## 🎯 Features

### MVP Core
- ✅ Multi-tenant organizations
- ✅ User authentication & authorization
- ✅ Document CRUD with multi-file support
- ✅ Category & Cost Center management
- ✅ Document workflow (Draft → Review → Export)
- ✅ Search & Filter
- ✅ Comment system
- ✅ Excel export (Generic & PEAK format)
- ✅ **AI Document Intelligence** (Gemini) - อัปโหลดรูปภาพ AI จะอ่านเอกสาร + กรอกฟอร์มให้อัตโนมัติ

### Coming Soon
- 📋 Income documents
- 📋 OCR/Extraction - ดึงข้อมูลจากเอกสารอัตโนมัติ
- 📋 Email/LINE forward
- 📋 WHT tracking
- 📋 Reports & Analytics

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **Owner** | Full access + Billing |
| **Admin** | Full access + Settings |
| **Accounting** | Review, Approve, Export |
| **Staff** | Create & view own documents |

## 📝 Document Status Flow

```
Draft → Pending Review → Ready to Export → Exported → Booked
                    ↓
              Need Info → (back to Pending Review)
                    ↓
                Rejected
```

## 🔒 Security

- Row-level security with organization isolation
- Signed URLs for file access (1-hour expiry)
- Role-based access control
- Audit logging for all actions

## 📄 License

MIT
