import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { StaffV2Status, StaffV2Workload } from '@/lib/types/staff-v2';

const statusLabels: Record<StaffV2Status, string> = {
  active: 'Activo',
  follow_up: 'En seguimiento',
  inactive: 'Inactivo',
};
const statusStyles: Record<StaffV2Status, string> = {
  active:
    'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  follow_up:
    'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  inactive: 'border-border bg-muted text-muted-foreground',
};
const workloadLabels: Record<StaffV2Workload, string> = {
  balanced: 'Equilibrada',
  review: 'Revisar',
  available: 'Disponible',
};

export function V2StaffStatusBadge({ status }: { status: StaffV2Status }) {
  return (
    <Badge variant="outline" className={cn('whitespace-nowrap', statusStyles[status])}>
      {statusLabels[status]}
    </Badge>
  );
}

export function V2StaffWorkloadBadge({
  workload,
}: {
  workload: StaffV2Workload;
}) {
  return (
    <Badge variant={workload === 'balanced' ? 'secondary' : 'outline'}>
      {workloadLabels[workload]}
    </Badge>
  );
}
