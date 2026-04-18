import { PageHeaderSkeleton } from '@/components/skeletons/common';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <Skeleton className="h-72 w-full rounded-xl" />
    </>
  );
}
