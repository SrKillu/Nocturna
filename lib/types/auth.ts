import type { User } from '@supabase/supabase-js';
import type { UserRole } from './database';

export type LegacyUserRole = UserRole;

export type RoleKey =
  | 'owner'
  | 'admin'
  | 'teacher'
  | 'assistant'
  | 'student'
  | 'guardian'
  | 'support';

export type MembershipStatus = 'active' | 'invited' | 'suspended' | 'left';

export type InstitutionStatus = 'active' | 'trial' | 'suspended' | 'archived';

export type CapabilityKey =
  | 'canManageInstitution'
  | 'canViewInstitutionSettings'
  | 'canManageUsers'
  | 'canManageCourses'
  | 'canManageSections'
  | 'canGrade'
  | 'canSubmit'
  | 'canViewReports'
  | 'canManageMaterials'
  | 'canUseChat'
  | 'canManageAttendance'
  | 'canManageCertificates';

export type Capabilities = Partial<Record<CapabilityKey, boolean>>;

/**
 * JWT custom claims injected via Supabase Custom Access Token Hook.
 * See /app/supabase/migrations/0003_auth_hook.sql
 *
 * @deprecated V1 claims are retained for compatibility during Batch A. V2
 * authorization must validate membership state against the database.
 */
export interface NocturnaJwtClaims {
  user_role: UserRole;
  institution_id: string | null;
}

export interface NocturnaJwtClaimsV2 {
  active_membership_id?: string;
  role_key?: RoleKey;
  institution_id?: string;
  session_version?: number;
}

export interface ProfileSummary {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
}

export interface MembershipSummary {
  membershipId: string;
  institutionId: string;
  institutionName: string;
  institutionSlug?: string | null;
  roleKey: RoleKey;
  status: MembershipStatus;
  institutionStatus: InstitutionStatus;
  joinedAt?: string | null;
}

export interface ActiveMembershipContext {
  userId: string;
  profileId: string;
  institutionId: string;
  membershipId: string;
  roleKey: RoleKey;
  institutionStatus: InstitutionStatus;
  membershipStatus: MembershipStatus;
  capabilities: Capabilities;
}

export interface AuthenticatedUserContext {
  user: User;
  userId: string;
  profileId: string;
  email: string;
  profile: ProfileSummary;
}

export interface SessionContext extends AuthenticatedUserContext {
  memberships: MembershipSummary[];
  activeMembership: ActiveMembershipContext | null;
  membershipRequired: boolean;
}

export interface AuthMeResponse {
  profile: ProfileSummary;
  memberships: MembershipSummary[];
  activeMembership: ActiveMembershipContext | null;
  membershipRequired: boolean;
  capabilities: Capabilities;
}

/**
 * @deprecated V1 authenticated context. Keep this shape during Batch A so
 * existing routes, middleware, services, and UI continue to compile until the
 * runtime auth migration happens in later batches.
 */
export interface AuthenticatedContext {
  user: User;
  userId: string;
  role: UserRole;
  institutionId: string;
  email: string;
}

export type LegacyAuthenticatedContext = AuthenticatedContext;
