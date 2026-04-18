import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { DashboardTopbar } from '@/components/dashboard/topbar';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { AuthAuditLogger } from '@/components/auth/auth-audit-logger';
import { SessionRecovery } from '@/components/auth/session-recovery';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const ctx = await requireAuth();
    const supabase = createClient();
    const { data: institution } = await supabase
      .from('institutions')
      .select('name')
      .eq('id', ctx.institutionId)
      .single();

    return (
      <div className="flex min-h-screen bg-muted/30">
        <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:block">
          <div className="flex h-16 items-center gap-2 border-b px-5">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                N
              </span>
              <span>Nocturna</span>
            </Link>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Institución</p>
            <p className="mt-1 truncate text-sm font-medium">{institution?.name ?? '—'}</p>
            <p className="mt-0.5 text-xs text-muted-foreground capitalize">
              Rol: {roleLabel(ctx.role)}
            </p>
          </div>
          <SidebarNav role={ctx.role} />
        </aside>
        <div className="flex min-h-screen flex-1 flex-col">
          <DashboardTopbar email={ctx.email} />
          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
        <AuthAuditLogger />
        <SessionRecovery />
      </div>
    );
  } catch {
    redirect('/login?redirectTo=/dashboard');
  }
}

function roleLabel(role: string) {
  switch (role) {
    case 'student':
      return 'Estudiante';
    case 'teacher':
      return 'Profesor';
    case 'admin':
      return 'Administrador';
    case 'super_admin':
      return 'Super Admin';
    default:
      return role;
  }
}
