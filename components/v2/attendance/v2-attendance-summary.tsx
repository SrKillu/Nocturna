import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  Gauge,
} from 'lucide-react';

import type { AttendanceV2Summary } from '@/lib/types/attendance-v2';

interface V2AttendanceSummaryProps {
  summary: AttendanceV2Summary;
}

export function V2AttendanceSummary({ summary }: V2AttendanceSummaryProps) {
  const metrics = [
    {
      label: 'Asistencia promedio',
      value: `${summary.averagePercent}%`,
      detail: 'Período visible',
      icon: Gauge,
    },
    {
      label: 'Sesiones pendientes',
      value: String(summary.pendingSessions),
      detail: 'Sin registro persistente',
      icon: CalendarClock,
    },
    {
      label: 'Estudiantes con alerta',
      value: String(summary.studentsWithAlerts),
      detail: 'Observación o prioridad',
      icon: AlertTriangle,
    },
    {
      label: 'Última sesión registrada',
      value: summary.lastRecordedSessionLabel,
      detail: 'Datos de demostración',
      icon: CalendarDays,
    },
  ] as const;

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumen de asistencia">
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
