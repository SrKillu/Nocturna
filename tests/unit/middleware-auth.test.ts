/**
 * T13 / T15 · Middleware guards (unit tier).
 *
 * These exercise the middleware's decision tree for:
 *   * unauthenticated requests to protected APIs / pages
 *   * CSRF failures on mutating requests
 *   * missing role/institution JWT claims
 *   * mismatched session_version (session expiration)
 *   * role mismatch between JWT and DB (stale token)
 *   * admin-API role enforcement
 *
 * Supabase is mocked so the test runs offline. The E2E tier (rls-isolation,
 * jwt-invalidation) still re-verifies these against a real database.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockRequest } from '../helpers/mock-request';
import { CSRF_COOKIE, CSRF_HEADER } from '@/lib/security/csrf';

vi.mock('@/lib/supabase/env', () => ({
  isSupabaseConfigured: () => true,
  assertSupabaseConfigured: () => undefined,
}));

type MockUser = { id: string; app_metadata?: Record<string, unknown> } | null;
type MockProfile = {
  role: string;
  institution_id: string | null;
  is_active: boolean;
  session_version: number;
} | null;

const authState: {
  user: MockUser;
  profile: MockProfile;
  profileErr: { message: string } | null;
} = {
  user: null,
  profile: null,
  profileErr: null,
};

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: authState.user }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: authState.profile,
            error: authState.profileErr,
          }),
        }),
      }),
    }),
  }),
}));

const loadMiddleware = async () => {
  const mod = await import('@/lib/supabase/middleware');
  return mod.updateSession;
};

function reset(): void {
  authState.user = null;
  authState.profile = null;
  authState.profileErr = null;
}

describe('middleware · auth decision tree', () => {
  beforeEach(reset);

  it('401 JSON on protected API when unauthenticated', async () => {
    const updateSession = await loadMiddleware();
    const res = await updateSession(
      mockRequest({ method: 'GET', path: '/api/courses' })
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('redirects protected page to /login when unauthenticated', async () => {
    const updateSession = await loadMiddleware();
    const res = await updateSession(
      mockRequest({ method: 'GET', path: '/dashboard/courses' })
    );
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toMatch(/\/login\?error=not_authenticated/);
  });

  it('403 when authenticated but missing role claim', async () => {
    authState.user = { id: 'u1', app_metadata: {} };
    const updateSession = await loadMiddleware();
    const res = await updateSession(
      mockRequest({ method: 'GET', path: '/api/courses' })
    );
    expect(res.status).toBe(403);
  });

  it('403 when role is present but institution_id claim is missing', async () => {
    authState.user = {
      id: 'u1',
      app_metadata: { user_role: 'student', session_version: 0 },
    };
    const updateSession = await loadMiddleware();
    const res = await updateSession(
      mockRequest({ method: 'GET', path: '/api/courses' })
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.message).toMatch(/institution/i);
  });

  it('401 on session_version mismatch (session expired)', async () => {
    authState.user = {
      id: 'u1',
      app_metadata: {
        user_role: 'student',
        institution_id: 'inst-a',
        session_version: 0,
      },
    };
    authState.profile = {
      role: 'student',
      institution_id: 'inst-a',
      is_active: true,
      session_version: 1, // bumped after JWT was issued
    };
    const updateSession = await loadMiddleware();
    const res = await updateSession(
      mockRequest({ method: 'GET', path: '/api/courses' })
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.message).toMatch(/expired/i);
  });

  it('403 on inactive account even with matching claims', async () => {
    authState.user = {
      id: 'u1',
      app_metadata: {
        user_role: 'student',
        institution_id: 'inst-a',
        session_version: 0,
      },
    };
    authState.profile = {
      role: 'student',
      institution_id: 'inst-a',
      is_active: false,
      session_version: 0,
    };
    const updateSession = await loadMiddleware();
    const res = await updateSession(
      mockRequest({ method: 'GET', path: '/api/courses' })
    );
    expect(res.status).toBe(403);
  });

  it('401 when JWT role no longer matches DB role (stale token)', async () => {
    authState.user = {
      id: 'u1',
      app_metadata: {
        user_role: 'teacher',
        institution_id: 'inst-a',
        session_version: 0,
      },
    };
    authState.profile = {
      role: 'student',
      institution_id: 'inst-a',
      is_active: true,
      session_version: 0,
    };
    const updateSession = await loadMiddleware();
    const res = await updateSession(
      mockRequest({ method: 'GET', path: '/api/courses' })
    );
    expect(res.status).toBe(401);
  });

  it('403 on /api/admin/* when DB role is not admin', async () => {
    authState.user = {
      id: 'u1',
      app_metadata: {
        user_role: 'teacher',
        institution_id: 'inst-a',
        session_version: 0,
      },
    };
    authState.profile = {
      role: 'teacher',
      institution_id: 'inst-a',
      is_active: true,
      session_version: 0,
    };
    const updateSession = await loadMiddleware();
    const res = await updateSession(
      mockRequest({ method: 'GET', path: '/api/admin/users' })
    );
    expect(res.status).toBe(403);
  });

  it('CSRF: rejects POST without token echo', async () => {
    const updateSession = await loadMiddleware();
    const res = await updateSession(
      mockRequest({
        method: 'POST',
        path: '/api/courses',
        headers: { origin: 'https://nocturna.test' },
      })
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.message).toMatch(/csrf/);
  });

  it('CSRF: rejects POST with cross-origin Origin header', async () => {
    const updateSession = await loadMiddleware();
    const res = await updateSession(
      mockRequest({
        method: 'POST',
        path: '/api/courses',
        headers: {
          origin: 'https://evil.example',
          [CSRF_HEADER]: 'tokentokentokentokentoken',
        },
        cookies: { [CSRF_COOKIE]: 'tokentokentokentokentoken' },
      })
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.message).toMatch(/csrf:origin_mismatch/);
  });
});
