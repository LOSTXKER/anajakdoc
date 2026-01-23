import { requireOrganization } from "@/server/auth";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { ExportProfileList } from "@/components/settings/export-profile-list";
import { getExportProfiles, ensureDefaultProfiles } from "@/server/actions/export-profile";

export default async function ExportProfilesPage() {
  const session = await requireOrganization();

  // Only admin/owner can manage export profiles
  if (!["ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    redirect("/settings");
  }

  // Ensure default profiles exist
  await ensureDefaultProfiles();

  const result = await getExportProfiles();

  return (
    <>
      <AppHeader
        title="Export Profiles"
        description="จัดการรูปแบบการ Export"
        showCreateButton={false}
      />

      <div className="p-6">
        <ExportProfileList 
          profiles={result.success ? result.data : []} 
        />
      </div>
    </>
  );
}
