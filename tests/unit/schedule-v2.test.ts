import { describe, expect, it } from 'vitest';

import { EMPTY_SCHEDULE_V2, getMockScheduleV2 } from '@/lib/mocks/schedule-v2';
import {
  getCapabilitiesForRoleKey,
  ROLE_CAPABILITIES,
} from '@/lib/rbac/capabilities';
import { navGroupsForCapabilities } from '@/lib/rbac/nav-v2';
import type { Capabilities, RoleKey } from '@/lib/types/auth';
import {
  canAccessScheduleV2,
  filterScheduleV2,
  groupScheduleByDay,
} from '@/lib/types/schedule-v2';

const navIds = (roleKey: RoleKey) =>
  navGroupsForCapabilities(getCapabilitiesForRoleKey(roleKey), roleKey)
    .flatMap((group) => group.items)
    .map((item) => item.id);

describe('Schedule V2 foundation', () => {
  it('provides institutional and teacher fixtures', () => {
    for (const role of ['owner', 'admin', 'teacher', 'assistant'] as const) {
      expect(getMockScheduleV2(role).sessions.length).toBeGreaterThan(0);
    }
    for (const role of ['student', 'guardian', 'support'] as const) {
      expect(getMockScheduleV2(role)).toEqual(EMPTY_SCHEDULE_V2);
    }
  });

  it('requires schedule visibility and an allowed role', () => {
    expect(canAccessScheduleV2('owner', ROLE_CAPABILITIES.owner)).toBe(true);
    expect(canAccessScheduleV2('teacher', ROLE_CAPABILITIES.teacher)).toBe(true);
    const student: Capabilities = {
      ...ROLE_CAPABILITIES.student,
      canViewSchedule: true,
    };
    expect(canAccessScheduleV2('student', student)).toBe(false);
  });

  it('does not use attendance or other substitute capabilities', () => {
    const capabilities: Capabilities = {
      ...ROLE_CAPABILITIES.student,
      canViewReports: true,
      canGrade: true,
      canSubmit: true,
      canManageAttendance: true,
      canViewSchedule: false,
    };
    expect(canAccessScheduleV2('teacher', capabilities)).toBe(false);
  });

  it('filters and groups ordered sessions', () => {
    const fixture = getMockScheduleV2('owner');
    expect(
      filterScheduleV2(fixture.sessions, {
        query: 'Álgebra',
        courseId: 'all',
        section: 'all',
        teacher: 'all',
        room: 'all',
        day: 'all',
        status: 'all',
      }).length
    ).toBeGreaterThan(0);
    const groups = groupScheduleByDay(fixture.sessions);
    expect(
      groups.monday[0]?.startTime <=
        (groups.monday[1]?.startTime ?? '99:99')
    ).toBe(true);
  });

  it('supports empty state', () => {
    expect(EMPTY_SCHEDULE_V2.sessions).toHaveLength(0);
  });

  it('shows nav only to allowed roles', () => {
    for (const role of ['owner', 'admin', 'teacher', 'assistant'] as const) {
      expect(navIds(role)).toContain('schedule');
    }
    for (const role of ['student', 'guardian', 'support'] as const) {
      expect(navIds(role)).not.toContain('schedule');
    }
  });

  it('contains no external calendar or actions', () => {
    const serialized = JSON.stringify(getMockScheduleV2('owner'));
    expect(serialized).not.toMatch(/@|https?:\/\/|[0-9a-f]{8}-[0-9a-f-]{27}/i);
    expect(serialized).not.toMatch(
      /google.?calendar|sync|create.?session|move.?class|cancel.?class|save.?schedule/i
    );
  });
});
