-- ====================================================================
-- Nocturna · Phase 5/7 · rls_policies.sql
-- ====================================================================
-- Strict multi-tenant RLS. Rules:
--  * Every INSERT/UPDATE policy enforces `institution_id = auth.institution_id()`.
--  * super_admin bypass lives ONLY on `institutions` and `audit_log` SELECT.
--  * audit_log has NO update/delete policies -> rows are immutable at row level.
--  * auth.role() is NEVER used; we always go through auth.user_role()/auth.institution_id().
-- ====================================================================

-- --------------------------------------------------------------------
-- Enable RLS
-- --------------------------------------------------------------------
alter table public.institutions enable row level security;
alter table public.profiles     enable row level security;
alter table public.courses      enable row level security;
alter table public.enrollments  enable row level security;
alter table public.tasks        enable row level security;
alter table public.submissions  enable row level security;
alter table public.grades       enable row level security;
alter table public.audit_log    enable row level security;

-- Force RLS even for table owners so no accidental bypass in SQL editor session.
alter table public.institutions force row level security;
alter table public.profiles     force row level security;
alter table public.courses      force row level security;
alter table public.enrollments  force row level security;
alter table public.tasks        force row level security;
alter table public.submissions  force row level security;
alter table public.grades       force row level security;
alter table public.audit_log    force row level security;

-- ====================================================================
-- institutions
--   super_admin may read any institution. Everyone else only their own.
--   No one can INSERT via RLS (bootstrapped by service role on signup).
--   Only admins of that institution can UPDATE their row.
-- ====================================================================
drop policy if exists institutions_select      on public.institutions;
drop policy if exists institutions_update_admin on public.institutions;

create policy institutions_select on public.institutions
  for select to authenticated
  using (
    auth.is_super_admin()
    or id = auth.institution_id()
  );

create policy institutions_update_admin on public.institutions
  for update to authenticated
  using (
    id = auth.institution_id()
    and auth.user_role() in ('admin', 'super_admin')
  )
  with check (
    id = auth.institution_id()
  );

-- ====================================================================
-- profiles
-- ====================================================================
drop policy if exists profiles_select_tenant  on public.profiles;
drop policy if exists profiles_update_self    on public.profiles;
drop policy if exists profiles_update_admin   on public.profiles;

create policy profiles_select_tenant on public.profiles
  for select to authenticated
  using (
    institution_id = auth.institution_id()
  );

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (
    id = auth.uid()
    and institution_id = auth.institution_id()
  )
  with check (
    id = auth.uid()
    and institution_id = auth.institution_id()
  );

create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (
    institution_id = auth.institution_id()
    and auth.user_role() in ('admin', 'super_admin')
  )
  with check (
    institution_id = auth.institution_id()
  );

-- No INSERT/DELETE policies: profile creation is handled by the
-- handle_new_user() trigger (SECURITY DEFINER), and deletion cascades from auth.users.

-- ====================================================================
-- courses
-- ====================================================================
drop policy if exists courses_select_tenant   on public.courses;
drop policy if exists courses_insert_admin    on public.courses;
drop policy if exists courses_update_admin    on public.courses;
drop policy if exists courses_delete_admin    on public.courses;

create policy courses_select_tenant on public.courses
  for select to authenticated
  using (
    institution_id = auth.institution_id()
  );

create policy courses_insert_admin on public.courses
  for insert to authenticated
  with check (
    institution_id = auth.institution_id()
    and auth.user_role() in ('admin', 'super_admin')
    and created_by = auth.uid()
  );

create policy courses_update_admin on public.courses
  for update to authenticated
  using (
    institution_id = auth.institution_id()
    and auth.user_role() in ('admin', 'super_admin')
  )
  with check (
    institution_id = auth.institution_id()
  );

create policy courses_delete_admin on public.courses
  for delete to authenticated
  using (
    institution_id = auth.institution_id()
    and auth.user_role() in ('admin', 'super_admin')
  );

-- ====================================================================
-- enrollments
-- ====================================================================
drop policy if exists enrollments_select_tenant on public.enrollments;
drop policy if exists enrollments_insert        on public.enrollments;
drop policy if exists enrollments_delete        on public.enrollments;

create policy enrollments_select_tenant on public.enrollments
  for select to authenticated
  using (
    institution_id = auth.institution_id()
  );

-- Students self-enroll; admins can enroll any student inside their tenant.
create policy enrollments_insert on public.enrollments
  for insert to authenticated
  with check (
    institution_id = auth.institution_id()
    and (
      (auth.user_role() = 'student' and student_id = auth.uid())
      or auth.user_role() in ('admin', 'super_admin')
    )
    and exists (
      select 1 from public.courses c
      where c.id = enrollments.course_id
        and c.institution_id = auth.institution_id()
    )
  );

create policy enrollments_delete on public.enrollments
  for delete to authenticated
  using (
    institution_id = auth.institution_id()
    and (
      student_id = auth.uid()
      or auth.user_role() in ('admin', 'super_admin')
    )
  );

