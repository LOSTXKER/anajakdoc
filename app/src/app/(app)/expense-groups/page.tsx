import { requireOrganization } from "@/server/auth";
import { AppHeader } from "@/components/layout/app-header";
import { ExpenseGroupList } from "@/components/expense-groups/expense-group-list";
import prisma from "@/lib/prisma";

async function getExpenseGroups(orgId: string) {
  const groups = await prisma.expenseGroup.findMany({
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

  // Serialize Decimal to number
  return groups.map(group => ({
    ...group,
    totalAmount: group.totalAmount.toNumber(),
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
    documents: group.documents.map(doc => ({
      ...doc,
      totalAmount: doc.totalAmount.toNumber(),
    })),
  }));
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
