import { describe, expect, it } from 'vitest';
import { EMPTY_REPORTS_V2, getMockReportsV2 } from '@/lib/mocks/reports-v2';
import { getCapabilitiesForRoleKey } from '@/lib/rbac/capabilities';
import { navGroupsForCapabilities } from '@/lib/rbac/nav-v2';
import type { RoleKey } from '@/lib/types/auth';
import { canAccessReportsV2, filterReportsV2, type ReportV2FilterState } from '@/lib/types/reports-v2';

const emptyFilters: ReportV2FilterState = { query: '', category: 'all', courseId: 'all', period: 'all', status: 'all', audience: 'all' };
function visibleNavIds(roleKey: RoleKey) {
  return navGroupsForCapabilities(getCapabilitiesForRoleKey(roleKey), roleKey).flatMap((group) => group.items).map((item) => item.id);
}

describe('Reports V2 foundation', () => {
  it('provides role-scoped fixtures for institutional and teaching roles', () => {
    expect(getMockReportsV2('owner').reports.length).toBeGreaterThan(0);
    expect(getMockReportsV2('admin').reports.length).toBeGreaterThan(0);
    expect(getMockReportsV2('teacher').reports.length).toBeGreaterThan(0);
    expect(getMockReportsV2('assistant').reports.length).toBeGreaterThan(0);
    expect(getMockReportsV2('admin').reports.length).toBeGreaterThan(getMockReportsV2('teacher').reports.length);
  });
  it('requires canViewReports plus an allowed role', () => {
    expect(canAccessReportsV2('owner', { canViewReports: true })).toBe(true);
    expect(canAccessReportsV2('assistant', { canViewReports: true })).toBe(true);
    expect(canAccessReportsV2('guardian', { canViewReports: true })).toBe(false);
    expect(canAccessReportsV2('support', { canViewReports: true })).toBe(false);
    expect(canAccessReportsV2('teacher', { canSubmit: true })).toBe(false);
  });
  it('searches and combines category, scope, period, status, and audience filters', () => {
    const reports = getMockReportsV2('admin').reports;
    expect(filterReportsV2(reports, { ...emptyFilters, query: 'Asistencia' })).toHaveLength(1);
    expect(filterReportsV2(reports, { ...emptyFilters, query: 'Ciencias' })).toHaveLength(1);
    expect(filterReportsV2(reports, { query: '', category: 'attendance', courseId: 'course-algebra-10a', period: 'current', status: 'available', audience: 'course' }).map((report) => report.id)).toEqual(['report-attendance-algebra']);
  });
  it('supports empty fixtures and empty filtered results', () => {
    expect(EMPTY_REPORTS_V2.reports).toEqual([]);
    expect(filterReportsV2(getMockReportsV2('admin').reports, { ...emptyFilters, query: 'inexistente' })).toEqual([]);
  });
  it('shows reports navigation only to allowed academic roles', () => {
    expect(visibleNavIds('owner')).toContain('reports');
    expect(visibleNavIds('admin')).toContain('reports');
    expect(visibleNavIds('teacher')).toContain('reports');
    expect(visibleNavIds('assistant')).toContain('reports');
    expect(visibleNavIds('student')).not.toContain('reports');
    expect(visibleNavIds('guardian')).not.toContain('reports');
    expect(visibleNavIds('support')).not.toContain('reports');
  });
  it('does not provide institutional fixtures to student, guardian, or support', () => {
    expect(getMockReportsV2('student')).toEqual(EMPTY_REPORTS_V2);
    expect(getMockReportsV2('guardian')).toEqual(EMPTY_REPORTS_V2);
    expect(getMockReportsV2('support')).toEqual(EMPTY_REPORTS_V2);
  });
  it('contains no identities, downloads, or real export formats', () => {
    const serialized = JSON.stringify(getMockReportsV2('admin'));
    expect(serialized).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(serialized).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
    expect(serialized).not.toMatch(/https?:\/\/|download|\.pdf|\.csv|\.xlsx/i);
  });
});
