import 'server-only';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/errors';
import type { AuthenticatedContext } from '@/lib/types/auth';

export const enrollByEmailSchema = z.object({
  email: z.string().email('Email inválido'),
});
export type EnrollByEmailInput = z.infer<typeof enrollByEmailSchema>;

export interface EnrolledStudent {
  enrollment_id: string;
  student_id: string;
  full_name: string | null;
  email: string;
  enrolled_at: string;
}

async function assertCanManageCourse(
  ctx: AuthenticatedContext,
  courseId: string
): Promise<{ institution_id: string; teacher_id: string | null }> {
  const supabase = createClient();
  const { data: course, error } = await supabase
    .from('courses')
    .select('id, institution_id, teacher_id')
    .eq('id', courseId)
    .maybeSingle();
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
  if (!course) throw new ApiError('NOT_FOUND', 'Curso no encontrado');

  const isStaff = ctx.role === 'admin' || ctx.role === 'super_admin';
  const isOwnerTeacher = ctx.role === 'teacher' && course.teacher_id === ctx.userId;
  if (!isStaff && !isOwnerTeacher) {
    throw new ApiError('FORBIDDEN', 'No puedes gestionar la matrícula de este curso');
  }
  return { institution_id: course.institution_id, teacher_id: course.teacher_id };
}

/**
 * Enrol a student in a course by email. The student MUST already exist in the
 * caller's institution. Non-existing emails return a 404 so the UI can surface
 * "send invitation" flows later (we don't auto-create user rows here).
 */
export async function enrollStudentByEmail(
  ctx: AuthenticatedContext,
  courseId: string,
  input: EnrollByEmailInput
): Promise<EnrolledStudent> {
  const course = await assertCanManageCourse(ctx, courseId);
  const supabase = createClient();

  const email = input.email.toLowerCase().trim();

  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, institution_id, is_active')
    .eq('email', email)
    .maybeSingle();
  if (profErr) throw new ApiError('INTERNAL_ERROR', profErr.message);
  if (!profile) {
    throw new ApiError(
      'NOT_FOUND',
      'No existe un usuario con ese email en tu institución. Pide al admin que lo cree o usa una invitación.'
    );
  }
  if (profile.institution_id !== course.institution_id) {
    throw new ApiError('FORBIDDEN', 'El usuario pertenece a otra institución');
  }
  if (profile.role !== 'student') {
    throw new ApiError('VALIDATION_ERROR', 'Solo estudiantes pueden ser inscritos');
  }
  if (!profile.is_active) {
    throw new ApiError('VALIDATION_ERROR', 'La cuenta del estudiante está desactivada');
  }

  const { data: existing } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('student_id', profile.id)
    .maybeSingle();
  if (existing) {
    throw new ApiError('CONFLICT', 'El estudiante ya está inscrito en este curso');
  }

  const { data: inserted, error: insErr } = await supabase
    .from('enrollments')
    .insert({
      institution_id: course.institution_id,
      course_id: courseId,
      student_id: profile.id,
    })
    .select('id, created_at')
    .single();
  if (insErr) throw new ApiError('INTERNAL_ERROR', insErr.message);

  return {
    enrollment_id: inserted.id,
    student_id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    enrolled_at: inserted.created_at,
  };
}

export async function unenrollStudent(
  ctx: AuthenticatedContext,
  courseId: string,
  studentId: string
): Promise<void> {
  await assertCanManageCourse(ctx, courseId);
  const supabase = createClient();

  const { error } = await supabase
    .from('enrollments')
    .delete()
    .eq('course_id', courseId)
    .eq('student_id', studentId);
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
}
