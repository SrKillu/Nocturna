import type { Metadata } from 'next';
import { requireAuth } from '@/lib/api/auth';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import {
  listCourses,
  listInstitutionTeachers,
} from '@/lib/services/courses.service';
import { PageHeader } from '@/components/layout/page-header';
import { CourseCard } from '@/components/courses/course-card';
import { CreateCourseDialogLazy } from '@/components/courses/create-course-dialog-lazy';
import { EmptyModule } from '@/components/layout/empty-module';

export const metadata: Metadata = {
  title: 'Cursos · Nocturna',
};
export const dynamic = 'force-dynamic';

interface CourseRow {
  id: string;
  name: string;
  description: string | null;
  teacher_id: string | null;
  created_at: string;
}

export default async function CoursesPage() {
  const ctx = await requireAuth();

  let courses: CourseRow[] = [];
  let teachers: Array<{ id: string; full_name: string | null; email: string }> = [];

  if (isSupabaseConfigured()) {
    try {
      courses = ((await listCourses(ctx)) ?? []) as CourseRow[];
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[courses] list failed', err);
    }
    if (ctx.role === 'admin' || ctx.role === 'super_admin') {
      try {
        teachers = (await listInstitutionTeachers(ctx)) as typeof teachers;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[courses] teachers failed', err);
      }
    }
  }

  const canCreate =
    ctx.role === 'admin' || ctx.role === 'super_admin' || ctx.role === 'teacher';

  return (
    <>
      <PageHeader
        title="Cursos"
        description="Todos los cursos de tu institución a los que tienes acceso."
        actions={
          canCreate ? (
            <CreateCourseDialogLazy
              teachers={teachers}
              canAssignTeacher={ctx.role === 'admin' || ctx.role === 'super_admin'}
            />
          ) : null
        }
      />

      {courses.length === 0 ? (
        <EmptyModule
          title="Aún no hay cursos"
          description={
            canCreate
              ? 'Usa “Crear curso” para dar de alta el primero.'
              : 'Cuando el administrador cree cursos aparecerán aquí.'
          }
        />
      ) : (
        <section
          aria-label="Listado de cursos"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} href={`/courses/${c.id}`} />
          ))}
        </section>
      )}
    </>
  );
}
