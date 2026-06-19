import type { Capabilities, CapabilityKey, RoleKey } from '@/lib/types/auth';

export type StudentV2Status = 'active' | 'follow_up' | 'inactive';
export type StudentV2Level = 'primary' | 'secondary';
export type StudentV2Risk = 'on_track' | 'watch' | 'priority';
export type StudentV2Audience = 'institution' | 'teacher';

export interface StudentV2ListItem {
  id: string;
  name: string;
  code: string;
  courseId: string;
  courseName: string;
  sectionLabel: string;
  level: StudentV2Level;
  levelLabel: string;
  status: StudentV2Status;
  attendancePercent: number;
  academicSummary: string;
  risk: StudentV2Risk;
  nextAction: string;
  audiences: readonly StudentV2Audience[];
}

export interface StudentV2CoursePreview {
  id: string;
  name: string;
  code: string;
  sectionLabel: string;
  progressLabel: string;
}

export interface StudentV2AttendanceSummary {
  presentCount: number;
  lateCount: number;
  absentCount: number;
  trendLabel: string;
}

export interface StudentV2EvaluationPreview {
  id: string;
  title: string;
  courseName: string;
  resultLabel: string;
  statusLabel: string;
}

export interface StudentV2NotePreview {
  id: string;
  title: string;
  detail: string;
  dateLabel: string;
}

export interface StudentV2Profile extends StudentV2ListItem {
  periodLabel: string;
  summaryDetail: string;
  relatedCourses: readonly StudentV2CoursePreview[];
  attendanceSummary: StudentV2AttendanceSummary;
  evaluationsPreview: readonly StudentV2EvaluationPreview[];
  notesPreview: readonly StudentV2NotePreview[];
  nextActions: readonly string[];
}

export interface StudentV2FilterState {
  query: string;
  status: StudentV2Status | 'all';
  level: StudentV2Level | 'all';
  courseId: string | 'all';
  risk: StudentV2Risk | 'all';
}

export const STUDENTS_V2_CAPABILITIES = [
  'canManageCourses',
  'canGrade',
] as const satisfies readonly CapabilityKey[];

export function canAccessStudentsV2(capabilities: Capabilities): boolean {
  return STUDENTS_V2_CAPABILITIES.some((capability) => capabilities[capability] === true);
}

export function studentAudienceForRole(roleKey: RoleKey): StudentV2Audience | null {
  if (roleKey === 'owner' || roleKey === 'admin') return 'institution';
  if (roleKey === 'teacher' || roleKey === 'assistant') return 'teacher';
  return null;
}

export function studentMatchesFilters(
  student: StudentV2ListItem,
  filters: StudentV2FilterState
): boolean {
  const query = filters.query.trim().toLocaleLowerCase('es');
  const matchesQuery =
    query.length === 0 ||
    [student.name, student.code, student.courseName, student.sectionLabel].some((value) =>
      value.toLocaleLowerCase('es').includes(query)
    );

  return (
    matchesQuery &&
    (filters.status === 'all' || student.status === filters.status) &&
    (filters.level === 'all' || student.level === filters.level) &&
    (filters.courseId === 'all' || student.courseId === filters.courseId) &&
    (filters.risk === 'all' || student.risk === filters.risk)
  );
}

export function filterStudentsV2(
  students: readonly StudentV2ListItem[],
  filters: StudentV2FilterState
): readonly StudentV2ListItem[] {
  return students.filter((student) => studentMatchesFilters(student, filters));
}
