import { Bell, BellDot, Clock3, ShieldAlert } from 'lucide-react';
import type { NotificationsV2Summary } from '@/lib/types/notifications-v2';

export function V2NotificationsSummary({ summary }: { summary: NotificationsV2Summary }) {
  const metrics = [
    ['Notificaciones', String(summary.totalNotifications), 'Señales mock', Bell],
    ['No leídas', String(summary.unreadNotifications), 'Estado visual', BellDot],
    ['Prioridad alta', String(summary.highPriorityNotifications), 'Revisión recomendada', ShieldAlert],
    ['Última actualización', summary.lastUpdateLabel, 'Marca temporal mock', Clock3],
  ] as const;
  return <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumen de notificaciones">{metrics.map(([label, value, detail, Icon]) => <article key={label} className="rounded-md border bg-card p-4"><div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-muted-foreground">{label}</p><Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden /></div><p className="mt-2 text-xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></article>)}</section>;
}
