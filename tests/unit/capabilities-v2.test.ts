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

const INSTITUTION_ADMINS: readonly RoleKey[] = ['owner', 'admin'];
const ACADEMIC_STAFF: readonly RoleKey[] = [
  'owner',
  'admin',
  'teacher',
  'assistant',
];
const COURSE_READERS: readonly RoleKey[] = [...ACADEMIC_STAFF, 'student'];

describe('V2 capability matrix', () => {
  it('registers every safe read capability', () => {
    expect(CAPABILITY_KEYS).toEqual(
      expect.arrayContaining([
        'canViewCourses',
        'canViewSections',
        'canViewStudents',
        'canViewStudentProfiles',
        'canViewOwnStudentProfile',
        'canViewEnrollments',
        'canViewAttendance',
        'canViewEvaluations',
        'canViewGradebook',
        'canViewOwnGrades',
        'canViewLinkedStudentGrades',
        'canViewMaterials',
        'canViewCertificates',
        'canViewStaff',
      ])
    );
  });

  it('grants institutional read capabilities to the approved roles only', () => {
    expectCapabilityMatrix('canViewCourses', COURSE_READERS);
    expectCapabilityMatrix('canViewSections', COURSE_READERS);
    expectCapabilityMatrix('canViewStudents', ACADEMIC_STAFF);
    expectCapabilityMatrix('canViewStudentProfiles', ACADEMIC_STAFF);
    expectCapabilityMatrix('canViewEnrollments', INSTITUTION_ADMINS);
    expectCapabilityMatrix('canViewAttendance', ACADEMIC_STAFF);
    expectCapabilityMatrix('canViewEvaluations', ACADEMIC_STAFF);
    expectCapabilityMatrix('canViewGradebook', ACADEMIC_STAFF);
    expectCapabilityMatrix('canViewMaterials', ACADEMIC_STAFF);
    expectCapabilityMatrix('canViewCertificates', INSTITUTION_ADMINS);
    expectCapabilityMatrix('canViewStaff', INSTITUTION_ADMINS);
  });

  it('keeps personal and relationship-derived reads narrowly scoped', () => {
    expectCapabilityMatrix('canViewOwnStudentProfile', ['student']);
    expectCapabilityMatrix('canViewOwnGrades', ['student']);
    expectCapabilityMatrix('canViewLinkedStudentGrades', ['guardian']);
  });

  it('keeps the C24 route-purpose capability assignments unchanged', () => {
    expectCapabilityMatrix('canViewAuditLog', INSTITUTION_ADMINS);
    expectCapabilityMatrix('canViewSchedule', ACADEMIC_STAFF);
    expectCapabilityMatrix('canAccessLibrary', ACADEMIC_STAFF);
    expectCapabilityMatrix('canViewLinkedStudents', ['guardian']);
    expectCapabilityMatrix('canViewNotifications', ROLE_KEYS);
  });

  it('keeps every pre-C27 capability assignment unchanged', () => {
    expectCapabilityMatrix('canManageInstitution', ['owner']);
    expectCapabilityMatrix('canViewInstitutionSettings', INSTITUTION_ADMINS);
    expectCapabilityMatrix('canManageUsers', INSTITUTION_ADMINS);
    expectCapabilityMatrix('canManageCourses', INSTITUTION_ADMINS);
    expectCapabilityMatrix('canManageSections', INSTITUTION_ADMINS);
    expectCapabilityMatrix('canGrade', ACADEMIC_STAFF);
    expectCapabilityMatrix('canSubmit', ['owner', 'student']);
    expectCapabilityMatrix('canViewReports', [
      'owner',
      'admin',
      'teacher',
      'assistant',
      'guardian',
      'support',
    ]);
    expectCapabilityMatrix('canManageMaterials', ACADEMIC_STAFF);
    expectCapabilityMatrix('canUseChat', ROLE_KEYS);
    expectCapabilityMatrix('canManageAttendance', ACADEMIC_STAFF);
    expectCapabilityMatrix('canManageCertificates', INSTITUTION_ADMINS);
  });
});
