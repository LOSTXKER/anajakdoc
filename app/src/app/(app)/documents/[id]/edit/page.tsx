import { notFound } from "next/navigation";
import { requireOrganization } from "@/server/auth";
import { getDocument } from "@/server/actions/document";
import { getCategories, getCostCenters, getContacts } from "@/server/queries/master-data";
import { DocumentBoxForm } from "@/components/documents/document-box-form";
import { serializeDocument } from "@/lib/utils";

interface EditDocumentPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDocumentPage({ params }: EditDocumentPageProps) {
  const session = await requireOrganization();
  const { id } = await params;
  
  const [doc, categories, costCenters, contacts] = await Promise.all([
    getDocument(id),
    getCategories(),
    getCostCenters(),
    getContacts(),
  ]);

  if (!doc) {
    notFound();
  }

  // Check if user can edit
  if (!["DRAFT", "NEED_INFO"].includes(doc.status)) {
    // Redirect to view page if can't edit
    return (
      <div className="p-6">
        <DocumentBoxForm
          mode="view"
          document={serializeDocument(doc)}
          categories={categories}
          costCenters={costCenters}
          contacts={contacts}
          userRole={session.currentOrganization.role}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <DocumentBoxForm
        mode="edit"
        document={serializeDocument(doc)}
        categories={categories}
        costCenters={costCenters}
        contacts={contacts}
        userRole={session.currentOrganization.role}
      />
    </div>
  );
}
