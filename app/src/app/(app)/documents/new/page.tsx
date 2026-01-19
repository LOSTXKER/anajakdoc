import { requireOrganization } from "@/server/auth";
import { getCategories, getContacts } from "@/server/queries/master-data";
import { UploadFirstForm } from "@/components/documents/upload-first-form";

export default async function NewDocumentPage() {
  const session = await requireOrganization();
  
  const [categories, contacts] = await Promise.all([
    getCategories(),
    getContacts(),
  ]);

  return (
    <UploadFirstForm
      categories={categories}
      contacts={contacts}
    />
  );
}
