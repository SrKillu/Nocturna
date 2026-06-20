import { ShieldAlert } from 'lucide-react';
import { V2AuditSeverityBadge } from '@/components/v2/audit-log/v2-audit-severity-badge';
import type { AuditLogV2RiskSignal } from '@/lib/types/audit-log-v2';

export function V2AuditRiskPanel({ signals }: { signals: readonly AuditLogV2RiskSignal[] }) {
  return <section className="rounded-md border bg-card" aria-labelledby="audit-risk-title"><div className="border-b px-4 py-3"><h2 id="audit-risk-title" className="flex items-center gap-2 font-semibold"><ShieldAlert className="h-4 w-4 text-primary" aria-hidden />Señales de riesgo</h2><p className="mt-0.5 text-sm text-muted-foreground">Indicadores simulados que requieren revisión humana.</p></div><ul className="divide-y">{signals.map((signal) => <li key={signal.id} className="flex items-start justify-between gap-3 px-4 py-3"><div><p className="text-sm font-medium">{signal.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{signal.detail}</p></div><V2AuditSeverityBadge severity={signal.severity} /></li>)}</ul></section>;
}
