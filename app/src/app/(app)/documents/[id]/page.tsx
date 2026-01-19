import { notFound } from "next/navigation";
import { requireOrganization } from "@/server/auth";
import { getDocument } from "@/server/actions/document";
import { getCategories, getContacts } from "@/server/queries/master-data";
import { DocumentBoxForm } from "@/components/documents/document-box-form";
import { serializeDocument } from "@/lib/utils";

interface DocumentPageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const session = await requireOrganization();
  const { id } = await params;
  
  const [doc, categories, contacts] = await Promise.all([
    getDocument(id),
    getCategories(),
    getContacts(),
  ]);

  if (!doc) {
    notFound();
  }

  return (
    <>
      {/* Simple Header Bar */}
      <header className="border-b bg-white px-6 py-3">
        <p className="text-sm text-gray-500">
          รายละเอียดกล่องเอกสาร
        </p>
      </header>
      
      <div className="p-4 md:p-6 lg:px-8">
        <DocumentBoxForm
          mode="view"
          document={serializeDocument(doc)}
          categories={categories}
          contacts={contacts}
          userRole={session.currentOrganization.role}
        />
      </div>
    </>
  );
}
