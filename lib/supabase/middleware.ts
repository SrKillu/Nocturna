import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { UserRole } from '@/lib/types/database';
import { isSupabaseConfigured } from '@/lib/supabase/env';

const PUBLIC_PAGE_PREFIXES = ['/login', '/signup', '/auth', '/'];
const PUBLIC_API_PREFIXES = ['/api/health', '/api/auth/signup'];

function isPublicPage(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_PAGE_PREFIXES.some(
    (p) => p !== '/' && (pathname === p || pathname.startsWith(`${p}/`))
  );
}

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next({ request: { headers: request.headers } });

  // Boot-time safety net: if Supabase env vars are placeholders, skip auth work.
  // Protected pages/APIs will still reject requests via requireAuth().
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

  // IMPORTANT: getUser() revalidates the token on every request.
  // Never use getSession() for authz decisions.
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

  // Unauthenticated
  if (!user) {
    if (isApi && !isPublicApi(pathname)) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } },
        { status: 401 }
      );
    }
    if (isDashboard) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }
    return innerResponse;
  }

  // Authenticated: enforce admin-only APIs.
  if (isAdminApi) {
    const authUser = user as { app_metadata?: Record<string, unknown> };
    const meta = (authUser.app_metadata ?? {}) as { user_role?: UserRole };
    const role = meta.user_role;
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
