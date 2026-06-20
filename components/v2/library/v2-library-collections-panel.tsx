import { Layers3 } from 'lucide-react';

import type { LibraryV2Collection } from '@/lib/types/library-v2';

export function V2LibraryCollectionsPanel({
  collections,
}: {
  collections: readonly LibraryV2Collection[];
}) {
  return (
    <section className="rounded-md border bg-card" aria-labelledby="library-collections-title">
      <div className="border-b px-4 py-3">
        <h2 id="library-collections-title" className="flex items-center gap-2 font-semibold">
          <Layers3 className="h-4 w-4 text-primary" aria-hidden />
          Colecciones
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Agrupaciones académicas de demostración.
        </p>
      </div>
      <ul className="divide-y">
        {collections.map((collection) => (
          <li key={collection.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{collection.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {collection.description}
                </p>
              </div>
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium tabular-nums">
                {collection.resourceCount}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
