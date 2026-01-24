import { requireOrganization } from "@/server/auth";
import { AppHeader } from "@/components/layout/app-header";
import { MemberList } from "@/components/settings/MemberList";
import prisma from "@/lib/prisma";

async function getMembers(orgId: string) {
  return prisma.organizationMember.findMany({
    where: { 
      organizationId: orgId,
      isActive: true,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });
}

export default async function MembersPage() {
  const session = await requireOrganization();
  const members = await getMembers(session.currentOrganization.id);

  return (
    <>
      <AppHeader 
        title="สมาชิก" 
        description="จัดการสมาชิกในองค์กร"
        showCreateButton={false}
      />
      
      <div className="p-6">
        <MemberList 
          members={members} 
          currentUserId={session.id}
          currentUserRole={session.currentOrganization.role}
          organizationId={session.currentOrganization.id}
        />
      </div>
    </>
  );
}
