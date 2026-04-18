import 'server-only';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { inviteUserToInstitution } from '@/lib/services/auth.service';
import { ApiError } from '@/lib/errors';
import type { AuthenticatedContext } from '@/lib/types/auth';

export const createTeacherSchema = z.object({
  email: z.string().email('Email inválido'),
  fullName: z.string().trim().min(2, 'Mínimo 2 caracteres').max(200),
  // Password optional. When omitted, a random one-time password is generated
  // and returned to the admin (to communicate to the teacher out of band).
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .max(200)
    .optional(),
});
export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;

export interface TeacherRow {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
  courses_count: number;
}

export async function listTeachers(ctx: AuthenticatedContext): Promise<TeacherRow[]> {
  if (ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw new ApiError('FORBIDDEN', 'Solo admins pueden ver la lista de profesores');
  }
  const supabase = createClient();

  // RLS already narrows to the caller's tenant.
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, is_active, created_at')
    .eq('role', 'teacher')
    .order('created_at', { ascending: false });
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
  if (!profiles || profiles.length === 0) return [];

  // Courses count per teacher (single pass).
  const { data: courses } = await supabase
    .from('courses')
    .select('teacher_id')
    .in('teacher_id', profiles.map((p) => p.id as string));

  const countsByTeacher = new Map<string, number>();
  for (const c of courses ?? []) {
    const tid = (c as { teacher_id: string | null }).teacher_id;
    if (!tid) continue;
    countsByTeacher.set(tid, (countsByTeacher.get(tid) ?? 0) + 1);
  }

  return profiles.map((p) => ({
    id: p.id as string,
    email: p.email as string,
    full_name: (p.full_name as string | null) ?? null,
    is_active: Boolean(p.is_active),
    created_at: p.created_at as string,
    courses_count: countsByTeacher.get(p.id as string) ?? 0,
  }));
}

export async function createTeacher(
  ctx: AuthenticatedContext,
  input: CreateTeacherInput
): Promise<{ id: string; email: string; temporaryPassword: string }> {
  if (ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw new ApiError('FORBIDDEN', 'Solo admins pueden crear profesores');
  }

  // Delegate to the hardened helper. It writes app_metadata (auth-critical
  // fields), creates auth user + profile atomically, and rolls back on error.
  const { userId, temporaryPassword } = await inviteUserToInstitution({
    institutionId: ctx.institutionId,
    email: input.email.toLowerCase().trim(),
    fullName: input.fullName.trim(),
    role: 'teacher',
  });

  // If the caller provided an explicit password, switch the generated one.
  if (input.password) {
    const { createServiceClient } = await import('@/lib/supabase/service');
    const admin = createServiceClient();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: input.password,
    });
    if (error) {
      // Non-fatal: the user exists with the temp password; return that instead.
      // eslint-disable-next-line no-console
      console.warn('[teachers.createTeacher] password override failed', error.message);
      return { id: userId, email: input.email, temporaryPassword };
    }
    return { id: userId, email: input.email, temporaryPassword: input.password };
  }

  return { id: userId, email: input.email, temporaryPassword };
}
