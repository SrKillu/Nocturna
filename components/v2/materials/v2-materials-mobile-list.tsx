import { BookOpenCheck, Clock3 } from 'lucide-react';

import { V2MaterialTypeBadge } from '@/components/v2/materials/v2-material-type-badge';
import {
  V2MaterialStatusBadge,
  V2MaterialVisibilityBadge,
} from '@/components/v2/materials/v2-material-visibility-badge';
import type { MaterialV2ListItem } from '@/lib/types/materials-v2';

export function V2MaterialsMobileList({
  materials,
}: {
  materials: readonly MaterialV2ListItem[];
}) {
  return (
    <ul className="divide-y overflow-hidden rounded-md border bg-card lg:hidden">
      {materials.map((material) => (
        <li key={material.id} className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">{material.title}</p>
              <div className="mt-1">
                <V2MaterialTypeBadge type={material.type} />
              </div>
            </div>
            <V2MaterialStatusBadge status={material.status} />
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex min-w-0 items-start gap-2">
              <BookOpenCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0">
                <p className="truncate">{material.courseName}</p>
                <p className="text-xs text-muted-foreground">{material.sectionLabel}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <p>{material.updatedLabel}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <V2MaterialVisibilityBadge visibility={material.visibility} />
            <p className="text-xs font-medium text-muted-foreground">
              {material.nextAction}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
