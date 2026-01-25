import { requireOrganization } from "@/server/auth";
import { AppHeader } from "@/components/layout/app-header";
import { ContactList } from "@/components/settings/ContactList";
import prisma from "@/lib/prisma";

async function getContacts(orgId: string) {
  const contacts = await prisma.contact.findMany({
    where: { 
      organizationId: orgId,
      isActive: true,
    },
    include: {
      _count: { select: { boxes: true } },
    },
    orderBy: [
      { boxes: { _count: "desc" } },
      { name: "asc" },
    ],
  });

  // Serialize Decimal fields for client component
  return contacts.map(c => ({
    ...c,
    defaultWhtRate: c.defaultWhtRate?.toNumber() ?? null,
  }));
}

export default async function ContactsPage() {
  const session = await requireOrganization();
  const contacts = await getContacts(session.currentOrganization.id);

  return (
    <>
      <AppHeader 
        title="ผู้ติดต่อ" 
        description="รายชื่อที่ใช้บ่อย"
        showCreateButton={false}
      />
      
      <div className="p-6">
        <ContactList contacts={contacts} />
      </div>
    </>
  );
}
