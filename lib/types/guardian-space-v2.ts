import type { Capabilities, RoleKey } from '@/lib/types/auth';

export type GuardianSpaceV2Tone = 'success' | 'info' | 'warning' | 'neutral';
export type GuardianSpaceV2Priority = 'high' | 'medium' | 'low';

export interface GuardianStudentV2 {
  id: string;
  name: string;
  code: string;
  levelLabel: string;
  sectionLabel: string;
  academicStatus: string;
  attendancePercent: number;
  alertCount: number;
}

export interface GuardianAttendanceV2 {
  studentId: string;
  studentName: string;
  percent: number;
  trendLabel: string;
}

export interface GuardianEvaluationV2 {
  id: string;
  studentName: string;
  title: string;
  courseName: string;
  resultLabel: string;
  tone: GuardianSpaceV2Tone;
}

export interface GuardianAlertV2 {
  id: string;
  studentName: string;
  title: string;
  detail: string;
  tone: GuardianSpaceV2Tone;
}

export interface GuardianActionV2 {
  id: string;
  title: string;
  context: string;
  dueLabel: string;
  priority: GuardianSpaceV2Priority;
}

export interface GuardianCommunicationV2 {
  id: string;
  title: string;
  detail: string;
  dateLabel: string;
}

export interface GuardianSpaceV2ViewModel {
  periodLabel: string;
  summary: string;
  students: readonly GuardianStudentV2[];
  attendance: readonly GuardianAttendanceV2[];
  evaluations: readonly GuardianEvaluationV2[];
  alerts: readonly GuardianAlertV2[];
  nextActions: readonly GuardianActionV2[];
  communications: readonly GuardianCommunicationV2[];
}

export function canAccessGuardianSpaceV2(
  roleKey: RoleKey,
  capabilities: Capabilities
): boolean {
  return roleKey === 'guardian' && capabilities.canViewLinkedStudents === true;
}
