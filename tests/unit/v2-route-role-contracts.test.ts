import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { getCapabilitiesForRoleKey } from '@/lib/rbac/capabilities';
import { navGroupsForCapabilities } from '@/lib/rbac/nav-v2';
import { canAccessAttendanceV2 } from '@/lib/types/attendance-v2';
import { canAccessAuditLogV2 } from '@/lib/types/audit-log-v2';
import { canAccessCertificatesV2 } from '@/lib/types/certificates-v2';
import { canAccessCoursesV2 } from '@/lib/types/courses-v2';
import { canAccessEnrollmentsV2 } from '@/lib/types/enrollments-v2';
import { canAccessEvaluationsV2 } from '@/lib/types/evaluations-v2';
import { canAccessGradebookV2 } from '@/lib/types/gradebook-v2';
import { canAccessGuardianSpaceV2 } from '@/lib/types/guardian-space-v2';
import { canAccessLibraryV2 } from '@/lib/types/library-v2';
import { canAccessMaterialsV2 } from '@/lib/types/materials-v2';
import { canAccessMySpaceV2 } from '@/lib/types/my-space-v2';
import { canAccessNotificationsV2 } from '@/lib/types/notifications-v2';
import { canAccessReportsV2 } from '@/lib/types/reports-v2';
import { canAccessScheduleV2 } from '@/lib/types/schedule-v2';
import { canAccessSettingsV2 } from '@/lib/types/settings-v2';
import { canAccessStaffV2 } from '@/lib/types/staff-v2';
import { canAccessStudentsV2 } from '@/lib/types/students-v2';
import type {
  Capabilities,
  CapabilityKey,
  RoleKey,
} from '@/lib/types/auth';

const ROLE_KEYS: readonly RoleKey[] = [
  'owner',
  'admin',
  'teacher',
  'assistant',
  'student',
  'guardian',
  'support',
];

const ALL_ROLES = ROLE_KEYS;
const INSTITUTION_ADMINS: readonly RoleKey[] = ['owner', 'admin'];
const ACADEMIC_STAFF: readonly RoleKey[] = [
  'owner',
  'admin',
  'teacher',
  'assistant',
];
const COURSE_ROLES: readonly RoleKey[] = [
  ...ACADEMIC_STAFF,
  'student',
];

type AccessEvaluator = (
  roleKey: RoleKey,
  capabilities: Capabilities
) => boolean;

interface V2RouteContract {
  path: string;
  navHref?: string;
  allowedRoles: readonly RoleKey[];
  primaryCapabilities: readonly CapabilityKey[];
  accessHelper: string;
  canAccess: AccessEvaluator;
}

const capabilityOnly =
  (helper: (capabilities: Capabilities) => boolean): AccessEvaluator =>
  (_roleKey, capabilities) =>
    helper(capabilities);

