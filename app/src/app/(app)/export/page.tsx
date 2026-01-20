import { requireOrganization } from "@/server/auth";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { ExportPanel } from "@/components/export/export-panel";
import prisma from "@/lib/prisma";

async function getExportableBoxes(orgId: string) {
  const boxes = await prisma.box.findMany({
    where: {
      organizationId: orgId,
      status: "APPROVED",
    },
    include: {
      category: true,
      costCenter: true,
      contact: true,
      createdBy: {
        select: { name: true },
      },
      documents: {
        select: { docType: true },
      },
    },
    orderBy: { boxDate: "desc" },
  });

  // Serialize Decimal to number and Date to string
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
    exportedAt: box.exportedAt?.toISOString() ?? null,
    createdAt: box.createdAt.toISOString(),
    updatedAt: box.updatedAt.toISOString(),
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

  const [boxes, history] = await Promise.all([
    getExportableBoxes(session.currentOrganization.id),
    getExportHistory(session.currentOrganization.id),
  ]);

  return (
    <>
      <AppHeader 
        title="Export ข้อมูล" 
        description="ส่งออกกล่องเอกสารเป็น Excel หรือ ZIP"
        showCreateButton={false}
      />
      
      <div className="p-6">
        <ExportPanel 
          boxes={boxes} 
          history={history}
        />
      </div>
    </>
  );
}
