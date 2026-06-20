import { Badge } from '@/components/ui/badge';
import type { EnrollmentV2Type } from '@/lib/types/enrollments-v2';

const labels: Record<EnrollmentV2Type, string> = {
  regular: 'Regular',
  extraordinary: 'Extraordinaria',
  transfer: 'Traslado',
  returning: 'Reingreso',
  agreement: 'Beca / convenio',
};
export function V2EnrollmentTypeBadge({ type }: { type: EnrollmentV2Type }) {
  return <Badge variant="outline">{labels[type]}</Badge>;
}
