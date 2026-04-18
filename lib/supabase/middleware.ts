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

const PUBLIC_API_PREFIXES = ['/api/health', '/api/auth/signup', '/api/auth/logout'];

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Applies the per-request security headers to a response.
 * (CSP is dynamic because it carries the per-request nonce.)
 */
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

function redirectToLogin(
  request: NextRequest,
  response: NextResponse,
  reason: string,
  redirectTo?: string
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  url.searchParams.set('error', reason);
  if (redirectTo) url.searchParams.set('redirectTo', redirectTo);
  const res = NextResponse.redirect(url);
  response.cookies.getAll().forEach((c) => res.cookies.set(c));
  clearAuthCookies(request, res);
  return res;
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const nonce = generateNonce();

  // Propagate the nonce into the downstream request so Next.js injects it
  // into its own <script> tags.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', buildCsp(nonce));

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  applySecurityHeaders(request, response, nonce);

  // 1. CSRF guard on every mutating request.
  if (needsCsrfCheck(request)) {
    try {
      validateCsrf(request);
    } catch (err) {
      if (err instanceof CsrfError) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: `csrf:${err.code}` } },
          { status: 403 }
        );
      }
      throw err;
    }
  }

  // 2. Placeholder-mode short-circuit until Supabase credentials are wired up.
  if (!isSupabaseConfigured()) {
    const pathname = request.nextUrl.pathname;
    if (pathname.startsWith('/api') && !pathname.startsWith('/api/health')) {
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message:
              'Supabase no está configurado. Completa NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY en /app/.env.',
          },
        },
        { status: 503 }
      );
    }
    if (pathname.startsWith('/dashboard')) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    return response;
  }

  let innerResponse = response;

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

  // NEVER use getSession() for authz. getUser() revalidates the token.
  let user: { id: string; app_metadata?: Record<string, unknown> } | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user as typeof user;
  } catch {
    user = null;
  }

  const pathname = request.nextUrl.pathname;
  const isApi = pathname.startsWith('/api');
  const isAdminApi = pathname.startsWith('/api/admin');
  const isDashboard = pathname.startsWith('/dashboard');

  if (!user) {
    if (isApi && !isPublicApi(pathname)) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } },
        { status: 401 }
      );
    }
    if (isDashboard) {
      return redirectToLogin(request, innerResponse, 'not_authenticated', pathname);
    }
    return innerResponse;
  }

  const authUser = user as { app_metadata?: Record<string, unknown> };
  const appMeta = (authUser.app_metadata ?? {}) as {
    user_role?: UserRole;
    institution_id?: string;
    is_active?: boolean;
  };
  const role = appMeta.user_role;
  const institutionId = appMeta.institution_id;
  const isActive = appMeta.is_active !== false;

  if (!role) {
    if (isApi && !isPublicApi(pathname)) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Invalid profile' } },
        { status: 403 }
      );
    }
    if (isDashboard) return redirectToLogin(request, innerResponse, 'invalid_profile');
    return innerResponse;
  }

  if (!institutionId) {
    if (isApi && !isPublicApi(pathname)) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Missing institution context' } },
        { status: 403 }
      );
    }
    if (isDashboard) {
      return redirectToLogin(
        request,
        innerResponse,
        isActive ? 'missing_tenant' : 'inactive_account'
      );
    }
    return innerResponse;
  }

  if (isAdminApi && role !== 'admin' && role !== 'super_admin') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin role required' } },
      { status: 403 }
    );
  }

  if (pathname === '/login' || pathname === '/signup') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return innerResponse;
}
