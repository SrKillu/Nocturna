'use client';

import { useMemo, useState } from 'react';
import { Info } from 'lucide-react';

import { V2CertificateReadinessPanel } from '@/components/v2/certificates/v2-certificate-readiness-panel';
import { V2CertificateTemplatesPanel } from '@/components/v2/certificates/v2-certificate-templates-panel';
import { V2CertificatesEmptyState } from '@/components/v2/certificates/v2-certificates-empty-state';
import { V2CertificatesFilters } from '@/components/v2/certificates/v2-certificates-filters';
import { V2CertificatesHeader } from '@/components/v2/certificates/v2-certificates-header';
import { V2CertificatesMobileList } from '@/components/v2/certificates/v2-certificates-mobile-list';
import { V2CertificatesSummary } from '@/components/v2/certificates/v2-certificates-summary';
import { V2CertificatesTable } from '@/components/v2/certificates/v2-certificates-table';
import {
  filterCertificatesV2,
  type CertificateV2FilterState,
  type CertificatesV2Fixture,
} from '@/lib/types/certificates-v2';

const initialFilters: CertificateV2FilterState = {
  query: '',
  type: 'all',
  courseId: 'all',
  period: 'all',
  status: 'all',
  eligibility: 'all',
};

export function V2CertificatesPage({
  certificates,
}: {
  certificates: CertificatesV2Fixture;
}) {
  const [filters, setFilters] = useState(initialFilters);
  const filtered = useMemo(
    () => filterCertificatesV2(certificates.certificates, filters),
    [certificates.certificates, filters]
  );
  const courseOptions = useMemo(() => {
    const values = new Map<
      string,
      { courseId: string; courseLabel: string; sectionLabel: string }
    >();

    certificates.certificates.forEach((certificate) => {
      values.set(certificate.courseId, {
        courseId: certificate.courseId,
        courseLabel: certificate.courseLabel,
        sectionLabel: certificate.sectionLabel,
      });
    });

    return Array.from(values.values());
  }, [certificates.certificates]);
  const hasFilters = Object.entries(filters).some(
    ([key, value]) =>
      value !== initialFilters[key as keyof CertificateV2FilterState]
  );

  return (
    <div className="space-y-5">
      <V2CertificatesHeader />
      <V2CertificatesSummary summary={certificates.summary} />
      <V2CertificatesFilters
        filters={filters}
        courseOptions={courseOptions}
        onChange={setFilters}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">{filtered.length}</span>{' '}
          {filtered.length === 1 ? 'registro visible' : 'registros visibles'}
        </p>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-4 w-4" aria-hidden />
          {certificates.disclaimer}
        </span>
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-md border bg-card p-4">
          <V2CertificatesEmptyState filtered={hasFilters} />
        </div>
      ) : (
        <>
          <V2CertificatesTable certificates={filtered} />
          <V2CertificatesMobileList certificates={filtered} />
        </>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        <V2CertificateReadinessPanel items={certificates.readiness} />
        <V2CertificateTemplatesPanel templates={certificates.templates} />
      </div>
    </div>
  );
}
