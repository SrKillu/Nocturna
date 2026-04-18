import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  Target,
} from 'lucide-react';
import { SubmissionUploader } from '@/components/submissions/submission-uploader';

import { requireAuth } from '@/lib/api/auth';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { getTaskDetail } from '@/lib/services/tasks.service';
import { PageHeader } from '@/components/layout/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatRelativeDate } from '@/lib/utils/date';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  if (!isSupabaseConfigured()) return { title: 'Tarea · Nocturna' };
  const ctx = await requireAuth().catch(() => null);
  if (!ctx) return { title: 'Tarea · Nocturna' };
  const detail = await getTaskDetail(ctx, params.id).catch(() => null);
  return { title: detail ? `${detail.title} · Nocturna` : 'Tarea · Nocturna' };
}

export default async function TaskDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const ctx = await requireAuth();
  if (!isSupabaseConfigured()) notFound();

  const detail = await getTaskDetail(ctx, params.id);
  if (!detail) notFound();

  return (
    <>
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 h-auto px-2 text-xs text-muted-foreground">
          <Link href="/tasks">
            <ArrowLeft className="mr-1 h-3 w-3" /> Volver a tareas
          </Link>
        </Button>
        <PageHeader
          title={detail.title}
          description={detail.description ?? 'Sin descripción.'}
          actions={
            <Badge variant="outline" className="gap-1">
              <Target className="h-3 w-3" /> Max {detail.max_score}
            </Badge>
          }
        />
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetaCard
          icon={<BookOpen className="h-4 w-4" />}
          label="Curso"
          value={detail.course.name}
          href={`/courses/${detail.course.id}`}
        />
        <MetaCard
          icon={<CalendarClock className="h-4 w-4" />}
          label="Entrega"
          value={detail.due_date ? formatRelativeDate(detail.due_date) : 'Sin fecha'}
        />
        <MetaCard
          icon={<FileText className="h-4 w-4" />}
          label="Entregas"
          value={String(detail.submission_count)}
        />
        <MetaCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Calificadas"
          value={`${detail.graded_count} / ${detail.submission_count || 0}`}
        />
      </section>

      {ctx.role === 'student' ? (
        <SubmissionUploader
          taskId={detail.id}
          existingStatus={detail.own_submission?.status ?? null}
        />
      ) : null}

      {ctx.role === 'student' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tu entrega</CardTitle>
            <CardDescription>
              Historial del estado de tu entrega para esta tarea.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {detail.own_submission ? (
              <div className="flex items-center gap-3 rounded-md border bg-muted/40 px-4 py-3">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Estado: {labelFor(detail.own_submission.status)}</p>
                  <p className="text-xs text-muted-foreground">
                    Enviada {formatRelativeDate(detail.own_submission.submitted_at)}
                  </p>
                </div>
                <Badge
                  variant={
                    detail.own_submission.status === 'graded' ? 'secondary' : 'outline'
                  }
                >
                  {labelFor(detail.own_submission.status)}
                </Badge>
              </div>
            ) : (
              <p className="rounded-md border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">
                Aún no has enviado esta tarea.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalles</CardTitle>
          <CardDescription>Información completa de la tarea.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <section>
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Enunciado
            </h3>
            <p className="mt-1 whitespace-pre-wrap leading-relaxed">
              {detail.description ?? 'Sin descripción adicional.'}
            </p>
          </section>
          <section>
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Creada
            </h3>
            <p className="mt-1 text-muted-foreground">
              {formatRelativeDate(detail.created_at)}
            </p>
          </section>
        </CardContent>
      </Card>
    </>
  );
}

function labelFor(status: string): string {
  switch (status) {
    case 'graded':
      return 'Calificada';
    case 'submitted':
      return 'Enviada';
    case 'late':
      return 'Entregada tarde';
    case 'returned':
      return 'Devuelta';
    default:
      return status;
  }
}

function MetaCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </CardTitle>
        <span className="rounded-md bg-muted p-1.5 text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="truncate text-base font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {content}
      </Link>
    );
  }
  return content;
}
