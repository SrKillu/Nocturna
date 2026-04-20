import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/errors';
import type { AuthenticatedContext } from '@/lib/types/auth';

export interface StudentRow {
  enrollment_id: string;
  student_id: string;
  full_name: string | null;
  email: string;
  enrolled_at: string;
}

/**
 * Lista los estudiantes matriculados en un curso. RLS ya filtra por tenant;
 * además verificamos visibilidad del curso (staff o teacher dueño, o student
 * enrolled — pero para estudiantes devolvemos la lista "limpia" sin email).
 *
 * Para cumplir con los permisos pedidos (teacher + admin), el endpoint exige
 * `requireRole(['admin','super_admin','teacher'])` y aquí validamos ownership
 * del teacher sobre el curso.
 */
export async function listCourseStudents(
  ctx: AuthenticatedContext,
  courseId: string
): Promise<StudentRow[]> {
  const supabase = createClient();

  const { data: course, error: cErr } = await supabase
    .from('courses')
    .select('id, institution_id, teacher_id')
    .eq('id', courseId)
    .maybeSingle();
  if (cErr) throw new ApiError('INTERNAL_ERROR', cErr.message);
  if (!course) throw new ApiError('NOT_FOUND', 'Curso no encontrado');

  const isStaff = ctx.role === 'admin' || ctx.role === 'super_admin';
  const isOwnerTeacher =
    ctx.role === 'teacher' && course.teacher_id === ctx.userId;
  if (!isStaff && !isOwnerTeacher) {
    throw new ApiError('FORBIDDEN', 'No puedes ver los estudiantes de este curso');
  }

  const { data: enrollments, error: eErr } = await supabase
    .from('enrollments')
    .select('id, student_id, created_at')
    .eq('course_id', courseId)
    .order('created_at', { ascending: true });
  if (eErr) throw new ApiError('INTERNAL_ERROR', eErr.message);
  const rows = (enrollments ?? []) as Array<{
    id: string;
    student_id: string;
    created_at: string;
  }>;
  if (rows.length === 0) return [];

  const ids = [...new Set(rows.map((r) => r.student_id))];
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', ids);
  if (pErr) throw new ApiError('INTERNAL_ERROR', pErr.message);
  const byId = new Map(
    (profiles ?? []).map((p) => [
      p.id as string,
      {
        email: p.email as string,
        full_name: (p.full_name as string | null) ?? null,
      },
    ])
  );

  return rows.map((r) => {
    const prof = byId.get(r.student_id);
    return {
      enrollment_id: r.id,
      student_id: r.student_id,
      full_name: prof?.full_name ?? null,
      email: prof?.email ?? '',
      enrolled_at: r.created_at,
    };
  });
}
