import type { Capabilities, RoleKey } from '@/lib/types/auth';

export type LibraryV2Audience = 'institution' | 'teacher';
export type LibraryV2ResourceType =
  | 'digital-book'
  | 'study-guide'
  | 'supplemental-reading'
  | 'external-video'
  | 'practice'
  | 'institutional-reference';
export type LibraryV2Availability = 'available' | 'reference' | 'featured';
export type LibraryV2Level = 'primary' | 'secondary' | 'general';
export type LibraryV2Period = 'current' | 'recent' | 'previous';

export interface LibraryV2Resource {
  id: string;
  title: string;
  collectionId: string;
  collectionName: string;
  type: LibraryV2ResourceType;
  courseId: string | null;
  courseName: string;
  level: LibraryV2Level;
  levelLabel: string;
  availability: LibraryV2Availability;
  updatedLabel: string;
  nextAction: string;
  period: LibraryV2Period;
  featured: boolean;
  audiences: readonly LibraryV2Audience[];
}

export interface LibraryV2Collection {
  id: string;
  name: string;
  description: string;
  resourceCount: number;
}

export interface LibraryV2Summary {
  availableResources: number;
  activeCollections: number;
  featuredResources: number;
  lastUpdateLabel: string;
}

export interface LibraryV2Fixture {
  summary: LibraryV2Summary;
  resources: readonly LibraryV2Resource[];
  collections: readonly LibraryV2Collection[];
  featured: readonly LibraryV2Resource[];
}

export interface LibraryV2FilterState {
  query: string;
  collectionId: string | 'all';
  type: LibraryV2ResourceType | 'all';
  courseId: string | 'all';
  level: LibraryV2Level | 'all';
  availability: LibraryV2Availability | 'all';
  period: LibraryV2Period | 'all';
}

const LIBRARY_V2_ROLES: readonly RoleKey[] = [
  'owner',
  'admin',
  'teacher',
  'assistant',
];

export function canAccessLibraryV2(
  roleKey: RoleKey,
  capabilities: Capabilities
): boolean {
  return (
    LIBRARY_V2_ROLES.includes(roleKey) &&
    capabilities.canManageMaterials === true
  );
}

export function libraryAudienceForRole(
  roleKey: RoleKey
): LibraryV2Audience | null {
  if (roleKey === 'owner' || roleKey === 'admin') return 'institution';
  if (roleKey === 'teacher' || roleKey === 'assistant') return 'teacher';
  return null;
}

export function filterLibraryV2(
  resources: readonly LibraryV2Resource[],
  filters: LibraryV2FilterState
): readonly LibraryV2Resource[] {
  const query = filters.query.trim().toLocaleLowerCase('es');

  return resources.filter((resource) => {
    const matchesQuery =
      query.length === 0 ||
      [
        resource.title,
        resource.collectionName,
        resource.courseName,
        resource.levelLabel,
      ].some((value) => value.toLocaleLowerCase('es').includes(query));

    return (
      matchesQuery &&
      (filters.collectionId === 'all' ||
        resource.collectionId === filters.collectionId) &&
      (filters.type === 'all' || resource.type === filters.type) &&
      (filters.courseId === 'all' || resource.courseId === filters.courseId) &&
      (filters.level === 'all' || resource.level === filters.level) &&
      (filters.availability === 'all' ||
        resource.availability === filters.availability) &&
      (filters.period === 'all' || resource.period === filters.period)
    );
  });
}
