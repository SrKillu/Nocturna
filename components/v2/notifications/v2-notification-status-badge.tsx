import { Badge } from '@/components/ui/badge';
import type { NotificationV2Status } from '@/lib/types/notifications-v2';

const labels: Record<NotificationV2Status, string> = {
  unread: 'No leída',
  read: 'Leída',
  archived: 'Archivada',
  pending: 'Pendiente',
  resolved: 'Resuelta',
};

export function V2NotificationStatusBadge({
  status,
}: {
  status: NotificationV2Status;
}) {
  return (
    <Badge variant={status === 'unread' ? 'secondary' : 'outline'}>
      {labels[status]}
    </Badge>
  );
}
