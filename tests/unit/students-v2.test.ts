import { describe, expect, it } from 'vitest';

import { getMockStudentsV2 } from '@/lib/mocks/students-v2';
import { navGroupsForCapabilities } from '@/lib/rbac/nav-v2';
import {
  canAccessStudentsV2,
  filterStudentsV2,
  studentAudienceForRole,
  type StudentV2FilterState,
} from '@/lib/types/students-v2';

const emptyFilters: StudentV2FilterState = {
  query: '',
  status: 'all',
  level: 'all',
  courseId: 'all',
  risk: 'all',
};

describe('Students V2 foundation', () => {
  it('allows institutional and teaching capabilities without exposing a global student view', () => {
    expect(canAccessStudentsV2({ canManageCourses: true })).toBe(true);
    expect(canAccessStudentsV2({ canGrade: true })).toBe(true);
    expect(canAccessStudentsV2({ canSubmit: true })).toBe(false);
    expect(canAccessStudentsV2({ canViewReports: true })).toBe(false);
  });

  it('maps only institutional and teaching roles to student audiences', () => {
    expect(studentAudienceForRole('owner')).toBe('institution');
    expect(studentAudienceForRole('assistant')).toBe('teacher');
    expect(studentAudienceForRole('student')).toBeNull();
    expect(studentAudienceForRole('guardian')).toBeNull();
  });

  it('returns safe role-scoped fixtures', () => {
    const institutionStudents = getMockStudentsV2('admin');
    const teacherStudents = getMockStudentsV2('teacher');

    expect(institutionStudents.length).toBeGreaterThan(teacherStudents.length);
    expect(teacherStudents.length).toBeGreaterThan(0);
    expect(getMockStudentsV2('student')).toEqual([]);
    expect(institutionStudents.every((student) => !student.name.includes('@'))).toBe(true);
    expect(institutionStudents.every((student) => student.id.startsWith('student-'))).toBe(true);
  });

  it('searches by name, code, course, or section', () => {
    const students = getMockStudentsV2('admin');

    expect(filterStudentsV2(students, { ...emptyFilters, query: 'Valeria' })).toHaveLength(1);
    expect(filterStudentsV2(students, { ...emptyFilters, query: 'EST-1078' })).toHaveLength(1);
    expect(filterStudentsV2(students, { ...emptyFilters, query: 'Ciencias' })).toHaveLength(2);
    expect(filterStudentsV2(students, { ...emptyFilters, query: '11B' })).toHaveLength(1);
  });

  it('combines status, level, course, and risk filters and supports an empty result', () => {
    const students = getMockStudentsV2('admin');
    const filtered = filterStudentsV2(students, {
      query: '',
      status: 'follow_up',
      level: 'secondary',
      courseId: 'course-algebra-10a',
      risk: 'watch',
    });

    expect(filtered.map((student) => student.code)).toEqual(['EST-1078']);
    expect(
      filterStudentsV2(students, {
        ...emptyFilters,
        query: 'nombre inexistente',
      })
    ).toEqual([]);
  });

  it('shows navigation only for the same authorized capabilities', () => {
    const managerItems = navGroupsForCapabilities({ canManageCourses: true })
      .flatMap((group) => group.items)
      .map((item) => item.id);
    const studentItems = navGroupsForCapabilities({ canSubmit: true })
      .flatMap((group) => group.items)
      .map((item) => item.id);

    expect(managerItems).toContain('students');
    expect(studentItems).not.toContain('students');
  });
});
