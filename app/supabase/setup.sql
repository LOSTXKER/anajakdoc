-- ============================================
-- Supabase Setup Script for Document Hub V3
-- Run this after creating a new Supabase project
-- ============================================

-- ============================================
-- 1. STORAGE BUCKETS
-- ============================================

-- Create documents bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Create exports bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exports',
  'exports',
  false,
  104857600, -- 100MB limit
  ARRAY['application/zip', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv']
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. STORAGE POLICIES
-- ============================================

-- Documents bucket: Allow authenticated users to upload to their org folder
CREATE POLICY "Users can upload documents to org folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT om.organization_id::text 
    FROM organization_members om
    JOIN users u ON u.id = om.user_id
    WHERE u.supabase_id = auth.uid()::text
  )
);

-- Documents bucket: Allow users to read documents from their org
CREATE POLICY "Users can read documents from org folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT om.organization_id::text 
    FROM organization_members om
    JOIN users u ON u.id = om.user_id
    WHERE u.supabase_id = auth.uid()::text
  )
);

-- Documents bucket: Allow users to delete documents from their org (accounting/admin only)
CREATE POLICY "Accounting can delete documents from org folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT om.organization_id::text 
    FROM organization_members om
    JOIN users u ON u.id = om.user_id
    WHERE u.supabase_id = auth.uid()::text
    AND om.role IN ('OWNER', 'ADMIN', 'ACCOUNTING')
  )
);

-- Exports bucket: Allow accounting to upload exports
CREATE POLICY "Accounting can upload exports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exports' AND
  (storage.foldername(name))[1] IN (
    SELECT om.organization_id::text 
    FROM organization_members om
    JOIN users u ON u.id = om.user_id
    WHERE u.supabase_id = auth.uid()::text
    AND om.role IN ('OWNER', 'ADMIN', 'ACCOUNTING')
  )
);

-- Exports bucket: Allow users to read exports from their org
CREATE POLICY "Users can read exports from org folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'exports' AND
  (storage.foldername(name))[1] IN (
    SELECT om.organization_id::text 
    FROM organization_members om
    JOIN users u ON u.id = om.user_id
    WHERE u.supabase_id = auth.uid()::text
  )
);

-- ============================================
-- 3. DATABASE RLS POLICIES
-- Note: These should be applied after Prisma migration
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE wht_trackings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_histories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Organizations: Users can only see orgs they belong to
-- ============================================
CREATE POLICY "org_select" ON organizations FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT om.organization_id FROM organization_members om
    JOIN users u ON u.id = om.user_id
    WHERE u.supabase_id = auth.uid()::text
  )
);

-- ============================================
-- Organization Members: Users can see members of their orgs
-- ============================================
CREATE POLICY "org_members_select" ON organization_members FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT om.organization_id FROM organization_members om
    JOIN users u ON u.id = om.user_id
    WHERE u.supabase_id = auth.uid()::text
  )
);

-- ============================================
-- Users: Can see users in their orgs
-- ============================================
CREATE POLICY "users_select" ON users FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT om.user_id FROM organization_members om
    WHERE om.organization_id IN (
      SELECT om2.organization_id FROM organization_members om2
      JOIN users u ON u.id = om2.user_id
      WHERE u.supabase_id = auth.uid()::text
    )
  )
);

-- ============================================
-- Boxes: Organization isolation
-- ============================================
CREATE POLICY "boxes_select" ON boxes FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT om.organization_id FROM organization_members om
    JOIN users u ON u.id = om.user_id
    WHERE u.supabase_id = auth.uid()::text
  )
);

CREATE POLICY "boxes_insert" ON boxes FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT om.organization_id FROM organization_members om
    JOIN users u ON u.id = om.user_id
    WHERE u.supabase_id = auth.uid()::text
  )
);

CREATE POLICY "boxes_update" ON boxes FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT om.organization_id FROM organization_members om
    JOIN users u ON u.id = om.user_id
    WHERE u.supabase_id = auth.uid()::text
  )
);

CREATE POLICY "boxes_delete" ON boxes FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT om.organization_id FROM organization_members om
    JOIN users u ON u.id = om.user_id
    WHERE u.supabase_id = auth.uid()::text
    AND om.role IN ('OWNER', 'ADMIN')
  )
);

-- ============================================
-- Documents: Linked to boxes, inherit org isolation
-- ============================================
CREATE POLICY "documents_select" ON documents FOR SELECT
TO authenticated
USING (
  box_id IN (
    SELECT b.id FROM boxes b
    WHERE b.organization_id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN users u ON u.id = om.user_id
      WHERE u.supabase_id = auth.uid()::text
    )
  )
);

CREATE POLICY "documents_insert" ON documents FOR INSERT
TO authenticated
WITH CHECK (
  box_id IN (
    SELECT b.id FROM boxes b
    WHERE b.organization_id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN users u ON u.id = om.user_id
      WHERE u.supabase_id = auth.uid()::text
    )
  )
);

CREATE POLICY "documents_update" ON documents FOR UPDATE
TO authenticated
USING (
  box_id IN (
    SELECT b.id FROM boxes b
    WHERE b.organization_id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN users u ON u.id = om.user_id
      WHERE u.supabase_id = auth.uid()::text
    )
  )
);

