import { Badge } from '@/components/ui/badge';
import type {
  AttendanceV2Alert,
  AttendanceV2Status,
} from '@/lib/types/attendance-v2';

const statusLabels: Record<AttendanceV2Status, string> = {
  present: 'Presente',
  late: 'Tardía',
  absent: 'Ausente',
  pending: 'Pendiente',
};

const alertLabels: Record<AttendanceV2Alert, string> = {
  none: 'Al día',
  watch: 'Atención',
  priority: 'Prioridad',
};

export function V2AttendanceStatusBadge({
  status,
}: {
  status: AttendanceV2Status;
}) {
  return (
    <Badge
      variant={
        status === 'absent'
          ? 'destructive'
          : status === 'present'
            ? 'secondary'
            : 'outline'
      }
    >
      {statusLabels[status]}
    </Badge>
  );
}

export function V2AttendanceAlertBadge({ alert }: { alert: AttendanceV2Alert }) {
  return (
    <Badge variant={alert === 'priority' ? 'destructive' : 'outline'}>
      {alertLabels[alert]}
    </Badge>
  );
}