-- ====================================================================
-- tasks
-- ====================================================================
drop policy if exists tasks_select_tenant       on public.tasks;
drop policy if exists tasks_insert_teacher      on public.tasks;
drop policy if exists tasks_update_teacher      on public.tasks;
drop policy if exists tasks_delete_teacher      on public.tasks;

create policy tasks_select_tenant on public.tasks
  for select to authenticated
  using (
    institution_id = auth.institution_id()
  );

create policy tasks_insert_teacher on public.tasks
  for insert to authenticated
  with check (
    institution_id = auth.institution_id()
    and auth.user_role() in ('teacher', 'admin', 'super_admin')
    and created_by = auth.uid()
    and exists (
      select 1 from public.courses c
      where c.id = tasks.course_id
        and c.institution_id = auth.institution_id()
        and (
          c.teacher_id = auth.uid()
          or auth.user_role() in ('admin', 'super_admin')
        )
    )
  );

create policy tasks_update_teacher on public.tasks
  for update to authenticated
  using (
    institution_id = auth.institution_id()
    and (
      created_by = auth.uid()
      or auth.user_role() in ('admin', 'super_admin')
    )
  )
  with check (
    institution_id = auth.institution_id()
  );

create policy tasks_delete_teacher on public.tasks
  for delete to authenticated
  using (
    institution_id = auth.institution_id()
    and (
      created_by = auth.uid()
      or auth.user_role() in ('admin', 'super_admin')
    )
  );

-- ====================================================================
-- submissions
-- ====================================================================
drop policy if exists submissions_select  on public.submissions;
drop policy if exists submissions_insert  on public.submissions;
drop policy if exists submissions_update  on public.submissions;

create policy submissions_select on public.submissions
  for select to authenticated
  using (
    institution_id = auth.institution_id()
    and (
      student_id = auth.uid()
      or auth.user_role() in ('admin', 'super_admin')
      or exists (
        select 1 from public.tasks t
        join public.courses c on c.id = t.course_id
        where t.id = submissions.task_id
          and c.teacher_id = auth.uid()
      )
    )
  );

create policy submissions_insert on public.submissions
  for insert to authenticated
  with check (
    institution_id = auth.institution_id()
    and student_id = auth.uid()
    and auth.user_role() = 'student'
    and exists (
      select 1 from public.enrollments e
      join public.tasks t on t.course_id = e.course_id
      where t.id = submissions.task_id
        and e.student_id = auth.uid()
        and e.institution_id = auth.institution_id()
    )
  );

create policy submissions_update on public.submissions
  for update to authenticated
  using (
    institution_id = auth.institution_id()
    and student_id = auth.uid()
    and status in ('submitted', 'returned')
  )
  with check (
    institution_id = auth.institution_id()
    and student_id = auth.uid()
  );

-- ====================================================================
-- grades
-- ====================================================================
drop policy if exists grades_select  on public.grades;
drop policy if exists grades_insert  on public.grades;
drop policy if exists grades_update  on public.grades;

create policy grades_select on public.grades
  for select to authenticated
  using (
    institution_id = auth.institution_id()
    and (
      auth.user_role() in ('admin', 'super_admin', 'teacher')
      or exists (
        select 1 from public.submissions s
        where s.id = grades.submission_id
          and s.student_id = auth.uid()
      )
    )
  );

create policy grades_insert on public.grades
  for insert to authenticated
  with check (
    institution_id = auth.institution_id()
    and teacher_id = auth.uid()
    and auth.user_role() in ('teacher', 'admin', 'super_admin')
    and exists (
      select 1 from public.submissions s
      join public.tasks   t on t.id = s.task_id
      join public.courses c on c.id = t.course_id
      where s.id = grades.submission_id
        and s.institution_id = auth.institution_id()
        and (
          c.teacher_id = auth.uid()
          or auth.user_role() in ('admin', 'super_admin')
        )
    )
  );

create policy grades_update on public.grades
  for update to authenticated
  using (
    institution_id = auth.institution_id()
    and (
      teacher_id = auth.uid()
      or auth.user_role() in ('admin', 'super_admin')
    )
  )
  with check (
    institution_id = auth.institution_id()
  );

-- ====================================================================
-- audit_log
--   INSERT: authenticated users, same tenant, actor_id must be themselves.
--   SELECT: admins of the tenant + super_admin cross-tenant.
--   UPDATE / DELETE: NO policies -> always denied by RLS.
-- ====================================================================
drop policy if exists audit_log_insert on public.audit_log;
drop policy if exists audit_log_select on public.audit_log;

create policy audit_log_insert on public.audit_log
  for insert to authenticated
  with check (
    institution_id = auth.institution_id()
    and (actor_id is null or actor_id = auth.uid())
  );

create policy audit_log_select on public.audit_log
  for select to authenticated
  using (
    auth.is_super_admin()
    or (
      institution_id = auth.institution_id()
      and auth.user_role() in ('admin', 'super_admin')
    )
  );

-- Intentionally: NO UPDATE and NO DELETE policies on audit_log.
