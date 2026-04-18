import { TableSkeleton, PageHeaderSkeleton } from '@/components/skeletons/common';

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <TableSkeleton rows={8} cols={6} />
    </>
  );
}
