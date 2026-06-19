import { Skeleton } from '@/components/ui/skeleton';

export default function MySpaceV2Loading() {
  return (
    <div className="space-y-5" aria-label="Cargando espacio académico">
      <div className="space-y-4 rounded-md border p-5">
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <div className="grid grid-cols-2 gap-3 pt-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14" />
          ))}
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <Skeleton className="h-44" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
    </div>
  );
}
