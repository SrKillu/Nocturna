import { describe, expect, it } from 'vitest';

import {
  CAPABILITY_KEYS,
  getCapabilitiesForRoleKey,
} from '@/lib/rbac/capabilities';
import type { CapabilityKey, RoleKey } from '@/lib/types/auth';

const ROLE_KEYS: readonly RoleKey[] = [
  'owner',
  'admin',
  'teacher',
  'assistant',
  'student',
  'guardian',
  'support',
];

function expectCapabilityMatrix(
  capability: CapabilityKey,
  allowedRoles: readonly RoleKey[]
) {
  for (const roleKey of ROLE_KEYS) {
    expect(getCapabilitiesForRoleKey(roleKey)[capability]).toBe(
      allowedRoles.includes(roleKey)
    );
  }
}

describe('V2 capability matrix', () => {
  it('registers the explicit route-purpose capabilities', () => {
    expect(CAPABILITY_KEYS).toEqual(
      expect.arrayContaining([
        'canViewAuditLog',
        'canViewSchedule',
        'canAccessLibrary',
        'canViewLinkedStudents',
        'canViewNotifications',
      ])
    );
  });

  it('grants each route-purpose capability to the approved roles only', () => {
    expectCapabilityMatrix('canViewAuditLog', ['owner', 'admin']);
    expectCapabilityMatrix('canViewSchedule', [
      'owner',
      'admin',
      'teacher',
      'assistant',
    ]);
    expectCapabilityMatrix('canAccessLibrary', [
      'owner',
      'admin',
      'teacher',
      'assistant',
    ]);
    expectCapabilityMatrix('canViewLinkedStudents', ['guardian']);
    expectCapabilityMatrix('canViewNotifications', ROLE_KEYS);
  });

  it('keeps the existing capability assignments unchanged', () => {
    expectCapabilityMatrix('canManageInstitution', ['owner']);
    expectCapabilityMatrix('canViewInstitutionSettings', ['owner', 'admin']);
    expectCapabilityMatrix('canManageAttendance', [
      'owner',
      'admin',
      'teacher',
      'assistant',
    ]);
    expectCapabilityMatrix('canManageMaterials', [
      'owner',
      'admin',
      'teacher',
      'assistant',
    ]);
    expectCapabilityMatrix('canViewReports', [
      'owner',
      'admin',
      'teacher',
      'assistant',
      'guardian',
      'support',
    ]);
  });
});
