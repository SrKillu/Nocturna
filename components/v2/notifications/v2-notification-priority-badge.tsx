import { Badge } from '@/components/ui/badge';
import type { NotificationV2Priority } from '@/lib/types/notifications-v2';

const labels: Record<NotificationV2Priority, string> = {
  low: 'Baja',
  normal: 'Normal',
  high: 'Alta',
  critical: 'Crítica',
};

export function V2NotificationPriorityBadge({
  priority,
}: {
  priority: NotificationV2Priority;
}) {
  return (
    <Badge variant={priority === 'critical' ? 'destructive' : 'outline'}>
      {labels[priority]}
    </Badge>
  );
}
