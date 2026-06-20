import { Badge } from '@/components/ui/badge';
import type { EnrollmentV2Risk } from '@/lib/types/enrollments-v2';

const labels: Record<EnrollmentV2Risk, string> = {
  on_track: 'Al día',
  watch: 'Atención',
  priority: 'Prioridad',
};
export function V2EnrollmentRiskBadge({ risk }: { risk: EnrollmentV2Risk }) {
  return <Badge variant={risk === 'priority' ? 'destructive' : 'outline'}>{labels[risk]}</Badge>;
}
