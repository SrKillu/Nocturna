import { describe, expect, it } from 'vitest';

import { EMPTY_CERTIFICATES_V2, getMockCertificatesV2 } from '@/lib/mocks/certificates-v2';
import {
  getCapabilitiesForRoleKey,
  ROLE_CAPABILITIES,
} from '@/lib/rbac/capabilities';
import { navGroupsForCapabilities } from '@/lib/rbac/nav-v2';
import type { Capabilities, RoleKey } from '@/lib/types/auth';
import {
  canAccessCertificatesV2,
  filterCertificatesV2,
} from '@/lib/types/certificates-v2';

function visibleNavIds(roleKey: RoleKey): string[] {
  return navGroupsForCapabilities(
    getCapabilitiesForRoleKey(roleKey),
    roleKey
  ).flatMap((group) => group.items.map((item) => item.id));
}

describe('Certificates V2 foundation', () => {
  it('provides owner and admin fixtures only', () => {
    expect(getMockCertificatesV2('owner').certificates.length).toBeGreaterThan(0);
    expect(getMockCertificatesV2('admin').certificates.length).toBeGreaterThan(0);
    expect(getMockCertificatesV2('teacher')).toEqual(EMPTY_CERTIFICATES_V2);
    expect(getMockCertificatesV2('assistant')).toEqual(EMPTY_CERTIFICATES_V2);
    expect(getMockCertificatesV2('student')).toEqual(EMPTY_CERTIFICATES_V2);
    expect(getMockCertificatesV2('guardian')).toEqual(EMPTY_CERTIFICATES_V2);
    expect(getMockCertificatesV2('support')).toEqual(EMPTY_CERTIFICATES_V2);
  });

  it('requires both canViewCertificates and owner/admin role scope', () => {
    expect(
      canAccessCertificatesV2('owner', ROLE_CAPABILITIES.owner)
    ).toBe(true);
    expect(
      canAccessCertificatesV2('admin', ROLE_CAPABILITIES.admin)
    ).toBe(true);

    const teacherWithCertificateCapability: Capabilities = {
      ...ROLE_CAPABILITIES.teacher,
      canViewCertificates: true,
    };
    const ownerWithoutCertificateCapability: Capabilities = {
      ...ROLE_CAPABILITIES.owner,
      canViewCertificates: false,
    };

    expect(
      canAccessCertificatesV2('teacher', teacherWithCertificateCapability)
    ).toBe(false);
    expect(
      canAccessCertificatesV2('owner', ownerWithoutCertificateCapability)
    ).toBe(false);
  });

  it('does not substitute management, report, grade or submit capabilities', () => {
    const substituteCapabilities: Capabilities = {
      ...ROLE_CAPABILITIES.student,
      canViewReports: true,
      canGrade: true,
      canSubmit: true,
      canManageCertificates: true,
      canViewCertificates: false,
    };

    expect(
      canAccessCertificatesV2('owner', substituteCapabilities)
    ).toBe(false);
  });

  it('filters by search and eligibility', () => {
    const fixture = getMockCertificatesV2('owner');
    const filtered = filterCertificatesV2(fixture.certificates, {
      query: '1042',
      type: 'all',
      courseId: 'all',
      period: 'all',
      status: 'all',
      eligibility: 'eligible',
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.recipientCode).toBe('EST-1042');
  });

  it('supports an empty fixture', () => {
    expect(EMPTY_CERTIFICATES_V2.certificates).toHaveLength(0);
    expect(
      filterCertificatesV2(EMPTY_CERTIFICATES_V2.certificates, {
        query: '',
        type: 'all',
        courseId: 'all',
        period: 'all',
        status: 'all',
        eligibility: 'all',
      })
    ).toHaveLength(0);
  });

  it('shows Certificates navigation only to owner and admin', () => {
    expect(visibleNavIds('owner')).toContain('certificates');
    expect(visibleNavIds('admin')).toContain('certificates');
    expect(visibleNavIds('teacher')).not.toContain('certificates');
    expect(visibleNavIds('assistant')).not.toContain('certificates');
    expect(visibleNavIds('student')).not.toContain('certificates');
    expect(visibleNavIds('guardian')).not.toContain('certificates');
    expect(visibleNavIds('support')).not.toContain('certificates');
  });

  it('contains no identities or real document artifacts in fixtures', () => {
    const serialized = JSON.stringify(getMockCertificatesV2('owner'));

    expect(serialized).not.toMatch(/@|https?:\/\/|[0-9a-f]{8}-[0-9a-f-]{27}/i);
    expect(serialized).not.toMatch(
      /\.pdf|\.png|qr|signature|signed.?url|storage|download/i
    );
  });
});
