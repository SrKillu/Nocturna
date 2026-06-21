import { describe, expect, it } from 'vitest';

import { EMPTY_GRADEBOOK_V2, getMockGradebookV2 } from '@/lib/mocks/gradebook-v2';
import { getCapabilitiesForRoleKey } from '@/lib/rbac/capabilities';
import { navGroupsForCapabilities } from '@/lib/rbac/nav-v2';
import type { RoleKey } from '@/lib/types/auth';
import {
  canAccessGradebookV2,
  filterGradebookV2,
  gradeRangeForRecord,
  type GradebookV2FilterState,
} from '@/lib/types/gradebook-v2';

const emptyFilters: GradebookV2FilterState = {
  query: '',
  courseId: 'all',
  section: 'all',
  period: 'all',
  status: 'all',
  range: 'all',
};

function visibleNavIds(roleKey: RoleKey) {
  return navGroupsForCapabilities(getCapabilitiesForRoleKey(roleKey), roleKey)
    .flatMap((group) => group.items)
    .map((item) => item.id);
}

describe('Gradebook V2 foundation', () => {
  it('provides role-scoped fixtures for institutional and teaching roles', () => {
    expect(getMockGradebookV2('owner').records.length).toBeGreaterThan(0);
    expect(getMockGradebookV2('admin').records.length).toBeGreaterThan(0);
    expect(getMockGradebookV2('teacher').records.length).toBeGreaterThan(0);
    expect(getMockGradebookV2('assistant').records.length).toBeGreaterThan(0);
    expect(getMockGradebookV2('admin').records.length).toBeGreaterThan(
      getMockGradebookV2('teacher').records.length
    );
  });

  it('requires canViewGradebook without granting access through grading', () => {
    expect(canAccessGradebookV2({ canViewGradebook: true })).toBe(true);
    expect(canAccessGradebookV2({ canGrade: true })).toBe(false);
    expect(canAccessGradebookV2({ canManageCourses: true })).toBe(false);
    expect(canAccessGradebookV2({ canSubmit: true })).toBe(false);
    expect(canAccessGradebookV2({ canViewReports: true })).toBe(false);
  });

  it('searches and combines course, section, period, status, and grade range filters', () => {
    const records = getMockGradebookV2('admin').records;

    expect(filterGradebookV2(records, { ...emptyFilters, query: 'EST-1078' })).toHaveLength(1);
    expect(filterGradebookV2(records, { ...emptyFilters, query: 'Ciencias' })).toHaveLength(2);
    expect(
      filterGradebookV2(records, {
        query: '',
        courseId: 'course-algebra-10a',
        section: '10A',
        period: 'current',
        status: 'risk',
        range: 'low',
      }).map((record) => record.studentCode)
    ).toEqual(['EST-1078']);
  });

  it('supports empty fixtures and empty filtered results', () => {
    expect(EMPTY_GRADEBOOK_V2.records).toEqual([]);
    expect(EMPTY_GRADEBOOK_V2.distribution).toEqual([]);
    expect(
      filterGradebookV2(getMockGradebookV2('admin').records, {
        ...emptyFilters,
        query: 'estudiante inexistente',
      })
    ).toEqual([]);
  });

  it('shows gradebook navigation only to roles with canGrade', () => {
    expect(visibleNavIds('owner')).toContain('gradebook');
    expect(visibleNavIds('admin')).toContain('gradebook');
    expect(visibleNavIds('teacher')).toContain('gradebook');
    expect(visibleNavIds('assistant')).toContain('gradebook');
    expect(visibleNavIds('student')).not.toContain('gradebook');
    expect(visibleNavIds('guardian')).not.toContain('gradebook');
    expect(visibleNavIds('support')).not.toContain('gradebook');
  });

  it('does not provide institutional fixtures to student, guardian, or support', () => {
    expect(getMockGradebookV2('student')).toEqual(EMPTY_GRADEBOOK_V2);
    expect(getMockGradebookV2('guardian')).toEqual(EMPTY_GRADEBOOK_V2);
    expect(getMockGradebookV2('support')).toEqual(EMPTY_GRADEBOOK_V2);
  });

  it('marks calculations as mock and derives non-official ranges', () => {
    const gradebook = getMockGradebookV2('admin');

    expect(gradebook.calculationLabel.toLocaleLowerCase('es')).toContain('no oficiales');
    expect(gradeRangeForRecord({ averageGrade: 94 })).toBe('high');
    expect(gradeRangeForRecord({ averageGrade: 68 })).toBe('low');
    expect(gradeRangeForRecord({ averageGrade: null })).toBe('ungraded');
  });

  it('keeps fixtures free of identities and persistence actions', () => {
    const serialized = JSON.stringify(getMockGradebookV2('admin'));
    const uuidPattern =
      /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

    expect(serialized).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(serialized).not.toMatch(uuidPattern);
    expect(serialized).not.toMatch(/guardar|persistir|certificado/i);
  });
});
