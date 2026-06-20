import { AlertTriangle, BarChart3, ClipboardCheck, Clock3 } from 'lucide-react';
import type { ReportsV2Summary } from '@/lib/types/reports-v2';

export function V2ReportsSummary({ summary }: { summary: ReportsV2Summary }) {
  const metrics = [
    ['Reportes disponibles', String(summary.availableReports), 'Resúmenes mock', BarChart3],
    ['Pendientes de revisión', String(summary.pendingReview), 'Validación humana', ClipboardCheck],
    ['Alertas académicas', String(summary.academicAlerts), 'Señales mock', AlertTriangle],
    ['Última actualización', summary.lastUpdateLabel, 'Dato de demostración', Clock3],
  ] as const;
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumen de reportes">
      {metrics.map(([label, value, detail, Icon]) => (
        <article key={label} className="rounded-md border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          </div>
          <p className="mt-2 text-xl font-semibold tabular-nums">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </article>
      ))}
    </section>
  );
}
