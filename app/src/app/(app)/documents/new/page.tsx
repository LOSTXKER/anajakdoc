import { redirect } from "next/navigation";
import { requireOrganization } from "@/server/auth";
import { getCategories, getCostCenters, getContacts } from "@/server/queries/master-data";
import { DocumentBoxForm } from "@/components/documents/document-box-form";
import type { TransactionType } from ".prisma/client";

interface NewDocumentPageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function NewDocumentPage({ searchParams }: NewDocumentPageProps) {
  const session = await requireOrganization();
  const params = await searchParams;
  
  const transactionType = (params.type?.toUpperCase() === "INCOME" ? "INCOME" : "EXPENSE") as TransactionType;
  
  const [categories, costCenters, contacts] = await Promise.all([
    getCategories(),
    getCostCenters(),
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
    <div className="p-6">
      <DocumentBoxForm
        mode="create"
        transactionType={transactionType}
        categories={filteredCategories}
        costCenters={costCenters}
        contacts={filteredContacts}
      />
    </div>
  );
}
