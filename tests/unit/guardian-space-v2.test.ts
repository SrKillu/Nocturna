import { describe, expect, it } from 'vitest';

import {
  EMPTY_GUARDIAN_SPACE_V2,
  getMockGuardianSpaceV2,
} from '@/lib/mocks/guardian-space-v2';
import { navGroupsForCapabilities } from '@/lib/rbac/nav-v2';
import { canAccessGuardianSpaceV2 } from '@/lib/types/guardian-space-v2';

function visibleNavIds(
  capabilities: Parameters<typeof navGroupsForCapabilities>[0],
  roleKey: Parameters<typeof navGroupsForCapabilities>[1]
) {
  return navGroupsForCapabilities(capabilities, roleKey)
    .flatMap((group) => group.items)
    .map((item) => item.id);
}

describe('Guardian Space V2 foundation', () => {
  it('provides a safe fixture only for guardian', () => {
    const guardianSpace = getMockGuardianSpaceV2('guardian');

    expect(guardianSpace).not.toBeNull();
    expect(guardianSpace?.students.length).toBeGreaterThan(0);
    expect(guardianSpace?.alerts.length).toBeGreaterThan(0);
    expect(getMockGuardianSpaceV2('student')).toBeNull();
    expect(getMockGuardianSpaceV2('support')).toBeNull();
  });

  it('requires guardian role plus the existing report capability', () => {
    expect(canAccessGuardianSpaceV2('guardian', { canViewReports: true })).toBe(true);
    expect(canAccessGuardianSpaceV2('guardian', { canUseChat: true })).toBe(false);
    expect(canAccessGuardianSpaceV2('support', { canViewReports: true })).toBe(false);
    expect(canAccessGuardianSpaceV2('admin', { canViewReports: true })).toBe(false);
  });

  it('shows guardian navigation only to guardian', () => {
    expect(
      visibleNavIds({ canViewReports: true, canUseChat: true }, 'guardian')
    ).toContain('guardian-space');
    expect(visibleNavIds({ canSubmit: true }, 'student')).not.toContain(
      'guardian-space'
    );
    expect(visibleNavIds({ canGrade: true }, 'teacher')).not.toContain(
      'guardian-space'
    );
    expect(visibleNavIds({ canManageCourses: true }, 'admin')).not.toContain(
      'guardian-space'
    );
    expect(
      visibleNavIds({ canViewReports: true, canUseChat: true }, 'support')
    ).not.toContain('guardian-space');
  });

  it('does not expose institutional students navigation to guardian', () => {
    const guardianNavigation = visibleNavIds(
      { canViewReports: true, canUseChat: true },
      'guardian'
    );

    expect(guardianNavigation).toContain('guardian-space');
    expect(guardianNavigation).not.toContain('students');
    expect(guardianNavigation).not.toContain('my-space');
  });

  it('provides a safe empty fixture for the empty state', () => {
    expect(EMPTY_GUARDIAN_SPACE_V2.students).toEqual([]);
    expect(EMPTY_GUARDIAN_SPACE_V2.alerts).toEqual([]);
    expect(EMPTY_GUARDIAN_SPACE_V2.nextActions).toEqual([]);
  });

  it('keeps fixtures free of emails and UUID-shaped identifiers', () => {
    const guardianSpace = getMockGuardianSpaceV2('guardian');
    const serialized = JSON.stringify(guardianSpace);
    const uuidPattern =
      /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

    expect(serialized).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(serialized).not.toMatch(uuidPattern);
  });
});