const ROUTE_CONTRACTS: readonly V2RouteContract[] = [
  {
    path: '/v2/dashboard',
    navHref: '/v2/dashboard',
    allowedRoles: ALL_ROLES,
    primaryCapabilities: [],
    accessHelper: 'active membership in protected V2 layout',
    canAccess: () => true,
  },
  {
    path: '/v2/courses',
    navHref: '/v2/courses',
    allowedRoles: COURSE_ROLES,
    primaryCapabilities: ['canManageCourses', 'canGrade', 'canSubmit'],
    accessHelper: 'canAccessCoursesV2',
    canAccess: capabilityOnly(canAccessCoursesV2),
  },
  {
    path: '/v2/courses/[courseId]',
    allowedRoles: COURSE_ROLES,
    primaryCapabilities: ['canManageCourses', 'canGrade', 'canSubmit'],
    accessHelper: 'canAccessCoursesV2',
    canAccess: capabilityOnly(canAccessCoursesV2),
  },
  {
    path: '/v2/students',
    navHref: '/v2/students',
    allowedRoles: ACADEMIC_STAFF,
    primaryCapabilities: ['canManageCourses', 'canGrade'],
    accessHelper: 'canAccessStudentsV2',
    canAccess: capabilityOnly(canAccessStudentsV2),
  },
  {
    path: '/v2/students/[studentId]',
    allowedRoles: ACADEMIC_STAFF,
    primaryCapabilities: ['canManageCourses', 'canGrade'],
    accessHelper: 'canAccessStudentsV2',
    canAccess: capabilityOnly(canAccessStudentsV2),
  },
  {
    path: '/v2/my-space',
    navHref: '/v2/my-space',
    allowedRoles: ['student'],
    primaryCapabilities: ['canSubmit'],
    accessHelper: 'canAccessMySpaceV2',
    canAccess: capabilityOnly(canAccessMySpaceV2),
  },
  {
    path: '/v2/guardian-space',
    navHref: '/v2/guardian-space',
    allowedRoles: ['guardian'],
    primaryCapabilities: ['canViewLinkedStudents'],
    accessHelper: 'canAccessGuardianSpaceV2',
    canAccess: canAccessGuardianSpaceV2,
  },
  {
    path: '/v2/attendance',
    navHref: '/v2/attendance',
    allowedRoles: ACADEMIC_STAFF,
    primaryCapabilities: ['canManageAttendance'],
    accessHelper: 'canAccessAttendanceV2',
    canAccess: capabilityOnly(canAccessAttendanceV2),
  },
  {
    path: '/v2/evaluations',
    navHref: '/v2/evaluations',
    allowedRoles: ACADEMIC_STAFF,
    primaryCapabilities: ['canGrade'],
    accessHelper: 'canAccessEvaluationsV2',
    canAccess: capabilityOnly(canAccessEvaluationsV2),
  },
  {
    path: '/v2/materials',
    navHref: '/v2/materials',
    allowedRoles: ACADEMIC_STAFF,
    primaryCapabilities: ['canManageMaterials'],
    accessHelper: 'canAccessMaterialsV2',
    canAccess: capabilityOnly(canAccessMaterialsV2),
  },
  {
    path: '/v2/gradebook',
    navHref: '/v2/gradebook',
    allowedRoles: ACADEMIC_STAFF,
    primaryCapabilities: ['canGrade'],
    accessHelper: 'canAccessGradebookV2',
    canAccess: capabilityOnly(canAccessGradebookV2),
  },
  {
    path: '/v2/reports',
    navHref: '/v2/reports',
    allowedRoles: ACADEMIC_STAFF,
    primaryCapabilities: ['canViewReports'],
    accessHelper: 'canAccessReportsV2',
    canAccess: canAccessReportsV2,
  },
  {
    path: '/v2/certificates',
    navHref: '/v2/certificates',
    allowedRoles: INSTITUTION_ADMINS,
    primaryCapabilities: ['canManageCertificates'],
    accessHelper: 'canAccessCertificatesV2',
    canAccess: canAccessCertificatesV2,
  },
  {
    path: '/v2/staff',
    navHref: '/v2/staff',
    allowedRoles: INSTITUTION_ADMINS,
    primaryCapabilities: ['canManageUsers'],
    accessHelper: 'canAccessStaffV2',
    canAccess: canAccessStaffV2,
  },
  {
    path: '/v2/enrollments',
    navHref: '/v2/enrollments',
    allowedRoles: INSTITUTION_ADMINS,
    primaryCapabilities: ['canManageCourses'],
    accessHelper: 'canAccessEnrollmentsV2',
    canAccess: canAccessEnrollmentsV2,
  },
  {
    path: '/v2/schedule',
    navHref: '/v2/schedule',
    allowedRoles: ACADEMIC_STAFF,
    primaryCapabilities: ['canViewSchedule'],
    accessHelper: 'canAccessScheduleV2',
    canAccess: canAccessScheduleV2,
  },
  {
    path: '/v2/library',
    navHref: '/v2/library',
    allowedRoles: ACADEMIC_STAFF,
    primaryCapabilities: ['canAccessLibrary'],
    accessHelper: 'canAccessLibraryV2',
    canAccess: canAccessLibraryV2,
  },
  {
    path: '/v2/settings',
    navHref: '/v2/settings',
    allowedRoles: INSTITUTION_ADMINS,
    primaryCapabilities: ['canViewInstitutionSettings'],
    accessHelper: 'canAccessSettingsV2',
    canAccess: canAccessSettingsV2,
  },
  {
    path: '/v2/audit-log',
    navHref: '/v2/audit-log',
    allowedRoles: INSTITUTION_ADMINS,
    primaryCapabilities: ['canViewAuditLog'],
    accessHelper: 'canAccessAuditLogV2',
    canAccess: canAccessAuditLogV2,
  },
  {
    path: '/v2/notifications',
    navHref: '/v2/notifications',
    allowedRoles: ALL_ROLES,
    primaryCapabilities: ['canViewNotifications'],
    accessHelper: 'canAccessNotificationsV2',
    canAccess: canAccessNotificationsV2,
  },
];

