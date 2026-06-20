import { AlertTriangle, ClipboardCheck, RefreshCw, UsersRound } from 'lucide-react';
import type { EnrollmentsV2Summary } from '@/lib/types/enrollments-v2';

export function V2EnrollmentsSummary({ summary }: { summary: EnrollmentsV2Summary }) {
  const metrics = [
    ['Matrículas activas', String(summary.activeEnrollments), 'Registros mock', ClipboardCheck],
    ['Cambios pendientes', String(summary.pendingChanges), 'Sin aprobaciones reales', RefreshCw],
    ['Cupos disponibles', String(summary.availableSeats), 'Capacidad simulada', UsersRound],
    ['Alertas de asignación', String(summary.assignmentAlerts), 'Seguimiento mock', AlertTriangle],
  ] as const;
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumen de matrículas">
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
