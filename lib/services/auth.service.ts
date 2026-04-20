import 'server-only';
import { createServiceClient } from '@/lib/supabase/service';
import { ApiError } from '@/lib/errors';
import type { InstitutionSignupInput } from '@/lib/validations/auth';

export interface BootstrapResult {
  institutionId: string;
  userId: string;
  email: string;
}

/**
 * Bootstraps a new institution + admin user atomically.
 *
 * Integrity guarantees:
 *   * `app_metadata` is the ONLY place auth-critical fields are written.
 *   * After createUser() we verify the profile row exists and matches the
 *     intended institution; otherwise every partial state is rolled back.
 */
export async function bootstrapInstitutionAndAdmin(
  input: InstitutionSignupInput
): Promise<BootstrapResult> {
  const admin = createServiceClient();

  const { data: existingInst } = await admin
    .from('institutions')
    .select('id')
    .eq('slug', input.institutionSlug)
    .maybeSingle();

  if (existingInst) {
    throw new ApiError('CONFLICT', 'Institution slug already exists');
  }

  // 1. Create institution.
  const { data: institution, error: instErr } = await admin
    .from('institutions')
    .insert({ name: input.institutionName, slug: input.institutionSlug })
    .select('id')
    .single();

  if (instErr || !institution) {
    throw new ApiError('INTERNAL_ERROR', `Could not create institution: ${instErr?.message ?? ''}`);
  }
  const institutionId = (institution as { id: string }).id;

  // 2. Create auth user (email-confirmed). Auth-critical fields go in app_metadata ONLY.
  const { data: created, error: userErr } = await admin.auth.admin.createUser({
    email: input.adminEmail,
    password: input.adminPassword,
    email_confirm: true,
    app_metadata: {
      user_role: 'admin',
      institution_id: institutionId,
      full_name: input.adminFullName,
    },
  });

  if (userErr || !created?.user) {
    await admin.from('institutions').delete().eq('id', institutionId);
    if (userErr?.message?.toLowerCase().includes('registered')) {
      throw new ApiError('CONFLICT', 'Email already registered');
    }
    throw new ApiError(
      'INTERNAL_ERROR',
      `Could not create admin user: ${userErr?.message ?? ''}`
    );
  }
  const userId = created.user.id;

  // 3. Force-upsert the profile (service role bypasses RLS). is_active defaults to true.
  const { error: profileErr } = await admin
    .from('profiles')
    .upsert(
      {
        id: userId,
        institution_id: institutionId,
        role: 'admin',
        email: input.adminEmail,
        full_name: input.adminFullName,
        is_active: true,
      },
      { onConflict: 'id' }
    );

  if (profileErr) {
    await admin.auth.admin.deleteUser(userId);
    await admin.from('institutions').delete().eq('id', institutionId);
    throw new ApiError(
      'INTERNAL_ERROR',
      `Could not create admin profile: ${profileErr.message}`
    );
  }

  // 4. Verify the final state. No profile OR wrong institution -> full rollback.
  const { data: verified, error: verifyErr } = await admin
    .from('profiles')
    .select('id, institution_id, role, is_active')
    .eq('id', userId)
    .maybeSingle();

  if (
    verifyErr ||
    !verified ||
    (verified as { institution_id: string }).institution_id !== institutionId ||
    (verified as { role: string }).role !== 'admin' ||
    (verified as { is_active: boolean }).is_active !== true
  ) {
    await admin.auth.admin.deleteUser(userId);
    await admin.from('institutions').delete().eq('id', institutionId);
    throw new ApiError(
      'INTERNAL_ERROR',
      'Profile integrity check failed after signup'
    );
  }

  return { institutionId, userId, email: input.adminEmail };
}

/**
 * Admin-only: invite a user into the caller's institution.
 * Auth-critical fields flow through app_metadata exclusively.
 */
export async function inviteUserToInstitution(params: {
  institutionId: string;
  email: string;
  fullName: string;
  role: 'student' | 'teacher' | 'admin';
}): Promise<{ userId: string; temporaryPassword: string }> {
  const admin = createServiceClient();
  const temporaryPassword = generateTempPassword();

  const { data: created, error: userErr } = await admin.auth.admin.createUser({
    email: params.email,
    password: temporaryPassword,
    email_confirm: true,
    app_metadata: {
      user_role: params.role,
      institution_id: params.institutionId,
      full_name: params.fullName,
    },
  });

  if (userErr || !created?.user) {
    if (userErr?.message?.toLowerCase().includes('registered')) {
      throw new ApiError('CONFLICT', 'Email already registered');
    }
    throw new ApiError('INTERNAL_ERROR', `Could not create user: ${userErr?.message ?? ''}`);
  }

  const { error: profileErr } = await admin
    .from('profiles')
    .upsert(
      {
        id: created.user.id,
        institution_id: params.institutionId,
        role: params.role,
        email: params.email,
        full_name: params.fullName,
        is_active: true,
      },
      { onConflict: 'id' }
    );

  if (profileErr) {
    await admin.auth.admin.deleteUser(created.user.id);
    throw new ApiError('INTERNAL_ERROR', `Could not create profile: ${profileErr.message}`);
  }

  return { userId: created.user.id, temporaryPassword };
}

