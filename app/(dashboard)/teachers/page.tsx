import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/api/auth';
import { listTeachers } from '@/lib/services/teachers.service';
import { CreateTeacherDialog } from '@/components/admin/create-teacher-dialog';
import { PageHeader } from '@/components/layout/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users2 } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function initials(name: string | null, email: string): string {
  const src = (name?.trim() || email).trim();
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
  return letters || '?';
}

/**
 * Ruta gemela de /admin/teachers expuesta en el sidebar "Gestión".
 * Reutiliza el mismo servicio y diálogo de creación.
 */
export default async function TeachersPage() {
  const ctx = await requireAuth();
  if (ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    redirect('/dashboard');
  }

  const teachers = await listTeachers(ctx);

  return (
    <>
      <PageHeader
        title="Profesores"
        description="Gestiona los profesores de tu institución. Pueden crear cursos, publicar materiales y calificar tareas."
        actions={<CreateTeacherDialog />}
      />

      {teachers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Users2 className="h-6 w-6 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <p className="font-medium">Todavía no hay profesores</p>
              <p className="text-sm text-muted-foreground">
                Crea el primero o enviá un QR de invitación desde la sección “Invitaciones”.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {teachers.length} profesor{teachers.length === 1 ? '' : 'es'}
            </CardTitle>
            <CardDescription>Creados en este panel o añadidos por invitación.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {teachers.map((t) => (
                <li key={t.id} className="flex items-center gap-4 px-6 py-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{initials(t.full_name, t.email)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {t.full_name?.trim() || t.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{t.email}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {t.is_active ? (
                      <Badge variant="secondary">Activo</Badge>
                    ) : (
                      <Badge variant="outline">Inactivo</Badge>
                    )}
                    <Badge variant="outline">
                      {t.courses_count} curso{t.courses_count === 1 ? '' : 's'}
                    </Badge>
                    <Link
                      href={`/courses?teacher=${t.id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      Ver cursos
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}
