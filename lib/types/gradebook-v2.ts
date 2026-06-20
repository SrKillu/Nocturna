import type { Capabilities, CapabilityKey, RoleKey } from '@/lib/types/auth';

export type GradebookV2Audience = 'institution' | 'teacher';
export type GradebookV2Status = 'on_track' | 'watch' | 'risk' | 'pending';
export type GradebookV2Trend = 'up' | 'stable' | 'down';
export type GradebookV2Period = 'current' | 'previous';
export type GradebookV2Range = 'high' | 'middle' | 'low' | 'ungraded';

export interface GradebookV2Record {
  id: string;
  studentName: string;
  studentCode: string;
  courseId: string;
  courseName: string;
  sectionLabel: string;
  averageGrade: number | null;
  lastEvaluationLabel: string;
  pendingEvaluations: number;
  status: GradebookV2Status;
  trend: GradebookV2Trend;
  trendLabel: string;
  period: GradebookV2Period;
  nextAction: string;
  audiences: readonly GradebookV2Audience[];
}

export interface GradebookV2Summary {
  overallAverage: number | null;
  studentsAtRisk: number;
  pendingToGrade: number;
  lastUpdateLabel: string;
}

export interface GradebookV2DistributionItem {
  range: GradebookV2Range;
  label: string;
  count: number;
}

export interface GradebookV2Fixture {
  summary: GradebookV2Summary;
  records: readonly GradebookV2Record[];
  distribution: readonly GradebookV2DistributionItem[];
  riskRecords: readonly GradebookV2Record[];
  calculationLabel: string;
}

export interface GradebookV2FilterState {
  query: string;
  courseId: string | 'all';
  section: string | 'all';
  period: GradebookV2Period | 'all';
  status: GradebookV2Status | 'all';
  range: GradebookV2Range | 'all';
}

export const GRADEBOOK_V2_CAPABILITIES = [
  'canGrade',
] as const satisfies readonly CapabilityKey[];

export function canAccessGradebookV2(capabilities: Capabilities): boolean {
  return capabilities.canGrade === true;
}

export function gradebookAudienceForRole(
  roleKey: RoleKey
): GradebookV2Audience | null {
  if (roleKey === 'owner' || roleKey === 'admin') return 'institution';
  if (roleKey === 'teacher' || roleKey === 'assistant') return 'teacher';
  return null;
}

export function gradeRangeForRecord(
  record: Pick<GradebookV2Record, 'averageGrade'>
): GradebookV2Range {
  if (record.averageGrade === null) return 'ungraded';
  if (record.averageGrade >= 90) return 'high';
  if (record.averageGrade >= 70) return 'middle';
  return 'low';
}

export function filterGradebookV2(
  records: readonly GradebookV2Record[],
  filters: GradebookV2FilterState
): readonly GradebookV2Record[] {
  const query = filters.query.trim().toLocaleLowerCase('es');

  return records.filter((record) => {
    const matchesQuery =
      query.length === 0 ||
      [
        record.studentName,
        record.studentCode,
        record.courseName,
        record.sectionLabel,
      ].some((value) => value.toLocaleLowerCase('es').includes(query));

    return (
      matchesQuery &&
      (filters.courseId === 'all' || record.courseId === filters.courseId) &&
      (filters.section === 'all' || record.sectionLabel === filters.section) &&
      (filters.period === 'all' || record.period === filters.period) &&
      (filters.status === 'all' || record.status === filters.status) &&
      (filters.range === 'all' || gradeRangeForRecord(record) === filters.range)
    );
  });
}
