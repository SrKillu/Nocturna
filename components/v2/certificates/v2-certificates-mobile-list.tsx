import { BookOpenCheck, CalendarDays } from 'lucide-react';

import {
  V2CertificateEligibilityBadge,
  V2CertificateStatusBadge,
} from '@/components/v2/certificates/v2-certificate-status-badge';
import { V2CertificateTypeBadge } from '@/components/v2/certificates/v2-certificate-type-badge';
import type { CertificateV2ListItem } from '@/lib/types/certificates-v2';

export function V2CertificatesMobileList({
  certificates,
}: {
  certificates: readonly CertificateV2ListItem[];
}) {
  return (
    <ul className="divide-y overflow-hidden rounded-md border bg-card lg:hidden">
      {certificates.map((certificate) => (
        <li key={certificate.id} className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{certificate.recipientLabel}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {certificate.recipientCode}
              </p>
            </div>
            <V2CertificateStatusBadge status={certificate.status} />
          </div>
          <div className="flex flex-wrap gap-2">
            <V2CertificateTypeBadge type={certificate.type} />
            <V2CertificateEligibilityBadge
              eligibility={certificate.eligibility}
            />
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <BookOpenCheck
                className="h-4 w-4 text-muted-foreground"
                aria-hidden
              />
              {certificate.courseLabel} · {certificate.sectionLabel}
            </p>
            <p className="flex items-center gap-2">
              <CalendarDays
                className="h-4 w-4 text-muted-foreground"
                aria-hidden
              />
              {certificate.periodLabel}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {certificate.nextAction}
          </p>
        </li>
      ))}
    </ul>
  );
}
