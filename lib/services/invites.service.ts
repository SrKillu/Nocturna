import 'server-only';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ApiError } from '@/lib/errors';
import type { AuthenticatedContext } from '@/lib/types/auth';
import {
  inviteStatus,
  type InvitePreview,
  type InviteStatus,
  type StudentInviteRow,
  type TeacherInviteRow,
} from '@/lib/invites/types';

// Re-export for consumers that import from this service.
export { inviteStatus };
export type { InvitePreview, InviteStatus, StudentInviteRow, TeacherInviteRow };

// ─────────────────────────────────────────────────────────────────────
// Validaciones
// ─────────────────────────────────────────────────────────────────────

export const createTeacherInviteSchema = z.object({
  emailHint: z.string().email('Email inválido').optional().nullable(),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});
export type CreateTeacherInviteInput = z.infer<typeof createTeacherInviteSchema>;

export const createStudentInviteSchema = z.object({
  courseId: z.string().uuid('courseId debe ser UUID'),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});
export type CreateStudentInviteInput = z.infer<typeof createStudentInviteSchema>;

// ─────────────────────────────────────────────────────────────────────
// Helpers RBAC
// ─────────────────────────────────────────────────────────────────────

function isStaff(ctx: AuthenticatedContext): boolean {
  return ctx.role === 'admin' || ctx.role === 'super_admin';
}

// ─────────────────────────────────────────────────────────────────────
// TEACHER INVITES  (admin → teacher)
// ─────────────────────────────────────────────────────────────────────

export async function listTeacherInvites(
  ctx: AuthenticatedContext
): Promise<TeacherInviteRow[]> {
  if (!isStaff(ctx)) {
    throw new ApiError('FORBIDDEN', 'Solo admins pueden listar invitaciones de profesor');
  }
  const sb = createClient();
  const { data, error } = await sb
    .from('teacher_invites')
    .select('id, token, email_hint, expires_at, used, revoked, created_at, created_by')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
  return (data ?? []) as TeacherInviteRow[];
}

export async function createTeacherInvite(
  ctx: AuthenticatedContext,
  input: CreateTeacherInviteInput
): Promise<TeacherInviteRow> {
  if (!isStaff(ctx)) {
    throw new ApiError('FORBIDDEN', 'Solo admins pueden crear invitaciones de profesor');
  }
  const sb = createClient();
  const expires = new Date(Date.now() + input.expiresInDays * 86400_000).toISOString();

  const { data, error } = await sb
    .from('teacher_invites')
    .insert({
      institution_id: ctx.institutionId,
      created_by: ctx.userId,
      email_hint: input.emailHint?.toLowerCase().trim() || null,
      expires_at: expires,
    })
    .select('id, token, email_hint, expires_at, used, revoked, created_at, created_by')
    .single();
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
  return data as TeacherInviteRow;
}

export async function revokeTeacherInvite(
  ctx: AuthenticatedContext,
  inviteId: string
): Promise<{ deleted: boolean }> {
  if (!isStaff(ctx)) {
    throw new ApiError('FORBIDDEN', 'Solo admins pueden revocar invitaciones de profesor');
  }
  const sb = createClient();
  const { data: inv, error: selErr } = await sb
    .from('teacher_invites')
    .select('id, revoked')
    .eq('id', inviteId)
    .maybeSingle();
  if (selErr) throw new ApiError('INTERNAL_ERROR', selErr.message);
  if (!inv) throw new ApiError('NOT_FOUND', 'Invitación no encontrada');

  // Semántica dual: si ya estaba revocada, hace DELETE real (limpieza).
  if (inv.revoked) {
    const { error: delErr } = await sb
      .from('teacher_invites')
      .delete()
      .eq('id', inviteId);
    if (delErr) throw new ApiError('INTERNAL_ERROR', delErr.message);
    return { deleted: true };
  }

  const { error } = await sb
    .from('teacher_invites')
    .update({ revoked: true })
    .eq('id', inviteId);
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
  return { deleted: false };
}

// ─────────────────────────────────────────────────────────────────────
// STUDENT INVITES  (teacher/admin → estudiante a un curso)
// ─────────────────────────────────────────────────────────────────────

