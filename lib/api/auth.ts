import { createClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/errors';
import {
  validateSession,
  sessionErrorToApiError,
  SessionValidationError,
} from '@/lib/auth/session';
import { hasCapability, legacyRoleToRoleKey } from '@/lib/rbac/capabilities';
import type { AuthenticatedContext, CapabilityKey } from '@/lib/types/auth';
import type { UserRole } from '@/lib/types/database';

/**
 * Returns the fully validated authenticated context for a route handler.
 * Maps SessionValidationError -> ApiError so the unified toApiErrorResponse()
 * handler can render the right status/code.
 */
export async function requireAuth(): Promise<AuthenticatedContext> {
  try {
    return await validateSession();
  } catch (err) {
    if (err instanceof SessionValidationError) {
      throw sessionErrorToApiError(err);
    }
    throw err;
  }
}

export function requireRole(
  ctx: AuthenticatedContext,
  allowed: readonly UserRole[]
): void {
  if (!allowed.includes(ctx.role)) {
    throw new ApiError('FORBIDDEN', `Role "${ctx.role}" not allowed`);
  }
}

export function requireCapability(
  ctx: AuthenticatedContext,
  capability: CapabilityKey
): void {
  const roleKey = legacyRoleToRoleKey(ctx.role);
  if (!hasCapability(roleKey, capability)) {
    throw new ApiError('FORBIDDEN', `Capability "${capability}" not allowed`);
  }
}

// Re-export so existing imports keep working.
export { createClient };
