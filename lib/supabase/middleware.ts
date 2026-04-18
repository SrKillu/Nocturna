import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { UserRole } from '@/lib/types/database';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { buildCsp, generateNonce } from '@/lib/security/csp';
import {
  ensureCsrfCookie,
  needsCsrfCheck,
  validateCsrf,
  CsrfError,
} from '@/lib/security/csrf';
import { sanitizeNextParam } from '@/lib/security/next-param';
import { readCurrentJwtClaims } from '@/lib/auth/jwt-claims';

const PUBLIC_API_PREFIXES = ['/api/health', '/api/auth/signup', '/api/auth/logout'];
const AUTH_PAGES = new Set(['/login', '/signup']);

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isProtectedApi(pathname: string): boolean {
  return pathname.startsWith('/api') && !isPublicApi(pathname);
}

const PROTECTED_PAGE_PREFIXES = [
  '/dashboard',
  '/courses',
  '/tasks',
  '/submissions',
  '/grades',
  '/admin',
  '/teachers',
  '/materials',
  '/chat',
  '/invites',
  '/invite',
];

function isProtectedPage(pathname: string): boolean {
  return PROTECTED_PAGE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function applySecurityHeaders(
  request: NextRequest,
  response: NextResponse,
  nonce: string
): void {
  response.headers.set('x-nonce', nonce);
  response.headers.set('Content-Security-Policy', buildCsp(nonce));
  ensureCsrfCookie(request, response);
}

function clearAuthCookies(request: NextRequest, response: NextResponse): void {
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')) {
      response.cookies.set({ name: cookie.name, value: '', maxAge: 0, path: '/' });
    }
  }
}

function logDeny(request: NextRequest, reason: string, detail?: string): void {
  // Structured one-liner; easy to grep (`[mw:deny]`) and to forward to an
  // external log sink later without changing any caller. For CSRF failures we
  // include extra forensic fields (origin/referer/host) because they're the
  // only way to tell trusted-proxy misconfigurations from real attacks.
  const payload: Record<string, unknown> = {
    method: request.method,
    path: request.nextUrl.pathname,
    reason,
    detail,
    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown',
    ua: request.headers.get('user-agent')?.slice(0, 120) ?? 'n/a',
  };
  if (reason === 'csrf') {
    payload.origin = request.headers.get('origin') ?? null;
    payload.referer = request.headers.get('referer') ?? null;
    payload.host = request.headers.get('host') ?? null;
    payload.xfHost = request.headers.get('x-forwarded-host') ?? null;
  }
  // eslint-disable-next-line no-console
  console.warn('[mw:deny]', payload);
}

function redirectToLogin(
  request: NextRequest,
  reason: string,
  nextPath?: string
): NextResponse {
  // Loop guard: if we're already on /login, just let it render.
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.next({ request });
  }
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  url.searchParams.set('error', reason);
  if (nextPath) {
    const safe = sanitizeNextParam(nextPath, '/dashboard');
    if (safe !== '/dashboard') url.searchParams.set('next', safe);
  }
  const res = NextResponse.redirect(url);
  clearAuthCookies(request, res);
  return res;
}

