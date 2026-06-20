import { Badge } from '@/components/ui/badge';
import type {
  CertificateV2Eligibility,
  CertificateV2Status,
} from '@/lib/types/certificates-v2';

const statusLabels: Record<CertificateV2Status, string> = {
  pending: 'Pendiente',
  review: 'En revisión',
  ready: 'Listo para revisión',
  blocked: 'Bloqueado',
};

const eligibilityLabels: Record<CertificateV2Eligibility, string> = {
  eligible: 'Elegible',
  review: 'Revisar',
  not_eligible: 'No elegible',
};

export function V2CertificateStatusBadge({
  status,
}: {
  status: CertificateV2Status;
}) {
  return (
    <Badge variant={status === 'ready' ? 'secondary' : 'outline'}>
      {statusLabels[status]}
    </Badge>
  );
}

export function V2CertificateEligibilityBadge({
  eligibility,
}: {
  eligibility: CertificateV2Eligibility;
}) {
  return (
    <Badge variant={eligibility === 'eligible' ? 'secondary' : 'outline'}>
      {eligibilityLabels[eligibility]}
    </Badge>
  );
}
