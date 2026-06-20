import { describe, expect, it } from 'vitest';

import { EMPTY_MATERIALS_V2, getMockMaterialsV2 } from '@/lib/mocks/materials-v2';
import { getCapabilitiesForRoleKey } from '@/lib/rbac/capabilities';
import { navGroupsForCapabilities } from '@/lib/rbac/nav-v2';
import type { RoleKey } from '@/lib/types/auth';
import {
  canAccessMaterialsV2,
  filterMaterialsV2,
  type MaterialV2FilterState,
} from '@/lib/types/materials-v2';

const emptyFilters: MaterialV2FilterState = {
  query: '',
  courseId: 'all',
  section: 'all',
  type: 'all',
  visibility: 'all',
  period: 'all',
};

function visibleNavIds(roleKey: RoleKey) {
  return navGroupsForCapabilities(getCapabilitiesForRoleKey(roleKey), roleKey)
    .flatMap((group) => group.items)
    .map((item) => item.id);
}

describe('Materials V2 foundation', () => {
  it('provides role-scoped fixtures for institutional and teaching roles', () => {
    expect(getMockMaterialsV2('owner').materials.length).toBeGreaterThan(0);
    expect(getMockMaterialsV2('admin').materials.length).toBeGreaterThan(0);
    expect(getMockMaterialsV2('teacher').materials.length).toBeGreaterThan(0);
    expect(getMockMaterialsV2('assistant').materials.length).toBeGreaterThan(0);
    expect(getMockMaterialsV2('admin').materials.length).toBeGreaterThan(
      getMockMaterialsV2('teacher').materials.length
    );
  });

  it('requires canManageMaterials without granting access through unrelated capabilities', () => {
    expect(canAccessMaterialsV2({ canManageMaterials: true })).toBe(true);
    expect(canAccessMaterialsV2({ canManageCourses: true })).toBe(false);
    expect(canAccessMaterialsV2({ canGrade: true })).toBe(false);
    expect(canAccessMaterialsV2({ canSubmit: true })).toBe(false);
    expect(canAccessMaterialsV2({ canViewReports: true })).toBe(false);
  });

  it('searches and combines course, section, type, visibility, and period filters', () => {
    const materials = getMockMaterialsV2('admin').materials;

    expect(
      filterMaterialsV2(materials, { ...emptyFilters, query: 'ecuaciones' })
    ).toHaveLength(1);
    expect(
      filterMaterialsV2(materials, { ...emptyFilters, query: 'Ciencias' })
    ).toHaveLength(1);
    expect(
      filterMaterialsV2(materials, {
        query: '',
        courseId: 'course-algebra-10a',
        section: '10A',
        type: 'document',
        visibility: 'course',
        period: 'current',
      }).map((material) => material.id)
    ).toEqual(['material-algebra-equations-guide']);
  });

  it('supports empty fixtures and empty filtered results', () => {
    expect(EMPTY_MATERIALS_V2.materials).toEqual([]);
    expect(EMPTY_MATERIALS_V2.recent).toEqual([]);
    expect(
      filterMaterialsV2(getMockMaterialsV2('admin').materials, {
        ...emptyFilters,
        query: 'material inexistente',
      })
    ).toEqual([]);
  });

  it('shows materials navigation only to owner, admin, teacher, and assistant', () => {
    expect(visibleNavIds('owner')).toContain('materials');
    expect(visibleNavIds('admin')).toContain('materials');
    expect(visibleNavIds('teacher')).toContain('materials');
    expect(visibleNavIds('assistant')).toContain('materials');
    expect(visibleNavIds('student')).not.toContain('materials');
    expect(visibleNavIds('guardian')).not.toContain('materials');
    expect(visibleNavIds('support')).not.toContain('materials');
  });

  it('does not provide institutional fixtures to student, guardian, or support', () => {
    expect(getMockMaterialsV2('student')).toEqual(EMPTY_MATERIALS_V2);
    expect(getMockMaterialsV2('guardian')).toEqual(EMPTY_MATERIALS_V2);
    expect(getMockMaterialsV2('support')).toEqual(EMPTY_MATERIALS_V2);
  });

  it('keeps fixtures free of identities, storage URLs, and bucket paths', () => {
    const serialized = JSON.stringify(getMockMaterialsV2('admin'));
    const uuidPattern =
      /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

    expect(serialized).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(serialized).not.toMatch(uuidPattern);
    expect(serialized).not.toMatch(/https?:\/\//i);
    expect(serialized).not.toMatch(/storage|bucket|signed[-_ ]?url/i);
  });
});
