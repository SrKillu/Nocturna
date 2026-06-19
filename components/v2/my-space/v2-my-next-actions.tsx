import { Clock3, ListChecks } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MySpaceV2Action, MySpaceV2Priority } from '@/lib/types/my-space-v2';

interface V2MyNextActionsProps {
  actions: readonly MySpaceV2Action[];
}

const priorityLabels: Record<MySpaceV2Priority, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

const priorityStyles: Record<MySpaceV2Priority, string> = {
  high: 'border-destructive/30 bg-destructive/10 text-destructive',
  medium: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  low: 'border-border bg-muted text-muted-foreground',
};

export function V2MyNextActions({ actions }: V2MyNextActionsProps) {
  return (
    <section className="rounded-md border bg-card" aria-labelledby="my-actions-title">
      <div className="border-b px-4 py-3 sm:px-5">
        <h2 id="my-actions-title" className="flex items-center gap-2 font-semibold">
          <ListChecks className="h-4 w-4 text-primary" aria-hidden />
          Próximas acciones
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Entregas y revisiones organizadas por prioridad.
        </p>
      </div>
      <ul className="divide-y">
        {actions.map((action) => (
          <li key={action.id} className="flex flex-col gap-3 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge
                variant="outline"
                className={cn('w-fit', priorityStyles[action.priority])}
              >
                {priorityLabels[action.priority]}
              </Badge>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" aria-hidden />
                {action.dueLabel}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">{action.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{action.courseName}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
