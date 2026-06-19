import type { Capabilities, CapabilityKey, RoleKey } from '@/lib/types/auth';

export type AttendanceV2Audience = 'institution' | 'teacher';
export type AttendanceV2Status = 'present' | 'late' | 'absent' | 'pending';
export type AttendanceV2Alert = 'none' | 'watch' | 'priority';
export type AttendanceV2SessionStatus = 'recorded' | 'pending';

export interface AttendanceV2Record {
  id: string;
  studentName: string;
  studentCode: string;
  courseId: string;
  courseName: string;
  sectionLabel: string;
  period: 'today' | 'week' | 'month';
  lastSessionLabel: string;
  status: AttendanceV2Status;
  attendancePercent: number;
  alert: AttendanceV2Alert;
  nextAction: string;
  audiences: readonly AttendanceV2Audience[];
}

export interface AttendanceV2Session {
  id: string;
  courseName: string;
  sectionLabel: string;
  dateLabel: string;
  status: AttendanceV2SessionStatus;
  presentCount: number;
  expectedCount: number;
  audiences: readonly AttendanceV2Audience[];
}

export interface AttendanceV2Summary {
  averagePercent: number;
  pendingSessions: number;
  studentsWithAlerts: number;
  lastRecordedSessionLabel: string;
}

export interface AttendanceV2Fixture {
  summary: AttendanceV2Summary;
  records: readonly AttendanceV2Record[];
  sessions: readonly AttendanceV2Session[];
}

export interface AttendanceV2FilterState {
  query: string;
  courseId: string | 'all';
  section: string | 'all';
  period: AttendanceV2Record['period'] | 'all';
  status: AttendanceV2Status | 'all';
}

export const ATTENDANCE_V2_CAPABILITIES = [
  'canManageAttendance',
] as const satisfies readonly CapabilityKey[];

export function canAccessAttendanceV2(capabilities: Capabilities): boolean {
  return capabilities.canManageAttendance === true;
}

export function attendanceAudienceForRole(
  roleKey: RoleKey
): AttendanceV2Audience | null {
  if (roleKey === 'owner' || roleKey === 'admin') return 'institution';
  if (roleKey === 'teacher' || roleKey === 'assistant') return 'teacher';
  return null;
}

export function filterAttendanceV2(
  records: readonly AttendanceV2Record[],
  filters: AttendanceV2FilterState
): readonly AttendanceV2Record[] {
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
      (filters.status === 'all' || record.status === filters.status)
    );
  });
}
