import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAuth } from '@/lib/api/auth';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { listCourses } from '@/lib/services/courses.service';
import { listAllTasks, type TaskListItem } from '@/lib/services/tasks.service';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyModule } from '@/components/layout/empty-module';
import { TaskFilterBar } from '@/components/tasks/task-filter-bar';
import { TaskListRow } from '@/components/tasks/task-list-row';
import { CreateTaskDialogLazy } from '@/components/tasks/create-task-dialog-lazy';

export const metadata: Metadata = {
  title: 'Tareas · Nocturna',
};
export const dynamic = 'force-dynamic';

interface CourseLite {
  id: string;
  name: string;
  teacher_id: string | null;
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: { courseId?: string };
}) {
  const ctx = await requireAuth();
  const courseId = searchParams.courseId?.trim() || null;

  let courses: CourseLite[] = [];
  let tasks: TaskListItem[] = [];

  if (isSupabaseConfigured()) {
    try {
      courses = ((await listCourses(ctx)) ?? []) as CourseLite[];
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[tasks] courses failed', err);
    }
    try {
      tasks = await listAllTasks(ctx, { courseId });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[tasks] list failed', err);
    }
  }

  const canCreate =
    ctx.role === 'teacher' || ctx.role === 'admin' || ctx.role === 'super_admin';

  // Teachers can only post tasks to courses they own; admins to any course.
  const assignableCourses =
    ctx.role === 'teacher'
      ? courses.filter((c) => c.teacher_id === ctx.userId)
      : courses;

  return (
    <>
      <PageHeader
        title="Tareas"
        description="Todas las tareas que puedes ver, ordenadas por fecha de entrega."
        actions={
          canCreate ? (
            <CreateTaskDialogLazy courses={assignableCourses} />
          ) : null
        }
      />

      <TaskFilterBar
        courses={courses.map((c) => ({ id: c.id, name: c.name }))}
        selectedCourseId={courseId}
      />

      {tasks.length === 0 ? (
        <EmptyModule
          title={courseId ? 'Este curso no tiene tareas' : 'Aún no hay tareas'}
          description={
            canCreate
              ? 'Usa “Crear tarea” para añadir la primera.'
              : 'Cuando se creen tareas aparecerán aquí.'
          }
        />
      ) : (
        <section aria-label="Listado de tareas" className="overflow-hidden rounded-xl border bg-card">
          <ul className="divide-y">
            {tasks.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/tasks/${t.id}`}
                  className="block transition-colors hover:bg-muted/50 focus:outline-none focus-visible:bg-muted/60"
                >
                  <TaskListRow task={t} role={ctx.role} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
