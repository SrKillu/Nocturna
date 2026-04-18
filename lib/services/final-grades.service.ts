import 'server-only';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/errors';
import type { AuthenticatedContext } from '@/lib/types/auth';

export const upsertFinalGradeSchema = z.object({
  studentId: z.string().uuid(),
  examScore: z
    .number()
    .min(0)
    .max(100)
    .nullable()
    .optional(),
  finalScore: z
    .number()
    .min(0)
    .max(100)
    .nullable()
    .optional(),
  comments: z.string().trim().max(2000).nullable().optional(),
});
export type UpsertFinalGradeInput = z.infer<typeof upsertFinalGradeSchema>;

export interface FinalGradeRow {
  id: string;
  course_id: string;
  student_id: string;
  exam_score: number | null;
  final_score: number | null;
  comments: string | null;
  created_at: string;
  updated_at: string;
  student: { id: string; full_name: string | null; email: string } | null;
}

async function assertCanManage(
  ctx: AuthenticatedContext,
  courseId: string
): Promise<{ institution_id: string }> {
  const sb = createClient();
  const { data: course, error } = await sb
    .from('courses')
    .select('id, institution_id, teacher_id')
    .eq('id', courseId)
    .maybeSingle();
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
  if (!course) throw new ApiError('NOT_FOUND', 'Curso no encontrado');
  const isStaff = ctx.role === 'admin' || ctx.role === 'super_admin';
  const isOwnerTeacher = ctx.role === 'teacher' && course.teacher_id === ctx.userId;
  if (!isStaff && !isOwnerTeacher) {
    throw new ApiError('FORBIDDEN', 'Solo admin o el profesor del curso pueden calificar');
  }
  return { institution_id: course.institution_id };
}

/** List grades of a course (staff view) — returns one row per student of the course,
 *  including enrolled students with no grade yet (exam/final null). */
export async function listCourseGrades(
  ctx: AuthenticatedContext,
  courseId: string
): Promise<FinalGradeRow[]> {
  const sb = createClient();

  // All enrolled students.
  const enrollRes = await sb
    .from('enrollments')
    .select('student_id')
    .eq('course_id', courseId);
  if (enrollRes.error) throw new ApiError('INTERNAL_ERROR', enrollRes.error.message);
  const studentIds = (enrollRes.data ?? []).map((r) => r.student_id as string);

  // Existing grades for the course.
  const gradesRes = await sb
    .from('final_grades')
    .select('id, course_id, student_id, exam_score, final_score, comments, created_at, updated_at')
    .eq('course_id', courseId);
  if (gradesRes.error) throw new ApiError('INTERNAL_ERROR', gradesRes.error.message);
  const gradeByStudent = new Map(
    (gradesRes.data ?? []).map((g) => [g.student_id as string, g])
  );

  const allIds = Array.from(new Set([...studentIds, ...gradeByStudent.keys()]));
  if (allIds.length === 0) return [];

  const profsRes = await sb
    .from('profiles')
    .select('id, full_name, email')
    .in('id', allIds);
  const profById = new Map((profsRes.data ?? []).map((p) => [p.id as string, p]));

  return allIds.map((sid) => {
    const g = gradeByStudent.get(sid);
    const p = profById.get(sid);
    return {
      id: (g?.id as string) ?? `virtual:${sid}`,
      course_id: courseId,
      student_id: sid,
      exam_score: (g?.exam_score as number | null) ?? null,
      final_score: (g?.final_score as number | null) ?? null,
      comments: (g?.comments as string | null) ?? null,
      created_at: (g?.created_at as string) ?? '',
      updated_at: (g?.updated_at as string) ?? '',
      student: p
        ? { id: p.id as string, full_name: (p.full_name as string | null) ?? null, email: p.email as string }
        : null,
    };
  });
}

/** Student's own grades across all their courses. */
export async function listStudentGrades(
  ctx: AuthenticatedContext
): Promise<Array<FinalGradeRow & { course: { id: string; name: string } }>> {
  const sb = createClient();
  const gradesRes = await sb
    .from('final_grades')
    .select('id, course_id, student_id, exam_score, final_score, comments, created_at, updated_at')
    .eq('student_id', ctx.userId)
    .order('updated_at', { ascending: false });
  if (gradesRes.error) throw new ApiError('INTERNAL_ERROR', gradesRes.error.message);
  const grades = gradesRes.data ?? [];
  if (grades.length === 0) return [];

  const courseIds = [...new Set(grades.map((g) => g.course_id as string))];
  const coursesRes = await sb
    .from('courses')
    .select('id, name')
    .in('id', courseIds);
  const courseById = new Map(
    (coursesRes.data ?? []).map((c) => [c.id as string, { id: c.id as string, name: c.name as string }])
  );
  return grades.map((g) => ({
    id: g.id as string,
    course_id: g.course_id as string,
    student_id: g.student_id as string,
    exam_score: (g.exam_score as number | null) ?? null,
    final_score: (g.final_score as number | null) ?? null,
    comments: (g.comments as string | null) ?? null,
    created_at: g.created_at as string,
    updated_at: g.updated_at as string,
    student: null,
    course: courseById.get(g.course_id as string) ?? { id: g.course_id as string, name: '—' },
  }));
}

/**
 * Upsert a grade. Enforces:
 *   * caller is admin or the course's teacher
 *   * student is actually enrolled in the course
 *   * uniqueness (course_id, student_id)
 */
export async function upsertFinalGrade(
  ctx: AuthenticatedContext,
  courseId: string,
  input: UpsertFinalGradeInput
): Promise<FinalGradeRow> {
  const course = await assertCanManage(ctx, courseId);
  const sb = createClient();

  const { count, error: enrErr } = await sb
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId)
    .eq('student_id', input.studentId);
  if (enrErr) throw new ApiError('INTERNAL_ERROR', enrErr.message);
  if (!count || count < 1) {
    throw new ApiError('VALIDATION_ERROR', 'El estudiante no está inscrito en este curso');
  }

  const payload = {
    institution_id: course.institution_id,
    course_id: courseId,
    student_id: input.studentId,
    exam_score: input.examScore ?? null,
    final_score: input.finalScore ?? null,
    comments: input.comments?.trim() || null,
    created_by: ctx.userId,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await sb
    .from('final_grades')
    .upsert(payload, { onConflict: 'course_id,student_id' })
    .select('id, course_id, student_id, exam_score, final_score, comments, created_at, updated_at')
    .single();
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);

  return { ...(data as FinalGradeRow), student: null };
}
