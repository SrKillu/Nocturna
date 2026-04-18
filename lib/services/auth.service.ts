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
 * Runs with the service-role client (bypasses RLS) because:
 *   - The institution does not yet exist.
 *   - There is no authenticated caller yet.
 *
 * IMPORTANT: role + institution_id are written ONLY to `app_metadata`
 * (server-controlled). `user_metadata` is NEVER used for auth-critical values.
 */
export async function bootstrapInstitutionAndAdmin(
  input: InstitutionSignupInput
): Promise<BootstrapResult> {
  const admin = createServiceClient();

  // Reject duplicate slug early.
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

  // 2. Create auth user (email-confirmed). `app_metadata` carries the role and tenant.
  //    handle_new_user() will read raw_app_meta_data and insert the profile row.
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
    // Rollback institution to avoid orphans.
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

  // 3. Safety net: ensure the profile row reflects the correct values, in case
  //    the handle_new_user trigger ran before the institution_id arrived or under
  //    slightly different conditions. Service role bypasses RLS.
  const { error: profileErr } = await admin
    .from('profiles')
    .upsert(
      {
        id: userId,
        institution_id: institutionId,
        role: 'admin',
        email: input.adminEmail,
        full_name: input.adminFullName,
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

  return {
    institutionId,
    userId,
    email: input.adminEmail,
  };
}

/**
 * Admin-only: invite a user into the caller's institution.
 * All auth-critical fields (role, institution_id) go through `app_metadata`.
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
      },
      { onConflict: 'id' }
    );

  if (profileErr) {
    await admin.auth.admin.deleteUser(created.user.id);
    throw new ApiError('INTERNAL_ERROR', `Could not create profile: ${profileErr.message}`);
  }

  return { userId: created.user.id, temporaryPassword };
}

function generateTempPassword(): string {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
  let out = '';
  for (let i = 0; i < 14; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
