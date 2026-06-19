import { Skeleton } from '@/components/ui/skeleton';

export default function CourseWorkspaceV2Loading() {
  return (
    <div className="space-y-5" aria-label="Cargando workspace del curso">
      <Skeleton className="h-5 w-32" />
      <div className="space-y-4 rounded-md border p-5">
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <div className="grid gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12" />
          ))}
        </div>
      </div>
      <Skeleton className="h-11 w-full" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
      </div>
    </div>
  );
}
