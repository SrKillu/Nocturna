import { describe, expect, it } from 'vitest';

import { EMPTY_STAFF_V2, getMockStaffV2 } from '@/lib/mocks/staff-v2';
import {
  getCapabilitiesForRoleKey,
  ROLE_CAPABILITIES,
} from '@/lib/rbac/capabilities';
import { navGroupsForCapabilities } from '@/lib/rbac/nav-v2';
import type { Capabilities, RoleKey } from '@/lib/types/auth';
import { canAccessStaffV2, filterStaffV2 } from '@/lib/types/staff-v2';

function visibleNavIds(roleKey: RoleKey): string[] {
  return navGroupsForCapabilities(
    getCapabilitiesForRoleKey(roleKey),
    roleKey
  ).flatMap((group) => group.items.map((item) => item.id));
}

describe('Staff V2 foundation', () => {
  it('provides fixtures only for owner and admin', () => {
    expect(getMockStaffV2('owner').staff.length).toBeGreaterThan(0);
    expect(getMockStaffV2('admin').staff.length).toBeGreaterThan(0);
    expect(getMockStaffV2('teacher')).toEqual(EMPTY_STAFF_V2);
    expect(getMockStaffV2('assistant')).toEqual(EMPTY_STAFF_V2);
    expect(getMockStaffV2('student')).toEqual(EMPTY_STAFF_V2);
    expect(getMockStaffV2('guardian')).toEqual(EMPTY_STAFF_V2);
    expect(getMockStaffV2('support')).toEqual(EMPTY_STAFF_V2);
  });

  it('requires both canViewStaff and owner/admin role scope', () => {
    expect(canAccessStaffV2('owner', ROLE_CAPABILITIES.owner)).toBe(true);
    expect(canAccessStaffV2('admin', ROLE_CAPABILITIES.admin)).toBe(true);

    const teacherWithViewStaff: Capabilities = {
      ...ROLE_CAPABILITIES.teacher,
      canViewStaff: true,
    };
    const ownerWithoutViewStaff: Capabilities = {
      ...ROLE_CAPABILITIES.owner,
      canViewStaff: false,
    };

    expect(canAccessStaffV2('teacher', teacherWithViewStaff)).toBe(false);
    expect(canAccessStaffV2('owner', ownerWithoutViewStaff)).toBe(false);
  });

  it('does not substitute management, report, grade or submit capabilities', () => {
    const substitutes: Capabilities = {
      ...ROLE_CAPABILITIES.student,
      canViewReports: true,
      canGrade: true,
      canSubmit: true,
      canManageUsers: true,
      canViewStaff: false,
    };

    expect(canAccessStaffV2('owner', substitutes)).toBe(false);
  });

  it('filters staff by search and role', () => {
    const fixture = getMockStaffV2('owner');
    const filtered = filterStaffV2(fixture.staff, {
      query: 'DOC-02',
      role: 'teacher',
      status: 'all',
      area: 'all',
      assignmentId: 'all',
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.staffCode).toBe('PER-DOC-02');
  });

  it('supports an empty state', () => {
    expect(EMPTY_STAFF_V2.staff).toHaveLength(0);
    expect(
      filterStaffV2(EMPTY_STAFF_V2.staff, {
        query: '',
        role: 'all',
        status: 'all',
        area: 'all',
        assignmentId: 'all',
      })
    ).toHaveLength(0);
  });

  it('shows Staff navigation only to owner and admin', () => {
    expect(visibleNavIds('owner')).toContain('staff');
    expect(visibleNavIds('admin')).toContain('staff');
    expect(visibleNavIds('teacher')).not.toContain('staff');
    expect(visibleNavIds('assistant')).not.toContain('staff');
    expect(visibleNavIds('student')).not.toContain('staff');
    expect(visibleNavIds('guardian')).not.toContain('staff');
    expect(visibleNavIds('support')).not.toContain('staff');
  });

  it('contains no real identities or user-management actions', () => {
    const serialized = JSON.stringify(getMockStaffV2('owner'));

    expect(serialized).not.toMatch(/@|https?:\/\/|[0-9a-f]{8}-[0-9a-f-]{27}/i);
    expect(serialized).not.toMatch(
      /send.?email|invite.?user|suspend.?user|change.?role|update.?user|save.?user/i
    );
  });
});
