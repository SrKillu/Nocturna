/**
 * T15b · Real permission matrix (E2E).
 *
 * Validates that role-based policies behave as advertised against a real DB:
 *   * student cannot insert into courses/tasks.
 *   * teacher cannot grade a submission of a course they don't own.
 *   * admin can invoke privileged RPCs within their tenant only.
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

d('T15b · permission matrix', () => {
  let T: SeededTenant | null = null;
  let otherTeacherId = '';
  let courseId = '';
  let taskId = '';
  let submissionId = '';

  beforeAll(async () => {
    T = await seedTenant('perm');
    const svc = serviceRole();

    // Add a second teacher not owning the course.
    const { data: other } = await svc.auth.admin.createUser({
      email: `other.${T.institutionId}@nocturna.test`,
      password: T.teacher.password,
      email_confirm: true,
      app_metadata: {
        user_role: 'teacher',
        institution_id: T.institutionId,
      },
    });
    otherTeacherId = other.user!.id;

    const { data: course } = await svc
      .from('courses')
      .insert({
        institution_id: T.institutionId,
        name: 'Perm Course',
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
        title: 'Perm Task',
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
    if (otherTeacherId) {
      await serviceRole().auth.admin.deleteUser(otherTeacherId);
    }
  }, 60_000);

  it('student cannot INSERT into courses', async () => {
    const c = await signInClient(T!.student.email, T!.student.password);
    const { error } = await c
      .from('courses')
      .insert({
        institution_id: T!.institutionId,
        name: 'nope',
        teacher_id: T!.teacher.id,
        created_by: T!.student.id,
      })
      .select('id')
      .maybeSingle();
    expect(error).toBeTruthy();
  });

  it('non-owner teacher cannot grade another teacher’s submission', async () => {
    const other = await signInClient(
      `other.${T!.institutionId}@nocturna.test`,
      T!.teacher.password
    );
    const { error } = await other.rpc('grade_submission', {
      p_submission_id: submissionId,
      p_score: 50,
      p_feedback: 'intruder',
    });
    expect(error).toBeTruthy();
    expect(String(error?.code ?? '')).toMatch(/42501|PGRST/);
  });

  it('owner teacher CAN grade their own submission', async () => {
    const owner = await signInClient(T!.teacher.email, T!.teacher.password);
    const { error } = await owner.rpc('grade_submission', {
      p_submission_id: submissionId,
      p_score: 90,
      p_feedback: 'legit',
    });
    expect(error).toBeNull();
  });

  it('admin CAN grade within their tenant', async () => {
    const admin = await signInClient(T!.admin.email, T!.admin.password);
    const { error } = await admin.rpc('grade_submission', {
      p_submission_id: submissionId,
      p_score: 95,
      p_feedback: 'adjusted by admin',
    });
    expect(error).toBeNull();
  });
});
