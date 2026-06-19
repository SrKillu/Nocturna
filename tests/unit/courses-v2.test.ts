import { describe, expect, it } from 'vitest';

import { getMockCoursesV2 } from '@/lib/mocks/courses-v2';
import {
  canAccessCoursesV2,
  courseAudienceForRole,
} from '@/lib/types/courses-v2';

describe('Courses V2 foundation', () => {
  it('allows course access for management, teaching, and student capabilities', () => {
    expect(canAccessCoursesV2({ canManageCourses: true })).toBe(true);
    expect(canAccessCoursesV2({ canGrade: true })).toBe(true);
    expect(canAccessCoursesV2({ canSubmit: true })).toBe(true);
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
});
