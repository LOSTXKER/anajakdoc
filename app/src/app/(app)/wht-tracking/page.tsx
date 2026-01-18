import { requireOrganization } from "@/server/auth";
import { getWHTTrackings, getWHTSummary } from "@/server/actions/wht-tracking";
import { AppHeader } from "@/components/layout/app-header";
import { WHTTrackingDashboard } from "@/components/wht/wht-tracking-dashboard";
import { redirect } from "next/navigation";
import { serializeWHTTrackings } from "@/lib/utils";

export default async function WHTTrackingPage() {
  const session = await requireOrganization();
  
  // Only accounting, admin, owner can access
  if (!["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    redirect("/documents");
  }

  const [outgoingTrackings, incomingTrackings, summary] = await Promise.all([
    getWHTTrackings({ trackingType: "OUTGOING" }),
    getWHTTrackings({ trackingType: "INCOMING" }),
    getWHTSummary(),
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
          outgoingTrackings={serializeWHTTrackings(outgoingTrackings)}
          incomingTrackings={serializeWHTTrackings(incomingTrackings)}
          summary={summary}
        />
      </div>
    </>
  );
}
