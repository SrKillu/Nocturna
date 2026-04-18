import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseEnv } from './env';

/**
 * Factory for Supabase clients used by E2E tests.
 * Never instantiated at import time — the helpers read `supabaseEnv()` lazily
 * so unit tests (which don't need real creds) can co-exist in the same suite.
 */

export function serviceRole(): SupabaseClient {
  const { url, serviceKey } = supabaseEnv();
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function anonClient(): SupabaseClient {
  const { url, anonKey } = supabaseEnv();
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Sign in as an existing user (anon key + password) and return a fresh client
 * scoped to that session. Use for RLS / permission assertions.
 */
export async function signInClient(
  email: string,
  password: string
): Promise<SupabaseClient> {
  const { url, anonKey } = supabaseEnv();
  const c = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`signIn failed for ${email}: ${error.message}`);
  return c;
}

export interface SeededUser {
  id: string;
  email: string;
  password: string;
}

export interface SeededTenant {
  institutionId: string;
  admin: SeededUser;
  teacher: SeededUser;
  student: SeededUser;
}

const PASSWORD = 'Nocturna!Test-Password-42';

/**
 * Creates an institution + one admin + one teacher + one student.
 * All users are fully confirmed with app_metadata.
 *
 * Cleanup is the caller's responsibility — see `teardownTenant`.
 */
export async function seedTenant(tag: string): Promise<SeededTenant> {
  const admin = serviceRole();
  const slug = `t-${tag}-${Date.now().toString(36)}`;

  const { data: inst, error: instErr } = await admin
    .from('institutions')
    .insert({ name: `Test ${tag}`, slug })
    .select('id')
    .single();
  if (instErr || !inst) throw new Error(`seed institution: ${instErr?.message}`);
  const institutionId = inst.id as string;

  async function mkUser(role: 'admin' | 'teacher' | 'student'): Promise<SeededUser> {
    const email = `${role}.${slug}@nocturna.test`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      app_metadata: {
        user_role: role,
        institution_id: institutionId,
      },
    });
    if (error || !data.user) throw new Error(`seed ${role}: ${error?.message}`);
    return { id: data.user.id, email, password: PASSWORD };
  }

  const [adminU, teacher, student] = await Promise.all([
    mkUser('admin'),
    mkUser('teacher'),
    mkUser('student'),
  ]);

  return { institutionId, admin: adminU, teacher, student };
}

export async function teardownTenant(t: SeededTenant | null): Promise<void> {
  if (!t) return;
  const admin = serviceRole();
  // Child rows cascade from institutions FK; we only need to delete auth users
  // (not FK-linked to institutions directly) and the institution row.
  await Promise.allSettled([
    admin.auth.admin.deleteUser(t.admin.id),
    admin.auth.admin.deleteUser(t.teacher.id),
    admin.auth.admin.deleteUser(t.student.id),
  ]);
  await admin.from('institutions').delete().eq('id', t.institutionId);
}
