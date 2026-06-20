import { describe, expect, it } from 'vitest';

import { EMPTY_SETTINGS_V2, getMockSettingsV2 } from '@/lib/mocks/settings-v2';
import {
  getCapabilitiesForRoleKey,
  ROLE_CAPABILITIES,
} from '@/lib/rbac/capabilities';
import { navGroupsForCapabilities } from '@/lib/rbac/nav-v2';
import type { Capabilities, RoleKey } from '@/lib/types/auth';
import { canAccessSettingsV2 } from '@/lib/types/settings-v2';

function visibleNavIds(roleKey: RoleKey) {
  return navGroupsForCapabilities(getCapabilitiesForRoleKey(roleKey), roleKey)
    .flatMap((group) => group.items)
    .map((item) => item.id);
}

describe('Institution Settings V2 foundation', () => {
  it('provides settings fixtures to owner and admin', () => {
    expect(getMockSettingsV2('owner').panels.length).toBeGreaterThan(0);
    expect(getMockSettingsV2('admin').panels.length).toBeGreaterThan(0);
  });

  it('supports the empty state for excluded roles', () => {
    for (const roleKey of [
      'teacher',
      'assistant',
      'student',
      'guardian',
      'support',
    ] as const) {
      expect(getMockSettingsV2(roleKey)).toEqual(EMPTY_SETTINGS_V2);
    }
  });

  it('contains all required settings panels', () => {
    const panelIds = getMockSettingsV2('owner').panels.map((panel) => panel.id);

    expect(panelIds).toEqual([
      'institution-profile',
      'academic-config',
      'branding',
      'security',
      'roles',
      'integrations',
      'notifications',
    ]);
  });

  it('requires the settings view capability and owner/admin role scope', () => {
    expect(canAccessSettingsV2('owner', ROLE_CAPABILITIES.owner)).toBe(true);
    expect(canAccessSettingsV2('admin', ROLE_CAPABILITIES.admin)).toBe(true);

    const teacherWithCapability: Capabilities = {
      ...ROLE_CAPABILITIES.teacher,
      canViewInstitutionSettings: true,
    };
    expect(canAccessSettingsV2('teacher', teacherWithCapability)).toBe(false);
  });

  it('does not grant access through unrelated capabilities', () => {
    const substitutes: Capabilities = {
      ...ROLE_CAPABILITIES.admin,
      canViewInstitutionSettings: false,
      canManageInstitution: true,
      canManageUsers: true,
      canManageCourses: true,
      canViewReports: true,
      canGrade: true,
      canSubmit: true,
    };

    expect(canAccessSettingsV2('admin', substitutes)).toBe(false);
  });

  it('shows settings navigation only to owner and admin', () => {
    expect(visibleNavIds('owner')).toContain('settings');
    expect(visibleNavIds('admin')).toContain('settings');

    for (const roleKey of [
      'teacher',
      'assistant',
      'student',
      'guardian',
      'support',
    ] as const) {
      expect(visibleNavIds(roleKey)).not.toContain('settings');
    }
  });

  it('keeps fixtures free of identities and real integration locations', () => {
    const serialized = JSON.stringify(getMockSettingsV2('owner'));
    const uuidPattern =
      /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

    expect(serialized).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(serialized).not.toMatch(uuidPattern);
    expect(serialized).not.toMatch(/https?:\/\//i);
    expect(serialized).not.toMatch(/signed[-_ ]?url|bucket|project[-_ ]?ref/i);
    expect(serialized).not.toMatch(
      /save|upload|connect|webhook|guardar|subir|cambiar permisos|cambiar roles/i
    );
  });

  it('does not alter full institution management for admin', () => {
    expect(ROLE_CAPABILITIES.owner.canManageInstitution).toBe(true);
    expect(ROLE_CAPABILITIES.admin.canManageInstitution).toBe(false);
  });
});
