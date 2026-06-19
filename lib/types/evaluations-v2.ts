import type { Capabilities, CapabilityKey, RoleKey } from '@/lib/types/auth';

export type EvaluationV2Audience = 'institution' | 'teacher';
export type EvaluationV2Type = 'quiz' | 'project' | 'exam' | 'assignment';
export type EvaluationV2Status = 'draft' | 'active' | 'review' | 'completed';
export type EvaluationV2Period = 'current' | 'upcoming' | 'previous';
export type EvaluationV2DeadlineWindow = 'today' | 'this_week' | 'next_week';

export interface EvaluationV2ListItem {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  sectionLabel: string;
  type: EvaluationV2Type;
  deadlineLabel: string;
  deadlineWindow: EvaluationV2DeadlineWindow;
  submittedCount: number;
  expectedCount: number;
  pendingReviewCount: number;
  status: EvaluationV2Status;
  averageGrade: number | null;
  period: EvaluationV2Period;
  nextAction: string;
  audiences: readonly EvaluationV2Audience[];
}

export interface EvaluationV2Summary {
  activeEvaluations: number;
  pendingReviews: number;
  upcomingDeadlines: number;
  averageGrade: number | null;
}

export interface EvaluationsV2Fixture {
  summary: EvaluationV2Summary;
  evaluations: readonly EvaluationV2ListItem[];
  deadlines: readonly EvaluationV2ListItem[];
}

export interface EvaluationV2FilterState {
  query: string;
  courseId: string | 'all';
  section: string | 'all';
  type: EvaluationV2Type | 'all';
  status: EvaluationV2Status | 'all';
  period: EvaluationV2Period | 'all';
}

export const EVALUATIONS_V2_CAPABILITIES = [
  'canGrade',
] as const satisfies readonly CapabilityKey[];

export function canAccessEvaluationsV2(capabilities: Capabilities): boolean {
  return capabilities.canGrade === true;
}

export function evaluationAudienceForRole(
  roleKey: RoleKey
): EvaluationV2Audience | null {
  if (roleKey === 'owner' || roleKey === 'admin') return 'institution';
  if (roleKey === 'teacher' || roleKey === 'assistant') return 'teacher';
  return null;
}

export function filterEvaluationsV2(
  evaluations: readonly EvaluationV2ListItem[],
  filters: EvaluationV2FilterState
): readonly EvaluationV2ListItem[] {
  const query = filters.query.trim().toLocaleLowerCase('es');

  return evaluations.filter((evaluation) => {
    const matchesQuery =
      query.length === 0 ||
      [
        evaluation.title,
        evaluation.courseName,
        evaluation.sectionLabel,
      ].some((value) => value.toLocaleLowerCase('es').includes(query));

    return (
      matchesQuery &&
      (filters.courseId === 'all' || evaluation.courseId === filters.courseId) &&
      (filters.section === 'all' || evaluation.sectionLabel === filters.section) &&
      (filters.type === 'all' || evaluation.type === filters.type) &&
      (filters.status === 'all' || evaluation.status === filters.status) &&
      (filters.period === 'all' || evaluation.period === filters.period)
    );
  });
}
