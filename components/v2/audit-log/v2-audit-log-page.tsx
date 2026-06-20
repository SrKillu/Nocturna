'use client';

import { useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import { V2AuditActivityPanel } from '@/components/v2/audit-log/v2-audit-activity-panel';
import { V2AuditLogEmptyState } from '@/components/v2/audit-log/v2-audit-log-empty-state';
import { V2AuditLogFilters } from '@/components/v2/audit-log/v2-audit-log-filters';
import { V2AuditLogHeader } from '@/components/v2/audit-log/v2-audit-log-header';
import { V2AuditLogMobileList } from '@/components/v2/audit-log/v2-audit-log-mobile-list';
import { V2AuditLogSummary } from '@/components/v2/audit-log/v2-audit-log-summary';
import { V2AuditLogTable } from '@/components/v2/audit-log/v2-audit-log-table';
import { V2AuditRiskPanel } from '@/components/v2/audit-log/v2-audit-risk-panel';
import { filterAuditLogV2, type AuditLogV2FilterState, type AuditLogV2Fixture } from '@/lib/types/audit-log-v2';

const initialFilters: AuditLogV2FilterState = { query: '', module: 'all', eventType: 'all', severity: 'all', status: 'all', actorId: 'all', period: 'all' };

export function V2AuditLogPage({ auditLog }: { auditLog: AuditLogV2Fixture }) {
  const [filters, setFilters] = useState(initialFilters);
  const filtered = useMemo(() => filterAuditLogV2(auditLog.events, filters), [auditLog.events, filters]);
  const actorOptions = useMemo(() => Array.from(new Map(auditLog.events.map((event) => [event.actorId, { actorId: event.actorId, actorLabel: event.actorLabel }])).values()), [auditLog.events]);
  const hasFilters = Object.entries(filters).some(([key, value]) => value !== initialFilters[key as keyof AuditLogV2FilterState]);
  return <div className="space-y-5"><V2AuditLogHeader /><V2AuditLogSummary summary={auditLog.summary} /><V2AuditLogFilters filters={filters} actorOptions={actorOptions} onChange={setFilters} /><div className="flex flex-wrap items-center justify-between gap-2 text-sm"><p className="text-muted-foreground"><span className="font-medium text-foreground">{filtered.length}</span> {filtered.length === 1 ? 'evento visible' : 'eventos visibles'}</p><span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Info className="h-4 w-4" aria-hidden />{auditLog.disclaimer}</span></div>{filtered.length === 0 ? <div className="rounded-md border bg-card p-4"><V2AuditLogEmptyState filtered={hasFilters} /></div> : <><V2AuditLogTable events={filtered} /><V2AuditLogMobileList events={filtered} /></>}<div className="grid gap-5 lg:grid-cols-2"><V2AuditActivityPanel events={auditLog.recentActivity} /><V2AuditRiskPanel signals={auditLog.riskSignals} /></div></div>;
}
