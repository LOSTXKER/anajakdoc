import { requireOrganization } from "@/server/auth";
import { getWorkflows } from "@/server/actions/workflow";
import { WorkflowList } from "@/components/settings/WorkflowList";

export default async function WorkflowsPage() {
  await requireOrganization();
  
  const result = await getWorkflows();
  const workflows = result.success ? result.data : [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Approval Workflow</h1>
        <p className="text-muted-foreground mt-1">
          กำหนด workflow อนุมัติสำหรับกล่องเอกสาร
        </p>
      </div>

      <WorkflowList initialWorkflows={workflows} />
    </div>
  );
}
