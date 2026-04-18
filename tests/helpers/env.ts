/**
 * Environment detection for the Nocturna test suite.
 *
 * The E2E tests talk to a real Supabase project (RLS, JWT invalidation, audit
 * log). They are expensive and destructive, so we gate them behind an explicit
 * credentials check. When the credentials are placeholders the suites call
 * `it.skipIf(!hasRealSupabase())` and stay inert instead of failing.
 */

import 'dotenv/config';

const PLACEHOLDERS = new Set([
  '',
  'YOUR_URL',
  'YOUR_ANON_KEY',
  'YOUR_SERVICE_KEY',
]);

function looksReal(value: string | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (PLACEHOLDERS.has(trimmed)) return false;
  if (trimmed.startsWith('YOUR_')) return false;
  return true;
}

export interface SupabaseEnv {
  url: string;
  anonKey: string;
  serviceKey: string;
}

export function hasRealSupabase(): boolean {
  return (
    looksReal(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    looksReal(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
    looksReal(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

export function supabaseEnv(): SupabaseEnv {
  if (!hasRealSupabase()) {
    throw new Error(
      'Supabase credentials are not configured. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY to run E2E tests.'
    );
  }
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  };
}

/**
 * Forced E2E run: set `NOCTURNA_E2E=1` to demand E2E tests even if creds look
 * placeholder-ish. Useful when wiring up CI secrets that aren't `YOUR_*`.
 */
export function e2eRequired(): boolean {
  return process.env.NOCTURNA_E2E === '1';
}
