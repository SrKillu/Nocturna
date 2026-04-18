-- ====================================================================
-- Nocturna · Phase 9/9 · business_rpcs.sql
-- ====================================================================
-- Transactional server-side primitives for business logic that touches
-- multiple tables at once. SECURITY INVOKER means RLS still applies.
-- Apply AFTER 0008_auth_hardening.sql.
-- ====================================================================

-- --------------------------------------------------------------------
-- public.grade_submission
--
-- One-shot, idempotent grading:
--   1. Upsert public.grades (unique on submission_id => idempotent)
--   2. Flip public.submissions.status to 'graded'
--   3. Insert into public.audit_log
-- All three happen in a single statement scope; any raise aborts them all.
--
-- Authorization is triple-checked:
--   * caller JWT has role teacher | admin | super_admin
--   * caller institution_id matches submission.institution_id
--   * if caller is teacher, they must be the assigned teacher of the course
-- --------------------------------------------------------------------
create or replace function public.grade_submission(
  p_submission_id uuid,
  p_score         numeric,
  p_feedback      text default null
)
returns public.grades
language plpgsql
security invoker
set search_path = public, auth
as $$
declare
  v_caller_id       uuid := auth.uid();
  v_caller_role     text := auth.user_role();
  v_caller_inst     uuid := auth.institution_id();
  v_submission      public.submissions%rowtype;
  v_task            public.tasks%rowtype;
  v_course          public.courses%rowtype;
  v_grade           public.grades%rowtype;
begin
  if v_caller_id is null then
    raise exception 'unauthenticated' using errcode = '42501';
  end if;

  if v_caller_role not in ('teacher', 'admin', 'super_admin') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_submission
    from public.submissions
   where id = p_submission_id;

  if not found then
    raise exception 'submission not found' using errcode = 'P0002';
  end if;

  if v_submission.institution_id is distinct from v_caller_inst then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_task from public.tasks where id = v_submission.task_id;
  if not found then
    raise exception 'task not found' using errcode = 'P0002';
  end if;

  if p_score is null or p_score < 0 or p_score > v_task.max_score then
    raise exception 'score out of range' using errcode = '22023';
  end if;

  select * into v_course from public.courses where id = v_task.course_id;
  if not found then
    raise exception 'course not found' using errcode = 'P0002';
  end if;

  if v_caller_role = 'teacher' and v_course.teacher_id is distinct from v_caller_id then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  insert into public.grades (
    institution_id, submission_id, teacher_id, score, feedback
  ) values (
    v_caller_inst, p_submission_id, v_caller_id, p_score, p_feedback
  )
  on conflict (submission_id) do update
     set teacher_id = excluded.teacher_id,
         score      = excluded.score,
         feedback   = excluded.feedback,
         graded_at  = now(),
         updated_at = now()
  returning * into v_grade;

  update public.submissions
     set status = 'graded',
         updated_at = now()
   where id = p_submission_id;

  -- best-effort audit
  begin
    insert into public.audit_log (
      institution_id, actor_id, action, entity_type, entity_id, metadata
    ) values (
      v_caller_inst, v_caller_id, 'grade.upsert', 'submission', p_submission_id,
      jsonb_build_object(
        'score', p_score,
        'grade_id', v_grade.id,
        'course_id', v_course.id,
        'task_id', v_task.id
      )
    );
  exception when others then
    null;
  end;

  return v_grade;
end;
$$;

grant execute on function public.grade_submission(uuid, numeric, text) to authenticated;

-- --------------------------------------------------------------------
-- public.log_audit
-- Thin wrapper used by service-role callers that want to append a row
-- without bypassing institution_id validation via RLS.
-- --------------------------------------------------------------------
create or replace function public.log_audit(
  p_action      text,
  p_entity_type text,
  p_entity_id   uuid,
  p_metadata    jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public, auth
as $$
declare
  v_id   uuid;
  v_inst uuid := auth.institution_id();
begin
  if v_inst is null then
    raise exception 'missing tenant' using errcode = '42501';
  end if;
  insert into public.audit_log (institution_id, actor_id, action, entity_type, entity_id, metadata)
  values (v_inst, auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.log_audit(text, text, uuid, jsonb) to authenticated;
