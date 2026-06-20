import { Activity } from 'lucide-react';
import { V2AuditEventTypeBadge } from '@/components/v2/audit-log/v2-audit-event-type-badge';
import type { AuditLogV2Event } from '@/lib/types/audit-log-v2';

export function V2AuditActivityPanel({ events }: { events: readonly AuditLogV2Event[] }) {
  return <section className="rounded-md border bg-card" aria-labelledby="audit-activity-title"><div className="border-b px-4 py-3"><h2 id="audit-activity-title" className="flex items-center gap-2 font-semibold"><Activity className="h-4 w-4 text-primary" aria-hidden />Actividad reciente</h2><p className="mt-0.5 text-sm text-muted-foreground">Secuencia mock sin consulta de registros reales.</p></div><ul className="divide-y">{events.map((event) => <li key={event.id} className="space-y-2 px-4 py-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium">{event.title}</p><p className="text-xs text-muted-foreground">{event.actorLabel} · {event.occurredAtLabel}</p></div><V2AuditEventTypeBadge eventType={event.eventType} /></div></li>)}</ul></section>;
}
