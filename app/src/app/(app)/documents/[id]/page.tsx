import { notFound } from "next/navigation";
import { requireOrganization } from "@/server/auth";
import { getBox } from "@/server/actions/box";
import { getBoxComments } from "@/server/actions/comment";
import { getBoxAuditLogs } from "@/server/actions/audit";
import { serializeBox } from "@/lib/utils";
import { BoxDetailWrapper } from "./box-detail-wrapper";
import prisma from "@/lib/prisma";

interface DocumentPageProps {
  params: Promise<{ id: string }>;
}

async function getContacts(orgId: string) {
  const contacts = await prisma.contact.findMany({
    where: { 
      organizationId: orgId,
      isActive: true,
    },
    select: { 
      id: true, 
      name: true,
      taxId: true,
      contactType: true,
      // Vendor defaults (Section 9)
      whtApplicable: true,
      defaultWhtRate: true,
      defaultVatRequired: true,
    },
    orderBy: { name: "asc" },
  });
  
  // Serialize Decimal fields
  return contacts.map(c => ({
    ...c,
    defaultWhtRate: c.defaultWhtRate?.toNumber() ?? null,
  }));
}

async function getBoxPayers(boxId: string) {
  const payers = await prisma.boxPayer.findMany({
    where: { boxId },
    include: {
      member: {
        select: {
          id: true,
          visibleName: true,
          bankName: true,
          bankAccount: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return payers.map(p => ({
    id: p.id,
    payerType: p.payerType,
    amount: p.amount.toNumber(),
    reimbursementStatus: p.reimbursementStatus,
    reimbursedAt: p.reimbursedAt?.toISOString() || null,
    member: p.member,
  }));
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const session = await requireOrganization();
  const { id } = await params;
  
  const [box, contacts, commentsResult, activitiesResult, payers] = await Promise.all([
    getBox(id),
    getContacts(session.currentOrganization.id),
    getBoxComments(id),
    getBoxAuditLogs(id),
    getBoxPayers(id),
  ]);

  if (!box) {
    notFound();
  }

  const serializedBox = serializeBox(box);
  const userRole = session.currentOrganization.role;
  const comments = commentsResult.success ? commentsResult.data : [];
  const activities = activitiesResult.success ? activitiesResult.data : [];

  // Determine permissions
  // canEdit: allow editing box details and advancing status (using new 4-status system)
  const editableStatuses = ["DRAFT", "PENDING", "NEED_DOCS"];
  const canEdit = ["OWNER", "ADMIN", "ACCOUNTING", "STAFF"].includes(userRole) && 
    editableStatuses.includes(box.status);
  const canSend = ["OWNER", "ADMIN", "STAFF"].includes(userRole) && box.status === "DRAFT";
  const canDelete = box.status === "DRAFT" && (
    ["OWNER", "ADMIN"].includes(userRole) || 
    box.createdById === session.id
  );
  const isAdmin = ["OWNER", "ADMIN"].includes(userRole);

  return (
    <BoxDetailWrapper 
      box={serializedBox}
      contacts={contacts}
      comments={comments}
      activities={activities}
      payers={payers}
      currentUserId={session.id}
      isAdmin={isAdmin}
      canEdit={canEdit}
      canSend={canSend}
      canDelete={canDelete}
    />
  );
}
