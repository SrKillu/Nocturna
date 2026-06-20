import { Badge } from '@/components/ui/badge';
import type { CertificateV2Type } from '@/lib/types/certificates-v2';

const labels: Record<CertificateV2Type, string> = {
  approval: 'Aprobación',
  enrollment: 'Matrícula',
  attendance: 'Asistencia',
  completion: 'Finalización',
  recognition: 'Reconocimiento',
};

export function V2CertificateTypeBadge({
  type,
}: {
  type: CertificateV2Type;
}) {
  return <Badge variant="outline">{labels[type]}</Badge>;
}
