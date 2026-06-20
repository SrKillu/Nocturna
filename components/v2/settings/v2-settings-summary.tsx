import { Building2, CalendarRange, Grid2X2Check, ListTodo } from 'lucide-react';

import type { SettingsV2Summary } from '@/lib/types/settings-v2';

export function V2SettingsSummary({ summary }: { summary: SettingsV2Summary }) {
  const metrics = [
    ['Institución', summary.institutionName, 'Perfil mock', Building2],
    ['Período activo', summary.activeAcademicPeriod, 'Calendario mock', CalendarRange],
    ['Módulos habilitados', String(summary.enabledModules), 'Resumen visual', Grid2X2Check],
    ['Configuración pendiente', String(summary.pendingConfiguration), 'Revisión humana', ListTodo],
  ] as const;

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumen de configuración">
      {metrics.map(([label, value, detail, Icon]) => (
        <article key={label} className="rounded-md border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          </div>
          <p className="mt-2 text-lg font-semibold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </article>
      ))}
    </section>
  );
}
