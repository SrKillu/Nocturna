import type { Capabilities, RoleKey } from '@/lib/types/auth';

export type AuditLogV2Module =
  | 'auth'
  | 'settings'
  | 'staff'
  | 'students'
  | 'courses'
  | 'enrollments'
  | 'reports'
  | 'certificates'
  | 'library';
export type AuditLogV2EventType =
  | 'sign-in'
  | 'settings-change'
  | 'role-change'
  | 'academic-update'
  | 'denied-attempt'
  | 'simulated-export'
  | 'admin-action'
  | 'membership-change';
export type AuditLogV2Severity = 'info' | 'notice' | 'warning' | 'critical';
export type AuditLogV2Status = 'recorded' | 'review' | 'resolved';
export type AuditLogV2Period = 'today' | 'week' | 'month' | 'previous';

export interface AuditLogV2Event {
  id: string;
  title: string;
  module: AuditLogV2Module;
  moduleLabel: string;
  eventType: AuditLogV2EventType;
  actorId: string;
  actorLabel: string;
  resourceLabel: string;
  severity: AuditLogV2Severity;
  status: AuditLogV2Status;
  occurredAtLabel: string;
  nextAction: string;
  period: AuditLogV2Period;
}

export interface AuditLogV2Summary {
  recordedEvents: number;
  criticalEvents: number;
  administrativeChanges: number;
  lastReviewLabel: string;
}

export interface AuditLogV2RiskSignal {
  id: string;
  title: string;
  detail: string;
  severity: AuditLogV2Severity;
}

export interface AuditLogV2Fixture {
  summary: AuditLogV2Summary;
  events: readonly AuditLogV2Event[];
  recentActivity: readonly AuditLogV2Event[];
  riskSignals: readonly AuditLogV2RiskSignal[];
  disclaimer: string;
}

export interface AuditLogV2FilterState {
  query: string;
  module: AuditLogV2Module | 'all';
  eventType: AuditLogV2EventType | 'all';
  severity: AuditLogV2Severity | 'all';
  status: AuditLogV2Status | 'all';
  actorId: string | 'all';
  period: AuditLogV2Period | 'all';
}

const AUDIT_LOG_V2_ROLES: readonly RoleKey[] = ['owner', 'admin'];

export function canAccessAuditLogV2(
  roleKey: RoleKey,
  capabilities: Capabilities
): boolean {
  return (
    AUDIT_LOG_V2_ROLES.includes(roleKey) &&
    capabilities.canViewAuditLog === true
  );
}

export function filterAuditLogV2(
  events: readonly AuditLogV2Event[],
  filters: AuditLogV2FilterState
): readonly AuditLogV2Event[] {
  const query = filters.query.trim().toLocaleLowerCase('es');

  return events.filter((event) => {
    const matchesQuery =
      query.length === 0 ||
      [
        event.title,
        event.moduleLabel,
        event.actorLabel,
        event.resourceLabel,
      ].some((value) => value.toLocaleLowerCase('es').includes(query));

    return (
      matchesQuery &&
      (filters.module === 'all' || event.module === filters.module) &&
      (filters.eventType === 'all' || event.eventType === filters.eventType) &&
      (filters.severity === 'all' || event.severity === filters.severity) &&
      (filters.status === 'all' || event.status === filters.status) &&
      (filters.actorId === 'all' || event.actorId === filters.actorId) &&
      (filters.period === 'all' || event.period === filters.period)
    );
  });
}
