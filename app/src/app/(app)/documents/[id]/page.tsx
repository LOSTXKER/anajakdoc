import { notFound } from "next/navigation";
import { requireOrganization } from "@/server/auth";
import { getDocument } from "@/server/actions/document";
import { getCategories, getCostCenters, getContacts } from "@/server/queries/master-data";
import { DocumentBoxForm } from "@/components/documents/document-box-form";
import { serializeDocument } from "@/lib/utils";

interface DocumentPageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentPage({ params }: DocumentPageProps) {
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
