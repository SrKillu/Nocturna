import { Activity, AlertTriangle, CircleCheck, Info } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { DashboardV2Metric, DashboardV2Tone } from '@/lib/types/dashboard-v2';

interface V2KpiStripProps {
  metrics: readonly DashboardV2Metric[];
}

const toneStyles: Record<DashboardV2Tone, string> = {
  neutral: 'text-foreground',
  info: 'text-sky-700 dark:text-sky-300',
  success: 'text-emerald-700 dark:text-emerald-300',
  warning: 'text-amber-700 dark:text-amber-300',
  danger: 'text-destructive',
};

const toneIcons: Record<DashboardV2Tone, typeof Activity> = {
  neutral: Activity,
  info: Info,
  success: CircleCheck,
  warning: AlertTriangle,
  danger: AlertTriangle,
};

export function V2KpiStrip({ metrics }: V2KpiStripProps) {
  return (
    <section aria-labelledby="v2-metrics-title">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="v2-metrics-title" className="text-sm font-semibold">
          Indicadores
        </h2>
        <span className="text-xs text-muted-foreground">Datos de demostración</span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {metrics.map((metric) => {
          const Icon = toneIcons[metric.tone];
          return (
            <div key={metric.id} className="rounded-md border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                <Icon className={cn('h-4 w-4', toneStyles[metric.tone])} aria-hidden />
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums">{metric.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{metric.hint}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
