# Supabase Setup Guide

## 1. Create New Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Enter project details:
   - **Name**: `anajakdoc-v3` (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Singapore (closest to Thailand)
4. Click "Create new project"
5. Wait for the project to be ready (~2 minutes)

## 2. Get Your Credentials

Once the project is ready:

1. Go to **Project Settings** (gear icon)
2. Navigate to **API** section
3. Copy the following values:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

4. Navigate to **Database** section
5. Copy the connection strings:
   - **Connection string (Session mode)** → `DATABASE_URL`
   - **Connection string (Transaction mode)** → `DIRECT_URL`

## 3. Update Environment Variables

Create or update your `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database
DATABASE_URL=postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

## 4. Run Prisma Migrations

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Or if you want to use migrations
npx prisma migrate dev --name init_v3
```

## 5. Apply RLS Policies & Storage Setup

After Prisma has created the tables:

1. Go to **SQL Editor** in Supabase dashboard
2. Open the file `supabase/setup.sql`
3. Copy and run the SQL commands

Or use Supabase CLI:

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Run the setup SQL
supabase db execute --file supabase/setup.sql
```

## 6. Configure Authentication

### Email/Password Auth (Default)

1. Go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. Configure settings:
   - Enable "Confirm email" if you want email verification
   - Set site URL to your production URL
   - Add redirect URLs for development:
     - `http://localhost:3000`
     - `http://localhost:3000/api/auth/callback`

### Google OAuth (Optional)

1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add to Supabase **Authentication** → **Providers** → **Google**

## 7. Storage Configuration

The `setup.sql` script creates two buckets:

### `documents` bucket
- Private bucket for document files
- 50MB file size limit
- Allowed types: JPEG, PNG, GIF, WebP, PDF

### `exports` bucket
- Private bucket for export files
- 100MB file size limit
- Allowed types: ZIP, Excel, CSV

## 8. Verify Setup

Run the following to verify everything is working:

```bash
# Start the development server
npm run dev

# The app should:
# 1. Connect to Supabase
# 2. Allow user registration/login
# 3. Create organizations
# 4. Upload documents to storage
```

## Troubleshooting

### Database connection issues
- Make sure you're using the correct connection string format
- Pooler connection (port 6543) for `DATABASE_URL`
- Direct connection (port 5432) for `DIRECT_URL`

### RLS Policy errors
- If policies fail to create, run them one by one to identify the issue
- Make sure tables exist before creating policies
- Check if the table names match (e.g., `boxes` not `box`)

### Storage upload issues
- Check the bucket exists
- Verify the folder structure matches the policy (org_id as first folder)
- Check file size and type limits
