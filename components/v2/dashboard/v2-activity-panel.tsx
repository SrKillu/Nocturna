import { Activity, CircleCheck, Clock3, Info, TriangleAlert } from 'lucide-react';

import { V2EmptyState } from '@/components/v2/states/v2-empty-state';
import { cn } from '@/lib/utils';
import type {
  DashboardV2ActivityItem,
  DashboardV2Tone,
} from '@/lib/types/dashboard-v2';

interface V2ActivityPanelProps {
  title: string;
  items: readonly DashboardV2ActivityItem[];
}

const toneIcons: Record<DashboardV2Tone, typeof Activity> = {
  neutral: Clock3,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: TriangleAlert,
};

const toneStyles: Record<DashboardV2Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  info: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  danger: 'bg-destructive/10 text-destructive',
};

export function V2ActivityPanel({ title, items }: V2ActivityPanelProps) {
  return (
    <section className="rounded-md border bg-card" aria-labelledby="v2-activity-title">
      <div className="border-b px-4 py-3 sm:px-5">
        <h2 id="v2-activity-title" className="font-semibold">
          {title}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Contexto reciente de demostración.</p>
      </div>

      {items.length === 0 ? (
        <div className="p-4">
          <V2EmptyState
            title="Sin actividad reciente"
            description="Los eventos relevantes aparecerán aquí."
            icon={Activity}
          />
        </div>
      ) : (
        <ol className="divide-y">
          {items.map((item) => {
            const Icon = toneIcons[item.tone];
            return (
              <li key={item.id} className="flex gap-3 px-4 py-4 sm:px-5">
                <span
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                    toneStyles[item.tone]
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{item.metadata}</p>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground">
                  {item.timestampLabel}
                </time>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
