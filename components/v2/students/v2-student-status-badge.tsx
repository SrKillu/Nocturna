import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { StudentV2Risk, StudentV2Status } from '@/lib/types/students-v2';

interface V2StudentStatusBadgeProps {
  status: StudentV2Status;
}

interface V2StudentRiskBadgeProps {
  risk: StudentV2Risk;
}

const statusLabels: Record<StudentV2Status, string> = {
  active: 'Activo',
  follow_up: 'En seguimiento',
  inactive: 'Inactivo',
};

const statusStyles: Record<StudentV2Status, string> = {
  active: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  follow_up: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  inactive: 'border-border bg-muted text-muted-foreground',
};

const riskLabels: Record<StudentV2Risk, string> = {
  on_track: 'Al día',
  watch: 'Atención',
  priority: 'Prioridad',
};

const riskStyles: Record<StudentV2Risk, string> = {
  on_track: 'border-border bg-muted/60 text-muted-foreground',
  watch: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  priority: 'border-destructive/40 bg-destructive/10 text-destructive',
};

export function V2StudentStatusBadge({ status }: V2StudentStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn('whitespace-nowrap', statusStyles[status])}>
      {statusLabels[status]}
    </Badge>
  );
}

export function V2StudentRiskBadge({ risk }: V2StudentRiskBadgeProps) {
  return (
    <Badge variant="outline" className={cn('whitespace-nowrap', riskStyles[risk])}>
      {riskLabels[risk]}
    </Badge>
  );
}
