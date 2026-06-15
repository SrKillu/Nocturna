import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ApiError } from '@/lib/errors';
import type { AuthenticatedContext } from '@/lib/types/auth';
import type { UserRole } from '@/lib/types/database';
import { readCurrentJwtClaims } from '@/lib/auth/jwt-claims';

/**
 * Unique, hardened server-side session validator.
 *
 * Rules (every one is mandatory):
 *   1. Supabase returns a user via getUser() (token re-validated against Auth server).
 *   2. The public.profiles row exists for that user.
 *   3. profiles.is_active = true
 *   4. profiles.institution_id is not null
 *   5. JWT claim session_version matches profiles.session_version
 *
 * On failure: throws ApiError with a structured `code` usable as ?error= query
 * parameter on the login page.
 *
 * NEVER trusts data coming from the request body / headers for any of these fields.
 */
export type SessionErrorCode =
  | 'not_authenticated'
  | 'invalid_profile'
  | 'inactive_account'
  | 'missing_tenant'
  | 'session_expired';

export class SessionValidationError extends Error {
  public readonly code: SessionErrorCode;
  constructor(code: SessionErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  institution_id: string | null;
  is_active: boolean;
  session_version: number;
}

export async function validateSession(): Promise<AuthenticatedContext> {
  const supabase = createClient();

  // 1. getUser() revalidates against the Auth server every time.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new SessionValidationError('not_authenticated');
  }

  // 2. Fetch the profile. RLS allows reading one's own profile within the same tenant.
  const { data: profile, error: profileErr } = (await supabase
    .from('profiles')
    .select('id, email, full_name, role, institution_id, is_active, session_version')
    .eq('id', user.id)
    .maybeSingle()) as { data: ProfileRow | null; error: unknown };

  if (profileErr) {
    // eslint-disable-next-line no-console
    console.error('[auth] validateSession profile query failed', profileErr);
    throw new SessionValidationError('invalid_profile');
  }

  if (!profile) {
    // eslint-disable-next-line no-console
    console.warn('[auth] user without profile', { userId: user.id });
    throw new SessionValidationError('invalid_profile');
  }

  // 3. Active flag.
  if (!profile.is_active) {
    throw new SessionValidationError('inactive_account');
  }

  // 4. Tenant binding.
  if (!profile.institution_id) {
    throw new SessionValidationError('missing_tenant');
  }

  // 5. Session version parity with the JWT claim.
  //    `user.app_metadata` reflects auth.users.raw_app_meta_data — NOT the
  //    hook-injected claims. Decode the real access token instead.
  const jwtClaims = (await readCurrentJwtClaims(supabase)) ?? {};
  const jwtVersion = jwtClaims.session_version ?? -1;

  if (jwtVersion !== profile.session_version) {
    throw new SessionValidationError('session_expired');
  }

  // All checks passed.
  return {
    user,
    userId: profile.id,
    role: profile.role,
    institutionId: profile.institution_id,
    email: profile.email,
  };
}

/**
 * Variante "loose" de validateSession: **NO** exige `institution_id` ni `is_active`.
 *
 * Pensada exclusivamente para endpoints del onboarding (consumir invitaciones,
 * pegar código de inscripción desde /auth/pending) y el /dashboard, que permite
 * entrar sin tenant y pide al usuario pegar su código de invitación in-place.
 *
 * Importante: usamos el `service client` ÚNICAMENTE para leer el profile propio
 * del usuario autenticado. Esto es necesario porque la RLS `profiles_select_tenant`
 * exige `institution_id = auth.institution_id()`, lo que impide al propio usuario
 * leer su perfil si aún no tiene institución. La auth sigue siendo la del user
 * (validada vía `getUser()` antes). Nunca exponer este client al cliente.
 */
export async function validateSessionLoose(): Promise<AuthenticatedContext> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new SessionValidationError('not_authenticated');
  }

  // Lectura autoritativa del profile. Sin service client podemos toparnos con
  // un user recién registrado sin tenant cuyo profile es invisible por RLS.
  const admin = createServiceClient();
  const { data: profile, error: profileErr } = (await admin
    .from('profiles')
    .select('id, email, full_name, role, institution_id, is_active, session_version')
    .eq('id', user.id)
    .maybeSingle()) as { data: ProfileRow | null; error: unknown };
  if (profileErr || !profile) {
    throw new SessionValidationError('invalid_profile');
  }

  return {
    user,
    userId: profile.id,
    role: profile.role,
    institutionId: profile.institution_id ?? '',
    email: profile.email,
  };
}


/**
 * Adapts SessionValidationError to the standard ApiError shape used by route handlers.
 */
export function sessionErrorToApiError(err: SessionValidationError): ApiError {
  switch (err.code) {
    case 'not_authenticated':
      return new ApiError('UNAUTHORIZED', 'User not authenticated');
    case 'inactive_account':
      return new ApiError('FORBIDDEN', 'Account is inactive');
    case 'missing_tenant':
      return new ApiError('FORBIDDEN', 'Missing institution context');
    case 'session_expired':
      return new ApiError('UNAUTHORIZED', 'Session expired, please sign in again');
    case 'invalid_profile':
    default:
      return new ApiError('FORBIDDEN', 'Invalid profile');
  }
}

export { validateSessionV2 } from './active-membership';
