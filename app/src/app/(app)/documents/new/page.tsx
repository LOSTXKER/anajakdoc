import { requireOrganization } from "@/server/auth";
import { getCategories, getContacts } from "@/server/queries/master-data";
import { DocumentBoxForm } from "@/components/documents/document-box-form";
import type { TransactionType } from ".prisma/client";

interface NewDocumentPageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function NewDocumentPage({ searchParams }: NewDocumentPageProps) {
  const session = await requireOrganization();
  const params = await searchParams;
  
  const transactionType = (params.type?.toUpperCase() === "INCOME" ? "INCOME" : "EXPENSE") as TransactionType;
  
  const [categories, contacts] = await Promise.all([
    getCategories(),
    getContacts(),
  ]);

  // Filter categories by transaction type
  const filteredCategories = categories.filter(
    (c) => c.categoryType === (transactionType === "EXPENSE" ? "EXPENSE" : "INCOME")
  );

  // Filter contacts by transaction type
  const filteredContacts = contacts.filter((c) => {
    if (transactionType === "EXPENSE") {
      return c.contactRole === "VENDOR" || c.contactRole === "BOTH";
    }
    return c.contactRole === "CUSTOMER" || c.contactRole === "BOTH";
  });

  return (
    <>
      {/* Simple Header Bar */}
      <header className="border-b bg-white px-6 py-3">
        <p className="text-sm text-gray-500">
          สร้างกล่องเอกสารใหม่
        </p>
      </header>
      
      <div className="p-4 md:p-6 lg:px-8">
        <DocumentBoxForm
          mode="create"
          transactionType={transactionType}
          categories={filteredCategories}
          contacts={filteredContacts}
        />
      </div>
    </>
  );
}
