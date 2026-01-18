import { requireOrganization } from "@/server/auth";
import { getCategories, getCostCenters, getContacts } from "@/server/queries/master-data";
import { AppHeader } from "@/components/layout/app-header";
import { DocumentForm } from "@/components/documents/document-form";

interface NewDocumentPageProps {
  searchParams: Promise<{
    type?: string;
  }>;
}

export default async function NewDocumentPage({ searchParams }: NewDocumentPageProps) {
  await requireOrganization();
  const params = await searchParams;
  
  const transactionType = params.type === "income" ? "INCOME" : "EXPENSE";
  
  const [categories, costCenters, contacts] = await Promise.all([
    getCategories(transactionType),
    getCostCenters(),
    getContacts(transactionType === "EXPENSE" ? "VENDOR" : "CUSTOMER"),
  ]);

  return (
    <>
      <AppHeader 
        title="สร้างกล่องเอกสารใหม่" 
        description={transactionType === "EXPENSE" ? "บันทึกรายจ่าย" : "บันทึกรายรับ"}
        showCreateButton={false}
      />
      
      <div className="p-6">
        <DocumentForm
          transactionType={transactionType}
          categories={categories}
          costCenters={costCenters}
          contacts={contacts}
        />
      </div>
    </>
  );
}
