import { Badge } from '@/components/ui/badge';
import type { AuditLogV2Status } from '@/lib/types/audit-log-v2';

const labels: Record<AuditLogV2Status, string> = {
  recorded: 'Registrado',
  review: 'En revisión',
  resolved: 'Resuelto',
};

export function V2AuditStatusBadge({
  status,
}: {
  status: AuditLogV2Status;
}) {
  return (
    <Badge variant={status === 'resolved' ? 'secondary' : 'outline'}>
      {labels[status]}
    </Badge>
  );
}