const EXPECTED_ROUTE_PATHS = [
  '/v2/dashboard',
  '/v2/courses',
  '/v2/courses/[courseId]',
  '/v2/students',
  '/v2/students/[studentId]',
  '/v2/my-space',
  '/v2/guardian-space',
  '/v2/attendance',
  '/v2/evaluations',
  '/v2/materials',
  '/v2/gradebook',
  '/v2/reports',
  '/v2/certificates',
  '/v2/staff',
  '/v2/enrollments',
  '/v2/schedule',
  '/v2/library',
  '/v2/settings',
  '/v2/audit-log',
  '/v2/notifications',
] as const;

function directRoutesForRole(roleKey: RoleKey): string[] {
  const capabilities = getCapabilitiesForRoleKey(roleKey);
  return ROUTE_CONTRACTS.filter((contract) =>
    contract.canAccess(roleKey, capabilities)
  ).map((contract) => contract.path);
}

function navHrefsForRole(roleKey: RoleKey): string[] {
  return navGroupsForCapabilities(
    getCapabilitiesForRoleKey(roleKey),
    roleKey
  )
    .flatMap((group) => group.items)
    .map((item) => item.href);
}

function routeToPagePath(route: string): string {
  const segments = route.replace(/^\/v2\/?/, '').split('/').filter(Boolean);
  return join(process.cwd(), 'app', '(v2)', 'v2', ...segments, 'page.tsx');
}

function collectPhysicalV2Routes(
  directory: string,
  segments: readonly string[] = []
): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      return collectPhysicalV2Routes(join(directory, entry.name), [
        ...segments,
        entry.name,
      ]);
    }
    if (entry.isFile() && entry.name === 'page.tsx') {
      return [`/v2${segments.length > 0 ? `/${segments.join('/')}` : ''}`];
    }
    return [];
  });
}

