import { ListSkeleton } from "@/components/ui/skeleton";

export default function DocumentsLoading() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2" />
        <div className="h-4 w-64 bg-muted animate-pulse rounded" />
      </div>
      
      {/* Filters skeleton */}
      <div className="flex gap-2 mb-6">
        <div className="h-10 w-64 bg-muted animate-pulse rounded" />
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>
      
      {/* Tabs skeleton */}
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-24 bg-muted animate-pulse rounded" />
        ))}
      </div>
      
      <ListSkeleton count={8} />
    </div>
  );
}
