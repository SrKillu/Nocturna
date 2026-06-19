import type { CapabilityKey, RoleKey } from '@/lib/types/auth';

export type DashboardV2Variant = 'institution' | 'teacher' | 'student' | 'staff';
export type DashboardV2Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type WorkQueuePriority = 'high' | 'medium' | 'low';

export interface DashboardV2Metric {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: DashboardV2Tone;
}

export interface DashboardV2WorkItem {
  id: string;
  priority: WorkQueuePriority;
  title: string;
  context: string;
  dueLabel?: string;
  actionLabel: string;
  requiredCapability?: CapabilityKey;
}

export interface DashboardV2ActivityItem {
  id: string;
  title: string;
  metadata: string;
  timestampLabel: string;
  tone: DashboardV2Tone;
}

export interface DashboardV2ViewModel {
  variant: DashboardV2Variant;
  heading: string;
  summary: string;
  primaryAction?: {
    label: string;
    requiredCapability?: CapabilityKey;
  };
  metrics: readonly DashboardV2Metric[];
  workQueue: readonly DashboardV2WorkItem[];
  activityTitle: string;
  activity: readonly DashboardV2ActivityItem[];
}

export function dashboardVariantForRole(roleKey: RoleKey): DashboardV2Variant {
  if (roleKey === 'owner' || roleKey === 'admin') return 'institution';
  if (roleKey === 'teacher' || roleKey === 'assistant') return 'teacher';
  if (roleKey === 'student') return 'student';
  return 'staff';
}
