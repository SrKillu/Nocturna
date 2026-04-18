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

export interface CourseDetail {
  id: string;
  name: string;
  description: string | null;
  teacher_id: string | null;
  created_at: string;
  teacher: { id: string; full_name: string | null; email: string } | null;
  enrollment_count: number;
  task_count: number;
  tasks: Array<{
    id: string;
    title: string;
    due_date: string | null;
    max_score: number;
  }>;
  is_enrolled: boolean;
}

/**
 * Aggregated view for /courses/[id]. Returns null when the course is not
 * reachable (RLS filtered it out, wrong tenant, missing id).
 */
export async function getCourseDetail(
  ctx: AuthenticatedContext,
  courseId: string
): Promise<CourseDetail | null> {
  const supabase = createClient();

  const { data: course, error } = await supabase
    .from('courses')
    .select(
      'id, name, description, teacher_id, created_at, teacher:profiles!courses_teacher_id_fkey(id, full_name, email)'
    )
    .eq('id', courseId)
    .maybeSingle();

  if (error || !course) return null;

  const [{ count: enrollmentCount }, { count: taskCount }, tasksRes, ownEnroll] =
    await Promise.all([
      supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId),
      supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId),
      supabase
        .from('tasks')
        .select('id, title, due_date, max_score')
        .eq('course_id', courseId)
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(20),
      ctx.role === 'student'
        ? supabase
            .from('enrollments')
            .select('id', { count: 'exact', head: true })
            .eq('course_id', courseId)
            .eq('student_id', ctx.userId)
        : Promise.resolve({ count: 0 }),
    ]);

  const typed = course as unknown as {
    id: string;
    name: string;
    description: string | null;
    teacher_id: string | null;
    created_at: string;
    teacher: { id: string; full_name: string | null; email: string } | null;
  };

  return {
    id: typed.id,
    name: typed.name,
    description: typed.description,
    teacher_id: typed.teacher_id,
    created_at: typed.created_at,
    teacher: typed.teacher,
    enrollment_count: Number(enrollmentCount ?? 0),
    task_count: Number(taskCount ?? 0),
    tasks: (tasksRes.data ?? []) as CourseDetail['tasks'],
    is_enrolled: Number((ownEnroll as { count?: number | null }).count ?? 0) > 0,
  };
}

export interface CoursePerson {
  id: string;
  full_name: string | null;
  email: string;
  role: 'teacher' | 'student';
  enrolled_at: string | null;
}

/**
 * Returns the teacher (if any) plus every enrolled student for a course.
 * Used by the /courses/[id] "Personas" tab. RLS scopes the call to the
 * caller's tenant automatically.
 */
export async function listCoursePeople(
  ctx: AuthenticatedContext,
  courseId: string
): Promise<CoursePerson[]> {
  const supabase = createClient();

  const { data: course } = await supabase
    .from('courses')
    .select(
      'teacher_id, teacher:profiles!courses_teacher_id_fkey(id, full_name, email)'
    )
    .eq('id', courseId)
    .maybeSingle();

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(
      'enrolled_at, student:profiles!enrollments_student_id_fkey(id, full_name, email)'
    )
    .eq('course_id', courseId)
    .order('enrolled_at', { ascending: true });

  const people: CoursePerson[] = [];
  const typedCourse = course as unknown as {
    teacher_id: string | null;
    teacher: { id: string; full_name: string | null; email: string } | null;
  } | null;
  if (typedCourse?.teacher) {
    people.push({
      id: typedCourse.teacher.id,
      full_name: typedCourse.teacher.full_name,
      email: typedCourse.teacher.email,
      role: 'teacher',
      enrolled_at: null,
    });
  }
  const typedEnrollments = (enrollments ?? []) as unknown as Array<{
    enrolled_at: string;
    student: { id: string; full_name: string | null; email: string } | null;
  }>;
  for (const e of typedEnrollments) {
    if (!e.student) continue;
    people.push({
      id: e.student.id,
      full_name: e.student.full_name,
      email: e.student.email,
      role: 'student',
      enrolled_at: e.enrolled_at,
    });
  }
  return people;
}

export interface CourseActivityItem {
  id: string;
  kind: 'task_created' | 'submission' | 'grade';
  title: string;
  subtitle: string | null;
  at: string;
}

/**
 * Lightweight stream of activity for the course detail page.
 * Aggregates the 3 events users care about: tasks created, submissions
 * received, grades posted. Newest first, capped at 20 items.
 */
export async function listCourseActivity(
  ctx: AuthenticatedContext,
  courseId: string
): Promise<CourseActivityItem[]> {
  const supabase = createClient();
  const [tasksRes, subsRes, gradesRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, created_at')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('submissions')
      .select('id, submitted_at, task:tasks!inner(title, course_id), student:profiles!submissions_student_id_fkey(full_name, email)')
      .eq('task.course_id', courseId)
      .order('submitted_at', { ascending: false })
      .limit(10),
    supabase
      .from('grades')
      .select('id, score, graded_at, submission:submissions!inner(task:tasks!inner(title, course_id), student:profiles!submissions_student_id_fkey(full_name))')
      .eq('submission.task.course_id', courseId)
      .order('graded_at', { ascending: false })
      .limit(10),
  ]);

  const items: CourseActivityItem[] = [];
  for (const t of tasksRes.data ?? []) {
    items.push({
      id: `task:${t.id}`,
      kind: 'task_created',
      title: `Nueva tarea \u2014 ${t.title}`,
      subtitle: null,
      at: t.created_at as string,
    });
  }
  const subs = (subsRes.data ?? []) as unknown as Array<{
    id: string;
    submitted_at: string;
    task: { title: string } | null;
    student: { full_name: string | null; email: string } | null;
  }>;
  for (const s of subs) {
    items.push({
      id: `sub:${s.id}`,
      kind: 'submission',
      title: `Entrega \u2014 ${s.task?.title ?? ''}`,
      subtitle: s.student?.full_name ?? s.student?.email ?? null,
      at: s.submitted_at,
    });
  }
  const grades = (gradesRes.data ?? []) as unknown as Array<{
    id: string;
    score: number;
    graded_at: string;
    submission: { task: { title: string } | null; student: { full_name: string | null } | null } | null;
  }>;
  for (const g of grades) {
    items.push({
      id: `grade:${g.id}`,
      kind: 'grade',
      title: `Calificaci\u00f3n \u2014 ${g.submission?.task?.title ?? ''}`,
      subtitle: `${g.submission?.student?.full_name ?? ''} \u00b7 ${g.score} pts`,
      at: g.graded_at,
    });
  }
  items.sort((a, b) => (a.at < b.at ? 1 : -1));
  return items.slice(0, 20);
}
