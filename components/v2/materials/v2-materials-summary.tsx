import { BookOpenCheck, Clock3, Files, Library } from 'lucide-react';

import type { MaterialsV2Summary } from '@/lib/types/materials-v2';

export function V2MaterialsSummary({ summary }: { summary: MaterialsV2Summary }) {
  const metrics = [
    {
      label: 'Materiales publicados',
      value: String(summary.publishedMaterials),
      detail: 'Recursos mock visibles',
      icon: Files,
    },
    {
      label: 'Materiales pendientes',
      value: String(summary.pendingMaterials),
      detail: 'Sin publicación real',
      icon: Clock3,
    },
    {
      label: 'Cursos con novedades',
      value: String(summary.coursesWithRecentMaterials),
      detail: 'Período reciente',
      icon: BookOpenCheck,
    },
    {
      label: 'Última actualización',
      value: summary.lastUpdateLabel,
      detail: 'Dato de demostración',
      icon: Library,
    },
  ] as const;

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumen de materiales">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <article key={metric.label} className="rounded-md border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
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
