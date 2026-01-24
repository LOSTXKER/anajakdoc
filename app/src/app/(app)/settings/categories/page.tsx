import { requireOrganization } from "@/server/auth";
import { AppHeader } from "@/components/layout/app-header";
import { CategoryList } from "@/components/settings/CategoryList";
import prisma from "@/lib/prisma";

async function getCategories(orgId: string) {
  return prisma.category.findMany({
    where: { organizationId: orgId },
    orderBy: [{ categoryType: "asc" }, { name: "asc" }],
  });
}

export default async function CategoriesPage() {
  const session = await requireOrganization();
  const categories = await getCategories(session.currentOrganization.id);

  return (
    <>
      <AppHeader 
        title="หมวดหมู่" 
        description="จัดการหมวดหมู่ค่าใช้จ่ายและรายรับ"
        showCreateButton={false}
      />
      
      <div className="p-6">
        <CategoryList categories={categories} />
      </div>
    </>
  );
}
