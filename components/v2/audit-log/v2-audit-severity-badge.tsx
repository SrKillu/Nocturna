import { Badge } from '@/components/ui/badge';
import type { AuditLogV2Severity } from '@/lib/types/audit-log-v2';

const labels: Record<AuditLogV2Severity, string> = {
  info: 'Informativo',
  notice: 'Atención',
  warning: 'Advertencia',
  critical: 'Crítico',
};

export function V2AuditSeverityBadge({
  severity,
}: {
  severity: AuditLogV2Severity;
}) {
  return (
    <Badge variant={severity === 'critical' ? 'destructive' : 'outline'}>
      {labels[severity]}
    </Badge>
  );
}
