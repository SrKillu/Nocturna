import { ArrowRight, Clock3 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { V2EmptyState } from '@/components/v2/states/v2-empty-state';
import type { Capabilities } from '@/lib/types/auth';
import type {
  DashboardV2WorkItem,
  WorkQueuePriority,
} from '@/lib/types/dashboard-v2';

interface V2WorkQueueProps {
  items: readonly DashboardV2WorkItem[];
  capabilities: Capabilities;
}

const priorityLabels: Record<WorkQueuePriority, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

const priorityStyles: Record<WorkQueuePriority, string> = {
  high: 'border-destructive/30 bg-destructive/10 text-destructive',
  medium: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  low: 'border-border bg-muted text-muted-foreground',
};

export function V2WorkQueue({ items, capabilities }: V2WorkQueueProps) {
  const visibleItems = items.filter(
    (item) => !item.requiredCapability || capabilities[item.requiredCapability] === true
  );

  return (
    <section className="rounded-md border bg-card" aria-labelledby="v2-work-queue-title">
      <div className="border-b px-4 py-3 sm:px-5">
        <h2 id="v2-work-queue-title" className="font-semibold">
          Requiere tu atención
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Prioridades organizadas según tu membresía activa.
        </p>
      </div>

      {visibleItems.length === 0 ? (
        <div className="p-4">
          <V2EmptyState
            title="No hay pendientes"
            description="Tu cola de trabajo está al día para esta institución."
          />
        </div>
      ) : (
        <ul className="divide-y">
          {visibleItems.map((item) => (
            <li
              key={item.id}
              className="flex min-h-[68px] flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5"
            >
              <Badge variant="outline" className={priorityStyles[item.priority]}>
                {priorityLabels[item.priority]}
              </Badge>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{item.context}</p>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                {item.dueLabel ? (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" aria-hidden />
                    {item.dueLabel}
                  </span>
                ) : null}
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  {item.actionLabel}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
