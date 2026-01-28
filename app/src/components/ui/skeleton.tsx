import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Two-column layout: To-Do & Recent */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* To-Do Section */}
        <div className="rounded-xl border bg-card">
          <div className="p-4 border-b">
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="divide-y">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-8 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Boxes */}
        <div className="rounded-xl border bg-card">
          <div className="p-4 border-b flex justify-between">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-lg border">
      <div className="border-b p-4">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4">
            <div className="flex gap-4">
              {Array.from({ length: cols }).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { Skeleton, CardSkeleton, ListSkeleton, DashboardSkeleton, TableSkeleton };