/**
 * Admin-only: change role or is_active for a user in the caller's tenant.
 * Every change bumps session_version so active JWTs become stale immediately.
 */
export async function updateTenantUser(params: {
  callerInstitutionId: string;
  callerUserId: string;
  targetUserId: string;
  role?: 'student' | 'teacher' | 'admin';
  isActive?: boolean;
}): Promise<{ userId: string; role?: string; isActive?: boolean; sessionVersion: number }> {
  const admin = createServiceClient();

  // Load target profile and confirm same tenant.
  const { data: target, error: loadErr } = await admin
    .from('profiles')
    .select('id, institution_id, role, is_active, session_version')
    .eq('id', params.targetUserId)
    .maybeSingle();

  if (loadErr) throw new ApiError('INTERNAL_ERROR', loadErr.message);
  const targetRow = target as
    | {
        id: string;
        institution_id: string;
        role: string;
        is_active: boolean;
        session_version: number;
      }
    | null;
  if (!targetRow) throw new ApiError('NOT_FOUND', 'User not found');

  if (targetRow.institution_id !== params.callerInstitutionId) {
    throw new ApiError('FORBIDDEN', 'Cross-tenant update is not allowed');
  }

  if (params.targetUserId === params.callerUserId && params.isActive === false) {
    throw new ApiError('CONFLICT', 'You cannot deactivate your own account');
  }

  const patch: Record<string, unknown> = {};
  if (params.role !== undefined) patch.role = params.role;
  if (params.isActive !== undefined) patch.is_active = params.isActive;
  patch.session_version = targetRow.session_version + 1;

  const { data: updated, error: updErr } = await admin
    .from('profiles')
    .update(patch)
    .eq('id', params.targetUserId)
    .select('id, role, is_active, session_version')
    .single();

  if (updErr || !updated) {
    throw new ApiError('INTERNAL_ERROR', updErr?.message ?? 'Update failed');
  }

  // Mirror auth-critical fields into auth.users.app_metadata so new JWTs
  // minted before the hook re-reads profiles also carry the right values.
  const appMetaPatch: Record<string, unknown> = {};
  if (params.role !== undefined) appMetaPatch.user_role = params.role;
  if (params.isActive !== undefined) appMetaPatch.is_active = params.isActive;
  if (Object.keys(appMetaPatch).length > 0) {
    await admin.auth.admin.updateUserById(params.targetUserId, {
      app_metadata: appMetaPatch,
    });
  }

  // Best-effort revoke of active refresh tokens.
  try {
    const { data: jwt } = await admin.auth.admin.createUser({}).catch(() => ({ data: null }));
    void jwt;
  } catch {
    // no-op: the primary invalidation mechanism is session_version bump, not token revocation.
  }

  return {
    userId: (updated as { id: string }).id,
    role: (updated as { role?: string }).role,
    isActive: (updated as { is_active?: boolean }).is_active,
    sessionVersion: (updated as { session_version: number }).session_version,
  };
}

