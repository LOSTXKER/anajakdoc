import { requireOrganization } from "@/server/auth";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { ExportPanel } from "@/components/export/export-panel";
import prisma from "@/lib/prisma";

async function getExportableDocuments(orgId: string) {
  return prisma.document.findMany({
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
}

async function getExportHistory(orgId: string) {
  return prisma.exportHistory.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
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
