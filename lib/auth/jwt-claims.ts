import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserRole } from '@/lib/types/database';

/**
 * JWT claims we care about server-side.
 *
 * ⚠️  Why this file exists
 * ------------------------
 * `supabase.auth.getUser()` returns `user.app_metadata`, but **that object
 * reflects `auth.users.raw_app_meta_data` — NOT the claims in the access
 * token**. The Custom Access Token Hook (0008) injects `session_version`,
 * `is_active`, etc. into the JWT body; it does NOT write them back to
 * `auth.users.raw_app_meta_data`. Therefore reading those claims from
 * `user.app_metadata` yields `undefined`, which triggers false
 * `session_expired` / `invalid_profile` redirects.
 *
 * The hook mirrors the critical claims to the JWT top-level precisely so we
 * can decode the access token server-side and read them from there. That is
 * what this helper does: it merges app_metadata + top-level and returns a
 * single normalised record.
 */
export interface NormalizedClaims {
  user_role?: UserRole;
  institution_id?: string;
  is_active?: boolean;
  session_version?: number;
}

/** Decode a JWT payload WITHOUT verifying the signature. Safe to use ONLY
 *  when the signature has already been validated (we validate via
 *  `supabase.auth.getUser()` which hits the Auth server).
 *  Edge-runtime safe: avoids Node-only `Buffer`. */
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // base64url → base64 with padding
    const b64 =
      payload.replace(/-/g, '+').replace(/_/g, '/') +
      '='.repeat((4 - (payload.length % 4)) % 4);
    // decode → UTF-8
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder('utf-8').decode(bytes);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function normalize(payload: Record<string, unknown>): NormalizedClaims {
  const appMeta = (payload.app_metadata ?? {}) as Record<string, unknown>;

  const pick = <T>(key: string): T | undefined => {
    const v = appMeta[key] ?? payload[key];
    return v === null ? undefined : (v as T);
  };

  const rawRole = pick<string>('user_role');
  const rawInst = pick<string>('institution_id');
  const rawActive = pick<boolean | string>('is_active');
  const rawVer = pick<number | string>('session_version');

  return {
    user_role: rawRole as UserRole | undefined,
    institution_id: rawInst ? String(rawInst) : undefined,
    is_active:
      rawActive === undefined
        ? undefined
        : typeof rawActive === 'string'
          ? rawActive === 'true'
          : Boolean(rawActive),
    session_version:
      rawVer === undefined
        ? undefined
        : Number.isFinite(Number(rawVer))
          ? Number(rawVer)
          : undefined,
  };
}

/**
 * Read the normalised claims of the *current* access token.
 * Returns `null` if there is no active session.
 *
 * Uses `getSession()` only to obtain the raw access_token string for decoding;
 * the caller must have already validated authenticity via `getUser()`.
 */
export async function readCurrentJwtClaims(
  supabase: SupabaseClient
): Promise<NormalizedClaims | null> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return normalize(payload);
}
