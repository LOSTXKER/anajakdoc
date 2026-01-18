import { requireOrganization } from "@/server/auth";
import { getDocuments } from "@/server/actions/document";
import { AppHeader } from "@/components/layout/app-header";
import { DocumentList } from "@/components/documents/document-list";
import { redirect } from "next/navigation";
import { serializeDocuments } from "@/lib/utils";

export default async function InboxPage() {
  const session = await requireOrganization();
  
  // Only accounting, admin, owner can access inbox
  if (!["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    redirect("/documents");
  }

  const documents = await getDocuments({
    status: ["PENDING_REVIEW", "NEED_INFO"],
  });

  // Serialize documents for client component
  const serializedDocuments = {
    ...documents,
    items: serializeDocuments(documents.items),
  };

  return (
    <>
      <AppHeader 
        title="Inbox" 
        description={`${documents.total} เอกสารรอตรวจสอบ`}
        showCreateButton={false}
      />
      
      <div className="p-6">
        <DocumentList 
          documents={serializedDocuments} 
          userRole={session.currentOrganization.role}
        />
      </div>
    </>
  );
}
