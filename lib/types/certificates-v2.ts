import type { Capabilities, CapabilityKey, RoleKey } from '@/lib/types/auth';

export type CertificateV2Type =
  | 'approval'
  | 'enrollment'
  | 'attendance'
  | 'completion'
  | 'recognition';
export type CertificateV2Status = 'pending' | 'review' | 'ready' | 'blocked';
export type CertificateV2Eligibility = 'eligible' | 'review' | 'not_eligible';
export type CertificateV2Period = 'current' | 'previous';

export interface CertificateV2ListItem {
  id: string;
  recipientLabel: string;
  recipientCode: string;
  type: CertificateV2Type;
  courseId: string;
  courseLabel: string;
  sectionLabel: string;
  period: CertificateV2Period;
  periodLabel: string;
  status: CertificateV2Status;
  eligibility: CertificateV2Eligibility;
  nextAction: string;
}

export interface CertificatesV2Summary {
  pendingCertificates: number;
  eligibleStudents: number;
  availableTemplates: number;
  lastReviewLabel: string;
}

export interface CertificateV2ReadinessItem {
  id: string;
  label: string;
  detail: string;
  status: 'complete' | 'review';
}

export interface CertificateV2Template {
  id: string;
  name: string;
  detail: string;
  statusLabel: string;
}

export interface CertificatesV2Fixture {
  summary: CertificatesV2Summary;
  certificates: readonly CertificateV2ListItem[];
  readiness: readonly CertificateV2ReadinessItem[];
  templates: readonly CertificateV2Template[];
  disclaimer: string;
}

export interface CertificateV2FilterState {
  query: string;
  type: CertificateV2Type | 'all';
  courseId: string | 'all';
  period: CertificateV2Period | 'all';
  status: CertificateV2Status | 'all';
  eligibility: CertificateV2Eligibility | 'all';
}

export const CERTIFICATES_V2_CAPABILITIES = [
  'canViewCertificates',
] as const satisfies readonly CapabilityKey[];
export const CERTIFICATES_V2_ROLES = [
  'owner',
  'admin',
] as const satisfies readonly RoleKey[];

export function canAccessCertificatesV2(
  roleKey: RoleKey,
  capabilities: Capabilities
): boolean {
  return (
    CERTIFICATES_V2_ROLES.includes(
      roleKey as (typeof CERTIFICATES_V2_ROLES)[number]
    ) && capabilities.canViewCertificates === true
  );
}

export function filterCertificatesV2(
  certificates: readonly CertificateV2ListItem[],
  filters: CertificateV2FilterState
): readonly CertificateV2ListItem[] {
  const query = filters.query.trim().toLocaleLowerCase('es');

  return certificates.filter((certificate) => {
    const matchesQuery =
      query.length === 0 ||
      [
        certificate.recipientLabel,
        certificate.recipientCode,
        certificate.courseLabel,
        certificate.sectionLabel,
      ].some((value) => value.toLocaleLowerCase('es').includes(query));

    return (
      matchesQuery &&
      (filters.type === 'all' || certificate.type === filters.type) &&
      (filters.courseId === 'all' || certificate.courseId === filters.courseId) &&
      (filters.period === 'all' || certificate.period === filters.period) &&
      (filters.status === 'all' || certificate.status === filters.status) &&
      (filters.eligibility === 'all' ||
        certificate.eligibility === filters.eligibility)
    );
  });
}
