import { notFound } from "next/navigation";
import { requireOrganization } from "@/server/auth";
import { getBox } from "@/server/actions/box";
import { serializeBox } from "@/lib/utils";
import { BoxDetailWrapper } from "./box-detail-wrapper";
import prisma from "@/lib/prisma";

interface DocumentPageProps {
  params: Promise<{ id: string }>;
}

async function getBoxTasks(boxId: string) {
  const tasks = await prisma.task.findMany({
    where: { boxId },
    include: {
      assignee: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
    orderBy: [
      { status: "asc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
  });

  return tasks.map(task => ({
    id: task.id,
    taskType: task.taskType,
    status: task.status,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate?.toISOString() ?? null,
    escalationLevel: task.escalationLevel,
    assignee: task.assignee,
    createdAt: task.createdAt.toISOString(),
  }));
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

export default async function DocumentPage({ params }: DocumentPageProps) {
  const session = await requireOrganization();
  const { id } = await params;
  
  const [box, tasks, contacts] = await Promise.all([
    getBox(id),
    getBoxTasks(id),
    getContacts(session.currentOrganization.id),
  ]);

  if (!box) {
    notFound();
  }

  const serializedBox = serializeBox(box);
  const userRole = session.currentOrganization.role;

  // Determine permissions
  const canEdit = ["OWNER", "ADMIN", "ACCOUNTING", "STAFF"].includes(userRole) && 
    ["DRAFT", "NEED_MORE_DOCS", "SUBMITTED"].includes(box.status);
  const canSend = ["OWNER", "ADMIN", "STAFF"].includes(userRole) && box.status === "DRAFT";
  const canDelete = box.status === "DRAFT" && (
    ["OWNER", "ADMIN"].includes(userRole) || 
    box.createdById === session.id
  );

  return (
    <BoxDetailWrapper 
      box={serializedBox}
      tasks={tasks}
      contacts={contacts}
      canEdit={canEdit}
      canSend={canSend}
      canDelete={canDelete}
    />
  );
}
