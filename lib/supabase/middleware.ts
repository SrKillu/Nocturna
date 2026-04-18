import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { UserRole } from '@/lib/types/database';
import { isSupabaseConfigured } from '@/lib/supabase/env';

const PUBLIC_PAGE_PREFIXES = ['/login', '/signup', '/auth', '/'];
const PUBLIC_API_PREFIXES = ['/api/health', '/api/auth/signup', '/api/auth/logout'];

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Wipes every Supabase auth cookie on the given response.
 * Used when the session is structurally broken (no profile, inactive, expired).
 */
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
  // Carry over any Set-Cookie headers the caller prepared, then add the clears.
  response.cookies.getAll().forEach((c) => res.cookies.set(c));
  clearAuthCookies(request, res);
  return res;
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next({ request: { headers: request.headers } });

  // Boot-time safety net: if Supabase env vars are placeholders, skip auth work.
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
          innerResponse = NextResponse.next({ request: { headers: request.headers } });
          innerResponse.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          innerResponse = NextResponse.next({ request: { headers: request.headers } });
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

  // Unauthenticated ---------------------------------------------------
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

  // Authenticated: claim-shape gate. ----------------------------------
  const authUser = user as { app_metadata?: Record<string, unknown> };
  const appMeta = (authUser.app_metadata ?? {}) as {
    user_role?: UserRole;
    institution_id?: string;
    is_active?: boolean;
  };
  const role = appMeta.user_role;
  const institutionId = appMeta.institution_id;
  const isActive = appMeta.is_active !== false; // undefined defaults to true at this layer; SSR requireAuth will re-check DB.

  // Missing role claim -> profile missing -> force logout via cookie wipe.
  if (!role) {
    if (isApi && !isPublicApi(pathname)) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Invalid profile' } },
        { status: 403 }
      );
    }
    if (isDashboard) {
      return redirectToLogin(request, innerResponse, 'invalid_profile');
    }
    return innerResponse;
  }

  // Missing institution_id claim -> inactive or hook rejected -> deny protected access.
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

  // Admin API gate -----------------------------------------------------
  if (isAdminApi) {
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin role required' } },
        { status: 403 }
      );
    }
  }

  // Logged-in users hitting login/signup should go to dashboard.
  if (pathname === '/login' || pathname === '/signup') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return innerResponse;
}
