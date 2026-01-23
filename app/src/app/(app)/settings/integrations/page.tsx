import { requireOrganization } from "@/server/auth";
import { getIntegrations } from "@/server/actions/integration";
import { IntegrationList } from "@/components/settings/integration-list";

export default async function IntegrationsPage() {
  await requireOrganization();
  
  const result = await getIntegrations();
  const integrations = result.success ? result.data : [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">การเชื่อมต่อ (Integrations)</h1>
        <p className="text-gray-500 mt-1">
          เชื่อมต่อกับ LINE, Slack, Discord หรือ Webhook เพื่อรับการแจ้งเตือนอัตโนมัติ
        </p>
      </div>

      <IntegrationList initialIntegrations={integrations} />
    </div>
  );
}
