import type { User } from '@supabase/supabase-js';
import type { UserRole } from './database';

/**
 * JWT custom claims injected via Supabase Custom Access Token Hook.
 * See /app/supabase/migrations/0003_auth_hook.sql
 */
export interface NocturnaJwtClaims {
  user_role: UserRole;
  institution_id: string | null;
}

export interface AuthenticatedContext {
  user: User;
  userId: string;
  role: UserRole;
  institutionId: string;
  email: string;
}
