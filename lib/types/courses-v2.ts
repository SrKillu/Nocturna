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
