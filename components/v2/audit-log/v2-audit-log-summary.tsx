import { AlertTriangle, Clock3, ListChecks, ShieldAlert } from 'lucide-react';

import type { AuditLogV2Summary } from '@/lib/types/audit-log-v2';

export function V2AuditLogSummary({ summary }: { summary: AuditLogV2Summary }) {
  const metrics = [
    ['Eventos registrados', String(summary.recordedEvents), 'Actividad mock', ListChecks],
    ['Eventos críticos', String(summary.criticalEvents), 'Señales simuladas', ShieldAlert],
    ['Cambios administrativos', String(summary.administrativeChanges), 'Revisión informativa', AlertTriangle],
    ['Última revisión', summary.lastReviewLabel, 'Marca temporal mock', Clock3],
  ] as const;

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumen de auditoría">
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
