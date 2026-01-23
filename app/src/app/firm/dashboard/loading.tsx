import { DashboardSkeleton } from "@/components/ui/skeleton";

export default function FirmDashboardLoading() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2" />
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
      </div>
      <DashboardSkeleton />
    </div>
  );
}
