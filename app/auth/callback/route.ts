import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateSession, SessionValidationError } from '@/lib/auth/session';
import { sanitizeNextParam } from '@/lib/security/next-param';

export const runtime = 'nodejs';

/**
 * OAuth / magic-link callback.
 *   /auth/callback?code=<code>&next=<relative-path>
 *
 * Hardened rules:
 *   * `next` must be a local, relative path (starts with '/', no protocol, no '//').
 *   * After exchanging the code, the full validateSession() chain runs.
 *   * If validation fails we sign the user out and redirect to /login?error=<code>.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  const code = url.searchParams.get('code');
  const next = sanitizeNextParam(url.searchParams.get('next'), '/dashboard');

  if (!code) {
    // eslint-disable-next-line no-console
    console.warn('[auth:callback] missing_code');
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('error', 'invalid_callback');
    return NextResponse.redirect(url);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('[auth:callback] exchange_failed', error.message);
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('error', 'invalid_callback');
    return NextResponse.redirect(url);
  }

  // Full session validation (user + profile + is_active + institution_id + session_version).
  try {
    await validateSession();
  } catch (err) {
    await supabase.auth.signOut({ scope: 'local' });
    const reason = err instanceof SessionValidationError ? err.code : 'invalid_profile';
    // eslint-disable-next-line no-console
    console.warn('[auth:callback] session_invalid', reason);
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('error', reason);
    return NextResponse.redirect(url);
  }

  url.pathname = next;
  url.search = '';
  return NextResponse.redirect(url);
}
