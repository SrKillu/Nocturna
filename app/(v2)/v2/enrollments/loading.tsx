import { Skeleton } from '@/components/ui/skeleton';

export default function EnrollmentsV2Loading() {
  return (
    <div className="space-y-5" aria-label="Cargando matrículas">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-80 w-full" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    </div>
  );
}
