import { Sparkles } from 'lucide-react';

import { V2LibraryResourceTypeBadge } from '@/components/v2/library/v2-library-resource-type-badge';
import type { LibraryV2Resource } from '@/lib/types/library-v2';

export function V2LibraryFeaturedPanel({
  resources,
}: {
  resources: readonly LibraryV2Resource[];
}) {
  return (
    <section className="rounded-md border bg-card" aria-labelledby="library-featured-title">
      <div className="border-b px-4 py-3">
        <h2 id="library-featured-title" className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden />
          Recursos destacados
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Selección informativa de demostración.
        </p>
      </div>
      <ul className="divide-y">
        {resources.map((resource) => (
          <li key={resource.id} className="space-y-2 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{resource.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {resource.collectionName}
                </p>
              </div>
              <V2LibraryResourceTypeBadge type={resource.type} />
            </div>
            <p className="text-xs text-muted-foreground">
              {resource.courseName} · {resource.updatedLabel}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
