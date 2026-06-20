import { Badge } from '@/components/ui/badge';
import type { NotificationV2Channel } from '@/lib/types/notifications-v2';

const labels: Record<NotificationV2Channel, string> = {
  internal: 'Interno',
  'simulated-email': 'Email simulado',
  dashboard: 'Dashboard',
  'simulated-mobile': 'Móvil simulado',
};

export function V2NotificationChannelBadge({
  channel,
}: {
  channel: NotificationV2Channel;
}) {
  return <Badge variant="outline">{labels[channel]}</Badge>;
}
