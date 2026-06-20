import { BookOpenCheck, Clock3, Layers3 } from 'lucide-react';

import { V2LibraryAvailabilityBadge } from '@/components/v2/library/v2-library-availability-badge';
import { V2LibraryResourceTypeBadge } from '@/components/v2/library/v2-library-resource-type-badge';
import type { LibraryV2Resource } from '@/lib/types/library-v2';

export function V2LibraryMobileList({
  resources,
}: {
  resources: readonly LibraryV2Resource[];
}) {
  return (
    <ul className="divide-y overflow-hidden rounded-md border bg-card lg:hidden">
      {resources.map((resource) => (
        <li key={resource.id} className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">{resource.title}</p>
              <div className="mt-1">
                <V2LibraryResourceTypeBadge type={resource.type} />
              </div>
            </div>
            <V2LibraryAvailabilityBadge
              availability={resource.availability}
            />
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p className="flex min-w-0 items-start gap-2">
              <Layers3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="truncate">{resource.collectionName}</span>
            </p>
            <p className="flex min-w-0 items-start gap-2">
              <BookOpenCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="truncate">{resource.courseName}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" aria-hidden />
              {resource.updatedLabel}
            </span>
            <span className="font-medium">{resource.nextAction}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
