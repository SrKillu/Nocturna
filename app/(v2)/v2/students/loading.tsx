import { Skeleton } from '@/components/ui/skeleton';

export default function StudentsV2Loading() {
  return (
    <div className="space-y-5" aria-label="Cargando estudiantes">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-3 rounded-md border p-3 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-9" />
        ))}
      </div>
      <Skeleton className="h-5 w-40" />
      <div className="space-y-3 rounded-md border p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}
