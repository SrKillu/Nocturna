import { redirect } from 'next/navigation';
import {
  validateSessionLoose,
  SessionValidationError,
} from '@/lib/auth/session';
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
 * Shell layout para cualquier página autenticada.
 *
 *   * Usamos `validateSessionLoose()` a propósito para permitir entrar al
 *     dashboard incluso sin `institution_id`. Esto cubre el flujo de registro
 *     público donde el usuario aún no aceptó ninguna invitación.
 *   * Las páginas que requieren tenant (cursos, tareas, materiales, etc.) siguen
 *     llamando a `requireAuth()` y van a redirigir a /login si corresponde.
 *   * El dashboard detecta `institutionId === null` y renderiza el panel de
 *     onboarding en lugar del contenido normal.
 */
export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let ctx;
  try {
    ctx = await validateSessionLoose();
  } catch (err) {
    // Solo redirigimos si realmente NO hay sesión.
    if (err instanceof SessionValidationError && err.code !== 'not_authenticated') {
      // profile inválido / inactivo: volvemos al login.
      redirect('/login?error=' + err.code);
    }
    redirect('/login?next=/dashboard');
  }

  const supabase = createClient();

  const [{ data: institution }, { data: profile }] = await Promise.all([
    ctx.institutionId
      ? supabase
          .from('institutions')
          .select('name')
          .eq('id', ctx.institutionId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', ctx.userId)
      .maybeSingle(),
  ]);

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
