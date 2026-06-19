import { describe, expect, it } from 'vitest';

import {
  EMPTY_EVALUATIONS_V2,
  getMockEvaluationsV2,
} from '@/lib/mocks/evaluations-v2';
import { getCapabilitiesForRoleKey } from '@/lib/rbac/capabilities';
import { navGroupsForCapabilities } from '@/lib/rbac/nav-v2';
import type { RoleKey } from '@/lib/types/auth';
import {
  canAccessEvaluationsV2,
  filterEvaluationsV2,
  type EvaluationV2FilterState,
} from '@/lib/types/evaluations-v2';

const emptyFilters: EvaluationV2FilterState = {
  query: '',
  courseId: 'all',
  section: 'all',
  type: 'all',
  status: 'all',
  period: 'all',
};

function visibleNavIds(roleKey: RoleKey) {
  return navGroupsForCapabilities(getCapabilitiesForRoleKey(roleKey), roleKey)
    .flatMap((group) => group.items)
    .map((item) => item.id);
}

describe('Evaluations V2 foundation', () => {
  it('provides role-scoped fixtures for institutional and teaching roles', () => {
    expect(getMockEvaluationsV2('owner').evaluations.length).toBeGreaterThan(0);
    expect(getMockEvaluationsV2('admin').evaluations.length).toBeGreaterThan(0);
    expect(getMockEvaluationsV2('teacher').evaluations.length).toBeGreaterThan(0);
    expect(getMockEvaluationsV2('assistant').evaluations.length).toBeGreaterThan(0);
    expect(getMockEvaluationsV2('admin').evaluations.length).toBeGreaterThan(
      getMockEvaluationsV2('teacher').evaluations.length
    );
  });

  it('requires canGrade without granting access through unrelated capabilities', () => {
    expect(canAccessEvaluationsV2({ canGrade: true })).toBe(true);
    expect(canAccessEvaluationsV2({ canManageCourses: true })).toBe(false);
    expect(canAccessEvaluationsV2({ canSubmit: true })).toBe(false);
    expect(canAccessEvaluationsV2({ canViewReports: true })).toBe(false);
  });

  it('searches and combines course, section, type, status, and period filters', () => {
    const evaluations = getMockEvaluationsV2('admin').evaluations;

    expect(
      filterEvaluationsV2(evaluations, { ...emptyFilters, query: 'Ecuaciones' })
    ).toHaveLength(1);
    expect(
      filterEvaluationsV2(evaluations, { ...emptyFilters, query: 'Ciencias' })
    ).toHaveLength(1);
    expect(
      filterEvaluationsV2(evaluations, {
        query: '',
        courseId: 'course-algebra-10a',
        section: '10A',
        type: 'quiz',
        status: 'review',
        period: 'current',
      }).map((evaluation) => evaluation.id)
    ).toEqual(['evaluation-algebra-equations']);
  });

  it('supports empty fixtures and empty filtered results', () => {
    expect(EMPTY_EVALUATIONS_V2.evaluations).toEqual([]);
    expect(EMPTY_EVALUATIONS_V2.deadlines).toEqual([]);
    expect(
      filterEvaluationsV2(getMockEvaluationsV2('admin').evaluations, {
        ...emptyFilters,
        query: 'evaluación inexistente',
      })
    ).toEqual([]);
  });

  it('shows evaluations navigation only to owner, admin, teacher, and assistant', () => {
    expect(visibleNavIds('owner')).toContain('evaluations');
    expect(visibleNavIds('admin')).toContain('evaluations');
    expect(visibleNavIds('teacher')).toContain('evaluations');
    expect(visibleNavIds('assistant')).toContain('evaluations');
    expect(visibleNavIds('student')).not.toContain('evaluations');
    expect(visibleNavIds('guardian')).not.toContain('evaluations');
    expect(visibleNavIds('support')).not.toContain('evaluations');
  });

  it('does not provide institutional fixtures to student, guardian, or support', () => {
    expect(getMockEvaluationsV2('student')).toEqual(EMPTY_EVALUATIONS_V2);
    expect(getMockEvaluationsV2('guardian')).toEqual(EMPTY_EVALUATIONS_V2);
    expect(getMockEvaluationsV2('support')).toEqual(EMPTY_EVALUATIONS_V2);
  });

  it('keeps fixtures free of emails and UUID-shaped identifiers', () => {
    const serialized = JSON.stringify(getMockEvaluationsV2('admin'));
    const uuidPattern =
      /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

    expect(serialized).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(serialized).not.toMatch(uuidPattern);
  });
});
