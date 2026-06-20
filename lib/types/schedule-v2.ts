import type { Capabilities, CapabilityKey, RoleKey } from '@/lib/types/auth';

export type ScheduleV2Day = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
export type ScheduleV2Status = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled' | 'pending';
export type ScheduleV2Type = 'regular' | 'laboratory' | 'evaluation' | 'tutorial' | 'meeting';
export type ScheduleV2Conflict = 'none' | 'room' | 'teacher' | 'capacity';
export type ScheduleV2Audience = 'institution' | 'teacher';

export interface ScheduleV2Session {
  id: string;
  day: ScheduleV2Day;
  dayLabel: string;
  startTime: string;
  endTime: string;
  courseId: string;
  courseLabel: string;
  sectionLabel: string;
  teacherLabel: string;
  roomLabel: string;
  status: ScheduleV2Status;
  type: ScheduleV2Type;
  conflict: ScheduleV2Conflict;
  audiences: readonly ScheduleV2Audience[];
}
export interface ScheduleV2Summary { scheduledSessions: number; occupiedRooms: number; conflicts: number; nextSessionLabel: string; }
export interface ScheduleV2ConflictItem { id: string; title: string; detail: string; type: Exclude<ScheduleV2Conflict, 'none'>; }
export interface ScheduleV2Fixture { summary: ScheduleV2Summary; sessions: readonly ScheduleV2Session[]; conflicts: readonly ScheduleV2ConflictItem[]; upcoming: readonly ScheduleV2Session[]; disclaimer: string; }
export interface ScheduleV2FilterState { query: string; courseId: string | 'all'; section: string | 'all'; teacher: string | 'all'; room: string | 'all'; day: ScheduleV2Day | 'all'; status: ScheduleV2Status | 'all'; }

export const SCHEDULE_V2_CAPABILITIES = ['canViewSchedule'] as const satisfies readonly CapabilityKey[];
export const SCHEDULE_V2_ROLES = ['owner', 'admin', 'teacher', 'assistant'] as const satisfies readonly RoleKey[];

export function canAccessScheduleV2(roleKey: RoleKey, capabilities: Capabilities): boolean {
  return SCHEDULE_V2_ROLES.includes(roleKey as (typeof SCHEDULE_V2_ROLES)[number]) && capabilities.canViewSchedule === true;
}
export function scheduleAudienceForRole(roleKey: RoleKey): ScheduleV2Audience | null {
  if (roleKey === 'owner' || roleKey === 'admin') return 'institution';
  if (roleKey === 'teacher' || roleKey === 'assistant') return 'teacher';
  return null;
}
export function filterScheduleV2(sessions: readonly ScheduleV2Session[], filters: ScheduleV2FilterState): readonly ScheduleV2Session[] {
  const query = filters.query.trim().toLocaleLowerCase('es');
  return sessions.filter((session) =>
    (query.length === 0 || [session.courseLabel, session.sectionLabel, session.teacherLabel, session.roomLabel].some((value) => value.toLocaleLowerCase('es').includes(query))) &&
    (filters.courseId === 'all' || session.courseId === filters.courseId) &&
    (filters.section === 'all' || session.sectionLabel === filters.section) &&
    (filters.teacher === 'all' || session.teacherLabel === filters.teacher) &&
    (filters.room === 'all' || session.roomLabel === filters.room) &&
    (filters.day === 'all' || session.day === filters.day) &&
    (filters.status === 'all' || session.status === filters.status)
  );
}
export function groupScheduleByDay(sessions: readonly ScheduleV2Session[]): Record<ScheduleV2Day, ScheduleV2Session[]> {
  const groups: Record<ScheduleV2Day, ScheduleV2Session[]> = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [] };
  sessions.forEach((session) => groups[session.day].push(session));
  Object.values(groups).forEach((items) => items.sort((a, b) => a.startTime.localeCompare(b.startTime)));
  return groups;
}
