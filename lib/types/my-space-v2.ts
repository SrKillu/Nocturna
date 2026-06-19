import type { Capabilities, CapabilityKey } from '@/lib/types/auth';

export type MySpaceV2Priority = 'high' | 'medium' | 'low';
export type MySpaceV2Tone = 'success' | 'info' | 'warning' | 'neutral';

export interface MySpaceV2Course {
  id: string;
  name: string;
  code: string;
  teacherName: string;
  scheduleLabel: string;
  progressLabel: string;
}

export interface MySpaceV2Action {
  id: string;
  title: string;
  courseName: string;
  dueLabel: string;
  priority: MySpaceV2Priority;
}

export interface MySpaceV2Attendance {
  percent: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  trendLabel: string;
}

export interface MySpaceV2Evaluation {
  id: string;
  title: string;
  courseName: string;
  resultLabel: string;
  tone: MySpaceV2Tone;
}

export interface MySpaceV2Feedback {
  id: string;
  courseName: string;
  comment: string;
  dateLabel: string;
}

export interface MySpaceV2ViewModel {
  studentCode: string;
  periodLabel: string;
  summary: string;
  courses: readonly MySpaceV2Course[];
  nextActions: readonly MySpaceV2Action[];
  attendance: MySpaceV2Attendance;
  evaluations: readonly MySpaceV2Evaluation[];
  feedback: readonly MySpaceV2Feedback[];
}

export const MY_SPACE_V2_REQUIRED_CAPABILITY =
  'canSubmit' as const satisfies CapabilityKey;

export const MY_SPACE_V2_EXCLUDED_CAPABILITIES = [
  'canManageInstitution',
  'canManageCourses',
  'canGrade',
] as const satisfies readonly CapabilityKey[];

export function canAccessMySpaceV2(capabilities: Capabilities): boolean {
  return (
    capabilities[MY_SPACE_V2_REQUIRED_CAPABILITY] === true &&
    MY_SPACE_V2_EXCLUDED_CAPABILITIES.every(
      (capability) => capabilities[capability] !== true
    )
  );
}
