import { Skeleton } from '@/components/ui/skeleton';

export default function LibraryV2Loading() {
  return (
    <div className="space-y-5" aria-label="Cargando biblioteca">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
      <div className="grid gap-3 rounded-md border p-3 md:grid-cols-2 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-9" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.55fr)]">
        <Skeleton className="h-96" />
        <div className="space-y-5">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      </div>
    </div>
  );
}
