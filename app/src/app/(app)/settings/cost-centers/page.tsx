import { requireOrganization } from "@/server/auth";
import { AppHeader } from "@/components/layout/app-header";
import { CostCenterList } from "@/components/settings/cost-center-list";
import prisma from "@/lib/prisma";

async function getCostCenters(orgId: string) {
  return prisma.costCenter.findMany({
    where: { 
      organizationId: orgId,
      isActive: true,
    },
    orderBy: { code: "asc" },
  });
}

export default async function CostCentersPage() {
  const session = await requireOrganization();
  const costCenters = await getCostCenters(session.currentOrganization.id);

  return (
    <>
      <AppHeader 
        title="ศูนย์ต้นทุน" 
        description="จัดการศูนย์ต้นทุน / โปรเจค / แผนก"
        showCreateButton={false}
      />
      
      <div className="p-6">
        <CostCenterList costCenters={costCenters} />
      </div>
    </>
  );
}
