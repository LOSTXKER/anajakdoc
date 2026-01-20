import { requireOrganization } from "@/server/auth";
import { getWhtTrackings, getWhtSummary } from "@/server/actions/wht-tracking";
import { AppHeader } from "@/components/layout/app-header";
import { WHTTrackingDashboard } from "@/components/wht/wht-tracking-dashboard";
import { redirect } from "next/navigation";
import { serializeWhtTrackings } from "@/lib/utils";

export default async function WHTTrackingPage() {
  const session = await requireOrganization();
  
  // Only accounting, admin, owner can access
  if (!["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    redirect("/documents");
  }

  const [outgoingTrackings, incomingTrackings, summary] = await Promise.all([
    getWhtTrackings({ type: "OUTGOING" }),
    getWhtTrackings({ type: "INCOMING" }),
    getWhtSummary(),
  ]);

  return (
    <>
      <AppHeader 
        title="ติดตามหัก ณ ที่จ่าย" 
        description="ติดตามการส่ง/รับหนังสือหัก ณ ที่จ่าย"
        showCreateButton={false}
      />
      
      <div className="p-6">
        <WHTTrackingDashboard
          outgoingTrackings={serializeWhtTrackings(outgoingTrackings)}
          incomingTrackings={serializeWhtTrackings(incomingTrackings)}
          summary={summary}
        />
      </div>
    </>
  );
}
