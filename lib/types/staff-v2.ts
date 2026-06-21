import type { Capabilities, CapabilityKey, RoleKey } from '@/lib/types/auth';

export type StaffV2Role = 'admin' | 'teacher' | 'assistant';
export type StaffV2Status = 'active' | 'follow_up' | 'inactive';
export type StaffV2Area =
  | 'administration'
  | 'sciences'
  | 'languages'
  | 'humanities'
  | 'technology';
export type StaffV2Workload = 'balanced' | 'review' | 'available';

export interface StaffV2ListItem {
  id: string;
  displayName: string;
  staffCode: string;
  role: StaffV2Role;
  area: StaffV2Area;
  areaLabel: string;
  assignmentId: string;
  assignmentLabel: string;
  status: StaffV2Status;
  workload: StaffV2Workload;
  workloadLabel: string;
  nextAction: string;
}

export interface StaffV2Summary {
  activeStaff: number;
  teachers: number;
  assistants: number;
  pendingInvitations: number;
}

export interface StaffV2WorkloadItem {
  id: string;
  areaLabel: string;
  assignedPeople: number;
  assignedGroups: number;
  statusLabel: string;
}

export interface StaffV2InvitationPreview {
  id: string;
  roleLabel: string;
  areaLabel: string;
  requestedLabel: string;
  statusLabel: string;
}

export interface StaffV2Fixture {
  summary: StaffV2Summary;
  staff: readonly StaffV2ListItem[];
  workload: readonly StaffV2WorkloadItem[];
  invitations: readonly StaffV2InvitationPreview[];
  disclaimer: string;
}

export interface StaffV2FilterState {
  query: string;
  role: StaffV2Role | 'all';
  status: StaffV2Status | 'all';
  area: StaffV2Area | 'all';
  assignmentId: string | 'all';
}

export const STAFF_V2_CAPABILITIES = [
  'canViewStaff',
] as const satisfies readonly CapabilityKey[];
export const STAFF_V2_ROLES = [
  'owner',
  'admin',
] as const satisfies readonly RoleKey[];

export function canAccessStaffV2(
  roleKey: RoleKey,
  capabilities: Capabilities
): boolean {
  return (
    STAFF_V2_ROLES.includes(roleKey as (typeof STAFF_V2_ROLES)[number]) &&
    capabilities.canViewStaff === true
  );
}

export function filterStaffV2(
  staff: readonly StaffV2ListItem[],
  filters: StaffV2FilterState
): readonly StaffV2ListItem[] {
  const query = filters.query.trim().toLocaleLowerCase('es');

  return staff.filter((person) => {
    const matchesQuery =
      query.length === 0 ||
      [
        person.displayName,
        person.staffCode,
        person.areaLabel,
        person.assignmentLabel,
      ].some((value) => value.toLocaleLowerCase('es').includes(query));

    return (
      matchesQuery &&
      (filters.role === 'all' || person.role === filters.role) &&
      (filters.status === 'all' || person.status === filters.status) &&
      (filters.area === 'all' || person.area === filters.area) &&
      (filters.assignmentId === 'all' ||
        person.assignmentId === filters.assignmentId)
    );
  });
}
