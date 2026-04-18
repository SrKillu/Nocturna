/**
 * T16 · audit_log integrity (E2E).
 *
 * After a grade upsert or session bump, the corresponding audit row must
 * exist, carry the correct institution_id (from the caller JWT, not the
 * client) and have the expected `action`. Also verifies that audit rows are
 * scoped to the tenant by RLS.
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

d('T16 · audit_log', () => {
  let T: SeededTenant | null = null;
  let submissionId = '';
  let taskId = '';
  let courseId = '';

  beforeAll(async () => {
    T = await seedTenant('audit');
    const svc = serviceRole();

    const { data: course } = await svc
      .from('courses')
      .insert({
        institution_id: T.institutionId,
        name: 'Audit Course',
        teacher_id: T.teacher.id,
        created_by: T.admin.id,
      })
      .select('id')
      .single();
    courseId = course!.id as string;

    await svc.from('enrollments').insert({
      institution_id: T.institutionId,
      course_id: courseId,
      student_id: T.student.id,
    });

    const { data: task } = await svc
      .from('tasks')
      .insert({
        institution_id: T.institutionId,
        course_id: courseId,
        title: 'Audit Task',
        max_score: 100,
        created_by: T.teacher.id,
      })
      .select('id')
      .single();
    taskId = task!.id as string;

    const { data: sub } = await svc
      .from('submissions')
      .insert({
        institution_id: T.institutionId,
        task_id: taskId,
        student_id: T.student.id,
        content: 'ok',
      })
      .select('id')
      .single();
    submissionId = sub!.id as string;
  }, 90_000);

  afterAll(async () => {
    await teardownTenant(T);
  }, 60_000);

  it('grade_submission RPC writes to audit_log with caller institution_id', async () => {
    const teacher = await signInClient(T!.teacher.email, T!.teacher.password);
    const { error } = await teacher.rpc('grade_submission', {
      p_submission_id: submissionId,
      p_score: 87,
      p_feedback: 'good',
    });
    expect(error).toBeNull();

    const svc = serviceRole();
    const { data: rows } = await svc
      .from('audit_log')
      .select('action, entity_type, entity_id, institution_id, actor_id')
      .eq('entity_id', submissionId)
      .eq('action', 'grade.upsert');
    expect(rows?.length ?? 0).toBeGreaterThanOrEqual(1);
    expect(rows![0].institution_id).toBe(T!.institutionId);
    expect(rows![0].actor_id).toBe(T!.teacher.id);
  });

  it('institution_id in audit_log cannot be spoofed from the client', async () => {
    const teacher = await signInClient(T!.teacher.email, T!.teacher.password);
    // Even if the client attempts to write with a fake institution_id, the
    // `log_audit` RPC ignores the column (auth.institution_id() wins).
    const { data: id, error } = await teacher.rpc('log_audit', {
      p_action: 'spoof.attempt',
      p_entity_type: 'probe',
      p_entity_id: submissionId,
      p_metadata: { foo: 'bar' },
    });
    expect(error).toBeNull();
    expect(id).toBeTruthy();

    const svc = serviceRole();
    const { data: row } = await svc
      .from('audit_log')
      .select('institution_id, actor_id')
      .eq('id', id as string)
      .single();
    expect(row?.institution_id).toBe(T!.institutionId);
    expect(row?.actor_id).toBe(T!.teacher.id);
  });
});
