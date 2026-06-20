import { describe, expect, it } from 'vitest';
import { EMPTY_AUDIT_LOG_V2, getMockAuditLogV2 } from '@/lib/mocks/audit-log-v2';
import { getCapabilitiesForRoleKey, ROLE_CAPABILITIES } from '@/lib/rbac/capabilities';
import { navGroupsForCapabilities } from '@/lib/rbac/nav-v2';
import type { Capabilities, RoleKey } from '@/lib/types/auth';
import { canAccessAuditLogV2, filterAuditLogV2, type AuditLogV2FilterState } from '@/lib/types/audit-log-v2';

const emptyFilters: AuditLogV2FilterState = { query: '', module: 'all', eventType: 'all', severity: 'all', status: 'all', actorId: 'all', period: 'all' };
const navIds = (roleKey: RoleKey) => navGroupsForCapabilities(getCapabilitiesForRoleKey(roleKey), roleKey).flatMap((group) => group.items).map((item) => item.id);

describe('Audit Log V2 foundation', () => {
  it('provides audit fixtures to owner and admin only', () => {
    expect(getMockAuditLogV2('owner').events.length).toBeGreaterThan(0);
    expect(getMockAuditLogV2('admin').events.length).toBeGreaterThan(0);
    for (const role of ['teacher', 'assistant', 'student', 'guardian', 'support'] as const) expect(getMockAuditLogV2(role)).toEqual(EMPTY_AUDIT_LOG_V2);
  });
  it('searches and combines audit filters', () => {
    const events = getMockAuditLogV2('owner').events;
    expect(filterAuditLogV2(events, { ...emptyFilters, query: 'denegado' })).toHaveLength(1);
    expect(filterAuditLogV2(events, { query: '', module: 'auth', eventType: 'denied-attempt', severity: 'critical', status: 'review', actorId: 'actor-unknown-demo', period: 'week' }).map((event) => event.id)).toEqual(['audit-denied-attempt']);
  });
  it('supports an empty filtered state', () => expect(filterAuditLogV2(getMockAuditLogV2('owner').events, { ...emptyFilters, query: 'evento inexistente' })).toEqual([]));
  it('requires settings view capability and owner/admin role scope', () => {
    expect(canAccessAuditLogV2('owner', ROLE_CAPABILITIES.owner)).toBe(true);
    expect(canAccessAuditLogV2('admin', ROLE_CAPABILITIES.admin)).toBe(true);
    const teacherWithCapability: Capabilities = { ...ROLE_CAPABILITIES.teacher, canViewInstitutionSettings: true };
    expect(canAccessAuditLogV2('teacher', teacherWithCapability)).toBe(false);
  });
  it('does not allow substitute capabilities', () => {
    const substitutes: Capabilities = { ...ROLE_CAPABILITIES.admin, canViewInstitutionSettings: false, canManageInstitution: true, canManageUsers: true, canViewReports: true, canGrade: true, canSubmit: true, canManageCourses: true };
    expect(canAccessAuditLogV2('admin', substitutes)).toBe(false);
  });
  it('shows audit navigation only to owner and admin', () => {
    expect(navIds('owner')).toContain('audit-log');
    expect(navIds('admin')).toContain('audit-log');
    for (const role of ['teacher', 'assistant', 'student', 'guardian', 'support'] as const) expect(navIds(role)).not.toContain('audit-log');
  });
  it('keeps fixtures free of real identities and sensitive telemetry', () => {
    const serialized = JSON.stringify(getMockAuditLogV2('owner'));
    expect(serialized).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(serialized).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
    expect(serialized).not.toMatch(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
    expect(serialized).not.toMatch(/https?:\/\/|token|cookie|header|secret|session.?id|project.?ref/i);
  });
  it('contains no real log operations or persistence actions', () => {
    const serialized = JSON.stringify(getMockAuditLogV2('owner'));
    expect(serialized).not.toMatch(/download|delete.?event|retain.?log|save.?log|query.?log|descargar|borrar.?evento|guardar.?log/i);
  });
});
