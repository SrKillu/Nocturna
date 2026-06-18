import { Skeleton } from '@/components/ui/skeleton';

export function V2DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="hidden w-72 shrink-0 border-r bg-sidebar p-5 lg:block">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="mt-10 h-4 w-16" />
        <Skeleton className="mt-3 h-10 w-full" />
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6">
          <Skeleton className="h-9 w-44" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
        </header>
        <main className="mx-auto max-w-[1440px] space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <Skeleton className="h-16 w-full" />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.7fr)]">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full" />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
