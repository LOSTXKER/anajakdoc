import { notFound } from "next/navigation";
import { requireOrganization } from "@/server/auth";
import { getDocument } from "@/server/actions/document";
import { serializeDocument } from "@/lib/utils";
import { BoxDetailWrapper } from "./box-detail-wrapper";

interface DocumentPageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const session = await requireOrganization();
  const { id } = await params;
  
  const doc = await getDocument(id);

  if (!doc) {
    notFound();
  }

  const serializedDoc = serializeDocument(doc);
  const userRole = session.currentOrganization.role;

  // Determine permissions
  const canEdit = ["ADMIN", "ACCOUNTING", "STAFF"].includes(userRole) && 
    ["DRAFT", "NEED_INFO"].includes(doc.status);
  const canSend = ["ADMIN", "STAFF"].includes(userRole) && doc.status === "DRAFT";

  return (
    <div className="p-4 md:p-6 lg:px-8 max-w-4xl mx-auto">
      <BoxDetailWrapper 
        document={serializedDoc}
        canEdit={canEdit}
        canSend={canSend}
      />
    </div>
  );
}
