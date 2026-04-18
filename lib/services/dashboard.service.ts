import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { AuthenticatedContext } from '@/lib/types/auth';
import type { UserRole, SubmissionStatus } from '@/lib/types/database';

/**
 * Aggregated view for the dashboard home page.
 *
 * One service call, one DB round-trip plan per section. We do NOT hit our own
 * /api/* routes from Server Components (that would double the network trip).
 * Instead we build the same data the APIs would return, directly via the
 * Supabase server client. RLS keeps every query tenant-scoped.
 */

export interface CoursePreview {
  id: string;
  name: string;
  description: string | null;
  teacher_id: string | null;
  created_at: string;
}

export interface TaskPreview {
  id: string;
  title: string;
  due_date: string | null;
  max_score: number;
  course_id: string;
  course_name: string | null;
  submission_status: SubmissionStatus | null; // student view: own submission
  submission_count: number | null;            // teacher/admin view: total submitted
}

export interface ActivityItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  actor_id: string | null;
  actor_name: string | null;
  metadata: Record<string, unknown> | null;
}

export interface DashboardKpis {
  activeCourses: number;
  pendingTasks: number;
  recentSubmissions: number;
  gradedSubmissions: number;
}

export interface DashboardOverview {
  role: UserRole;
  displayName: string;
  institutionName: string | null;
  kpis: DashboardKpis;
  courses: CoursePreview[];
  tasks: TaskPreview[];
  activity: ActivityItem[];
}

const COURSE_LIMIT = 5;
const TASK_LIMIT = 5;
const ACTIVITY_LIMIT = 8;
const RECENT_WINDOW_DAYS = 7;

export async function getDashboardOverview(
  ctx: AuthenticatedContext
): Promise<DashboardOverview> {
  const supabase = createClient();

  const [institutionRes, profileRes] = await Promise.all([
    supabase.from('institutions').select('name').eq('id', ctx.institutionId).maybeSingle(),
    supabase.from('profiles').select('full_name').eq('id', ctx.userId).maybeSingle(),
  ]);

  const displayName =
    profileRes.data?.full_name?.trim() || ctx.email.split('@')[0] || 'Nocturna';

  const [courses, tasks, activity, kpis] = await Promise.all([
    fetchCourses(ctx, supabase),
    fetchTasks(ctx, supabase),
    fetchActivity(ctx, supabase),
    fetchKpis(ctx, supabase),
  ]);

  return {
    role: ctx.role,
    displayName,
    institutionName: institutionRes.data?.name ?? null,
    kpis,
    courses,
    tasks,
    activity,
  };
}

// --------------------------------------------------------------------------
// Sections
// --------------------------------------------------------------------------

type Supa = ReturnType<typeof createClient>;

async function fetchCourses(ctx: AuthenticatedContext, supabase: Supa): Promise<CoursePreview[]> {
  if (ctx.role === 'student') {
    const { data } = await supabase
      .from('enrollments')
      .select('course:courses(id, name, description, teacher_id, created_at)')
      .eq('student_id', ctx.userId)
      .order('enrolled_at', { ascending: false })
      .limit(COURSE_LIMIT);
    return ((data ?? []) as unknown as Array<{ course: CoursePreview | null }>)
      .map((r) => r.course)
      .filter((c): c is CoursePreview => Boolean(c));
  }

  if (ctx.role === 'teacher') {
    const { data } = await supabase
      .from('courses')
      .select('id, name, description, teacher_id, created_at')
      .eq('teacher_id', ctx.userId)
      .order('created_at', { ascending: false })
      .limit(COURSE_LIMIT);
    return (data ?? []) as CoursePreview[];
  }

  const { data } = await supabase
    .from('courses')
    .select('id, name, description, teacher_id, created_at')
    .order('created_at', { ascending: false })
    .limit(COURSE_LIMIT);
  return (data ?? []) as CoursePreview[];
}

async function fetchTasks(ctx: AuthenticatedContext, supabase: Supa): Promise<TaskPreview[]> {
  // Student: tasks from enrolled courses, surfacing own submission status.
  if (ctx.role === 'student') {
    const { data } = await supabase
      .from('tasks')
      .select(
        'id, title, due_date, max_score, course_id, course:courses!inner(name, enrollments!inner(student_id)), submissions:submissions(id, status, student_id)'
      )
      .eq('course.enrollments.student_id', ctx.userId)
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(TASK_LIMIT);
    return ((data ?? []) as unknown as Array<{
      id: string;
      title: string;
      due_date: string | null;
      max_score: number;
      course_id: string;
      course: { name: string } | null;
      submissions: Array<{ status: SubmissionStatus; student_id: string }>;
    }>).map((t) => {
      const own = t.submissions?.find((s) => s.student_id === ctx.userId) ?? null;
      return {
        id: t.id,
        title: t.title,
        due_date: t.due_date,
        max_score: t.max_score,
        course_id: t.course_id,
        course_name: t.course?.name ?? null,
        submission_status: own?.status ?? null,
        submission_count: null,
      };
    });
  }

  // Teacher / Admin: tasks with submitted-but-ungraded counts.
  const baseQuery = supabase
    .from('tasks')
    .select(
      'id, title, due_date, max_score, course_id, course:courses!inner(name, teacher_id), submissions(status)'
    )
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(TASK_LIMIT);

  const query =
    ctx.role === 'teacher'
      ? baseQuery.eq('course.teacher_id', ctx.userId)
      : baseQuery;

  const { data } = await query;
  return ((data ?? []) as unknown as Array<{
    id: string;
    title: string;
    due_date: string | null;
    max_score: number;
    course_id: string;
    course: { name: string } | null;
    submissions: Array<{ status: SubmissionStatus }>;
  }>).map((t) => ({
    id: t.id,
    title: t.title,
    due_date: t.due_date,
    max_score: t.max_score,
    course_id: t.course_id,
    course_name: t.course?.name ?? null,
    submission_status: null,
    submission_count: (t.submissions ?? []).filter((s) => s.status === 'submitted').length,
  }));
}

