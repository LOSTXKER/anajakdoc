import { notFound } from "next/navigation";
import { requireOrganization } from "@/server/auth";
import { getBox } from "@/server/actions/box";
import { getCategories, getContacts, getCostCenters } from "@/server/queries/master-data";
import { serializeBox } from "@/lib/utils";
import { BoxDetailWrapper } from "./box-detail-wrapper";

interface DocumentPageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const session = await requireOrganization();
  const { id } = await params;
  
  const [box, categories, contacts, costCenters] = await Promise.all([
    getBox(id),
    getCategories(),
    getContacts(),
    getCostCenters(),
  ]);

  if (!box) {
    notFound();
  }

  const serializedBox = serializeBox(box);
  const userRole = session.currentOrganization.role;

  // Determine permissions
  const canEdit = ["OWNER", "ADMIN", "ACCOUNTING", "STAFF"].includes(userRole) && 
    ["DRAFT", "NEED_MORE_DOCS", "SUBMITTED"].includes(box.status);
  const canSend = ["OWNER", "ADMIN", "STAFF"].includes(userRole) && box.status === "DRAFT";
  const canReview = ["OWNER", "ADMIN", "ACCOUNTING"].includes(userRole) && 
    ["SUBMITTED", "IN_REVIEW", "NEED_MORE_DOCS"].includes(box.status);
  // Can delete: only DRAFT boxes, and only owner/admin or the creator
  const canDelete = box.status === "DRAFT" && (
    ["OWNER", "ADMIN"].includes(userRole) || 
    box.createdById === session.id
  );

  return (
    <div className="p-4 md:p-6 lg:px-8 max-w-7xl mx-auto">
      <BoxDetailWrapper 
        box={serializedBox}
        categories={categories}
        contacts={contacts}
        costCenters={costCenters}
        canEdit={canEdit}
        canSend={canSend}
        canReview={canReview}
        canDelete={canDelete}
      />
    </div>
  );
}
