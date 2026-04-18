import { Skeleton } from '@/components/ui/skeleton';

/**
 * Dashboard home skeleton — layout-matched so there is no content jump when
 * the real data streams in. One `Skeleton` per semantic region.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy aria-live="polite">
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}
