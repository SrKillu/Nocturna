import { CalendarClock, ClipboardCheck, FileCheck2, Gauge } from 'lucide-react';

import type { EvaluationV2Summary } from '@/lib/types/evaluations-v2';

export function V2EvaluationsSummary({
  summary,
}: {
  summary: EvaluationV2Summary;
}) {
  const metrics = [
    {
      label: 'Evaluaciones activas',
      value: String(summary.activeEvaluations),
      detail: 'Activas o en revisión',
      icon: ClipboardCheck,
    },
    {
      label: 'Pendientes de revisión',
      value: String(summary.pendingReviews),
      detail: 'Entregas mock',
      icon: FileCheck2,
    },
    {
      label: 'Próximas fechas límite',
      value: String(summary.upcomingDeadlines),
      detail: 'Período visible',
      icon: CalendarClock,
    },
    {
      label: 'Promedio registrado',
      value: summary.averageGrade === null ? 'Sin datos' : `${summary.averageGrade}`,
      detail: 'Calificación de demostración',
      icon: Gauge,
    },
  ] as const;

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumen de evaluaciones">
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