function jsonError(
  status: 401 | 403 | 503,
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'INTERNAL_ERROR',
  message: string
): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const nonce = generateNonce();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', buildCsp(nonce));

  // We never return a raw NextResponse.next() without our security headers /
  // CSRF cookie stamped in, so every return goes through innerResponse.
  let innerResponse = NextResponse.next({ request: { headers: requestHeaders } });
  applySecurityHeaders(request, innerResponse, nonce);

  // 1. CSRF guard on every mutating request.
  if (needsCsrfCheck(request)) {
    try {
      validateCsrf(request);
    } catch (err) {
      if (err instanceof CsrfError) {
        logDeny(request, 'csrf', err.code);
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: `csrf:${err.code}` } },
          { status: 403 }
        );
      }
      throw err;
    }
  }

  // 2. Placeholder mode while Supabase creds are missing.
  if (!isSupabaseConfigured()) {
    const pathname = request.nextUrl.pathname;
    if (isProtectedApi(pathname)) {
      return jsonError(
        503,
        'INTERNAL_ERROR',
        'Supabase no está configurado. Completa NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY en /app/.env.'
      );
    }
    if (isProtectedPage(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    return innerResponse;
  }

  // 3. Supabase SSR client. All cookie mutations propagate into innerResponse.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          innerResponse = NextResponse.next({ request: { headers: requestHeaders } });
          applySecurityHeaders(request, innerResponse, nonce);
          innerResponse.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          innerResponse = NextResponse.next({ request: { headers: requestHeaders } });
          applySecurityHeaders(request, innerResponse, nonce);
          innerResponse.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // 4. Authoritative getUser() - never trust getSession() for authz.
  let user: {
    id: string;
    app_metadata?: Record<string, unknown>;
  } | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user as typeof user;
  } catch {
    user = null;
  }

  const pathname = request.nextUrl.pathname;
  const protectedApi = isProtectedApi(pathname);
  const protectedPage = isProtectedPage(pathname);
  const isAdminApi = pathname.startsWith('/api/admin');

  // --- Unauthenticated ---------------------------------------------------
  if (!user) {
    if (protectedApi) {
      logDeny(request, 'not_authenticated');
      return jsonError(401, 'UNAUTHORIZED', 'User not authenticated');
    }
    if (protectedPage) {
      logDeny(request, 'not_authenticated');
      return redirectToLogin(request, 'not_authenticated', pathname);
    }
    if (AUTH_PAGES.has(pathname)) return innerResponse;
    return innerResponse;
  }

  // --- Authenticated -----------------------------------------------------
  // IMPORTANT: `user.app_metadata` reflects auth.users.raw_app_meta_data
  // (stored in the DB), NOT the actual claims minted by the Custom Access
  // Token Hook. Reading it directly misses hook-injected claims such as
  // `session_version` and `is_active`. We therefore decode the real JWT.
  const rawClaims = (await readCurrentJwtClaims(supabase)) ?? {};
  const claims: {
    user_role?: UserRole;
    institution_id?: string;
    is_active?: boolean;
    session_version?: number;
  } = rawClaims;

  // Already logged in but hitting auth pages -> send to dashboard.
  if (AUTH_PAGES.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // JWT-claim gate (first layer). Missing claims == missing profile or inactive.
  if (!claims.user_role) {
    logDeny(request, 'missing_role_claim');
    if (protectedApi) return jsonError(403, 'FORBIDDEN', 'Invalid profile');
    if (protectedPage) return redirectToLogin(request, 'invalid_profile');
    return innerResponse;
  }
  if (!claims.institution_id) {
    logDeny(request, 'missing_tenant_claim', String(claims.is_active ?? 'unknown'));
    if (protectedApi) return jsonError(403, 'FORBIDDEN', 'Missing institution context');
    if (protectedPage) {
      return redirectToLogin(
        request,
        claims.is_active === false ? 'inactive_account' : 'missing_tenant'
      );
    }
    return innerResponse;
  }

  // DB gate (second, authoritative layer). Runs ONLY for protected routes so
  // we keep static asset traffic cheap.
  if (protectedApi || protectedPage) {
    const authenticatedUser = user as { id: string; app_metadata?: Record<string, unknown> };
    const {
      data: profile,
      error: profileErr,
    } = await supabase
      .from('profiles')
      .select('role, institution_id, is_active, session_version')
      .eq('id', authenticatedUser.id)
      .maybeSingle();

    if (profileErr) {
      logDeny(request, 'profile_query_error', profileErr.message);
      if (protectedApi) return jsonError(503, 'INTERNAL_ERROR', 'Auth lookup failed');
      return redirectToLogin(request, 'invalid_profile');
    }

    const row = profile as
      | {
          role: UserRole;
          institution_id: string | null;
          is_active: boolean;
          session_version: number;
        }
      | null;

    if (!row) {
      logDeny(request, 'no_profile');
      if (protectedApi) return jsonError(403, 'FORBIDDEN', 'Invalid profile');
      return redirectToLogin(request, 'invalid_profile');
    }
    if (!row.is_active) {
      logDeny(request, 'inactive_account');
      if (protectedApi) return jsonError(403, 'FORBIDDEN', 'Account is inactive');
      return redirectToLogin(request, 'inactive_account');
    }
    if (!row.institution_id) {
      logDeny(request, 'missing_tenant_db');
      if (protectedApi) return jsonError(403, 'FORBIDDEN', 'Missing institution context');
      return redirectToLogin(request, 'missing_tenant');
    }
    // Session invalidation: JWT claim must match DB counter.
    const jwtVersion = Number.isFinite(claims.session_version) ? Number(claims.session_version) : -1;
    if (jwtVersion !== row.session_version) {
      logDeny(request, 'session_expired', `jwt=${jwtVersion} db=${row.session_version}`);
      if (protectedApi) return jsonError(401, 'UNAUTHORIZED', 'Session expired');
      return redirectToLogin(request, 'session_expired', pathname);
    }
    // Role must match between JWT and DB (defends against stale tokens after
    // a role change where session_version bump didn't propagate yet).
    if (row.role !== claims.user_role) {
      logDeny(request, 'role_mismatch', `jwt=${claims.user_role} db=${row.role}`);
      if (protectedApi) return jsonError(401, 'UNAUTHORIZED', 'Session stale');
      return redirectToLogin(request, 'session_expired', pathname);
    }

    // /api/admin/* additional role check using the DB role (authoritative).
    if (isAdminApi && row.role !== 'admin' && row.role !== 'super_admin') {
      logDeny(request, 'admin_role_required', row.role);
      return jsonError(403, 'FORBIDDEN', 'Admin role required');
    }
  } else if (isAdminApi) {
    // Unreachable (admin api is protected), but belt-and-suspenders.
    if (claims.user_role !== 'admin' && claims.user_role !== 'super_admin') {
      return jsonError(403, 'FORBIDDEN', 'Admin role required');
    }
  }

  return innerResponse;
}
