import { describe, expect, it } from 'vitest';

import {
  getMockCoursesV2,
  getMockCourseWorkspaceV2,
} from '@/lib/mocks/courses-v2';
import {
  canAccessCoursesV2,
  courseAudienceForRole,
} from '@/lib/types/courses-v2';

describe('Courses V2 foundation', () => {
  it('requires the explicit course read capability', () => {
    expect(canAccessCoursesV2({ canViewCourses: true })).toBe(true);
    expect(canAccessCoursesV2({ canManageCourses: true })).toBe(false);
    expect(canAccessCoursesV2({ canGrade: true })).toBe(false);
    expect(canAccessCoursesV2({ canSubmit: true })).toBe(false);
    expect(canAccessCoursesV2({ canViewReports: true })).toBe(false);
  });

  it('maps only supported V2 roles to a course audience', () => {
    expect(courseAudienceForRole('owner')).toBe('institution');
    expect(courseAudienceForRole('assistant')).toBe('teacher');
    expect(courseAudienceForRole('student')).toBe('student');
    expect(courseAudienceForRole('guardian')).toBeNull();
  });

  it('returns safe role-scoped mock course lists', () => {
    const institutionCourses = getMockCoursesV2('admin');
    const studentCourses = getMockCoursesV2('student');

    expect(institutionCourses.length).toBeGreaterThan(studentCourses.length);
    expect(studentCourses.length).toBeGreaterThan(0);
    expect(getMockCoursesV2('guardian')).toEqual([]);
    expect(studentCourses.every((course) => course.audiences.includes('student'))).toBe(true);
  });

  it('resolves a role-scoped workspace by safe course id', () => {
    const workspace = getMockCourseWorkspaceV2('course-algebra-10a', 'student');

    expect(workspace?.name).toBe('Álgebra I');
    expect(workspace?.workQueue.length).toBeGreaterThan(0);
    expect(workspace?.rosterPreview.length).toBeGreaterThan(0);
  });

  it('does not resolve unknown or out-of-scope course workspaces', () => {
    expect(getMockCourseWorkspaceV2('course-unknown', 'admin')).toBeNull();
    expect(getMockCourseWorkspaceV2('course-technology-8a', 'student')).toBeNull();
    expect(getMockCourseWorkspaceV2('course-algebra-10a', 'guardian')).toBeNull();
  });
});
