import { Badge } from '@/components/ui/badge';
import type { SettingsV2Status } from '@/lib/types/settings-v2';

const labels: Record<SettingsV2Status, string> = {
  active: 'Activo',
  configured: 'Configurado',
  review: 'Revisar',
  planned: 'Planificado',
  disabled: 'Deshabilitado',
};

export function V2SettingsStatusBadge({
  status,
}: {
  status: SettingsV2Status;
}) {
  return (
    <Badge
      variant={
        status === 'active' || status === 'configured' ? 'secondary' : 'outline'
      }
    >
      {labels[status]}
    </Badge>
  );
}
