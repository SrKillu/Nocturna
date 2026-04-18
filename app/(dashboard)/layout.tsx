import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/api/auth';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/app-shell';
import { AuthAuditLogger } from '@/components/auth/auth-audit-logger';
import { SessionRecovery } from '@/components/auth/session-recovery';

// The authenticated shell depends on auth cookies (per-request), so Next must
// never try to cache the RSC payload. Without this flag, Next.js can serve the
// pre-rendered HTML of a previous user to a different session → hydration
// mismatches on user-specific fields (email, full name, institution).
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'default-no-store';

/**
 * Shell layout for every authenticated page.
 *
 * Route group `(dashboard)` → no URL segment is injected, so this wraps:
 *   /dashboard, /courses, /tasks, /submissions, /grades, /admin
 *
 * Auth contract:
 *   * `requireAuth()` runs validateSession() with the same rules as the
 *     middleware (profile exists, active, session_version match, role match).
 *   * Any failure redirects to /login preserving the `next` param.
 *
 * The visible navigation items are flat and identical for every role. The
 * “Admin” entry is rendered conditionally on the client (role prop), and the
 * /admin page itself re-checks the role server-side before rendering.
 */
export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let ctx;
  try {
    ctx = await requireAuth();
  } catch {
    redirect('/login?next=/dashboard');
  }

  const supabase = createClient();
  const { data: institution } = await supabase
    .from('institutions')
    .select('name')
    .eq('id', ctx.institutionId)
    .maybeSingle();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', ctx.userId)
    .maybeSingle();

  return (
    <>
      <AppShell
        user={{
          email: ctx.email,
          fullName: profile?.full_name ?? null,
          role: ctx.role,
        }}
        institutionName={institution?.name ?? null}
      >
        {children}
      </AppShell>
      <AuthAuditLogger />
      <SessionRecovery />
    </>
  );
}
