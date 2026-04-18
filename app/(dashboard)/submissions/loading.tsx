import { ListSkeleton, PageHeaderSkeleton } from '@/components/skeletons/common';

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <ListSkeleton rows={6} />
    </>
  );
}
