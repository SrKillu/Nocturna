import { Clock3, Layers3, UserRound } from 'lucide-react';
import { V2AuditEventTypeBadge } from '@/components/v2/audit-log/v2-audit-event-type-badge';
import { V2AuditSeverityBadge } from '@/components/v2/audit-log/v2-audit-severity-badge';
import { V2AuditStatusBadge } from '@/components/v2/audit-log/v2-audit-status-badge';
import type { AuditLogV2Event } from '@/lib/types/audit-log-v2';

export function V2AuditLogMobileList({ events }: { events: readonly AuditLogV2Event[] }) {
  return <ul className="divide-y overflow-hidden rounded-md border bg-card lg:hidden">{events.map((event) => <li key={event.id} className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{event.title}</p><div className="mt-1"><V2AuditEventTypeBadge eventType={event.eventType} /></div></div><V2AuditSeverityBadge severity={event.severity} /></div><div className="grid gap-2 text-sm sm:grid-cols-2"><p className="flex items-center gap-2"><Layers3 className="h-4 w-4 text-muted-foreground" aria-hidden />{event.moduleLabel}</p><p className="flex items-center gap-2"><UserRound className="h-4 w-4 text-muted-foreground" aria-hidden />{event.actorLabel}</p><p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-muted-foreground" aria-hidden />{event.occurredAtLabel}</p><V2AuditStatusBadge status={event.status} /></div><p className="text-xs text-muted-foreground">{event.resourceLabel} · {event.nextAction}</p></li>)}</ul>;
}
