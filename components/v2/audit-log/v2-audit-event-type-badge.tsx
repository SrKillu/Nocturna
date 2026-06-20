import { Badge } from '@/components/ui/badge';
import type { AuditLogV2EventType } from '@/lib/types/audit-log-v2';

const labels: Record<AuditLogV2EventType, string> = {
  'sign-in': 'Inicio de sesión',
  'settings-change': 'Configuración',
  'role-change': 'Cambio de rol',
  'academic-update': 'Actualización',
  'denied-attempt': 'Acceso denegado',
  'simulated-export': 'Exportación simulada',
  'admin-action': 'Acción administrativa',
  'membership-change': 'Membresía',
};

export function V2AuditEventTypeBadge({
  eventType,
}: {
  eventType: AuditLogV2EventType;
}) {
  return <Badge variant="outline">{labels[eventType]}</Badge>;
}
