import { BellRing, CircleCheck } from 'lucide-react';

import { V2EmptyState } from '@/components/v2/states/v2-empty-state';
import { cn } from '@/lib/utils';
import type {
  GuardianAlertV2,
  GuardianSpaceV2Tone,
} from '@/lib/types/guardian-space-v2';

interface V2GuardianAlertsPreviewProps {
  alerts: readonly GuardianAlertV2[];
}

const toneStyles: Record<GuardianSpaceV2Tone, string> = {
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  info: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  neutral: 'bg-muted text-muted-foreground',
};

export function V2GuardianAlertsPreview({ alerts }: V2GuardianAlertsPreviewProps) {
  return (
    <section className="rounded-md border bg-card" aria-labelledby="guardian-alerts-title">
      <div className="border-b px-4 py-3">
        <h2 id="guardian-alerts-title" className="flex items-center gap-2 font-semibold">
          <BellRing className="h-4 w-4 text-primary" aria-hidden />
          Alertas y seguimiento
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Situaciones académicas que requieren atención.
        </p>
      </div>
      {alerts.length === 0 ? (
        <div className="p-4">
          <V2EmptyState
            icon={CircleCheck}
            title="Sin alertas abiertas"
            description="No hay seguimientos pendientes en esta vista."
          />
        </div>
      ) : (
        <ul className="divide-y">
          {alerts.map((alert) => (
            <li key={alert.id} className="flex gap-3 px-4 py-3">
              <span
                className={cn(
                  'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                  toneStyles[alert.tone]
                )}
              >
                <BellRing className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-medium">{alert.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{alert.studentName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{alert.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
