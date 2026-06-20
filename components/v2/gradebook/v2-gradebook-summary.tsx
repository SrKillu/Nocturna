import { AlertTriangle, Calculator, ClipboardCheck, Clock3 } from 'lucide-react';

import type { GradebookV2Summary } from '@/lib/types/gradebook-v2';

export function V2GradebookSummary({ summary }: { summary: GradebookV2Summary }) {
  const metrics = [
    {
      label: 'Promedio general mock',
      value: summary.overallAverage === null ? 'Sin datos' : String(summary.overallAverage),
      detail: 'Cálculo no oficial',
      icon: Calculator,
    },
    {
      label: 'Estudiantes en riesgo',
      value: String(summary.studentsAtRisk),
      detail: 'Señales de demostración',
      icon: AlertTriangle,
    },
    {
      label: 'Pendientes de calificar',
      value: String(summary.pendingToGrade),
      detail: 'Sin acciones reales',
      icon: ClipboardCheck,
    },
    {
      label: 'Última actualización',
      value: summary.lastUpdateLabel,
      detail: 'Dato mock',
      icon: Clock3,
    },
  ] as const;

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumen del libro de notas">
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
