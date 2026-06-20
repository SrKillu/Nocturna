import type { Capabilities, RoleKey } from '@/lib/types/auth';

export type SettingsV2Status =
  | 'active'
  | 'configured'
  | 'review'
  | 'planned'
  | 'disabled';

export interface SettingsV2Summary {
  institutionName: string;
  activeAcademicPeriod: string;
  enabledModules: number;
  pendingConfiguration: number;
}

export interface SettingsV2Field {
  id: string;
  label: string;
  value: string;
  detail?: string;
  status?: SettingsV2Status;
}

export interface SettingsV2Panel {
  id:
    | 'institution-profile'
    | 'academic-config'
    | 'branding'
    | 'security'
    | 'roles'
    | 'integrations'
    | 'notifications';
  title: string;
  description: string;
  fields: readonly SettingsV2Field[];
}

export interface SettingsV2Fixture {
  summary: SettingsV2Summary;
  panels: readonly SettingsV2Panel[];
  disclaimer: string;
}

const SETTINGS_V2_ROLES: readonly RoleKey[] = ['owner', 'admin'];

export function canAccessSettingsV2(
  roleKey: RoleKey,
  capabilities: Capabilities
): boolean {
  return (
    SETTINGS_V2_ROLES.includes(roleKey) &&
    capabilities.canViewInstitutionSettings === true
  );
}
