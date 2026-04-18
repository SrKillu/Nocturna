import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarClock, ClipboardList, Target, Users } from 'lucide-react';
import { requireAuth } from '@/lib/api/auth';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import {
  getCourseDetail,
  listCoursePeople,
  listCourseActivity,
} from '@/lib/services/courses.service';
import { accentFor, courseInitials } from '@/lib/ui/course-accents';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnrollButton } from '@/components/courses/enroll-button';
import { CourseStream } from '@/components/courses/course-stream';
import { CoursePeople } from '@/components/courses/course-people';
import { CourseTasksTab } from '@/components/courses/course-tasks-tab';

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

  const [detail, people, activity] = await Promise.all([
    getCourseDetail(ctx, params.id),
    listCoursePeople(ctx, params.id).catch(() => []),
    listCourseActivity(ctx, params.id).catch(() => []),
  ]);
  if (!detail) notFound();

  const canEnroll = ctx.role === 'student' && !detail.is_enrolled;
  const accent = accentFor(detail.id);
  const initials = courseInitials(detail.name);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Button asChild variant="ghost" size="sm" className="-ml-2 h-auto px-2 text-xs text-muted-foreground">
        <Link href="/courses">
          <ArrowLeft className="mr-1 h-3 w-3" /> Volver a cursos
        </Link>
      </Button>

      {/* Classroom-style hero */}
      <header
        className={cn(
          'relative overflow-hidden rounded-2xl bg-gradient-to-br px-6 py-8 text-white shadow-sm sm:px-10 sm:py-10',
          accent.from,
          accent.to
        )}
      >
        <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -left-10 bottom-0 h-44 w-44 rounded-full bg-black/15 blur-2xl" />
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-5">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl font-semibold backdrop-blur-sm">
              {initials}
            </span>
            <div className="min-w-0 space-y-2">
              <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/25">
                {detail.teacher
                  ? `Prof. ${detail.teacher.full_name ?? detail.teacher.email}`
                  : 'Sin profesor asignado'}
              </Badge>
              <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">{detail.name}</h1>
              <p className="max-w-2xl text-sm text-white/85">
                {detail.description ?? 'Sin descripción.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEnroll ? <EnrollButton courseId={detail.id} /> : null}
          </div>
        </div>

        {/* Meta strip */}
        <div className="relative z-10 mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/15 pt-4 text-xs text-white/90">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> {detail.enrollment_count} estudiantes
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" /> {detail.task_count} tareas
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5" />
            Creado{' '}
            {new Date(detail.created_at).toLocaleDateString('es', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          {detail.is_enrolled ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" /> Matriculado·a
            </span>
          ) : null}
        </div>
      </header>

      {/* Tabs — Classroom style */}
      <Tabs defaultValue="stream" className="space-y-4">
        <TabsList className="w-full justify-start gap-1 bg-card">
          <TabsTrigger value="stream">Novedades</TabsTrigger>
          <TabsTrigger value="tasks">Tareas</TabsTrigger>
          <TabsTrigger value="people">Personas</TabsTrigger>
        </TabsList>

        <TabsContent value="stream" className="space-y-4">
          <CourseStream items={activity} />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <CourseTasksTab tasks={detail.tasks} courseId={detail.id} role={ctx.role} />
        </TabsContent>

        <TabsContent value="people" className="space-y-4">
          <CoursePeople people={people} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
