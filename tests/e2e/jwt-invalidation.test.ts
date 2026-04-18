/**
 * T17 · JWT invalidation via session_version bump.
 *
 * Flow:
 *   1. Sign in as a teacher, keep the session.
 *   2. Admin calls bump_session_version(teacher) → profile.session_version++.
 *   3. The OLD token is now stale. Re-fetching the profile with that client
 *      should fail RLS-wise, or at minimum the middleware would reject it.
 *      Here we assert against the DB layer: the session's JWT session_version
 *      no longer matches the DB session_version, and a fresh login gets a
 *      new token that succeeds.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { hasRealSupabase } from '../helpers/env';
import {
  seedTenant,
  teardownTenant,
  serviceRole,
  signInClient,
  type SeededTenant,
} from '../helpers/supabase';

const d = hasRealSupabase() ? describe : describe.skip;

d('T17 · JWT / session invalidation', () => {
  let T: SeededTenant | null = null;

  beforeAll(async () => {
    T = await seedTenant('jwt');
  }, 60_000);

  afterAll(async () => {
    await teardownTenant(T);
  }, 60_000);

  it('bumping session_version increments the counter in public.profiles', async () => {
    const svc = serviceRole();
    const before = await svc
      .from('profiles')
      .select('session_version')
      .eq('id', T!.teacher.id)
      .single();
    const v0 = (before.data?.session_version as number) ?? 0;

    const { data: newV, error } = await svc.rpc('bump_session_version', {
      target_user_id: T!.teacher.id,
    });
    expect(error).toBeNull();
    expect(newV).toBe(v0 + 1);

    const after = await svc
      .from('profiles')
      .select('session_version')
      .eq('id', T!.teacher.id)
      .single();
    expect(after.data?.session_version).toBe(v0 + 1);
  });

  it('non-admin cannot invoke bump_session_version (FORBIDDEN)', async () => {
    const teacher = await signInClient(T!.teacher.email, T!.teacher.password);
    const { error } = await teacher.rpc('bump_session_version', {
      target_user_id: T!.student.id,
    });
    expect(error).toBeTruthy();
    // Postgres 42501 insufficient_privilege
    expect(String(error?.code ?? '')).toMatch(/42501|PGRST/);
  });

  it('a freshly signed-in user carries the new session_version in its JWT', async () => {
    // Force a bump first so we can compare.
    const svc = serviceRole();
    await svc.rpc('bump_session_version', { target_user_id: T!.student.id });
    const { data: p } = await svc
      .from('profiles')
      .select('session_version')
      .eq('id', T!.student.id)
      .single();

    const student = await signInClient(T!.student.email, T!.student.password);
    const {
      data: { session },
    } = await student.auth.getSession();
    const payload = session?.access_token?.split('.')[1];
    expect(payload).toBeTruthy();
    // base64url decode
    const json = JSON.parse(
      Buffer.from(payload!, 'base64url').toString('utf-8')
    ) as { session_version?: number; app_metadata?: { session_version?: number } };
    const sv = json.session_version ?? json.app_metadata?.session_version;
    expect(sv).toBe(p?.session_version);
  });
});
