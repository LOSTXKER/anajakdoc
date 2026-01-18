import { requireOrganization } from "@/server/auth";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { ExportPanel } from "@/components/export/export-panel";
import prisma from "@/lib/prisma";

async function getExportableDocuments(orgId: string) {
  const docs = await prisma.document.findMany({
    where: {
      organizationId: orgId,
      status: "READY_TO_EXPORT",
    },
    include: {
      category: true,
      costCenter: true,
      contact: true,
      submittedBy: {
        select: { name: true },
      },
    },
    orderBy: { docDate: "desc" },
  });

  // Serialize Decimal to number and Date to string
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
  }));
}

async function getExportHistory(orgId: string) {
  const history = await prisma.exportHistory.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Serialize Date to string
  return history.map(h => ({
    ...h,
    createdAt: h.createdAt.toISOString(),
  }));
}

export default async function ExportPage() {
  const session = await requireOrganization();
  
  // Only accounting, admin, owner can export
  if (!["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    redirect("/documents");
  }

  const [documents, history] = await Promise.all([
    getExportableDocuments(session.currentOrganization.id),
    getExportHistory(session.currentOrganization.id),
  ]);

  return (
    <>
      <AppHeader 
        title="Export ข้อมูล" 
        description="ส่งออกเอกสารเป็น Excel หรือ ZIP"
        showCreateButton={false}
      />
      
      <div className="p-6">
        <ExportPanel 
          documents={documents} 
          history={history}
        />
      </div>
    </>
  );
}
