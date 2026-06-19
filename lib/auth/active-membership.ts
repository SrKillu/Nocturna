import 'server-only';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getCapabilitiesForRoleKey } from '@/lib/rbac/capabilities';
import type {
  ActiveMembershipContext,
  InstitutionStatus,
  MembershipStatus,
  MembershipSummary,
  ProfileSummary,
  RoleKey,
  SessionContext,
} from '@/lib/types/auth';

export const ACTIVE_MEMBERSHIP_COOKIE = 'active_membership_id';

export type SessionV2ErrorCode =
  | 'SESSION_NOT_AUTHENTICATED'
  | 'PROFILE_NOT_FOUND'
  | 'PROFILE_INACTIVE';

export class SessionV2ValidationError extends Error {
  public readonly code: SessionV2ErrorCode;

  constructor(code: SessionV2ErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

type ProfileV2Row = {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
};

type MembershipV2Row = {
  id: string;
  institution_id: string;
  profile_id: string;
  status: string;
  joined_at: string | null;
  roles: { key: string } | { key: string }[] | null;
  institutions:
    | { name: string; slug: string | null; status: string }
    | { name: string; slug: string | null; status: string }[]
    | null;
};

function firstJoin<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function isRoleKey(value: string | null | undefined): value is RoleKey {
  return (
    value === 'owner' ||
    value === 'admin' ||
    value === 'teacher' ||
    value === 'assistant' ||
    value === 'student' ||
    value === 'guardian' ||
    value === 'support'
  );
}

function isMembershipStatus(value: string): value is MembershipStatus {
  return value === 'active' || value === 'invited' || value === 'suspended' || value === 'left';
}

function isInstitutionStatus(value: string): value is InstitutionStatus {
  return value === 'active' || value === 'trial' || value === 'suspended' || value === 'archived';
}

function toProfileSummary(profile: ProfileV2Row): ProfileSummary {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    avatarUrl: null,
    isActive: profile.is_active,
  };
}

function toMembershipSummary(row: MembershipV2Row): MembershipSummary | null {
  const role = firstJoin(row.roles);
  const institution = firstJoin(row.institutions);
  if (!role || !isRoleKey(role.key) || !institution) return null;

  const status: MembershipStatus = isMembershipStatus(row.status) ? row.status : 'suspended';
  const institutionStatus: InstitutionStatus = isInstitutionStatus(institution.status)
    ? institution.status
    : 'suspended';

  return {
    membershipId: row.id,
    institutionId: row.institution_id,
    institutionName: institution.name,
    institutionSlug: institution.slug,
    roleKey: role.key,
    status,
    institutionStatus,
    joinedAt: row.joined_at,
  };
}

function toActiveMembershipContext(
  user: User,
  profile: ProfileV2Row,
  membership: MembershipSummary
): ActiveMembershipContext {
  return {
    userId: user.id,
    profileId: profile.id,
    institutionId: membership.institutionId,
    membershipId: membership.membershipId,
    roleKey: membership.roleKey,
    institutionStatus: membership.institutionStatus,
    membershipStatus: membership.status,
    capabilities: getCapabilitiesForRoleKey(membership.roleKey),
  };
}

export function readActiveMembershipIdCookie(): string | null {
  return cookies().get(ACTIVE_MEMBERSHIP_COOKIE)?.value ?? null;
}

export function resolveActiveMembership(
  user: User,
  profile: ProfileV2Row,
  memberships: MembershipSummary[],
  requestedMembershipId: string | null
): ActiveMembershipContext | null {
  const activeMemberships = memberships.filter(
    (membership) =>
      membership.status === 'active' &&
      (membership.institutionStatus === 'active' || membership.institutionStatus === 'trial')
  );

  const selected = requestedMembershipId
    ? activeMemberships.find((membership) => membership.membershipId === requestedMembershipId) ?? null
    : activeMemberships.length === 1
      ? activeMemberships[0]
      : null;

  if (!selected) return null;
  return toActiveMembershipContext(user, profile, selected);
}

export async function listMembershipsForUser(userId: string): Promise<MembershipSummary[]> {
  const admin = createServiceClient();
  const { data, error } = (await admin
    .from('institution_memberships')
    .select(
      `
        id,
        institution_id,
        profile_id,
        status,
        joined_at,
        roles:role_id (
          key
        ),
        institutions:institution_id (
          name,
          slug,
          status
        )
      `
    )
    .eq('profile_id', userId)
    .order('created_at', { ascending: true })) as {
    data: MembershipV2Row[] | null;
    error: unknown;
  };

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[auth:v2] membership query failed', error);
    throw error;
  }

  return (data ?? []).map(toMembershipSummary).filter((row): row is MembershipSummary => row !== null);
}

export async function validateActiveMembershipForUser(
  user: User,
  profile: ProfileV2Row,
  membershipId: string | null
): Promise<ActiveMembershipContext | null> {
  const memberships = await listMembershipsForUser(user.id);
  return resolveActiveMembership(user, profile, memberships, membershipId);
}

export async function getProfileForSessionV2(userId: string): Promise<ProfileV2Row> {
  const admin = createServiceClient();
  const { data: profile, error: profileErr } = (await admin
    .from('profiles')
    .select('id, email, full_name, is_active')
    .eq('id', userId)
    .maybeSingle()) as { data: ProfileV2Row | null; error: unknown };

  if (profileErr) {
    // eslint-disable-next-line no-console
    console.error('[auth:v2] profile query failed', profileErr);
    throw profileErr;
  }

  if (!profile || !profile.is_active) {
    throw new SessionV2ValidationError(
      profile ? 'PROFILE_INACTIVE' : 'PROFILE_NOT_FOUND'
    );
  }

  return profile;
}

export async function validateActiveMembershipIdForUser(
  user: User,
  membershipId: string
): Promise<ActiveMembershipContext | null> {
  const profile = await getProfileForSessionV2(user.id);
  return validateActiveMembershipForUser(user, profile, membershipId);
}

export async function validateSessionV2(): Promise<SessionContext> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new SessionV2ValidationError('SESSION_NOT_AUTHENTICATED');
  }

  const profile = await getProfileForSessionV2(user.id);
  const memberships = await listMembershipsForUser(user.id);
  const activeMembership = resolveActiveMembership(
    user,
    profile,
    memberships,
    readActiveMembershipIdCookie()
  );

  return {
    user,
    userId: user.id,
    profileId: profile.id,
    email: profile.email,
    profile: toProfileSummary(profile),
    memberships,
    activeMembership,
    membershipRequired: activeMembership === null,
  };
}
