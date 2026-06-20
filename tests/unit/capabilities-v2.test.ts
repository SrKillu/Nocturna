import { describe, expect, it } from 'vitest';

import {
  CAPABILITY_KEYS,
  getCapabilitiesForRoleKey,
} from '@/lib/rbac/capabilities';
import type { RoleKey } from '@/lib/types/auth';

describe('V2 capability matrix', () => {
  it('registers the settings view capability', () => {
    expect(CAPABILITY_KEYS).toContain('canViewInstitutionSettings');
  });

  it('grants settings view access only to owner and admin', () => {
    const expectedByRole: Readonly<Record<RoleKey, boolean>> = {
      owner: true,
      admin: true,
      teacher: false,
      assistant: false,
      student: false,
      guardian: false,
      support: false,
    };

    for (const [roleKey, expected] of Object.entries(expectedByRole)) {
      expect(
        getCapabilitiesForRoleKey(roleKey as RoleKey)
          .canViewInstitutionSettings
      ).toBe(expected);
    }
  });

  it('keeps institution management restricted to owner', () => {
    expect(getCapabilitiesForRoleKey('owner').canManageInstitution).toBe(true);
    expect(getCapabilitiesForRoleKey('admin').canManageInstitution).toBe(false);

    for (const roleKey of [
      'teacher',
      'assistant',
      'student',
      'guardian',
      'support',
    ] as const) {
      expect(getCapabilitiesForRoleKey(roleKey).canManageInstitution).toBe(
        false
      );
    }
  });
});
