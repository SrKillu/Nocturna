import { Skeleton } from '@/components/ui/skeleton';

export default function GuardianSpaceV2Loading() {
  return (
    <div className="space-y-5" aria-label="Cargando espacio del encargado">
      <div className="space-y-4 rounded-md border p-5">
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <div className="grid grid-cols-2 gap-3 pt-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14" />
          ))}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-48" />
    </div>
  );
}
