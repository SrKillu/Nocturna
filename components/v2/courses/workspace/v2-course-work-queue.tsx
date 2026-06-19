import { Clock3 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CourseV2WorkItem, CourseV2WorkPriority } from '@/lib/types/courses-v2';

interface V2CourseWorkQueueProps {
  items: readonly CourseV2WorkItem[];
}

const priorityLabels: Record<CourseV2WorkPriority, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

const priorityStyles: Record<CourseV2WorkPriority, string> = {
  high: 'border-destructive/30 bg-destructive/10 text-destructive',
  medium: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  low: 'border-border bg-muted text-muted-foreground',
};

export function V2CourseWorkQueue({ items }: V2CourseWorkQueueProps) {
  return (
    <section className="rounded-md border bg-card" aria-labelledby="course-work-queue-title">
      <div className="border-b px-4 py-3 sm:px-5">
        <h2 id="course-work-queue-title" className="font-semibold">
          Cola de trabajo
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Próximas acciones de demostración para este curso.
        </p>
      </div>
      <ul className="divide-y">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-3 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge
                variant="outline"
                className={cn('w-fit', priorityStyles[item.priority])}
              >
                {priorityLabels[item.priority]}
              </Badge>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" aria-hidden />
                {item.dueLabel}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">{item.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{item.context}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
