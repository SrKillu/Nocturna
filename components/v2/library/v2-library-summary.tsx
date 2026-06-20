import { BookMarked, Clock3, LibraryBig, Sparkles } from 'lucide-react';

import type { LibraryV2Summary } from '@/lib/types/library-v2';

export function V2LibrarySummary({ summary }: { summary: LibraryV2Summary }) {
  const metrics = [
    {
      label: 'Recursos disponibles',
      value: String(summary.availableResources),
      detail: 'Referencias mock',
      icon: BookMarked,
    },
    {
      label: 'Colecciones activas',
      value: String(summary.activeCollections),
      detail: 'Selecciones visibles',
      icon: LibraryBig,
    },
    {
      label: 'Recursos destacados',
      value: String(summary.featuredResources),
      detail: 'Curaduría de demostración',
      icon: Sparkles,
    },
    {
      label: 'Última actualización',
      value: summary.lastUpdateLabel,
      detail: 'Dato de demostración',
      icon: Clock3,
    },
  ] as const;

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumen de biblioteca">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <article key={metric.label} className="rounded-md border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                {metric.label}
              </p>
              <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            </div>
            <p className="mt-2 text-xl font-semibold tabular-nums">{metric.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
          </article>
        );
      })}
    </section>
  );
}
