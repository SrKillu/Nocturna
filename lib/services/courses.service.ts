import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/errors';
import type { AuthenticatedContext } from '@/lib/types/auth';
import type { CreateCourseInput, UpdateCourseInput } from '@/lib/validations/courses';

export async function listCourses(ctx: AuthenticatedContext) {
  const supabase = createClient();

  // RLS already filters to the current institution.
  // For students: limit to enrolled courses.
  if (ctx.role === 'student') {
    const { data, error } = await supabase
      .from('enrollments')
      .select('course:courses(*)')
      .eq('student_id', ctx.userId);
    if (error) throw new ApiError('INTERNAL_ERROR', error.message);
    return (data ?? []).map((r: { course: unknown }) => r.course).filter(Boolean);
  }

  if (ctx.role === 'teacher') {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('teacher_id', ctx.userId)
      .order('created_at', { ascending: false });
    if (error) throw new ApiError('INTERNAL_ERROR', error.message);
    return data ?? [];
  }

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
  return data ?? [];
}

export async function createCourse(ctx: AuthenticatedContext, input: CreateCourseInput) {
  if (ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw new ApiError('FORBIDDEN', 'Only admins can create courses');
  }
  const supabase = createClient();

  if (input.teacherId) {
    const { data: teacher } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', input.teacherId)
      .single();
    if (!teacher || teacher.role !== 'teacher') {
      throw new ApiError('VALIDATION_ERROR', 'Assigned user is not a teacher in this institution');
    }
  }

  const { data, error } = await supabase
    .from('courses')
    .insert({
      institution_id: ctx.institutionId, // trusted: from JWT
      name: input.name,
      description: input.description ?? null,
      teacher_id: input.teacherId ?? null,
      created_by: ctx.userId,
    })
    .select('*')
    .single();

  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
  return data;
}

export async function updateCourse(
  ctx: AuthenticatedContext,
  courseId: string,
  input: UpdateCourseInput
) {
  if (ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw new ApiError('FORBIDDEN', 'Only admins can update courses');
  }
  const supabase = createClient();

  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.description !== undefined) payload.description = input.description;
  if (input.teacherId !== undefined) payload.teacher_id = input.teacherId;

  const { data, error } = await supabase
    .from('courses')
    .update(payload)
    .eq('id', courseId)
    .select('*')
    .single();

  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
  if (!data) throw new ApiError('NOT_FOUND', 'Course not found');
  return data;
}

export async function assignTeacher(
  ctx: AuthenticatedContext,
  courseId: string,
  teacherId: string
) {
  return updateCourse(ctx, courseId, { teacherId });
}

export async function enrollStudent(
  ctx: AuthenticatedContext,
  courseId: string,
  studentId?: string
) {
  const supabase = createClient();

  const targetStudentId =
    ctx.role === 'student' ? ctx.userId : studentId ?? ctx.userId;

  if (ctx.role === 'student' && targetStudentId !== ctx.userId) {
    throw new ApiError('FORBIDDEN', 'Students can only enroll themselves');
  }

  const { data, error } = await supabase
    .from('enrollments')
    .insert({
      institution_id: ctx.institutionId,
      course_id: courseId,
      student_id: targetStudentId,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new ApiError('CONFLICT', 'Already enrolled');
    }
    throw new ApiError('INTERNAL_ERROR', error.message);
  }
  return data;
}

export async function listInstitutionTeachers(ctx: AuthenticatedContext) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('role', 'teacher')
    .order('full_name', { ascending: true });
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
  return data ?? [];
}