async function fetchActivity(
  ctx: AuthenticatedContext,
  supabase: Supa
): Promise<ActivityItem[]> {
  // Students see only their own actions; everyone else sees the whole tenant.
  const base = supabase
    .from('audit_log')
    .select('id, action, entity_type, entity_id, created_at, actor_id, metadata, actor:profiles!audit_log_actor_id_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(ACTIVITY_LIMIT);

  const q = ctx.role === 'student' ? base.eq('actor_id', ctx.userId) : base;
  const { data, error } = await q;
  // audit_log FK alias may not exist yet on older migrations → graceful fallback.
  if (error) {
    const { data: fallback } = await supabase
      .from('audit_log')
      .select('id, action, entity_type, entity_id, created_at, actor_id, metadata')
      .order('created_at', { ascending: false })
      .limit(ACTIVITY_LIMIT);
    return ((fallback ?? []) as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id),
      action: String(r.action),
      entity_type: String(r.entity_type),
      entity_id: (r.entity_id as string | null) ?? null,
      created_at: String(r.created_at),
      actor_id: (r.actor_id as string | null) ?? null,
      actor_name: null,
      metadata: (r.metadata as Record<string, unknown> | null) ?? null,
    }));
  }
  return ((data ?? []) as unknown as Array<{
    id: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    created_at: string;
    actor_id: string | null;
    metadata: Record<string, unknown> | null;
    actor: { full_name: string | null } | null;
  }>).map((r) => ({
    id: r.id,
    action: r.action,
    entity_type: r.entity_type,
    entity_id: r.entity_id,
    created_at: r.created_at,
    actor_id: r.actor_id,
    actor_name: r.actor?.full_name ?? null,
    metadata: r.metadata,
  }));
}

async function fetchKpis(ctx: AuthenticatedContext, supabase: Supa): Promise<DashboardKpis> {
  const since = new Date(Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // 1. activeCourses — tenant-scoped through RLS.
  const activeCoursesPromise =
    ctx.role === 'student'
      ? supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', ctx.userId)
      : ctx.role === 'teacher'
        ? supabase
            .from('courses')
            .select('*', { count: 'exact', head: true })
            .eq('teacher_id', ctx.userId)
        : supabase.from('courses').select('*', { count: 'exact', head: true });

  // 2. pendingTasks — for student: tasks without own submission; for staff: submissions awaiting grading.
  const pendingPromise =
    ctx.role === 'student'
      ? supabase.rpc('student_pending_task_count', { p_student: ctx.userId }).then(
          (res) => ({ count: (res.data as number | null) ?? null, error: res.error }),
          () =>
            // RPC might not exist on placeholder/old DB → fall back to a heuristic.
            supabase
              .from('submissions')
              .select('*', { count: 'exact', head: true })
              .eq('student_id', ctx.userId)
              .eq('status', 'submitted')
        )
      : supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'submitted');

  // 3. recentSubmissions — last 7 days, tenant-wide (RLS).
  const recentPromise = supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .gte('submitted_at', since);

  // 4. gradedSubmissions — last 7 days.
  const gradedPromise = supabase
    .from('grades')
    .select('*', { count: 'exact', head: true })
    .gte('graded_at', since);

  const [active, pending, recent, graded] = await Promise.all([
    activeCoursesPromise,
    pendingPromise,
    recentPromise,
    gradedPromise,
  ]);

  return {
    activeCourses: Number(active.count ?? 0),
    pendingTasks: Number((pending as { count?: number | null }).count ?? 0),
    recentSubmissions: Number(recent.count ?? 0),
    gradedSubmissions: Number(graded.count ?? 0),
  };
}

// --------------------------------------------------------------------------
// Safe fallback — when Supabase credentials are still placeholder, every
// query above throws. The page uses this so the UI renders empty instead of
// an error screen during local bring-up.
// --------------------------------------------------------------------------
export function emptyOverview(ctx: AuthenticatedContext, institutionName: string | null): DashboardOverview {
  return {
    role: ctx.role,
    displayName: ctx.email.split('@')[0] ?? 'Nocturna',
    institutionName,
    kpis: { activeCourses: 0, pendingTasks: 0, recentSubmissions: 0, gradedSubmissions: 0 },
    courses: [],
    tasks: [],
    activity: [],
  };
}
