import { describe, expect, it } from 'vitest';
import { EMPTY_NOTIFICATIONS_V2, getMockNotificationsV2 } from '@/lib/mocks/notifications-v2';
import { getCapabilitiesForRoleKey } from '@/lib/rbac/capabilities';
import { navGroupsForCapabilities } from '@/lib/rbac/nav-v2';
import type { RoleKey } from '@/lib/types/auth';
import { canAccessNotificationsV2, filterNotificationsV2, type NotificationsV2FilterState } from '@/lib/types/notifications-v2';

const emptyFilters: NotificationsV2FilterState = { query: '', module: 'all', type: 'all', priority: 'all', status: 'all', channel: 'all', period: 'all' };
const navIds = (roleKey: RoleKey) => navGroupsForCapabilities(getCapabilitiesForRoleKey(roleKey), roleKey).flatMap((group) => group.items).map((item) => item.id);

describe('Notifications Center V2 foundation', () => {
  it('provides role-scoped fixtures for every active V2 role', () => {
    for (const role of ['owner', 'admin', 'teacher', 'assistant', 'student', 'guardian', 'support'] as const) {
      expect(
        canAccessNotificationsV2(role, getCapabilitiesForRoleKey(role))
      ).toBe(true);
      expect(getMockNotificationsV2(role).notifications.length).toBeGreaterThan(0);
    }
  });
  it('searches and combines notification filters', () => {
    const items = getMockNotificationsV2('teacher').notifications;
    expect(filterNotificationsV2(items, { ...emptyFilters, query: 'asistencia' })).toHaveLength(1);
    expect(filterNotificationsV2(items, { query: '', module: 'attendance', type: 'attendance', priority: 'high', status: 'unread', channel: 'dashboard', period: 'today' }).map((item) => item.id)).toEqual(['notification-attendance-teaching']);
  });
  it('supports empty fixtures and empty filtered results', () => {
    expect(EMPTY_NOTIFICATIONS_V2.notifications).toEqual([]);
    expect(filterNotificationsV2(getMockNotificationsV2('student').notifications, { ...emptyFilters, query: 'inexistente' })).toEqual([]);
  });
  it('shows notifications navigation to every active V2 role', () => {
    for (const role of ['owner', 'admin', 'teacher', 'assistant', 'student', 'guardian', 'support'] as const) expect(navIds(role)).toContain('notifications');
  });
  it('requires the explicit capability instead of academic substitutes', () => {
    expect(canAccessNotificationsV2('teacher', { canGrade: true })).toBe(false);
    expect(canAccessNotificationsV2('student', { canSubmit: true })).toBe(false);
    expect(navGroupsForCapabilities({ canViewReports: true }).flatMap((group) => group.items).map((item) => item.id)).not.toContain('notifications');
    expect(navGroupsForCapabilities({ canGrade: true }).flatMap((group) => group.items).map((item) => item.id)).not.toContain('notifications');
    expect(navGroupsForCapabilities({ canSubmit: true }).flatMap((group) => group.items).map((item) => item.id)).not.toContain('notifications');
    expect(navGroupsForCapabilities({ canManageCourses: true }).flatMap((group) => group.items).map((item) => item.id)).not.toContain('notifications');
  });
  it('does not expose administrative notifications to personal or support roles', () => {
    for (const role of ['student', 'guardian', 'support'] as const) {
      expect(getMockNotificationsV2(role).notifications.some((item) => item.administrative)).toBe(false);
    }
  });
  it('keeps fixtures free of real identities and sensitive transport data', () => {
    const serialized = JSON.stringify(['owner', 'admin', 'teacher', 'assistant', 'student', 'guardian', 'support'].map((role) => getMockNotificationsV2(role as RoleKey)));
    expect(serialized).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(serialized).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
    expect(serialized).not.toMatch(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
    expect(serialized).not.toMatch(/https?:\/\/|token|cookie|header|secret|session.?id|project.?ref/i);
  });
  it('contains no real messaging, state mutation, or subscriptions', () => {
    const serialized = JSON.stringify(getMockNotificationsV2('owner'));
    expect(serialized).not.toMatch(/send.?email|send.?push|websocket|polling|subscribe|mark.?read|delete.?notification|save.?preference/i);
  });
});
