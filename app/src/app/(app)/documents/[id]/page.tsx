import { notFound } from "next/navigation";
import { requireOrganization } from "@/server/auth";
import { getDocument } from "@/server/actions/document";
import { AppHeader } from "@/components/layout/app-header";
import { DocumentDetail } from "@/components/documents/document-detail";

interface DocumentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const session = await requireOrganization();
  const { id } = await params;
  
  const document = await getDocument(id);

  if (!document) {
    notFound();
  }

  return (
    <>
      <AppHeader 
        title={document.docNumber}
        description={document.description || "รายละเอียดเอกสาร"}
        showCreateButton={false}
      />
      
      <div className="p-6">
        <DocumentDetail document={document} userRole={session.currentOrganization.role} />
      </div>
    </>
  );
}