CREATE POLICY "documents_delete" ON documents FOR DELETE
TO authenticated
USING (
  box_id IN (
    SELECT b.id FROM boxes b
    WHERE b.organization_id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN users u ON u.id = om.user_id
      WHERE u.supabase_id = auth.uid()::text
      AND om.role IN ('OWNER', 'ADMIN', 'ACCOUNTING')
    )
  )
);

-- ============================================
-- Tasks: Organization isolation
-- ============================================
CREATE POLICY "tasks_select" ON tasks FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT om.organization_id FROM organization_members om
    JOIN users u ON u.id = om.user_id
    WHERE u.supabase_id = auth.uid()::text
  )
);

CREATE POLICY "tasks_insert" ON tasks FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT om.organization_id FROM organization_members om
    JOIN users u ON u.id = om.user_id
    WHERE u.supabase_id = auth.uid()::text
  )
);

CREATE POLICY "tasks_update" ON tasks FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT om.organization_id FROM organization_members om
    JOIN users u ON u.id = om.user_id
    WHERE u.supabase_id = auth.uid()::text
  )
);

-- ============================================
-- Contacts: Organization isolation
-- ============================================
CREATE POLICY "contacts_all" ON contacts FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT om.organization_id FROM organization_members om
    JOIN users u ON u.id = om.user_id
    WHERE u.supabase_id = auth.uid()::text
  )
);

-- ============================================
-- Categories: Organization isolation
-- ============================================
CREATE POLICY "categories_all" ON categories FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT om.organization_id FROM organization_members om
    JOIN users u ON u.id = om.user_id
    WHERE u.supabase_id = auth.uid()::text
  )
);

-- ============================================
-- Cost Centers: Organization isolation
-- ============================================
CREATE POLICY "cost_centers_all" ON cost_centers FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT om.organization_id FROM organization_members om
    JOIN users u ON u.id = om.user_id
    WHERE u.supabase_id = auth.uid()::text
  )
);

-- ============================================
-- Fiscal Periods: Organization isolation
-- ============================================
CREATE POLICY "fiscal_periods_all" ON fiscal_periods FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT om.organization_id FROM organization_members om
    JOIN users u ON u.id = om.user_id
    WHERE u.supabase_id = auth.uid()::text
  )
);

-- ============================================
-- Booking Entries: Organization isolation
-- ============================================
CREATE POLICY "booking_entries_all" ON booking_entries FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT om.organization_id FROM organization_members om
    JOIN users u ON u.id = om.user_id
    WHERE u.supabase_id = auth.uid()::text
  )
);

-- ============================================
-- Notifications: User can only see their own
-- ============================================
CREATE POLICY "notifications_select" ON notifications FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT u.id FROM users u
    WHERE u.supabase_id = auth.uid()::text
  )
);

CREATE POLICY "notifications_update" ON notifications FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT u.id FROM users u
    WHERE u.supabase_id = auth.uid()::text
  )
);

-- ============================================
-- Comments: Organization isolation via box
-- ============================================
CREATE POLICY "comments_all" ON comments FOR ALL
TO authenticated
USING (
  box_id IN (
    SELECT b.id FROM boxes b
    WHERE b.organization_id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN users u ON u.id = om.user_id
      WHERE u.supabase_id = auth.uid()::text
    )
  )
);

-- ============================================
-- WHT Trackings: Organization isolation via box
-- ============================================
CREATE POLICY "wht_trackings_all" ON wht_trackings FOR ALL
TO authenticated
USING (
  box_id IN (
    SELECT b.id FROM boxes b
    WHERE b.organization_id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN users u ON u.id = om.user_id
      WHERE u.supabase_id = auth.uid()::text
    )
  )
);

-- ============================================
-- Payments: Organization isolation via box
-- ============================================
CREATE POLICY "payments_all" ON payments FOR ALL
TO authenticated
USING (
  box_id IN (
    SELECT b.id FROM boxes b
    WHERE b.organization_id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN users u ON u.id = om.user_id
      WHERE u.supabase_id = auth.uid()::text
    )
  )
);

-- ============================================
-- Document Files: Organization isolation via document->box
-- ============================================
CREATE POLICY "document_files_all" ON document_files FOR ALL
TO authenticated
USING (
  document_id IN (
    SELECT d.id FROM documents d
    JOIN boxes b ON b.id = d.box_id
    WHERE b.organization_id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN users u ON u.id = om.user_id
      WHERE u.supabase_id = auth.uid()::text
    )
  )
);

-- ============================================
-- Activity Logs: Organization isolation via box (nullable)
-- ============================================
CREATE POLICY "activity_logs_select" ON activity_logs FOR SELECT
TO authenticated
USING (
  box_id IS NULL OR
  box_id IN (
    SELECT b.id FROM boxes b
    WHERE b.organization_id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN users u ON u.id = om.user_id
      WHERE u.supabase_id = auth.uid()::text
    )
  )
);

-- ============================================
-- Saved Filters: User can only see their own
-- ============================================
CREATE POLICY "saved_filters_all" ON saved_filters FOR ALL
TO authenticated
USING (
  user_id IN (
    SELECT u.id FROM users u
    WHERE u.supabase_id = auth.uid()::text
  )
);

-- ============================================
-- Export Histories: Organization isolation
-- ============================================
CREATE POLICY "export_histories_all" ON export_histories FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT om.organization_id FROM organization_members om
    JOIN users u ON u.id = om.user_id
    WHERE u.supabase_id = auth.uid()::text
  )
);
