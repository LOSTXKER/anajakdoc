import { requireOrganization } from "@/server/auth";
import { getOrganizationAuditLogs } from "@/server/actions/audit";
import { AuditLogViewer } from "@/components/settings/AuditLogViewer";

export default async function AuditLogPage() {
  await requireOrganization();
  
  const result = await getOrganizationAuditLogs({ page: 1, limit: 50 });
  const initialData = result.success && result.data ? result.data : { logs: [], total: 0, page: 1, totalPages: 0 };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
        <p className="text-muted-foreground mt-1">
          ประวัติการใช้งานระบบทั้งหมดเพื่อความโปร่งใสและตรวจสอบได้
        </p>
      </div>

      <AuditLogViewer initialData={initialData} />
    </div>
  );
}
