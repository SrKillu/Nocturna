import { createClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/errors';
import type { AuthenticatedContext } from '@/lib/types/auth';
import type { UserRole } from '@/lib/types/database';

/**
 * Returns the authenticated context for a route handler, or throws ApiError.
 * NEVER trust institution_id from the request body.
 */
export async function requireAuth(): Promise<AuthenticatedContext> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ApiError('UNAUTHORIZED', 'User not authenticated');
  }

  // JWT custom claims from the access token hook.
  const meta = (user.app_metadata ?? {}) as {
    user_role?: UserRole;
    institution_id?: string;
  };

  let role = meta.user_role;
  let institutionId = meta.institution_id ?? null;

  // Fallback: read role/institution from profiles if claims not yet propagated.
  if (!role || !institutionId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, institution_id')
      .eq('id', user.id)
      .single();
    role = (profile?.role as UserRole | undefined) ?? role;
    institutionId = profile?.institution_id ?? institutionId;
  }

  if (!role) {
    throw new ApiError('FORBIDDEN', 'Missing role claim');
  }
  if (!institutionId) {
    throw new ApiError('FORBIDDEN', 'Missing institution context');
  }

  return {
    user,
    userId: user.id,
    role,
    institutionId,
    email: user.email ?? '',
  };
}

export function requireRole(
  ctx: AuthenticatedContext,
  allowed: readonly UserRole[]
): void {
  if (!allowed.includes(ctx.role)) {
    throw new ApiError('FORBIDDEN', `Role "${ctx.role}" not allowed`);
  }
}
