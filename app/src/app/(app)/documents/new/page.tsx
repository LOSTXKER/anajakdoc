import { requireOrganization } from "@/server/auth";
import { UploadFirstForm } from "@/components/documents/upload";
import prisma from "@/lib/prisma";

async function getMembers(orgId: string) {
  const members = await prisma.organizationMember.findMany({
    where: {
      organizationId: orgId,
      isActive: true,
    },
    select: {
      id: true,
      visibleName: true,
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return members.map(m => ({
    id: m.id,
    name: m.user.name || "ไม่ระบุชื่อ",
    visibleName: m.visibleName,
  }));
}

export default async function NewDocumentPage() {
  const session = await requireOrganization();
  const members = await getMembers(session.currentOrganization.id);

  return <UploadFirstForm members={members} />;
}
