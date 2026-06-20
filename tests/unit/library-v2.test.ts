import { describe, expect, it } from 'vitest';

import { EMPTY_LIBRARY_V2, getMockLibraryV2 } from '@/lib/mocks/library-v2';
import {
  getCapabilitiesForRoleKey,
  ROLE_CAPABILITIES,
} from '@/lib/rbac/capabilities';
import { navGroupsForCapabilities } from '@/lib/rbac/nav-v2';
import type { Capabilities, RoleKey } from '@/lib/types/auth';
import {
  canAccessLibraryV2,
  filterLibraryV2,
  type LibraryV2FilterState,
} from '@/lib/types/library-v2';

const emptyFilters: LibraryV2FilterState = {
  query: '',
  collectionId: 'all',
  type: 'all',
  courseId: 'all',
  level: 'all',
  availability: 'all',
  period: 'all',
};

function visibleNavIds(roleKey: RoleKey) {
  return navGroupsForCapabilities(getCapabilitiesForRoleKey(roleKey), roleKey)
    .flatMap((group) => group.items)
    .map((item) => item.id);
}

describe('Library V2 foundation', () => {
  it('provides fixtures for institutional and teaching roles', () => {
    for (const role of ['owner', 'admin', 'teacher', 'assistant'] as const) {
      expect(getMockLibraryV2(role).resources.length).toBeGreaterThan(0);
    }
    expect(getMockLibraryV2('admin').resources.length).toBeGreaterThan(
      getMockLibraryV2('teacher').resources.length
    );
  });

  it('requires canAccessLibrary and an allowed role', () => {
    expect(canAccessLibraryV2('owner', ROLE_CAPABILITIES.owner)).toBe(true);
    expect(canAccessLibraryV2('teacher', ROLE_CAPABILITIES.teacher)).toBe(true);

    const studentWithMaterials: Capabilities = {
      ...ROLE_CAPABILITIES.student,
      canAccessLibrary: true,
    };
    expect(canAccessLibraryV2('student', studentWithMaterials)).toBe(false);
  });

  it('does not grant access through unrelated capabilities', () => {
    const substitutes: Capabilities = {
      ...ROLE_CAPABILITIES.student,
      canSubmit: true,
      canViewReports: true,
      canGrade: true,
      canManageMaterials: true,
      canAccessLibrary: false,
    };

    expect(canAccessLibraryV2('teacher', substitutes)).toBe(false);
  });

  it('searches and combines library filters', () => {
    const resources = getMockLibraryV2('admin').resources;

    expect(
      filterLibraryV2(resources, { ...emptyFilters, query: 'álgebra' })
    ).toHaveLength(1);
    expect(
      filterLibraryV2(resources, {
        query: '',
        collectionId: 'collection-core-learning',
        type: 'digital-book',
        courseId: 'course-algebra-10a',
        level: 'secondary',
        availability: 'featured',
        period: 'current',
      }).map((resource) => resource.id)
    ).toEqual(['library-algebra-foundations']);
  });

  it('supports empty fixtures and empty filtered results', () => {
    expect(EMPTY_LIBRARY_V2.resources).toEqual([]);
    expect(EMPTY_LIBRARY_V2.collections).toEqual([]);
    expect(
      filterLibraryV2(getMockLibraryV2('admin').resources, {
        ...emptyFilters,
        query: 'recurso inexistente',
      })
    ).toEqual([]);
  });

  it('shows library navigation only to approved roles', () => {
    for (const role of ['owner', 'admin', 'teacher', 'assistant'] as const) {
      expect(visibleNavIds(role)).toContain('library');
    }
    for (const role of ['student', 'guardian', 'support'] as const) {
      expect(visibleNavIds(role)).not.toContain('library');
    }
  });

  it('does not provide institutional fixtures to excluded roles', () => {
    expect(getMockLibraryV2('student')).toEqual(EMPTY_LIBRARY_V2);
    expect(getMockLibraryV2('guardian')).toEqual(EMPTY_LIBRARY_V2);
    expect(getMockLibraryV2('support')).toEqual(EMPTY_LIBRARY_V2);
  });

  it('keeps fixtures free of identities and real file locations', () => {
    const serialized = JSON.stringify(getMockLibraryV2('admin'));
    const uuidPattern =
      /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

    expect(serialized).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(serialized).not.toMatch(uuidPattern);
    expect(serialized).not.toMatch(/https?:\/\//i);
    expect(serialized).not.toMatch(/storage|bucket|signed[-_ ]?url/i);
    expect(serialized).not.toMatch(
      /upload|download|delete|publish|save|subir|descargar|borrar|publicar|guardar/i
    );
  });
});
