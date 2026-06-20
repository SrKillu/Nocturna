import type { Capabilities, CapabilityKey, RoleKey } from '@/lib/types/auth';

export type ReportV2Audience = 'institution' | 'course' | 'section';
export type ReportV2DataAudience = 'institution' | 'teacher';
export type ReportV2Category =
  | 'attendance'
  | 'performance'
  | 'risk'
  | 'evaluations'
  | 'materials'
  | 'activity'
  | 'progress';
export type ReportV2Status = 'available' | 'review' | 'scheduled';
export type ReportV2Period = 'current' | 'recent' | 'previous';

export interface ReportV2ListItem {
  id: string;
  title: string;
  category: ReportV2Category;
  courseId: string | null;
  scopeLabel: string;
  period: ReportV2Period;
  periodLabel: string;
  status: ReportV2Status;
  audience: ReportV2Audience;
  updatedLabel: string;
  nextAction: string;
  audiences: readonly ReportV2DataAudience[];
}

export interface ReportsV2Summary {
  availableReports: number;
  pendingReview: number;
  academicAlerts: number;
  lastUpdateLabel: string;
}

export interface ReportV2Insight {
  id: string;
  title: string;
  detail: string;
}

export interface ReportsV2Fixture {
  summary: ReportsV2Summary;
  reports: readonly ReportV2ListItem[];
  insights: readonly ReportV2Insight[];
  scheduled: readonly ReportV2ListItem[];
  disclaimer: string;
}

export interface ReportV2FilterState {
  query: string;
  category: ReportV2Category | 'all';
  courseId: string | 'all';
  period: ReportV2Period | 'all';
  status: ReportV2Status | 'all';
  audience: ReportV2Audience | 'all';
}

export const REPORTS_V2_CAPABILITIES = [
  'canViewReports',
] as const satisfies readonly CapabilityKey[];
export const REPORTS_V2_ROLES = [
  'owner',
  'admin',
  'teacher',
  'assistant',
] as const satisfies readonly RoleKey[];

export function canAccessReportsV2(
  roleKey: RoleKey,
  capabilities: Capabilities
): boolean {
  return (
    REPORTS_V2_ROLES.includes(roleKey as (typeof REPORTS_V2_ROLES)[number]) &&
    capabilities.canViewReports === true
  );
}

export function reportDataAudienceForRole(
  roleKey: RoleKey
): ReportV2DataAudience | null {
  if (roleKey === 'owner' || roleKey === 'admin') return 'institution';
  if (roleKey === 'teacher' || roleKey === 'assistant') return 'teacher';
  return null;
}

export function filterReportsV2(
  reports: readonly ReportV2ListItem[],
  filters: ReportV2FilterState
): readonly ReportV2ListItem[] {
  const query = filters.query.trim().toLocaleLowerCase('es');
  return reports.filter((report) => {
    const matchesQuery =
      query.length === 0 ||
      [report.title, report.scopeLabel, report.periodLabel].some((value) =>
        value.toLocaleLowerCase('es').includes(query)
      );
    return (
      matchesQuery &&
      (filters.category === 'all' || report.category === filters.category) &&
      (filters.courseId === 'all' || report.courseId === filters.courseId) &&
      (filters.period === 'all' || report.period === filters.period) &&
      (filters.status === 'all' || report.status === filters.status) &&
      (filters.audience === 'all' || report.audience === filters.audience)
    );
  });
}
