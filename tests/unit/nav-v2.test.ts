import { describe, expect, it } from 'vitest';

import {
  getCapabilitiesForRoleKey,
  ROLE_CAPABILITIES,
} from '@/lib/rbac/capabilities';
import { navGroupsForCapabilities } from '@/lib/rbac/nav-v2';
import type { Capabilities, RoleKey } from '@/lib/types/auth';

const ROLE_KEYS: readonly RoleKey[] = [
  'owner',
  'admin',
  'teacher',
  'assistant',
  'student',
  'guardian',
  'support',
];

function navIds(capabilities: Capabilities, roleKey?: RoleKey) {
  return navGroupsForCapabilities(capabilities, roleKey)
    .flatMap((group) => group.items)
    .map((item) => item.id);
}

function expectVisibleForRoles(
  itemId: string,
  allowedRoles: readonly RoleKey[]
) {
  for (const roleKey of ROLE_KEYS) {
    expect(navIds(getCapabilitiesForRoleKey(roleKey), roleKey)).toEqual(
      allowedRoles.includes(roleKey)
        ? expect.arrayContaining([itemId])
        : expect.not.arrayContaining([itemId])
    );
  }
}

describe('V2 navigation capability contracts', () => {
  it('keeps the effective module visibility matrix unchanged', () => {
    expectVisibleForRoles('courses', [
      'owner',
      'admin',
      'teacher',
      'assistant',
      'student',
    ]);
    expectVisibleForRoles('students', [
      'owner',
      'admin',
      'teacher',
      'assistant',
    ]);
    expectVisibleForRoles('enrollments', ['owner', 'admin']);
    expectVisibleForRoles('staff', ['owner', 'admin']);
    expectVisibleForRoles('attendance', [
      'owner',
      'admin',
      'teacher',
      'assistant',
    ]);
    expectVisibleForRoles('evaluations', [
      'owner',
      'admin',
      'teacher',
      'assistant',
    ]);
    expectVisibleForRoles('gradebook', [
      'owner',
      'admin',
      'teacher',
      'assistant',
    ]);
    expectVisibleForRoles('certificates', ['owner', 'admin']);
    expectVisibleForRoles('materials', [
      'owner',
      'admin',
      'teacher',
      'assistant',
    ]);
    expectVisibleForRoles('my-space', ['student']);
    expectVisibleForRoles('audit-log', ['owner', 'admin']);
    expectVisibleForRoles('schedule', [
      'owner',
      'admin',
      'teacher',
      'assistant',
    ]);
    expectVisibleForRoles('library', [
      'owner',
      'admin',
      'teacher',
      'assistant',
    ]);
    expectVisibleForRoles('guardian-space', ['guardian']);
    expectVisibleForRoles('notifications', ROLE_KEYS);
  });

  it('does not accept the replaced temporary capabilities', () => {
    const managementOnlyNavigation = navIds(
      {
        canManageCourses: true,
        canGrade: true,
        canSubmit: true,
        canManageUsers: true,
        canManageAttendance: true,
        canManageCertificates: true,
        canManageMaterials: true,
      },
      'admin'
    );
    for (const itemId of [
      'courses',
      'students',
      'enrollments',
      'staff',
      'attendance',
      'evaluations',
      'gradebook',
      'certificates',
      'materials',
      'my-space',
    ]) {
      expect(managementOnlyNavigation).not.toContain(itemId);
    }
    expect(
      navIds(
        {
          ...ROLE_CAPABILITIES.admin,
          canViewAuditLog: false,
          canViewInstitutionSettings: true,
        },
        'admin'
      )
    ).not.toContain('audit-log');
    expect(
      navIds(
        {
          ...ROLE_CAPABILITIES.teacher,
          canViewSchedule: false,
          canManageAttendance: true,
        },
        'teacher'
      )
    ).not.toContain('schedule');
    expect(
      navIds(
        {
          ...ROLE_CAPABILITIES.teacher,
          canAccessLibrary: false,
          canManageMaterials: true,
        },
        'teacher'
      )
    ).not.toContain('library');
    expect(
      navIds(
        {
          ...ROLE_CAPABILITIES.guardian,
          canViewLinkedStudents: false,
          canViewReports: true,
        },
        'guardian'
      )
    ).not.toContain('guardian-space');
  });

  it('requires the notifications capability instead of unrelated academic capabilities', () => {
    expect(
      navIds(
        {
          canGrade: true,
          canSubmit: true,
          canManageCourses: true,
          canViewReports: true,
        },
        'teacher'
      )
    ).not.toContain('notifications');
  });
});
