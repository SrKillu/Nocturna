import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CourseV2Status } from '@/lib/types/courses-v2';

interface V2CourseStatusBadgeProps {
  status: CourseV2Status;
}

const statusLabels: Record<CourseV2Status, string> = {
  active: 'Activo',
  planning: 'En preparación',
  completed: 'Finalizado',
};

const statusStyles: Record<CourseV2Status, string> = {
  active: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  planning: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  completed: 'border-border bg-muted text-muted-foreground',
};

export function V2CourseStatusBadge({ status }: V2CourseStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn('whitespace-nowrap', statusStyles[status])}>
      {statusLabels[status]}
    </Badge>
  );
}
