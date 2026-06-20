import type { Capabilities, CapabilityKey, RoleKey } from '@/lib/types/auth';
import type { UserRole } from '@/lib/types/database';

export type CapabilitySet = Readonly<Record<CapabilityKey, boolean>>;

export const CAPABILITY_KEYS = [
  'canManageInstitution',
  'canManageUsers',
  'canManageCourses',
  'canManageSections',
  'canGrade',
  'canSubmit',
  'canViewReports',
  'canManageMaterials',
  'canUseChat',
  'canManageAttendance',
  'canManageCertificates',
] as const satisfies readonly CapabilityKey[];

function buildCapabilities(enabled: readonly CapabilityKey[]): CapabilitySet {
  const enabledSet = new Set<CapabilityKey>(enabled);
  return Object.fromEntries(
    CAPABILITY_KEYS.map((capability) => [capability, enabledSet.has(capability)])
  ) as CapabilitySet;
}

export const ROLE_CAPABILITIES: Readonly<Record<RoleKey, CapabilitySet>> = {
  owner: buildCapabilities(CAPABILITY_KEYS),
  admin: buildCapabilities([
    'canManageUsers',
    'canManageCourses',
    'canManageSections',
    'canGrade',
    'canViewReports',
    'canManageMaterials',
    'canUseChat',
    'canManageAttendance',
    'canManageCertificates',
  ]),
  teacher: buildCapabilities([
    'canGrade',
    'canViewReports',
    'canManageMaterials',
    'canUseChat',
    'canManageAttendance',
  ]),
  assistant: buildCapabilities([
    'canGrade',
    'canViewReports',
    'canManageMaterials',
    'canUseChat',
    'canManageAttendance',
  ]),
  student: buildCapabilities(['canSubmit', 'canUseChat']),
  guardian: buildCapabilities(['canViewReports', 'canUseChat']),
  support: buildCapabilities(['canViewReports', 'canUseChat']),
};

/**
 * Temporary V1 -> V2 adapter for Batch B1.
 *
 * `super_admin` has no direct tenant-scoped V2 equivalent. During the legacy
 * bridge it maps to `owner` so existing admin flows keep their current access,
 * but new V2 authorization must validate the active membership from the DB.
 */
export function legacyRoleToRoleKey(role: UserRole): RoleKey {
  switch (role) {
    case 'student':
      return 'student';
    case 'teacher':
      return 'teacher';
    case 'admin':
      return 'admin';
    case 'super_admin':
      return 'owner';
    default: {
      const exhaustive: never = role;
      return exhaustive;
    }
  }
}

export function getCapabilitiesForRoleKey(roleKey: RoleKey): CapabilitySet {
  return ROLE_CAPABILITIES[roleKey];
}

export function getCapabilitiesForLegacyRole(role: UserRole): CapabilitySet {
  return getCapabilitiesForRoleKey(legacyRoleToRoleKey(role));
}

export function hasCapability(
  capabilitiesOrRoleKey: Capabilities | RoleKey,
  capability: CapabilityKey
): boolean {
  if (typeof capabilitiesOrRoleKey === 'string') {
    return getCapabilitiesForRoleKey(capabilitiesOrRoleKey)[capability];
  }
  return capabilitiesOrRoleKey[capability] === true;
}
