import type { RoleKey } from '@/lib/types/auth';

export type NotificationV2Module =
  | 'system'
  | 'courses'
  | 'attendance'
  | 'evaluations'
  | 'enrollments'
  | 'certificates'
  | 'library'
  | 'security'
  | 'settings'
  | 'support';
export type NotificationV2Type =
  | 'system'
  | 'academic'
  | 'attendance'
  | 'evaluation'
  | 'enrollment'
  | 'certificate'
  | 'library'
  | 'security'
  | 'reminder'
  | 'announcement';
export type NotificationV2Priority = 'low' | 'normal' | 'high' | 'critical';
export type NotificationV2Status =
  | 'unread'
  | 'read'
  | 'archived'
  | 'pending'
  | 'resolved';
export type NotificationV2Channel =
  | 'internal'
  | 'simulated-email'
  | 'dashboard'
  | 'simulated-mobile';
export type NotificationV2Period = 'today' | 'week' | 'month' | 'previous';

export interface NotificationV2Item {
  id: string;
  title: string;
  detail: string;
  module: NotificationV2Module;
  moduleLabel: string;
  type: NotificationV2Type;
  priority: NotificationV2Priority;
  status: NotificationV2Status;
  channel: NotificationV2Channel;
  occurredAtLabel: string;
  nextAction: string;
  period: NotificationV2Period;
  roles: readonly RoleKey[];
  administrative: boolean;
}

export interface NotificationsV2Summary {
  totalNotifications: number;
  unreadNotifications: number;
  highPriorityNotifications: number;
  lastUpdateLabel: string;
}

export interface NotificationV2DigestItem {
  id: string;
  title: string;
  detail: string;
}

export interface NotificationV2Preference {
  id: string;
  label: string;
  value: string;
  detail: string;
}

export interface NotificationsV2Fixture {
  summary: NotificationsV2Summary;
  notifications: readonly NotificationV2Item[];
  digest: readonly NotificationV2DigestItem[];
  preferences: readonly NotificationV2Preference[];
  disclaimer: string;
}

export interface NotificationsV2FilterState {
  query: string;
  module: NotificationV2Module | 'all';
  type: NotificationV2Type | 'all';
  priority: NotificationV2Priority | 'all';
  status: NotificationV2Status | 'all';
  channel: NotificationV2Channel | 'all';
  period: NotificationV2Period | 'all';
}

export const NOTIFICATIONS_V2_ROLES: readonly RoleKey[] = [
  'owner',
  'admin',
  'teacher',
  'assistant',
  'student',
  'guardian',
  'support',
];

export function canAccessNotificationsV2(roleKey: RoleKey): boolean {
  return NOTIFICATIONS_V2_ROLES.includes(roleKey);
}

export function filterNotificationsV2(
  notifications: readonly NotificationV2Item[],
  filters: NotificationsV2FilterState
): readonly NotificationV2Item[] {
  const query = filters.query.trim().toLocaleLowerCase('es');

  return notifications.filter((notification) => {
    const matchesQuery =
      query.length === 0 ||
      [
        notification.title,
        notification.detail,
        notification.moduleLabel,
      ].some((value) => value.toLocaleLowerCase('es').includes(query));

    return (
      matchesQuery &&
      (filters.module === 'all' || notification.module === filters.module) &&
      (filters.type === 'all' || notification.type === filters.type) &&
      (filters.priority === 'all' ||
        notification.priority === filters.priority) &&
      (filters.status === 'all' || notification.status === filters.status) &&
      (filters.channel === 'all' || notification.channel === filters.channel) &&
      (filters.period === 'all' || notification.period === filters.period)
    );
  });
}
