import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/api/auth';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyModule } from '@/components/layout/empty-module';

export const metadata: Metadata = {
  title: 'Administración · Nocturna',
};

/**
 * Admin area. Visible only to admin and super_admin roles.
 * Role check is re-done server-side here even though the sidebar hides the
 * entry — deep links (shared URLs, bookmarks) must still be refused.
 */
export default async function AdminPage() {
  const ctx = await requireAuth();
  if (ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    redirect('/dashboard');
  }
  return (
    <>
      <PageHeader
        title="Administración"
        description="Gestión de usuarios, auditoría y configuración institucional."
      />
      <EmptyModule
        title="Módulo de administración"
        description="Próximamente: alta/baja de usuarios, revocación de sesiones, auditoría y archivos."
      />
    </>
  );
}
