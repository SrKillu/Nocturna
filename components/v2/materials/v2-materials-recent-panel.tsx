import { Clock3, Files } from 'lucide-react';

import { V2MaterialStatusBadge } from '@/components/v2/materials/v2-material-visibility-badge';
import type { MaterialV2ListItem } from '@/lib/types/materials-v2';

export function V2MaterialsRecentPanel({
  materials,
}: {
  materials: readonly MaterialV2ListItem[];
}) {
  return (
    <section className="rounded-md border bg-card" aria-labelledby="recent-materials-title">
      <div className="border-b px-4 py-3">
        <h2 id="recent-materials-title" className="flex items-center gap-2 font-semibold">
          <Files className="h-4 w-4 text-primary" aria-hidden />
          Materiales recientes
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Actividad académica de demostración.
        </p>
      </div>
      <ul className="divide-y">
        {materials.map((material) => (
          <li key={material.id} className="space-y-2 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{material.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {material.courseName} · {material.sectionLabel}
                </p>
              </div>
              <V2MaterialStatusBadge status={material.status} />
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" aria-hidden />
              {material.updatedLabel}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
