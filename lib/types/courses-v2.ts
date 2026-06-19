import type { Capabilities, CapabilityKey, RoleKey } from '@/lib/types/auth';

export type CourseV2Status = 'active' | 'planning' | 'completed';
export type CourseV2Level = 'primary' | 'secondary';
export type CourseV2Category = 'sciences' | 'languages' | 'humanities' | 'technology';
export type CourseV2Audience = 'institution' | 'teacher' | 'student';

export interface CourseV2ListItem {
  id: string;
  name: string;
  code: string;
  teacherName: string;
  studentCount: number;
  status: CourseV2Status;
  level: CourseV2Level;
  levelLabel: string;
  scheduleLabel: string;
  category: CourseV2Category;
  categoryLabel: string;
  nextAction: string;
  audiences: readonly CourseV2Audience[];
}

export type CourseV2WorkPriority = 'high' | 'medium' | 'low';
export type CourseV2PreviewStatus = 'active' | 'pending' | 'completed' | 'draft';

export interface CourseV2WorkItem {
  id: string;
  title: string;
  context: string;
  dueLabel: string;
  priority: CourseV2WorkPriority;
}

export interface CourseV2RosterMember {
  id: string;
  name: string;
  detail: string;
  status: CourseV2PreviewStatus;
}

export interface CourseV2EvaluationPreview {
  id: string;
  title: string;
  detail: string;
  status: CourseV2PreviewStatus;
}

export interface CourseV2MaterialPreview {
  id: string;
  title: string;
  detail: string;
  status: CourseV2PreviewStatus;
}

export interface CourseV2Workspace extends CourseV2ListItem {
  summary: string;
  termLabel: string;
  roomLabel: string;
  workQueue: readonly CourseV2WorkItem[];
  rosterPreview: readonly CourseV2RosterMember[];
  evaluationsPreview: readonly CourseV2EvaluationPreview[];
  materialsPreview: readonly CourseV2MaterialPreview[];
}

export const COURSES_V2_CAPABILITIES = [
  'canManageCourses',
  'canGrade',
  'canSubmit',
] as const satisfies readonly CapabilityKey[];

export function canAccessCoursesV2(capabilities: Capabilities): boolean {
  return COURSES_V2_CAPABILITIES.some((capability) => capabilities[capability] === true);
}

export function courseAudienceForRole(roleKey: RoleKey): CourseV2Audience | null {
  if (roleKey === 'owner' || roleKey === 'admin') return 'institution';
  if (roleKey === 'teacher' || roleKey === 'assistant') return 'teacher';
  if (roleKey === 'student') return 'student';
  return null;
}
