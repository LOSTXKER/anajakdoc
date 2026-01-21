import { requireOrganization } from "@/server/auth";
import { AppHeader } from "@/components/layout/app-header";
import { UnifiedDocumentView } from "@/components/documents/unified-document-view";
import prisma from "@/lib/prisma";

async function getAllBoxes(orgId: string, userId: string) {
  const boxes = await prisma.box.findMany({
    where: {
      organizationId: orgId,
    },
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
        select: { documents: true, payments: true, comments: true },
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
  const [myBoxes, submitted, inReview, needMoreDocs, readyToBook, whtPending, booked, total, incomplete, complete] = await Promise.all([
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
  ]);

  return {
    myBoxes,
    pendingReview: submitted + inReview, // Combined for backward compatibility
    needInfo: needMoreDocs,
    approved: readyToBook + whtPending,
    exported: booked,
    total,
    incomplete,
    complete,
    // New counts
    submitted,
    inReview,
    needMoreDocs,
    readyToBook,
    whtPending,
    booked,
  };
}

export default async function DocumentsPage() {
  const session = await requireOrganization();

  const [boxes, counts] = await Promise.all([
    getAllBoxes(session.currentOrganization.id, session.id),
    getStatusCounts(session.currentOrganization.id, session.id),
  ]);

  return (
    <>
      <AppHeader
        title="กล่องเอกสาร"
        description="จัดการกล่องเอกสารทั้งหมดของคุณ"
        showCreateButton={false}
      />
      
      <div className="p-6">
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
