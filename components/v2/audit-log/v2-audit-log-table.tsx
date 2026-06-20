import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { V2AuditEventTypeBadge } from '@/components/v2/audit-log/v2-audit-event-type-badge';
import { V2AuditSeverityBadge } from '@/components/v2/audit-log/v2-audit-severity-badge';
import { V2AuditStatusBadge } from '@/components/v2/audit-log/v2-audit-status-badge';
import type { AuditLogV2Event } from '@/lib/types/audit-log-v2';

export function V2AuditLogTable({ events }: { events: readonly AuditLogV2Event[] }) {
  return <div className="hidden overflow-hidden rounded-md border bg-card lg:block"><Table><TableHeader><TableRow className="bg-muted/30 hover:bg-muted/30"><TableHead className="px-4">Evento</TableHead><TableHead>Módulo</TableHead><TableHead>Actor mock</TableHead><TableHead>Recurso afectado</TableHead><TableHead>Severidad</TableHead><TableHead>Estado</TableHead><TableHead>Fecha / hora</TableHead><TableHead className="pr-4">Próxima acción</TableHead></TableRow></TableHeader><TableBody>{events.map((event) => <TableRow key={event.id}><TableCell className="px-4 py-3"><p className="font-medium">{event.title}</p><div className="mt-1"><V2AuditEventTypeBadge eventType={event.eventType} /></div></TableCell><TableCell>{event.moduleLabel}</TableCell><TableCell>{event.actorLabel}</TableCell><TableCell>{event.resourceLabel}</TableCell><TableCell><V2AuditSeverityBadge severity={event.severity} /></TableCell><TableCell><V2AuditStatusBadge status={event.status} /></TableCell><TableCell className="text-sm text-muted-foreground">{event.occurredAtLabel}</TableCell><TableCell className="pr-4 text-sm text-muted-foreground">{event.nextAction}</TableCell></TableRow>)}</TableBody></Table></div>;
}
