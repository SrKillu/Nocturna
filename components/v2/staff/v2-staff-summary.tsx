import { ClipboardCheck, GraduationCap, UserCheck, UsersRound } from 'lucide-react';

import type { StaffV2Summary } from '@/lib/types/staff-v2';

export function V2StaffSummary({ summary }: { summary: StaffV2Summary }) {
  const metrics = [
    ['Personal activo', String(summary.activeStaff), 'Registros mock', UserCheck],
    ['Docentes', String(summary.teachers), 'Cobertura institucional', GraduationCap],
    ['Asistentes', String(summary.assistants), 'Apoyo académico', UsersRound],
    [
      'Invitaciones pendientes',
      String(summary.pendingInvitations),
      'Sin envíos reales',
      ClipboardCheck,
    ],
  ] as const;

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumen de personal">
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
