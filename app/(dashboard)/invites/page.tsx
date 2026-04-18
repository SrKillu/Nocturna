import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/api/auth';
import { listCourses } from '@/lib/services/courses.service';
import {
  listTeacherInvites,
  listStudentInvites,
} from '@/lib/services/invites.service';
import { PageHeader } from '@/components/layout/page-header';
import { InvitesAdminPanel } from '@/components/invites/invites-admin-panel';
import { InvitesTeacherPanel } from '@/components/invites/invites-teacher-panel';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function InvitesPage() {
  const ctx = await requireAuth();

  if (ctx.role === 'student') {
    redirect('/dashboard');
  }

  const isStaff = ctx.role === 'admin' || ctx.role === 'super_admin';

  const [teacherInvites, studentInvites, courses] = await Promise.all([
    isStaff ? listTeacherInvites(ctx).catch(() => []) : Promise.resolve([]),
    listStudentInvites(ctx).catch(() => []),
    listCourses(ctx).then((cs) =>
      (cs as Array<{ id: string; name: string; teacher_id: string | null }>)
        .map((c) => ({ id: c.id, name: c.name, teacher_id: c.teacher_id ?? null }))
    ),
  ]);

  return (
    <>
      <PageHeader
        title="Invitaciones"
        description="Genera códigos QR para sumar profesores a la institución o estudiantes a un curso."
      />

      {isStaff ? (
        <InvitesAdminPanel initialInvites={teacherInvites} />
      ) : null}

      <InvitesTeacherPanel
        role={ctx.role}
        userId={ctx.userId}
        courses={courses}
        initialInvites={studentInvites}
      />
    </>
  );
}
