import { getSession } from "@/server/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ClientList } from "./_components/client-list";

export default async function FirmClientsPage() {
  const session = await getSession();
  
  if (!session?.firmMembership) {
    redirect("/dashboard");
  }

  const firmId = session.firmMembership.firmId;
  const role = session.firmMembership.role;
  const isManager = role === "OWNER" || role === "ADMIN";

  // Fetch clients via FirmClientRelation (new model)
  // Only show ACTIVE relations (ธุรกิจที่ตอบรับคำเชิญแล้ว)
  const activeRelations = await prisma.firmClientRelation.findMany({
    where: {
      firmId,
      status: "ACTIVE",
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          taxId: true,
          email: true,
          phone: true,
          logo: true,
          plan: true,
          createdAt: true,
          _count: {
            select: { boxes: true },
          },
          boxes: {
            where: {
              status: { in: ["DRAFT", "SUBMITTED", "IN_REVIEW", "NEED_MORE_DOCS"] },
            },
            select: { id: true },
          },
          firmAssignments: {
            where: { firmId },
            include: {
              firmMember: {
                include: {
                  user: {
                    select: { name: true, email: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { respondedAt: "desc" },
  });

  // For non-managers, filter to only assigned clients
  let clients = activeRelations.map((r) => r.organization);

  if (!isManager) {
    const firmMember = await prisma.firmMember.findFirst({
      where: {
        firmId,
        userId: session.id,
      },
    });

    if (firmMember) {
      const assignedOrgIds = await prisma.firmClientAssignment.findMany({
        where: { firmMemberId: firmMember.id },
        select: { organizationId: true },
      });
      const assignedIds = new Set(assignedOrgIds.map((a) => a.organizationId));
      clients = clients.filter((c) => assignedIds.has(c.id));
    } else {
      clients = [];
    }
  }

  // Transform data
  const clientsData = clients.map((client) => ({
    id: client.id,
    name: client.name,
    slug: client.slug,
    taxId: client.taxId,
    email: client.email,
    phone: client.phone,
    logo: client.logo,
    plan: client.plan,
    createdAt: client.createdAt,
    totalDocs: client._count.boxes,
    pendingDocs: client.boxes.length,
    assignees: client.firmAssignments?.map((a) => ({
      id: a.firmMember.id,
      name: a.firmMember.user.name,
      email: a.firmMember.user.email,
      role: a.role,
    })) || [],
  }));

  return (
    <ClientList 
      clients={clientsData} 
      isManager={isManager} 
    />
  );
}