describe('Nocturna V2 route-role contracts', () => {
  it('represents every expected V2 route and every V2 role', () => {
    expect(ROUTE_CONTRACTS.map((contract) => contract.path).sort()).toEqual(
      [...EXPECTED_ROUTE_PATHS].sort()
    );
    expect(ROLE_KEYS).toEqual([
      'owner',
      'admin',
      'teacher',
      'assistant',
      'student',
      'guardian',
      'support',
    ]);
  });

  it.each(ROUTE_CONTRACTS)(
    '$path allows and denies the expected roles through its runtime helper',
    (contract) => {
      for (const roleKey of ROLE_KEYS) {
        const expected = contract.allowedRoles.includes(roleKey);
        expect(
          contract.canAccess(roleKey, getCapabilitiesForRoleKey(roleKey))
        ).toBe(expected);
      }
    }
  );

  it.each(ROLE_KEYS)(
    '%s navigation matches the routes available through direct access',
    (roleKey) => {
      const directRoutes = new Set(directRoutesForRole(roleKey));
      const expectedNavHrefs = ROUTE_CONTRACTS.filter(
        (contract) =>
          contract.navHref && contract.allowedRoles.includes(roleKey)
      ).map((contract) => contract.navHref as string);
      const actualNavHrefs = navHrefsForRole(roleKey);

      expect([...actualNavHrefs].sort()).toEqual(
        [...expectedNavHrefs].sort()
      );

      for (const href of actualNavHrefs) {
        const contract = ROUTE_CONTRACTS.find(
          (candidate) => candidate.navHref === href
        );
        expect(contract, `missing contract for nav href ${href}`).toBeDefined();
        expect(directRoutes.has(contract?.path ?? '')).toBe(true);
      }
    }
  );

  it('locks the restricted role route sets', () => {
    expect(directRoutesForRole('student').sort()).toEqual(
      [
        '/v2/dashboard',
        '/v2/notifications',
        '/v2/courses',
        '/v2/courses/[courseId]',
        '/v2/my-space',
      ].sort()
    );
    expect(directRoutesForRole('guardian').sort()).toEqual(
      ['/v2/dashboard', '/v2/notifications', '/v2/guardian-space'].sort()
    );
    expect(directRoutesForRole('support').sort()).toEqual(
      ['/v2/dashboard', '/v2/notifications'].sort()
    );
  });

  it('locks administrative and academic-staff boundaries', () => {
    for (const roleKey of ['teacher', 'assistant'] as const) {
      const routes = directRoutesForRole(roleKey);
      for (const restrictedRoute of [
        '/v2/settings',
        '/v2/audit-log',
        '/v2/certificates',
        '/v2/staff',
        '/v2/enrollments',
        '/v2/guardian-space',
        '/v2/my-space',
      ]) {
        expect(routes).not.toContain(restrictedRoute);
      }
      expect(routes).toEqual(
        expect.arrayContaining([
          '/v2/schedule',
          '/v2/library',
          '/v2/reports',
        ])
      );
    }

    expect(getCapabilitiesForRoleKey('admin').canManageInstitution).toBe(
      false
    );
  });

  it('keeps universal and owner/admin-only routes explicit', () => {
    for (const roleKey of ROLE_KEYS) {
      expect(directRoutesForRole(roleKey)).toEqual(
        expect.arrayContaining(['/v2/dashboard', '/v2/notifications'])
      );
    }

    for (const path of [
      '/v2/settings',
      '/v2/audit-log',
      '/v2/certificates',
      '/v2/staff',
      '/v2/enrollments',
    ]) {
      expect(
        ROUTE_CONTRACTS.find((contract) => contract.path === path)
          ?.allowedRoles
      ).toEqual(INSTITUTION_ADMINS);
    }
  });

  it('has no physical module route without a contract or contract without a page', () => {
    const v2Directory = join(process.cwd(), 'app', '(v2)', 'v2');
    const physicalRoutes = collectPhysicalV2Routes(v2Directory)
      .filter((route) => route !== '/v2')
      .sort();
    const contractRoutes = ROUTE_CONTRACTS.map(
      (contract) => contract.path
    ).sort();

    expect(physicalRoutes).toEqual(contractRoutes);
    for (const contract of ROUTE_CONTRACTS) {
      expect(
        existsSync(routeToPagePath(contract.path)),
        `missing page for ${contract.path}`
      ).toBe(true);
    }
  });

  it('has no navigation destination without a route contract', () => {
    const contractNavHrefs = new Set(
      ROUTE_CONTRACTS.flatMap((contract) =>
        contract.navHref ? [contract.navHref] : []
      )
    );
    const allNavHrefs = new Set(ROLE_KEYS.flatMap(navHrefsForRole));

    expect([...allNavHrefs].sort()).toEqual([...contractNavHrefs].sort());
  });
});
