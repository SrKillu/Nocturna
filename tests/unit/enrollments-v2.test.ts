import { describe, expect, it } from 'vitest';
import { EMPTY_ENROLLMENTS_V2, getMockEnrollmentsV2 } from '@/lib/mocks/enrollments-v2';
import { getCapabilitiesForRoleKey, ROLE_CAPABILITIES } from '@/lib/rbac/capabilities';
import { navGroupsForCapabilities } from '@/lib/rbac/nav-v2';
import type { Capabilities, RoleKey } from '@/lib/types/auth';
import { canAccessEnrollmentsV2, filterEnrollmentsV2 } from '@/lib/types/enrollments-v2';

function visibleNavIds(roleKey: RoleKey): string[] {
  return navGroupsForCapabilities(getCapabilitiesForRoleKey(roleKey), roleKey).flatMap((group) => group.items.map((item) => item.id));
}

describe('Enrollments V2 foundation', () => {
  it('provides fixtures only for owner and admin', () => {
    expect(getMockEnrollmentsV2('owner').enrollments.length).toBeGreaterThan(0);
    expect(getMockEnrollmentsV2('admin').enrollments.length).toBeGreaterThan(0);
    for (const role of ['teacher', 'assistant', 'student', 'guardian', 'support'] as const) {
      expect(getMockEnrollmentsV2(role)).toEqual(EMPTY_ENROLLMENTS_V2);
    }
  });
  it('requires canViewEnrollments and owner/admin role scope', () => {
    expect(canAccessEnrollmentsV2('owner', ROLE_CAPABILITIES.owner)).toBe(true);
    expect(canAccessEnrollmentsV2('admin', ROLE_CAPABILITIES.admin)).toBe(true);
    const teacherWithCapability: Capabilities = { ...ROLE_CAPABILITIES.teacher, canViewEnrollments: true };
    const ownerWithoutCapability: Capabilities = { ...ROLE_CAPABILITIES.owner, canViewEnrollments: false };
    expect(canAccessEnrollmentsV2('teacher', teacherWithCapability)).toBe(false);
    expect(canAccessEnrollmentsV2('owner', ownerWithoutCapability)).toBe(false);
  });
  it('does not substitute management, report, grade or submit capabilities', () => {
    const substitutes: Capabilities = { ...ROLE_CAPABILITIES.student, canViewReports: true, canGrade: true, canSubmit: true, canManageCourses: true, canViewEnrollments: false };
    expect(canAccessEnrollmentsV2('owner', substitutes)).toBe(false);
  });
  it('filters by search, course and status', () => {
    const fixture = getMockEnrollmentsV2('owner');
    const filtered = filterEnrollmentsV2(fixture.enrollments, { query: '1042', courseId: 'course-algebra-10a', section: 'all', status: 'active', period: 'all', type: 'all', risk: 'all' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.studentCode).toBe('EST-1042');
  });
  it('supports an empty state', () => {
    expect(EMPTY_ENROLLMENTS_V2.enrollments).toHaveLength(0);
  });
  it('shows Matrículas navigation only to owner and admin', () => {
    expect(visibleNavIds('owner')).toContain('enrollments');
    expect(visibleNavIds('admin')).toContain('enrollments');
    for (const role of ['teacher', 'assistant', 'student', 'guardian', 'support'] as const) {
      expect(visibleNavIds(role)).not.toContain('enrollments');
    }
  });
  it('contains no real identities, endpoints or enrollment actions', () => {
    const serialized = JSON.stringify(getMockEnrollmentsV2('owner'));
    expect(serialized).not.toMatch(/@|https?:\/\/|[0-9a-f]{8}-[0-9a-f-]{27}/i);
    expect(serialized).not.toMatch(/enroll.?student|withdraw.?student|approve.?enrollment|import.?enrollment|save.?enrollment|signed.?url/i);
  });
});
