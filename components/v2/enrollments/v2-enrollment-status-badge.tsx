import { Badge } from '@/components/ui/badge';
import type { EnrollmentV2Status } from '@/lib/types/enrollments-v2';

const labels: Record<EnrollmentV2Status, string> = {
  active: 'Activa',
  pending: 'Pendiente',
  suspended: 'Suspendida',
  completed: 'Completada',
  withdrawn: 'Retirada',
  review: 'En revisión',
};
export function V2EnrollmentStatusBadge({ status }: { status: EnrollmentV2Status }) {
  return <Badge variant={status === 'active' ? 'secondary' : 'outline'}>{labels[status]}</Badge>;
}