export async function listStudentInvites(
  ctx: AuthenticatedContext,
  opts: { courseId?: string } = {}
): Promise<StudentInviteRow[]> {
  const sb = createClient();
  let q = sb
    .from('student_invites')
    .select('id, token, course_id, expires_at, used, revoked, created_at, created_by')
    .order('created_at', { ascending: false })
    .limit(200);
  if (opts.courseId) q = q.eq('course_id', opts.courseId);
  const { data, error } = await q;
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
  const rows = (data ?? []) as Array<Omit<StudentInviteRow, 'course_name'>>;
  if (rows.length === 0) return [];

  const courseIds = [...new Set(rows.map((r) => r.course_id))];
  const { data: courses } = await sb
    .from('courses')
    .select('id, name')
    .in('id', courseIds);
  const nameById = new Map((courses ?? []).map((c) => [c.id as string, c.name as string]));

  return rows.map((r) => ({ ...r, course_name: nameById.get(r.course_id) ?? null }));
}

async function assertCanManageCourse(
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
  if (
    !isStaff(ctx) &&
    !(ctx.role === 'teacher' && course.teacher_id === ctx.userId)
  ) {
    throw new ApiError('FORBIDDEN', 'No puedes generar invitaciones para este curso');
  }
  return { institution_id: course.institution_id };
}

export async function createStudentInvite(
  ctx: AuthenticatedContext,
  input: CreateStudentInviteInput
): Promise<StudentInviteRow> {
  const course = await assertCanManageCourse(ctx, input.courseId);
  const sb = createClient();
  const expires = new Date(Date.now() + input.expiresInDays * 86400_000).toISOString();

  const { data, error } = await sb
    .from('student_invites')
    .insert({
      institution_id: course.institution_id,
      course_id: input.courseId,
      created_by: ctx.userId,
      expires_at: expires,
    })
    .select('id, token, course_id, expires_at, used, revoked, created_at, created_by')
    .single();
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);

  const { data: courseRow } = await sb
    .from('courses')
    .select('name')
    .eq('id', input.courseId)
    .maybeSingle();
  return {
    ...(data as Omit<StudentInviteRow, 'course_name'>),
    course_name: (courseRow?.name as string) ?? null,
  };
}

export async function revokeStudentInvite(
  ctx: AuthenticatedContext,
  inviteId: string
): Promise<{ deleted: boolean }> {
  const sb = createClient();
  const { data: inv } = await sb
    .from('student_invites')
    .select('id, course_id, revoked')
    .eq('id', inviteId)
    .maybeSingle();
  if (!inv) throw new ApiError('NOT_FOUND', 'Invitación no encontrada');
  await assertCanManageCourse(ctx, inv.course_id as string);

  if (inv.revoked) {
    const { error } = await sb
      .from('student_invites')
      .delete()
      .eq('id', inviteId);
    if (error) throw new ApiError('INTERNAL_ERROR', error.message);
    return { deleted: true };
  }

  const { error } = await sb
    .from('student_invites')
    .update({ revoked: true })
    .eq('id', inviteId);
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
  return { deleted: false };
}

// ─────────────────────────────────────────────────────────────────────
// LOOKUP & CONSUME  (usuario logueado consume el token)
// ─────────────────────────────────────────────────────────────────────

/**
 * Busca un invite por token usando el service client (bypassa RLS) porque el
 * usuario que lo escanea puede ser anónimo o pertenecer a otro tenant aún.
 */
export async function lookupInvite(token: string): Promise<InvitePreview | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return null;
  }
  const admin = createServiceClient();

  // Try teacher first.
  const t = await admin
    .from('teacher_invites')
    .select('institution_id, used, revoked, expires_at')
    .eq('token', token)
    .maybeSingle();
  if (t.data) {
    const instRes = await admin
      .from('institutions')
      .select('name')
      .eq('id', t.data.institution_id as string)
      .maybeSingle();
    return {
      kind: 'teacher',
      institutionId: t.data.institution_id as string,
      institutionName: (instRes.data?.name as string) ?? null,
      courseId: null,
      courseName: null,
      status: inviteStatus({
        used: t.data.used as boolean,
        revoked: t.data.revoked as boolean,
        expires_at: t.data.expires_at as string,
      }),
      expires_at: t.data.expires_at as string,
    };
  }

  const s = await admin
    .from('student_invites')
    .select('institution_id, course_id, used, revoked, expires_at')
    .eq('token', token)
    .maybeSingle();
  if (s.data) {
    const [instRes, courseRes] = await Promise.all([
      admin
        .from('institutions')
        .select('name')
        .eq('id', s.data.institution_id as string)
        .maybeSingle(),
      admin
        .from('courses')
        .select('name')
        .eq('id', s.data.course_id as string)
        .maybeSingle(),
    ]);
    return {
      kind: 'student',
      institutionId: s.data.institution_id as string,
      institutionName: (instRes.data?.name as string) ?? null,
      courseId: s.data.course_id as string,
      courseName: (courseRes.data?.name as string) ?? null,
      status: inviteStatus({
        used: s.data.used as boolean,
        revoked: s.data.revoked as boolean,
        expires_at: s.data.expires_at as string,
      }),
      expires_at: s.data.expires_at as string,
    };
  }

  return null;
}

