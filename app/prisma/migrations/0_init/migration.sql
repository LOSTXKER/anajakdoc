-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'STARTER', 'PRO', 'BUSINESS', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'ACCOUNTING', 'STAFF');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "ContactRole" AS ENUM ('VENDOR', 'CUSTOMER', 'BOTH');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('EXPENSE', 'INCOME');

-- CreateEnum
CREATE TYPE "WhtSuggestion" AS ENUM ('NONE', 'SOMETIMES', 'USUALLY');

-- CreateEnum
CREATE TYPE "PeriodStatus" AS ENUM ('OPEN', 'CLOSING', 'CLOSED');

-- CreateEnum
CREATE TYPE "BoxType" AS ENUM ('EXPENSE', 'INCOME', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('STANDARD', 'NO_VAT', 'PETTY_CASH', 'FOREIGN');

-- CreateEnum
CREATE TYPE "BoxStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'NEED_INFO', 'APPROVED', 'EXPORTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DocStatus" AS ENUM ('INCOMPLETE', 'COMPLETE', 'NA');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'OVERPAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('SLIP_TRANSFER', 'SLIP_CHEQUE', 'BANK_STATEMENT', 'CREDIT_CARD_STATEMENT', 'ONLINE_RECEIPT', 'PETTY_CASH_VOUCHER', 'TAX_INVOICE', 'TAX_INVOICE_ABB', 'RECEIPT', 'CASH_RECEIPT', 'INVOICE', 'FOREIGN_INVOICE', 'CUSTOMS_FORM', 'DELIVERY_NOTE', 'CREDIT_NOTE', 'DEBIT_NOTE', 'REFUND_RECEIPT', 'WHT_SENT', 'WHT_RECEIVED', 'WHT_INCOMING', 'TAX_PAYMENT_SLIP', 'TAX_RECEIPT_GOVT', 'SSO_PAYMENT', 'GOVT_RECEIPT', 'CONTRACT', 'QUOTATION', 'PURCHASE_ORDER', 'CLAIM_FORM', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('TRANSFER', 'CHEQUE', 'CASH', 'CREDIT_CARD', 'ONLINE');

-- CreateEnum
CREATE TYPE "WhtType" AS ENUM ('OUTGOING', 'INCOMING');

-- CreateEnum
CREATE TYPE "WhtStatus" AS ENUM ('PENDING', 'ISSUED', 'SENT', 'CONFIRMED', 'RECEIVED');

-- CreateEnum
CREATE TYPE "WhtSentMethod" AS ENUM ('EMAIL', 'MAIL', 'HAND_DELIVERY', 'OTHER');

-- CreateEnum
CREATE TYPE "ExportType" AS ENUM ('EXCEL_GENERIC', 'EXCEL_PEAK', 'CSV', 'ZIP');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOX_SUBMITTED', 'BOX_APPROVED', 'BOX_REJECTED', 'BOX_NEED_INFO', 'DOCUMENT_ADDED', 'DUE_DATE_REMINDER', 'DUE_DATE_OVERDUE', 'WHT_PENDING', 'WHT_OVERDUE', 'COMMENT_ADDED', 'MEMBER_INVITED');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tax_id" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logo" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar_url" TEXT,
    "supabase_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'STAFF',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joined_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_type" "ContactType" NOT NULL DEFAULT 'INDIVIDUAL',
    "contact_role" "ContactRole" NOT NULL DEFAULT 'VENDOR',
    "tax_id" TEXT,
    "branch_no" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "wht_applicable" BOOLEAN NOT NULL DEFAULT false,
    "default_wht_rate" DECIMAL(5,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_centers" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category_type" "CategoryType" NOT NULL DEFAULT 'EXPENSE',
    "peak_account_code" TEXT,
    "wht_suggestion" "WhtSuggestion" NOT NULL DEFAULT 'NONE',
    "default_wht_rate" DECIMAL(5,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_periods" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "PeriodStatus" NOT NULL DEFAULT 'OPEN',
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boxes" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "box_number" TEXT NOT NULL,
    "title" TEXT,
    "box_type" "BoxType" NOT NULL DEFAULT 'EXPENSE',
    "expense_type" "ExpenseType",
    "box_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3),
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "vat_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "wht_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "vat_rate" DECIMAL(5,2),
    "is_vat_inclusive" BOOLEAN NOT NULL DEFAULT true,
    "has_wht" BOOLEAN NOT NULL DEFAULT false,
    "wht_rate" DECIMAL(5,2),
    "status" "BoxStatus" NOT NULL DEFAULT 'DRAFT',
    "doc_status" "DocStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "has_vat" BOOLEAN NOT NULL DEFAULT true,
    "no_receipt_reason" TEXT,
    "wht_sent" BOOLEAN NOT NULL DEFAULT false,
    "foreign_currency" TEXT,
    "foreign_amount" DECIMAL(15,2),
    "exchange_rate" DECIMAL(15,6),
    "description" TEXT,
    "notes" TEXT,
    "external_ref" TEXT,
    "contact_id" TEXT,
    "category_id" TEXT,
    "cost_center_id" TEXT,
    "fiscal_period_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "linked_box_id" TEXT,
    "exported_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "box_id" TEXT NOT NULL,
    "doc_type" "DocType" NOT NULL,
    "doc_number" TEXT,
    "doc_date" TIMESTAMP(3),
    "amount" DECIMAL(15,2),
    "vat_amount" DECIMAL(15,2),
    "foreign_currency" TEXT,
    "foreign_amount" DECIMAL(15,2),
    "notes" TEXT,
    "ai_extracted" JSONB,
    "ai_confidence" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_files" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "checksum" TEXT,
    "page_order" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "box_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "paid_date" TIMESTAMP(3) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "document_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wht_trackings" (
    "id" TEXT NOT NULL,
    "box_id" TEXT NOT NULL,
    "type" "WhtType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "rate" DECIMAL(5,2),
    "status" "WhtStatus" NOT NULL DEFAULT 'PENDING',
    "issued_date" TIMESTAMP(3),
    "sent_date" TIMESTAMP(3),
    "sent_method" "WhtSentMethod",
    "received_date" TIMESTAMP(3),
    "document_id" TEXT,
    "contact_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wht_trackings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "box_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "box_id" TEXT,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_histories" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "export_type" "ExportType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT,
    "box_ids" TEXT[],
    "box_count" INTEGER NOT NULL,
    "exported_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "export_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_filters" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_filters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_supabase_id_key" ON "users"("supabase_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organization_id_user_id_key" ON "organization_members"("organization_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "cost_centers_organization_id_code_key" ON "cost_centers"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "categories_organization_id_code_key" ON "categories"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_periods_organization_id_year_month_key" ON "fiscal_periods"("organization_id", "year", "month");

-- CreateIndex
CREATE INDEX "boxes_organization_id_status_idx" ON "boxes"("organization_id", "status");

-- CreateIndex
CREATE INDEX "boxes_organization_id_box_date_idx" ON "boxes"("organization_id", "box_date");

-- CreateIndex
CREATE INDEX "boxes_organization_id_box_type_idx" ON "boxes"("organization_id", "box_type");

-- CreateIndex
CREATE INDEX "boxes_organization_id_doc_status_idx" ON "boxes"("organization_id", "doc_status");

-- CreateIndex
CREATE INDEX "boxes_contact_id_idx" ON "boxes"("contact_id");

-- CreateIndex
CREATE UNIQUE INDEX "boxes_organization_id_box_number_key" ON "boxes"("organization_id", "box_number");

-- CreateIndex
CREATE INDEX "documents_box_id_idx" ON "documents"("box_id");

-- CreateIndex
CREATE INDEX "documents_doc_type_idx" ON "documents"("doc_type");

-- CreateIndex
CREATE INDEX "document_files_document_id_idx" ON "document_files"("document_id");

-- CreateIndex
CREATE INDEX "document_files_checksum_idx" ON "document_files"("checksum");

-- CreateIndex
CREATE INDEX "payments_box_id_idx" ON "payments"("box_id");

-- CreateIndex
CREATE INDEX "wht_trackings_box_id_idx" ON "wht_trackings"("box_id");

-- CreateIndex
CREATE INDEX "wht_trackings_status_idx" ON "wht_trackings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "saved_filters_organization_id_user_id_name_key" ON "saved_filters"("organization_id", "user_id", "name");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_organization_id_created_at_idx" ON "notifications"("organization_id", "created_at");

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_periods" ADD CONSTRAINT "fiscal_periods_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boxes" ADD CONSTRAINT "boxes_linked_box_id_fkey" FOREIGN KEY ("linked_box_id") REFERENCES "boxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boxes" ADD CONSTRAINT "boxes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boxes" ADD CONSTRAINT "boxes_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boxes" ADD CONSTRAINT "boxes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boxes" ADD CONSTRAINT "boxes_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boxes" ADD CONSTRAINT "boxes_fiscal_period_id_fkey" FOREIGN KEY ("fiscal_period_id") REFERENCES "fiscal_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boxes" ADD CONSTRAINT "boxes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "boxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_files" ADD CONSTRAINT "document_files_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "boxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wht_trackings" ADD CONSTRAINT "wht_trackings_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "boxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wht_trackings" ADD CONSTRAINT "wht_trackings_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "boxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "boxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_histories" ADD CONSTRAINT "export_histories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_filters" ADD CONSTRAINT "saved_filters_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_filters" ADD CONSTRAINT "saved_filters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

