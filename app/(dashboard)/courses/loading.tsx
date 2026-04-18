import { CardGridSkeleton, PageHeaderSkeleton } from '@/components/skeletons/common';

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <CardGridSkeleton count={6} />
    </>
  );
}
