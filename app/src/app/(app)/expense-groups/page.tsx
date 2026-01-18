import { requireOrganization } from "@/server/auth";
import { AppHeader } from "@/components/layout/app-header";
import { ExpenseGroupList } from "@/components/expense-groups/expense-group-list";
import prisma from "@/lib/prisma";

async function getExpenseGroups(orgId: string) {
  return prisma.expenseGroup.findMany({
    where: { organizationId: orgId },
    include: {
      documents: {
        select: {
          id: true,
          docNumber: true,
          totalAmount: true,
          status: true,
        },
      },
      _count: {
        select: { documents: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function ExpenseGroupsPage() {
  const session = await requireOrganization();
  const groups = await getExpenseGroups(session.currentOrganization.id);

  return (
    <>
      <AppHeader 
        title="กลุ่มค่าใช้จ่าย" 
        description="รวมเอกสารเป็นกลุ่มเพื่อเบิกจ่ายพร้อมกัน"
        showCreateButton={false}
      />
      
      <div className="p-6">
        <ExpenseGroupList groups={groups} />
      </div>
    </>
  );
}
