import { describe, expect, it } from 'vitest';

import { getMockMySpaceV2 } from '@/lib/mocks/my-space-v2';
import { navGroupsForCapabilities } from '@/lib/rbac/nav-v2';
import { canAccessMySpaceV2 } from '@/lib/types/my-space-v2';

function visibleNavIds(
  capabilities: Parameters<typeof navGroupsForCapabilities>[0],
  roleKey: Parameters<typeof navGroupsForCapabilities>[1]
) {
  return navGroupsForCapabilities(capabilities, roleKey)
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

  it('requires the explicit self-profile capability and student role', () => {
    expect(canAccessMySpaceV2('student', { canViewOwnStudentProfile: true })).toBe(true);
    expect(canAccessMySpaceV2('teacher', { canViewOwnStudentProfile: true })).toBe(false);
    expect(canAccessMySpaceV2('student', { canSubmit: true })).toBe(false);
    expect(canAccessMySpaceV2('student', { canManageCourses: true })).toBe(false);
    expect(canAccessMySpaceV2('student', { canGrade: true })).toBe(false);
  });

  it('shows Mi espacio only to the student-oriented capability set', () => {
    expect(visibleNavIds({ canViewOwnStudentProfile: true }, 'student')).toContain('my-space');
    expect(visibleNavIds({ canViewOwnStudentProfile: true }, 'teacher')).not.toContain('my-space');
    expect(visibleNavIds({ canSubmit: true }, 'student')).not.toContain('my-space');
    expect(visibleNavIds({ canManageCourses: true }, 'student')).not.toContain('my-space');
    expect(visibleNavIds({ canGrade: true }, 'student')).not.toContain('my-space');
    expect(
      visibleNavIds({
        canViewOwnStudentProfile: true,
        canManageInstitution: true,
        canManageCourses: true,
        canGrade: true,
      }, 'student')
    ).toContain('my-space');
  });

  it('does not expose the global students navigation to self-profile memberships', () => {
    const studentNavigation = visibleNavIds({
      canViewOwnStudentProfile: true,
      canViewCourses: true,
    }, 'student');

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