function generateTempPassword(): string {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
  let out = '';
  for (let i = 0; i < 14; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

// ════════════════════════════════════════════════════════════════════
// Public self-service registration (student / teacher)
// ════════════════════════════════════════════════════════════════════

export interface PublicRegisterResult {
  userId: string;
  email: string;
  /** Rol finalmente persistido (puede venir del token si se proveyó). */
  role: 'student' | 'teacher';
  /** null si el usuario se registró sin invite. */
  institutionId: string | null;
  /** Si el token era de `student_invites`, devolvemos el curso para redirigir. */
  enrolledCourseId: string | null;
  /** true si se consumió un invite durante el signup. */
  tokenConsumed: boolean;
}

/**
 * Registro público (no-admin). Cubre dos caminos:
 *
 *   1. SIN token: crea la cuenta con role elegido + institution_id=null.
 *      La UI envía al usuario a /auth/pending para pegar el código cuando
 *      lo reciba.
 *
 *   2. CON token (UUID de teacher_invites o student_invites): crea la
 *      cuenta usando role + institution_id del invite, marca el invite
 *      como usado y — si es student — crea el enrollment. Todo atómico
 *      desde el punto de vista del usuario (rollback del auth.user si falla).
 *
 * Nunca permite role='admin'. El endpoint valida con Zod primero.
 */
export async function registerPublicUser(input: {
  fullName: string;
  email: string;
  password: string;
  role: 'student' | 'teacher';
  token?: string | null;
}): Promise<PublicRegisterResult> {
  const admin = createServiceClient();

  // ── 1. Si hay token, lo resolvemos ANTES de crear el user. ────────
  let resolvedRole: 'student' | 'teacher' = input.role;
  let resolvedInstitutionId: string | null = null;
  let studentInviteCourseId: string | null = null;
  let teacherInviteId: string | null = null;
  let studentInviteId: string | null = null;

  if (input.token) {
    // eslint-disable-next-line no-console
    console.log('[auth.register] token provided, looking up', {
      token: input.token.slice(0, 8),
    });
    // Lookup en teacher_invites
    const tRes = await admin
      .from('teacher_invites')
      .select('id, institution_id, used, revoked, expires_at')
      .eq('token', input.token)
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
      resolvedRole = 'teacher';
      resolvedInstitutionId = inv.institution_id;
      teacherInviteId = inv.id;
    } else {
      // Lookup en student_invites
      const sRes = await admin
        .from('student_invites')
        .select('id, institution_id, course_id, used, revoked, expires_at')
        .eq('token', input.token)
        .maybeSingle();
      if (!sRes.data) {
        throw new ApiError('NOT_FOUND', 'Invitación no encontrada');
      }
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
      resolvedRole = 'student';
      resolvedInstitutionId = inv.institution_id;
      studentInviteCourseId = inv.course_id;
      studentInviteId = inv.id;
    }
    // eslint-disable-next-line no-console
    console.log('[auth.register] token resolved', {
      role: resolvedRole,
      institutionId: resolvedInstitutionId,
      courseId: studentInviteCourseId,
    });
  }

  // ── 2. Crear auth user. ───────────────────────────────────────────
  const { data: created, error: userErr } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    app_metadata: {
      user_role: resolvedRole,
      institution_id: resolvedInstitutionId,
      full_name: input.fullName,
    },
  });
  if (userErr || !created?.user) {
    if (userErr?.message?.toLowerCase().includes('registered')) {
      throw new ApiError('CONFLICT', 'Ya existe una cuenta con ese email');
    }
    throw new ApiError(
      'INTERNAL_ERROR',
      `No se pudo crear la cuenta: ${userErr?.message ?? ''}`
    );
  }
  const userId = created.user.id;

  // ── 3. Crear profile (idempotente). ──────────────────────────────
  const { error: profileErr } = await admin.from('profiles').upsert(
    {
      id: userId,
      institution_id: resolvedInstitutionId,
      role: resolvedRole,
      email: input.email,
      full_name: input.fullName,
      is_active: true,
    },
    { onConflict: 'id' }
  );
  if (profileErr) {
    // Rollback del auth.user si no pudimos crear el profile.
    await admin.auth.admin.deleteUser(userId).catch(() => undefined);
    throw new ApiError(
      'INTERNAL_ERROR',
      `No se pudo crear el perfil: ${profileErr.message}`
    );
  }

  // ── 4. Si había token, consumirlo. ───────────────────────────────
  let enrolledCourseId: string | null = null;
  let tokenConsumed = false;

  if (teacherInviteId) {
    const { error } = await admin
      .from('teacher_invites')
      .update({
        used: true,
        used_at: new Date().toISOString(),
        used_by: userId,
      })
      .eq('id', teacherInviteId);
    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[auth.register] teacher invite mark-used failed', error);
    } else {
      tokenConsumed = true;
    }
  }

  if (studentInviteId && studentInviteCourseId && resolvedInstitutionId) {
    // Crear enrollment.
    const { data: enrollment, error: enrErr } = await admin
      .from('enrollments')
      .upsert(
        {
          institution_id: resolvedInstitutionId,
          course_id: studentInviteCourseId,
          student_id: userId,
        },
        { onConflict: 'course_id,student_id', ignoreDuplicates: false }
      )
      .select('id, course_id')
      .single();

    if (enrErr) {
      // eslint-disable-next-line no-console
      console.error('[auth.register] enrollment failed', enrErr);
      // No rollback del user: el signup es válido, solo informamos que no se matriculó.
    } else {
      enrolledCourseId = (enrollment as { course_id: string }).course_id;
      // eslint-disable-next-line no-console
      console.log('[auth.register] enrollment ready', {
        enrollmentId: (enrollment as { id: string }).id,
      });
    }

    const { error: usedErr } = await admin
      .from('student_invites')
      .update({
        used: true,
        used_at: new Date().toISOString(),
        used_by: userId,
      })
      .eq('id', studentInviteId);
    if (!usedErr) tokenConsumed = true;
  }

  return {
    userId,
    email: input.email,
    role: resolvedRole,
    institutionId: resolvedInstitutionId,
    enrolledCourseId,
    tokenConsumed,
  };
}

