import type { Capabilities, CapabilityKey, RoleKey } from '@/lib/types/auth';

export type MaterialV2Audience = 'institution' | 'teacher';
export type MaterialV2Type = 'document' | 'slides' | 'video' | 'link';
export type MaterialV2Visibility = 'course' | 'staff' | 'draft';
export type MaterialV2Status = 'published' | 'pending' | 'archived';
export type MaterialV2Period = 'current' | 'recent' | 'previous';

export interface MaterialV2ListItem {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  sectionLabel: string;
  type: MaterialV2Type;
  visibility: MaterialV2Visibility;
  status: MaterialV2Status;
  updatedLabel: string;
  period: MaterialV2Period;
  nextAction: string;
  audiences: readonly MaterialV2Audience[];
}

export interface MaterialsV2Summary {
  publishedMaterials: number;
  pendingMaterials: number;
  coursesWithRecentMaterials: number;
  lastUpdateLabel: string;
}

export interface MaterialsV2Fixture {
  summary: MaterialsV2Summary;
  materials: readonly MaterialV2ListItem[];
  recent: readonly MaterialV2ListItem[];
}

export interface MaterialV2FilterState {
  query: string;
  courseId: string | 'all';
  section: string | 'all';
  type: MaterialV2Type | 'all';
  visibility: MaterialV2Visibility | 'all';
  period: MaterialV2Period | 'all';
}

export const MATERIALS_V2_CAPABILITIES = [
  'canManageMaterials',
] as const satisfies readonly CapabilityKey[];

export function canAccessMaterialsV2(capabilities: Capabilities): boolean {
  return capabilities.canManageMaterials === true;
}

export function materialAudienceForRole(roleKey: RoleKey): MaterialV2Audience | null {
  if (roleKey === 'owner' || roleKey === 'admin') return 'institution';
  if (roleKey === 'teacher' || roleKey === 'assistant') return 'teacher';
  return null;
}

export function filterMaterialsV2(
  materials: readonly MaterialV2ListItem[],
  filters: MaterialV2FilterState
): readonly MaterialV2ListItem[] {
  const query = filters.query.trim().toLocaleLowerCase('es');

  return materials.filter((material) => {
    const matchesQuery =
      query.length === 0 ||
      [material.title, material.courseName, material.sectionLabel].some((value) =>
        value.toLocaleLowerCase('es').includes(query)
      );

    return (
      matchesQuery &&
      (filters.courseId === 'all' || material.courseId === filters.courseId) &&
      (filters.section === 'all' || material.sectionLabel === filters.section) &&
      (filters.type === 'all' || material.type === filters.type) &&
      (filters.visibility === 'all' || material.visibility === filters.visibility) &&
      (filters.period === 'all' || material.period === filters.period)
    );
  });
}
