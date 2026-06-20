import { Badge } from '@/components/ui/badge';
import type { ReportV2Status } from '@/lib/types/reports-v2';

const labels: Record<ReportV2Status, string> = {
  available: 'Disponible',
  review: 'En revisión',
  scheduled: 'Programado',
};
export function V2ReportStatusBadge({ status }: { status: ReportV2Status }) {
  return <Badge variant={status === 'available' ? 'secondary' : 'outline'}>{labels[status]}</Badge>;
}
