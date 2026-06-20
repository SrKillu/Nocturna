import { Badge } from '@/components/ui/badge';
import type { StaffV2Role } from '@/lib/types/staff-v2';

const labels: Record<StaffV2Role, string> = {
  admin: 'Administración',
  teacher: 'Docente',
  assistant: 'Asistente',
};

export function V2StaffRoleBadge({ role }: { role: StaffV2Role }) {
  return <Badge variant="outline">{labels[role]}</Badge>;
}
