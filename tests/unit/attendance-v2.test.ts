import { describe, expect, it } from 'vitest';

import {
  EMPTY_ATTENDANCE_V2,
  getMockAttendanceV2,
} from '@/lib/mocks/attendance-v2';
import { navGroupsForCapabilities } from '@/lib/rbac/nav-v2';
import {
  canAccessAttendanceV2,
  filterAttendanceV2,
  type AttendanceV2FilterState,
} from '@/lib/types/attendance-v2';
import { getCapabilitiesForRoleKey } from '@/lib/rbac/capabilities';
import type { RoleKey } from '@/lib/types/auth';

const emptyFilters: AttendanceV2FilterState = {
  query: '',
  courseId: 'all',
  section: 'all',
  period: 'all',
  status: 'all',
};

function visibleNavIds(roleKey: RoleKey) {
  return navGroupsForCapabilities(getCapabilitiesForRoleKey(roleKey), roleKey)
    .flatMap((group) => group.items)
    .map((item) => item.id);
}

describe('Attendance V2 foundation', () => {
  it('provides role-scoped fixtures for institutional and teaching roles', () => {
    expect(getMockAttendanceV2('owner').records.length).toBeGreaterThan(0);
    expect(getMockAttendanceV2('admin').records.length).toBeGreaterThan(0);
    expect(getMockAttendanceV2('teacher').records.length).toBeGreaterThan(0);
    expect(getMockAttendanceV2('assistant').records.length).toBeGreaterThan(0);
    expect(getMockAttendanceV2('admin').records.length).toBeGreaterThan(
      getMockAttendanceV2('teacher').records.length
    );
  });

  it('requires canViewAttendance without granting access through write capabilities', () => {
    expect(canAccessAttendanceV2({ canViewAttendance: true })).toBe(true);
    expect(canAccessAttendanceV2({ canManageAttendance: true })).toBe(false);
    expect(canAccessAttendanceV2({ canManageCourses: true })).toBe(false);
    expect(canAccessAttendanceV2({ canGrade: true })).toBe(false);
    expect(canAccessAttendanceV2({ canSubmit: true })).toBe(false);
    expect(canAccessAttendanceV2({ canViewReports: true })).toBe(false);
  });

  it('searches and combines course, section, period, and status filters', () => {
    const records = getMockAttendanceV2('admin').records;

    expect(filterAttendanceV2(records, { ...emptyFilters, query: 'EST-1078' })).toHaveLength(1);
    expect(filterAttendanceV2(records, { ...emptyFilters, query: 'Ciencias' })).toHaveLength(2);
    expect(
      filterAttendanceV2(records, {
        query: '',
        courseId: 'course-algebra-10a',
        section: '10A',
        period: 'today',
        status: 'late',
      }).map((record) => record.studentCode)
    ).toEqual(['EST-1078']);
  });

  it('supports empty fixtures and empty filtered results', () => {
    expect(EMPTY_ATTENDANCE_V2.records).toEqual([]);
    expect(EMPTY_ATTENDANCE_V2.sessions).toEqual([]);
    expect(
      filterAttendanceV2(getMockAttendanceV2('admin').records, {
        ...emptyFilters,
        query: 'estudiante inexistente',
      })
    ).toEqual([]);
  });

  it('shows attendance navigation only to owner, admin, teacher, and assistant', () => {
    expect(visibleNavIds('owner')).toContain('attendance');
    expect(visibleNavIds('admin')).toContain('attendance');
    expect(visibleNavIds('teacher')).toContain('attendance');
    expect(visibleNavIds('assistant')).toContain('attendance');
    expect(visibleNavIds('student')).not.toContain('attendance');
    expect(visibleNavIds('guardian')).not.toContain('attendance');
    expect(visibleNavIds('support')).not.toContain('attendance');
  });

  it('does not provide institutional fixtures to student, guardian, or support', () => {
    expect(getMockAttendanceV2('student')).toEqual(EMPTY_ATTENDANCE_V2);
    expect(getMockAttendanceV2('guardian')).toEqual(EMPTY_ATTENDANCE_V2);
    expect(getMockAttendanceV2('support')).toEqual(EMPTY_ATTENDANCE_V2);
  });

  it('keeps fixtures free of emails and UUID-shaped identifiers', () => {
    const serialized = JSON.stringify(getMockAttendanceV2('admin'));
    const uuidPattern =
      /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

    expect(serialized).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(serialized).not.toMatch(uuidPattern);
  });
});
