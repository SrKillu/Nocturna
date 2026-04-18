import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CalendarClock, ClipboardList, User2, Users } from 'lucide-react';
import { requireAuth } from '@/lib/api/auth';
import { getCourseDetail } from '@/lib/services/courses.service';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { PageHeader } from '@/components/layout/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnrollButton } from '@/components/courses/enroll-button';
import { formatRelativeDate } from '@/lib/utils/date';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const ctx = await requireAuth().catch(() => null);
  if (!ctx || !isSupabaseConfigured()) return { title: 'Curso · Nocturna' };
  const detail = await getCourseDetail(ctx, params.id).catch(() => null);
  return { title: detail ? `${detail.name} · Nocturna` : 'Curso · Nocturna' };
}

export default async function CourseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const ctx = await requireAuth();

  if (!isSupabaseConfigured()) notFound();

  const detail = await getCourseDetail(ctx, params.id);
  if (!detail) notFound();

  const canEnroll =
    ctx.role === 'student' && !detail.is_enrolled;

  return (
    <>
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 h-auto px-2 text-xs text-muted-foreground">
          <Link href="/courses">
            <ArrowLeft className="mr-1 h-3 w-3" /> Volver a cursos
          </Link>
        </Button>
        <PageHeader
          title={detail.name}
          description={detail.description ?? 'Sin descripción.'}
          actions={canEnroll ? <EnrollButton courseId={detail.id} /> : null}
        />
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <MetaCard
          icon={<User2 className="h-4 w-4" />}
          label="Profesor"
          value={
            detail.teacher
              ? detail.teacher.full_name ?? detail.teacher.email
              : 'Sin asignar'
          }
        />
        <MetaCard
          icon={<Users className="h-4 w-4" />}
          label="Estudiantes"
          value={String(detail.enrollment_count)}
        />
        <MetaCard
          icon={<ClipboardList className="h-4 w-4" />}
          label="Tareas"
          value={String(detail.task_count)}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tareas del curso</CardTitle>
          <CardDescription>
            Listado ordenado por fecha de entrega. Las tareas se gestionarán desde el módulo
            correspondiente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {detail.tasks.length === 0 ? (
            <p className="rounded-md border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">
              Aún no hay tareas para este curso.
            </p>
          ) : (
            <ul className="divide-y">
              {detail.tasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarClock className="h-3 w-3" aria-hidden />
                      {formatRelativeDate(t.due_date)}
                    </p>
                  </div>
                  <Badge variant="outline">Max. {t.max_score}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function MetaCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </CardTitle>
        <span className="rounded-md bg-muted p-1.5 text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="truncate text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