export interface ConsumeResult {
  kind: 'teacher' | 'student';
  courseId: string | null;
  institutionId: string;
}

/**
 * Consume un token en nombre del usuario autenticado. Usamos service client
 * para poder actualizar app_metadata (role / institution) en el caso de
 * invitación de profesor sin afectar RLS.
 */
export async function consumeInvite(
  ctx: AuthenticatedContext,
  token: string
): Promise<ConsumeResult> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    throw new ApiError('VALIDATION_ERROR', 'Token inválido');
  }
  const admin = createServiceClient();

  // ── TEACHER invite ───────────────────────────────────────────────
  const tRes = await admin
    .from('teacher_invites')
    .select('id, institution_id, used, revoked, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (tRes.data) {
    const inv = tRes.data as {
      id: string;
      institution_id: string;
      used: boolean;
      revoked: boolean;
      expires_at: string;
    };
    if (inv.revoked) throw new ApiError('FORBIDDEN', 'Invitación revocada');
    if (inv.used) throw new ApiError('CONFLICT', 'Invitación ya utilizada');
    if (new Date(inv.expires_at).getTime() < Date.now()) {
      throw new ApiError('FORBIDDEN', 'Invitación expirada');
    }

    // Si el usuario ya tiene una institución distinta no lo re-asignamos.
    if (ctx.institutionId && ctx.institutionId !== inv.institution_id) {
      throw new ApiError(
        'CONFLICT',
        'Ya perteneces a otra institución. Cierra sesión y regístrate con otra cuenta.'
      );
    }

    // Si ya es teacher del mismo tenant, solo marcamos used.
    const { error: profErr } = await admin
      .from('profiles')
      .update({
        role: 'teacher',
        institution_id: inv.institution_id,
        is_active: true,
      })
      .eq('id', ctx.userId);
    if (profErr) throw new ApiError('INTERNAL_ERROR', profErr.message);

    // Sincronizar app_metadata para que el próximo JWT refleje el rol.
    await admin.auth.admin.updateUserById(ctx.userId, {
      app_metadata: {
        institution_id: inv.institution_id,
        user_role: 'teacher',
      },
    });

    const { error: usedErr } = await admin
      .from('teacher_invites')
      .update({ used: true, used_at: new Date().toISOString(), used_by: ctx.userId })
      .eq('id', inv.id);
    if (usedErr) throw new ApiError('INTERNAL_ERROR', usedErr.message);

    return { kind: 'teacher', courseId: null, institutionId: inv.institution_id };
  }

  // ── STUDENT invite ───────────────────────────────────────────────
  const sRes = await admin
    .from('student_invites')
    .select('id, institution_id, course_id, used, revoked, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (sRes.data) {
    const inv = sRes.data as {
      id: string;
      institution_id: string;
      course_id: string;
      used: boolean;
      revoked: boolean;
      expires_at: string;
    };
    if (inv.revoked) throw new ApiError('FORBIDDEN', 'Invitación revocada');
    if (inv.used) throw new ApiError('CONFLICT', 'Invitación ya utilizada');
    if (new Date(inv.expires_at).getTime() < Date.now()) {
      throw new ApiError('FORBIDDEN', 'Invitación expirada');
    }
    if (ctx.institutionId !== inv.institution_id) {
      throw new ApiError(
        'FORBIDDEN',
        'Esta invitación es para otra institución.'
      );
    }

    // Auto-inscripción usando service client (bypass RLS, ya validamos).
    const { error: enrErr } = await admin
      .from('enrollments')
      .insert({
        institution_id: inv.institution_id,
        course_id: inv.course_id,
        student_id: ctx.userId,
      });
    if (enrErr && enrErr.code !== '23505') {
      // 23505 = unique_violation → ya estaba matriculado, tratamos como OK.
      throw new ApiError('INTERNAL_ERROR', enrErr.message);
    }

    const { error: usedErr } = await admin
      .from('student_invites')
      .update({ used: true, used_at: new Date().toISOString(), used_by: ctx.userId })
      .eq('id', inv.id);
    if (usedErr) throw new ApiError('INTERNAL_ERROR', usedErr.message);

    return { kind: 'student', courseId: inv.course_id, institutionId: inv.institution_id };
  }

  throw new ApiError('NOT_FOUND', 'Invitación no encontrada');
}
