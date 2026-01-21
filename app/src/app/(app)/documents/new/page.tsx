import { requireOrganization } from "@/server/auth";
import { UploadFirstForm } from "@/components/documents/upload";

export default async function NewDocumentPage() {
  await requireOrganization();

  return <UploadFirstForm />;
}
