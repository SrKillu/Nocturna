import { Clock3, Layers3 } from 'lucide-react';
import { V2NotificationChannelBadge } from '@/components/v2/notifications/v2-notification-channel-badge';
import { V2NotificationPriorityBadge } from '@/components/v2/notifications/v2-notification-priority-badge';
import { V2NotificationStatusBadge } from '@/components/v2/notifications/v2-notification-status-badge';
import type { NotificationV2Item } from '@/lib/types/notifications-v2';

export function V2NotificationsMobileList({ notifications }: { notifications: readonly NotificationV2Item[] }) {
  return <ul className="divide-y overflow-hidden rounded-md border bg-card lg:hidden">{notifications.map((notification) => <li key={notification.id} className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{notification.title}</p><p className="mt-1 text-xs text-muted-foreground">{notification.detail}</p></div><V2NotificationPriorityBadge priority={notification.priority} /></div><div className="grid gap-2 text-sm sm:grid-cols-2"><p className="flex items-center gap-2"><Layers3 className="h-4 w-4 text-muted-foreground" aria-hidden />{notification.moduleLabel}</p><p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-muted-foreground" aria-hidden />{notification.occurredAtLabel}</p><V2NotificationStatusBadge status={notification.status} /><V2NotificationChannelBadge channel={notification.channel} /></div><p className="text-xs text-muted-foreground">{notification.nextAction}</p></li>)}</ul>;
}
