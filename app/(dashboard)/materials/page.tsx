import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/api/auth';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { listCourses } from '@/lib/services/courses.service';
import { PageHeader } from '@/components/layout/page-header';
import { MaterialsWorkspace } from '@/components/materials/materials-workspace';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: { courseId?: string };
}

export default async function MaterialsPage({ searchParams }: PageProps) {
  const ctx = await requireAuth();
  if (!isSupabaseConfigured()) notFound();

  const courses = (await listCourses(ctx)) as Array<{
    id: string;
    name: string;
    description: string | null;
    teacher_id: string | null;
  }>;

  const canManage = ctx.role === 'admin' || ctx.role === 'super_admin' || ctx.role === 'teacher';

  return (
    <>
      <PageHeader
        title="Materiales"
        description="Archivos y recursos compartidos en tus cursos. Descargables en un click."
      />
      <MaterialsWorkspace
        role={ctx.role}
        userId={ctx.userId}
        canManage={canManage}
        courses={courses.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description ?? null,
          teacher_id: c.teacher_id ?? null,
        }))}
        initialCourseId={searchParams.courseId ?? null}
      />
    </>
  );
}
