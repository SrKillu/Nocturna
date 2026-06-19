import { describe, expect, it } from 'vitest';

import { getMockMySpaceV2 } from '@/lib/mocks/my-space-v2';
import { navGroupsForCapabilities } from '@/lib/rbac/nav-v2';
import { canAccessMySpaceV2 } from '@/lib/types/my-space-v2';

function visibleNavIds(capabilities: Parameters<typeof navGroupsForCapabilities>[0]) {
  return navGroupsForCapabilities(capabilities)
    .flatMap((group) => group.items)
    .map((item) => item.id);
}

describe('Student Self View V2 foundation', () => {
  it('provides a safe academic fixture for the student role', () => {
    const mySpace = getMockMySpaceV2('student');

    expect(mySpace).not.toBeNull();
    expect(mySpace?.courses.length).toBeGreaterThan(0);
    expect(mySpace?.nextActions.length).toBeGreaterThan(0);
    expect(mySpace?.feedback.length).toBeGreaterThan(0);
  });

  it('returns an empty state source for roles without student self data', () => {
    expect(getMockMySpaceV2('teacher')).toBeNull();
    expect(getMockMySpaceV2('guardian')).toBeNull();
    expect(getMockMySpaceV2('support')).toBeNull();
  });

  it('uses canSubmit for student self access while excluding institutional capabilities', () => {
    expect(canAccessMySpaceV2({ canSubmit: true })).toBe(true);
    expect(canAccessMySpaceV2({ canSubmit: true, canManageCourses: true })).toBe(false);
    expect(canAccessMySpaceV2({ canSubmit: true, canGrade: true })).toBe(false);
    expect(canAccessMySpaceV2({ canViewReports: true })).toBe(false);
  });

  it('shows Mi espacio only to the student-oriented capability set', () => {
    expect(visibleNavIds({ canSubmit: true })).toContain('my-space');
    expect(visibleNavIds({ canManageCourses: true })).not.toContain('my-space');
    expect(visibleNavIds({ canGrade: true })).not.toContain('my-space');
    expect(
      visibleNavIds({
        canSubmit: true,
        canManageInstitution: true,
        canManageCourses: true,
        canGrade: true,
      })
    ).not.toContain('my-space');
  });

  it('does not expose the global students navigation to canSubmit-only memberships', () => {
    const studentNavigation = visibleNavIds({ canSubmit: true });

    expect(studentNavigation).toContain('my-space');
    expect(studentNavigation).toContain('courses');
    expect(studentNavigation).not.toContain('students');
  });

  it('keeps fixtures free of emails and UUID-shaped identifiers', () => {
    const mySpace = getMockMySpaceV2('student');
    const serialized = JSON.stringify(mySpace);
    const uuidPattern =
      /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

    expect(serialized).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(serialized).not.toMatch(uuidPattern);
  });
});
