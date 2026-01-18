import { notFound } from "next/navigation";
import { requireOrganization } from "@/server/auth";
import { getDocument } from "@/server/actions/document";
import { getMasterData } from "@/server/queries/master-data";
import { AppHeader } from "@/components/layout/app-header";
import { DocumentEditForm } from "@/components/documents/document-edit-form";
import { serializeDocument } from "@/lib/utils";

interface EditDocumentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditDocumentPage({ params }: EditDocumentPageProps) {
  await requireOrganization();
  const { id } = await params;
  
  const [document, masterData] = await Promise.all([
    getDocument(id),
    getMasterData(),
  ]);

  if (!document) {
    notFound();
  }

  // Check if can edit
  if (!["DRAFT", "NEED_INFO"].includes(document.status)) {
    notFound();
  }

  // Serialize document for Client Component
  const serializedDocument = serializeDocument(document);

  return (
    <>
      <AppHeader 
        title={`แก้ไข ${serializedDocument.docNumber}`}
        description="แก้ไขรายละเอียดเอกสาร"
        showCreateButton={false}
      />
      
      <div className="p-6">
        <DocumentEditForm 
          document={serializedDocument}
          categories={masterData.categories}
          costCenters={masterData.costCenters}
          contacts={masterData.contacts}
        />
      </div>
    </>
  );
}
