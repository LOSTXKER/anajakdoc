import { requireOrganization } from "@/server/auth";
import { AppHeader } from "@/components/layout/app-header";
import { UnifiedDocumentView } from "@/components/documents/unified-document-view";
import prisma from "@/lib/prisma";

async function getAllDocuments(orgId: string, userId: string) {
  const docs = await prisma.document.findMany({
    where: {
      organizationId: orgId,
    },
    include: {
      category: true,
      costCenter: true,
      contact: true,
      submittedBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      subDocuments: {
        include: {
          files: { orderBy: { pageOrder: "asc" } },
        },
      },
      _count: {
        select: { files: true, subDocuments: true, comments: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Serialize for client
  return docs.map(doc => ({
    ...doc,
    subtotal: doc.subtotal.toNumber(),
    vatAmount: doc.vatAmount.toNumber(),
    whtAmount: doc.whtAmount.toNumber(),
    totalAmount: doc.totalAmount.toNumber(),
    vatRate: doc.vatRate?.toNumber() ?? null,
    whtRate: doc.whtRate?.toNumber() ?? null,
    docDate: doc.docDate.toISOString(),
    dueDate: doc.dueDate?.toISOString() ?? null,
    submittedAt: doc.submittedAt?.toISOString() ?? null,
    reviewedAt: doc.reviewedAt?.toISOString() ?? null,
    exportedAt: doc.exportedAt?.toISOString() ?? null,
    bookedAt: doc.bookedAt?.toISOString() ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    subDocuments: doc.subDocuments.map(sub => ({
      ...sub,
      amount: sub.amount?.toNumber() ?? null,
      vatAmount: sub.vatAmount?.toNumber() ?? null,
      docDate: sub.docDate?.toISOString() ?? null,
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString(),
    })),
  }));
}

async function getStatusCounts(orgId: string, userId: string) {
  const [myDocs, pendingReview, needInfo, readyToExport, exported, booked, total] = await Promise.all([
    prisma.document.count({ where: { organizationId: orgId, submittedById: userId } }),
    prisma.document.count({ where: { organizationId: orgId, status: "PENDING_REVIEW" } }),
    prisma.document.count({ where: { organizationId: orgId, status: "NEED_INFO" } }),
    prisma.document.count({ where: { organizationId: orgId, status: "READY_TO_EXPORT" } }),
    prisma.document.count({ where: { organizationId: orgId, status: "EXPORTED" } }),
    prisma.document.count({ where: { organizationId: orgId, status: "BOOKED" } }),
    prisma.document.count({ where: { organizationId: orgId } }),
  ]);

  return {
    myDocs,
    pendingReview,
    needInfo,
    readyToExport,
    exported,
    booked,
    total,
  };
}

export default async function DocumentsPage() {
  const session = await requireOrganization();

  const [documents, counts] = await Promise.all([
    getAllDocuments(session.currentOrganization.id, session.id),
    getStatusCounts(session.currentOrganization.id, session.id),
  ]);

  return (
    <>
      <AppHeader
        title="เอกสาร"
        description="จัดการกล่องเอกสารทั้งหมดของคุณ"
        showCreateButton={false}
      />
      
      <div className="p-6">
        <UnifiedDocumentView
          documents={documents}
          counts={counts}
          userRole={session.currentOrganization.role}
          userId={session.id}
        />
      </div>
    </>
  );
}
