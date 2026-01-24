import { requireOrganization } from "@/server/auth";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { FiscalPeriodList } from "@/components/settings/FiscalPeriodList";
import { getFiscalPeriods } from "@/server/actions/fiscal-period";

export default async function FiscalPeriodsPage() {
  const session = await requireOrganization();
  
  // Only accounting, admin, owner can manage fiscal periods
  if (!["ACCOUNTING", "ADMIN", "OWNER"].includes(session.currentOrganization.role)) {
    redirect("/dashboard");
  }

  const periods = await getFiscalPeriods();

  return (
    <>
      <AppHeader 
        title="งวดบัญชี" 
        description="จัดการงวดบัญชีรายเดือน"
        showCreateButton={false}
      />
      
      <div className="p-6">
        <FiscalPeriodList periods={periods} />
      </div>
    </>
  );
}
