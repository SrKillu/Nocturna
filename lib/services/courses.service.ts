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
  // RBAC — staff only. RLS in the DB is the authoritative gate:
  //   courses_insert_staff allows admin/super_admin on any course of the tenant,
  //   and teacher only when they create the course for themselves.
  if (ctx.role !== 'admin' && ctx.role !== 'super_admin' && ctx.role !== 'teacher') {
    throw new ApiError('FORBIDDEN', 'Only staff can create courses');
  }
  const supabase = createClient();

  // For teachers the server forces teacher_id = self. Any value they send is
  // ignored (defence-in-depth: RLS would reject it anyway, but we fail fast).
  const teacherId =
    ctx.role === 'teacher' ? ctx.userId : (input.teacherId ?? null);

  if (teacherId && ctx.role !== 'teacher') {
    const { data: teacher } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', teacherId)
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
      teacher_id: teacherId,
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

  // --- Diagnostics ------------------------------------------------
  // Log the inputs so we can tell "RLS blocked" from "wrong id" in prod logs.
  // eslint-disable-next-line no-console
  console.log('[courses.getCourseDetail] probe', {
    courseId,
    role: ctx.role,
    userId: ctx.userId,
    institutionId: ctx.institutionId,
    isValidUuid:
      typeof courseId === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId),
  });

  if (
    typeof courseId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId)
  ) {
    // eslint-disable-next-line no-console
    console.warn('[courses.getCourseDetail] invalid-uuid; bailing out', { courseId });
    return null;
  }

  // --- Query the course row ---------------------------------------
  // IMPORTANT: do NOT embed profiles with a FK hint (e.g. `!courses_teacher_id_fkey`).
  // The FK name can differ between environments (schema reconcile renames it) and
  // courses has TWO FKs to profiles (teacher_id + created_by), so an un-hinted
  // embed is ambiguous. We fetch the teacher in a second step.
  const { data: course, error } = await supabase
    .from('courses')
    .select('id, name, description, teacher_id, created_at')
    .eq('id', courseId)
    .maybeSingle();

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[courses.getCourseDetail] supabase error', {
      courseId,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return null;
  }
  if (!course) {
    // Row genuinely not visible. Can mean: (a) id doesn't exist, (b) RLS hid it.
    // eslint-disable-next-line no-console
    console.warn('[courses.getCourseDetail] no-row (RLS hid it OR id not in DB)', {
      courseId,
      role: ctx.role,
      userId: ctx.userId,
    });
    return null;
  }

  // --- Sidecar fetches (parallel) --------------------------------
  const [{ count: enrollmentCount }, { count: taskCount }, tasksRes, ownEnroll, teacherRes] =
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
      course.teacher_id
        ? supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', course.teacher_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

  const typed = course as {
    id: string;
    name: string;
    description: string | null;
    teacher_id: string | null;
    created_at: string;
  };

  const teacher = (teacherRes as { data: { id: string; full_name: string | null; email: string } | null })
    .data ?? null;

  return {
    id: typed.id,
    name: typed.name,
    description: typed.description,
    teacher_id: typed.teacher_id,
    created_at: typed.created_at,
    teacher,
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
 *
 * Implementation note: we no longer rely on embedded FK-joins
 * (`profiles!<fk_name>(...)`) because the FK names vary across environments
 * after schema reconciliations. Separate queries are slightly chattier but
 * robust and trivial to reason about.
 */
export async function listCoursePeople(
  _ctx: AuthenticatedContext,
  courseId: string
): Promise<CoursePerson[]> {
  const supabase = createClient();

  // 1) Course → get teacher_id (if any).
  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .select('teacher_id')
    .eq('id', courseId)
    .maybeSingle();
  if (courseErr) {
    // eslint-disable-next-line no-console
    console.error('[courses.listCoursePeople] course err', courseErr);
  }

  // 2) Enrollments → list of student ids + their enrolment timestamp.
  const { data: enrollments, error: enrollErr } = await supabase
    .from('enrollments')
    .select('created_at, student_id')
    .eq('course_id', courseId)
    .order('created_at', { ascending: true });
  if (enrollErr) {
    // eslint-disable-next-line no-console
    console.error('[courses.listCoursePeople] enrollments err', enrollErr);
  }

  // 3) Batch profile lookup for teacher + all students.
  const ids = new Set<string>();
  if (course?.teacher_id) ids.add(course.teacher_id as string);
  for (const e of enrollments ?? []) {
    if (e.student_id) ids.add(e.student_id as string);
  }
  let profiles: Array<{ id: string; full_name: string | null; email: string }> = [];
  if (ids.size > 0) {
    const { data: profs, error: profErr } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', [...ids]);
    if (profErr) {
      // eslint-disable-next-line no-console
      console.error('[courses.listCoursePeople] profiles err', profErr);
    }
    profiles = profs ?? [];
  }
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  const people: CoursePerson[] = [];
  const teacherId = course?.teacher_id as string | null | undefined;
  if (teacherId && profileById.has(teacherId)) {
    const t = profileById.get(teacherId)!;
    people.push({
      id: t.id,
      full_name: t.full_name,
      email: t.email,
      role: 'teacher',
      enrolled_at: null,
    });
  }
  for (const e of enrollments ?? []) {
    const sid = e.student_id as string;
    const s = profileById.get(sid);
    if (!s) continue;
    people.push({
      id: s.id,
      full_name: s.full_name,
      email: s.email,
      role: 'student',
      enrolled_at: (e.created_at as string) ?? null,
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
 *
 * No FK-name embeds (varies per env); all joins done in app code.
 * Uses `created_at` across the board (the canonical column in the schema).
 */
export async function listCourseActivity(
  _ctx: AuthenticatedContext,
  courseId: string
): Promise<CourseActivityItem[]> {
  const supabase = createClient();

  // 1) Tasks in the course.
  const tasksRes = await supabase
    .from('tasks')
    .select('id, title, created_at')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (tasksRes.error) {
    // eslint-disable-next-line no-console
    console.error('[courses.listCourseActivity] tasks err', tasksRes.error);
  }
  const tasks = tasksRes.data ?? [];
  const taskIds = tasks.map((t) => t.id as string);
  const taskTitleById = new Map(tasks.map((t) => [t.id as string, t.title as string]));

  // 2) Submissions for those tasks.
  const subsRes =
    taskIds.length > 0
      ? await supabase
          .from('submissions')
          .select('id, task_id, student_id, created_at')
          .in('task_id', taskIds)
          .order('created_at', { ascending: false })
          .limit(10)
      : { data: [], error: null };
  if (subsRes.error) {
    // eslint-disable-next-line no-console
    console.error('[courses.listCourseActivity] subs err', subsRes.error);
  }
  const subs = (subsRes.data ?? []) as Array<{
    id: string;
    task_id: string;
    student_id: string;
    created_at: string;
  }>;
  const subById = new Map(subs.map((s) => [s.id, s]));

  // 3) Grades for those submissions.
  const gradesRes =
    subs.length > 0
      ? await supabase
          .from('grades')
          .select('id, submission_id, score, created_at')
          .in('submission_id', subs.map((s) => s.id))
          .order('created_at', { ascending: false })
          .limit(10)
      : { data: [], error: null };
  if (gradesRes.error) {
    // eslint-disable-next-line no-console
    console.error('[courses.listCourseActivity] grades err', gradesRes.error);
  }
  const grades = (gradesRes.data ?? []) as Array<{
    id: string;
    submission_id: string;
    score: number;
    created_at: string;
  }>;

  // 4) Batch profile lookup for every student that appears in subs or grades.
  const studentIds = new Set<string>();
  for (const s of subs) studentIds.add(s.student_id);
  for (const g of grades) {
    const s = subById.get(g.submission_id);
    if (s) studentIds.add(s.student_id);
  }
  let profiles: Array<{ id: string; full_name: string | null; email: string }> = [];
  if (studentIds.size > 0) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', [...studentIds]);
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[courses.listCourseActivity] profiles err', error);
    }
    profiles = data ?? [];
  }
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  const items: CourseActivityItem[] = [];
  for (const t of tasks) {
    items.push({
      id: `task:${t.id}`,
      kind: 'task_created',
      title: `Nueva tarea — ${t.title}`,
      subtitle: null,
      at: t.created_at as string,
    });
  }
  for (const s of subs) {
    const prof = profileById.get(s.student_id);
    items.push({
      id: `sub:${s.id}`,
      kind: 'submission',
      title: `Entrega — ${taskTitleById.get(s.task_id) ?? ''}`,
      subtitle: prof?.full_name ?? prof?.email ?? null,
      at: s.created_at,
    });
  }
  for (const g of grades) {
    const sub = subById.get(g.submission_id);
    const prof = sub ? profileById.get(sub.student_id) : null;
    const taskTitle = sub ? taskTitleById.get(sub.task_id) ?? '' : '';
    items.push({
      id: `grade:${g.id}`,
      kind: 'grade',
      title: `Calificación — ${taskTitle}`,
      subtitle: `${prof?.full_name ?? prof?.email ?? ''} · ${g.score} pts`,
      at: g.created_at,
    });
  }
  items.sort((a, b) => (a.at < b.at ? 1 : -1));
  return items.slice(0, 20);
}
