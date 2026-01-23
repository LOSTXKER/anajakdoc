import { Suspense } from "react";
import { requireOrganization } from "@/server/auth";
import { AppHeader } from "@/components/layout/app-header";
import { UnifiedDocumentView } from "@/components/documents/unified-document-view";
import { DocumentFilters } from "@/components/documents/document-filters";
import { getSavedFilters } from "@/server/actions/saved-filter";
import prisma from "@/lib/prisma";
import type { BoxStatus, BoxType } from "@prisma/client";

interface SearchParams {
  search?: string;
  status?: string;
  type?: string;
  reimburse?: string;
}

async function getFilteredBoxes(
  orgId: string, 
  userId: string, 
  userRole: string,
  filters: SearchParams
) {
  // Build where clause
  const where: Record<string, unknown> = {
    organizationId: orgId,
  };

  // Apply search filter
  if (filters.search) {
    where.OR = [
      { boxNumber: { contains: filters.search, mode: "insensitive" } },
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { externalRef: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  // Apply status filter
  if (filters.status && filters.status !== "all") {
    where.status = filters.status as BoxStatus;
  }

  // Apply type filter
  if (filters.type && filters.type !== "all") {
    where.boxType = filters.type as BoxType;
  }

  // Apply reimbursement filter (Section 19)
  if (filters.reimburse === "pending") {
    where.paymentMode = "EMPLOYEE_ADVANCE";
    where.reimbursementStatus = "PENDING";
  }

  // For staff, only show their own boxes
  if (userRole === "STAFF") {
    where.createdById = userId;
  }

  const boxes = await prisma.box.findMany({
    where,
    include: {
      category: true,
      costCenter: true,
      contact: true,
      createdBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      documents: {
        include: {
          files: { orderBy: { pageOrder: "asc" } },
        },
      },
      payments: true,
      _count: {
        select: { documents: true, payments: true, comments: true, tasks: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Serialize for client
  return boxes.map(box => ({
    ...box,
    totalAmount: box.totalAmount.toNumber(),
    vatAmount: box.vatAmount.toNumber(),
    whtAmount: box.whtAmount.toNumber(),
    paidAmount: box.paidAmount.toNumber(),
    vatRate: box.vatRate?.toNumber() ?? null,
    whtRate: box.whtRate?.toNumber() ?? null,
    foreignAmount: box.foreignAmount?.toNumber() ?? null,
    exchangeRate: box.exchangeRate?.toNumber() ?? null,
    boxDate: box.boxDate.toISOString(),
    dueDate: box.dueDate?.toISOString() ?? null,
    whtDueDate: box.whtDueDate?.toISOString() ?? null,
    exportedAt: box.exportedAt?.toISOString() ?? null,
    createdAt: box.createdAt.toISOString(),
    updatedAt: box.updatedAt.toISOString(),
    documents: box.documents.map(doc => ({
      ...doc,
      amount: doc.amount?.toNumber() ?? null,
      vatAmount: doc.vatAmount?.toNumber() ?? null,
      foreignAmount: doc.foreignAmount?.toNumber() ?? null,
      docDate: doc.docDate?.toISOString() ?? null,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    })),
    payments: box.payments.map(p => ({
      ...p,
      amount: p.amount.toNumber(),
      paidDate: p.paidDate.toISOString(),
      createdAt: p.createdAt.toISOString(),
    })),
  }));
}

async function getStatusCounts(orgId: string, userId: string) {
  const [myBoxes, submitted, inReview, needMoreDocs, readyToBook, whtPending, booked, total, incomplete, complete, reimbursePending] = await Promise.all([
    prisma.box.count({ where: { organizationId: orgId, createdById: userId } }),
    prisma.box.count({ where: { organizationId: orgId, status: "SUBMITTED" } }),
    prisma.box.count({ where: { organizationId: orgId, status: "IN_REVIEW" } }),
    prisma.box.count({ where: { organizationId: orgId, status: "NEED_MORE_DOCS" } }),
    prisma.box.count({ where: { organizationId: orgId, status: "READY_TO_BOOK" } }),
    prisma.box.count({ where: { organizationId: orgId, status: "WHT_PENDING" } }),
    prisma.box.count({ where: { organizationId: orgId, status: "BOOKED" } }),
    prisma.box.count({ where: { organizationId: orgId } }),
    prisma.box.count({ where: { organizationId: orgId, docStatus: "INCOMPLETE" } }),
    prisma.box.count({ where: { organizationId: orgId, docStatus: "COMPLETE" } }),
    // Reimbursement pending (Section 19)
    prisma.box.count({ 
      where: { 
        organizationId: orgId, 
        paymentMode: "EMPLOYEE_ADVANCE",
        reimbursementStatus: "PENDING"
      } 
    }),
  ]);

  return {
    myBoxes,
    pendingReview: submitted + inReview,
    needInfo: needMoreDocs,
    approved: readyToBook + whtPending,
    exported: booked,
    total,
    incomplete,
    complete,
    submitted,
    inReview,
    needMoreDocs,
    readyToBook,
    whtPending,
    booked,
    reimbursePending,
  };
}

interface DocumentsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const session = await requireOrganization();
  const params = await searchParams;

  const [boxes, counts, savedFilters] = await Promise.all([
    getFilteredBoxes(
      session.currentOrganization.id, 
      session.id,
      session.currentOrganization.role,
      params
    ),
    getStatusCounts(session.currentOrganization.id, session.id),
    getSavedFilters(),
  ]);

  const hasActiveFilters = !!(params.search || params.status || params.type || params.reimburse);

  return (
    <>
      <AppHeader
        title="กล่องเอกสาร"
        description="จัดการกล่องเอกสารทั้งหมดของคุณ"
        showCreateButton={false}
      />
      
      <div className="p-6 space-y-4">
        {/* Filters */}
        <Suspense fallback={null}>
          <DocumentFilters savedFilters={savedFilters} />
        </Suspense>

        {/* Results info when filtering */}
        {hasActiveFilters && (
          <p className="text-sm text-muted-foreground">
            พบ {boxes.length} รายการ
          </p>
        )}

        {/* Document List */}
        <UnifiedDocumentView
          boxes={boxes}
          counts={counts}
          userRole={session.currentOrganization.role}
          userId={session.id}
        />
      </div>
    </>
  );
}
