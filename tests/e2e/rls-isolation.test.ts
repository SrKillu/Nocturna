/**
 * T15 · RLS multi-tenant isolation (E2E).
 *
 * Seeds two independent institutions (A and B), then verifies that:
 *   * A user signed into tenant A cannot SELECT rows belonging to tenant B.
 *   * A user signed into tenant A cannot INSERT rows into tenant B.
 *   * Institution_id can never be forged from the client — it always resolves
 *     to the caller's JWT institution via auth.institution_id() defaults.
 *
 * Requires real Supabase credentials. Skipped otherwise.
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

d('T15 · RLS multi-tenant isolation', () => {
  let A: SeededTenant | null = null;
  let B: SeededTenant | null = null;
  let courseIdA = '';
  let courseIdB = '';

  beforeAll(async () => {
    A = await seedTenant('rls-a');
    B = await seedTenant('rls-b');
    const svc = serviceRole();
    const { data: cA, error: eA } = await svc
      .from('courses')
      .insert({
        institution_id: A.institutionId,
        name: 'Course A',
        teacher_id: A.teacher.id,
        created_by: A.admin.id,
      })
      .select('id')
      .single();
    if (eA || !cA) throw new Error(`seed course A: ${eA?.message}`);
    courseIdA = cA.id as string;

    const { data: cB, error: eB } = await svc
      .from('courses')
      .insert({
        institution_id: B.institutionId,
        name: 'Course B',
        teacher_id: B.teacher.id,
        created_by: B.admin.id,
      })
      .select('id')
      .single();
    if (eB || !cB) throw new Error(`seed course B: ${eB?.message}`);
    courseIdB = cB.id as string;
  }, 60_000);

  afterAll(async () => {
    await teardownTenant(A);
    await teardownTenant(B);
  }, 60_000);

  it('user from A sees only A’s courses', async () => {
    const c = await signInClient(A!.admin.email, A!.admin.password);
    const { data } = await c.from('courses').select('id, institution_id');
    expect(data).toBeTruthy();
    for (const row of data!) {
      expect(row.institution_id).toBe(A!.institutionId);
    }
    expect(data!.some((r) => r.id === courseIdA)).toBe(true);
    expect(data!.some((r) => r.id === courseIdB)).toBe(false);
  });

  it('user from A cannot SELECT a specific course from B by id', async () => {
    const c = await signInClient(A!.admin.email, A!.admin.password);
    const { data } = await c.from('courses').select('*').eq('id', courseIdB);
    expect(data ?? []).toHaveLength(0);
  });

  it('user from A cannot INSERT a course for tenant B even if payload claims so', async () => {
    const c = await signInClient(A!.admin.email, A!.admin.password);
    const { error } = await c
      .from('courses')
      .insert({
        institution_id: B!.institutionId, // spoof attempt
        name: 'Injected',
        teacher_id: B!.teacher.id,
        created_by: A!.admin.id,
      })
      .select('id')
      .maybeSingle();
    // RLS must refuse the insert; supabase surfaces this as an error.
    expect(error).toBeTruthy();
  });

  it('student of A cannot read audit_log from B', async () => {
    const c = await signInClient(A!.student.email, A!.student.password);
    const { data } = await c
      .from('audit_log')
      .select('id, institution_id')
      .eq('institution_id', B!.institutionId);
    expect(data ?? []).toHaveLength(0);
  });
});
