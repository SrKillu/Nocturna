import type { Capabilities, CapabilityKey, RoleKey } from '@/lib/types/auth';

export type EnrollmentV2Status =
  | 'active'
  | 'pending'
  | 'suspended'
  | 'completed'
  | 'withdrawn'
  | 'review';
export type EnrollmentV2Type =
  | 'regular'
  | 'extraordinary'
  | 'transfer'
  | 'returning'
  | 'agreement';
export type EnrollmentV2Risk = 'on_track' | 'watch' | 'priority';
export type EnrollmentV2Period = 'current' | 'previous';

export interface EnrollmentV2ListItem {
  id: string;
  studentLabel: string;
  studentCode: string;
  courseId: string;
  courseLabel: string;
  sectionLabel: string;
  period: EnrollmentV2Period;
  periodLabel: string;
  status: EnrollmentV2Status;
  type: EnrollmentV2Type;
  capacityLabel: string;
  risk: EnrollmentV2Risk;
  riskLabel: string;
  nextAction: string;
}

export interface EnrollmentsV2Summary {
  activeEnrollments: number;
  pendingChanges: number;
  availableSeats: number;
  assignmentAlerts: number;
}

export interface EnrollmentV2CapacityItem {
  id: string;
  courseLabel: string;
  sectionLabel: string;
  occupied: number;
  capacity: number;
}

export interface EnrollmentV2ChangeItem {
  id: string;
  title: string;
  detail: string;
  dateLabel: string;
  statusLabel: string;
}

export interface EnrollmentsV2Fixture {
  summary: EnrollmentsV2Summary;
  enrollments: readonly EnrollmentV2ListItem[];
  capacity: readonly EnrollmentV2CapacityItem[];
  changes: readonly EnrollmentV2ChangeItem[];
  disclaimer: string;
}

export interface EnrollmentV2FilterState {
  query: string;
  courseId: string | 'all';
  section: string | 'all';
  status: EnrollmentV2Status | 'all';
  period: EnrollmentV2Period | 'all';
  type: EnrollmentV2Type | 'all';
  risk: EnrollmentV2Risk | 'all';
}

export const ENROLLMENTS_V2_CAPABILITIES = [
  'canManageCourses',
] as const satisfies readonly CapabilityKey[];
export const ENROLLMENTS_V2_ROLES = [
  'owner',
  'admin',
] as const satisfies readonly RoleKey[];

export function canAccessEnrollmentsV2(
  roleKey: RoleKey,
  capabilities: Capabilities
): boolean {
  return (
    ENROLLMENTS_V2_ROLES.includes(
      roleKey as (typeof ENROLLMENTS_V2_ROLES)[number]
    ) && capabilities.canManageCourses === true
  );
}

export function filterEnrollmentsV2(
  enrollments: readonly EnrollmentV2ListItem[],
  filters: EnrollmentV2FilterState
): readonly EnrollmentV2ListItem[] {
  const query = filters.query.trim().toLocaleLowerCase('es');
  return enrollments.filter((enrollment) => {
    const matchesQuery =
      query.length === 0 ||
      [
        enrollment.studentLabel,
        enrollment.studentCode,
        enrollment.courseLabel,
        enrollment.sectionLabel,
      ].some((value) => value.toLocaleLowerCase('es').includes(query));
    return (
      matchesQuery &&
      (filters.courseId === 'all' || enrollment.courseId === filters.courseId) &&
      (filters.section === 'all' || enrollment.sectionLabel === filters.section) &&
      (filters.status === 'all' || enrollment.status === filters.status) &&
      (filters.period === 'all' || enrollment.period === filters.period) &&
      (filters.type === 'all' || enrollment.type === filters.type) &&
      (filters.risk === 'all' || enrollment.risk === filters.risk)
    );
  });
}
