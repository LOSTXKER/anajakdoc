import { requireOrganization } from "@/server/auth";
import { getDocuments } from "@/server/actions/document";
import { AppHeader } from "@/components/layout/app-header";
import { DocumentList } from "@/components/documents/document-list";
import { DocumentFilters } from "@/components/documents/document-filters";
import { serializeDocuments } from "@/lib/utils";

interface DocumentsPageProps {
  searchParams: Promise<{
    status?: string;
    type?: string;
    category?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const session = await requireOrganization();
  const params = await searchParams;
  
  const filters = {
    status: params.status?.split(",") as import("@/types").DocumentStatus[] | undefined,
    transactionType: params.type as import("@/types").TransactionType | undefined,
    categoryId: params.category,
    search: params.search,
  };

  const page = parseInt(params.page || "1");
  const result = await getDocuments(filters, page);
  
  // Serialize documents for Client Component
  const documents = {
    ...result,
    items: serializeDocuments(result.items),
  };

  return (
    <>
      <AppHeader 
        title="เอกสารของฉัน" 
        description="จัดการเอกสารทั้งหมดของคุณ"
      />
      
      <div className="p-6 space-y-6">
        <DocumentFilters />
        <DocumentList 
          documents={documents} 
          userRole={session.currentOrganization.role}
        />
      </div>
    </>
  );
}
