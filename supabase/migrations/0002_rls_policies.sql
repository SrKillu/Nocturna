-- ===================================================================
-- Nocturna - Row Level Security
-- All tenant isolation is enforced via institution_id from the JWT claim.
-- ===================================================================

-- JWT claim helpers --------------------------------------------------
create or replace function public.jwt_institution_id()
returns uuid
language sql
stable
as $$
  select nullif(
           coalesce(
             (auth.jwt() -> 'app_metadata' ->> 'institution_id'),
             (auth.jwt() ->> 'institution_id')
           ),
           ''
         )::uuid;
$$;

create or replace function public.jwt_user_role()
returns public.user_role
language sql
stable
as $$
  select coalesce(
           (auth.jwt() -> 'app_metadata' ->> 'user_role'),
           (auth.jwt() ->> 'user_role')
         )::public.user_role;
$$;

-- Enable RLS ---------------------------------------------------------
alter table public.institutions enable row level security;
alter table public.profiles     enable row level security;
alter table public.courses      enable row level security;
alter table public.enrollments  enable row level security;
alter table public.tasks        enable row level security;
alter table public.submissions  enable row level security;
alter table public.grades       enable row level security;

-- INSTITUTIONS -------------------------------------------------------
drop policy if exists "institutions_select_own" on public.institutions;
create policy "institutions_select_own"
  on public.institutions for select
  to authenticated
  using (id = public.jwt_institution_id());

drop policy if exists "institutions_update_admin" on public.institutions;
create policy "institutions_update_admin"
  on public.institutions for update
  to authenticated
  using (id = public.jwt_institution_id() and public.jwt_user_role() in ('admin','super_admin'))
  with check (id = public.jwt_institution_id());

-- PROFILES -----------------------------------------------------------
drop policy if exists "profiles_select_same_tenant" on public.profiles;
create policy "profiles_select_same_tenant"
  on public.profiles for select
  to authenticated
  using (institution_id = public.jwt_institution_id());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and institution_id = public.jwt_institution_id());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (
    institution_id = public.jwt_institution_id()
    and public.jwt_user_role() in ('admin','super_admin')
  )
  with check (institution_id = public.jwt_institution_id());

-- COURSES ------------------------------------------------------------
drop policy if exists "courses_select_tenant" on public.courses;
create policy "courses_select_tenant"
  on public.courses for select
  to authenticated
  using (institution_id = public.jwt_institution_id());

drop policy if exists "courses_insert_admin" on public.courses;
create policy "courses_insert_admin"
  on public.courses for insert
  to authenticated
  with check (
    institution_id = public.jwt_institution_id()
    and public.jwt_user_role() in ('admin','super_admin')
  );

drop policy if exists "courses_update_admin" on public.courses;
create policy "courses_update_admin"
  on public.courses for update
  to authenticated
  using (
    institution_id = public.jwt_institution_id()
    and public.jwt_user_role() in ('admin','super_admin')
  )
  with check (institution_id = public.jwt_institution_id());

drop policy if exists "courses_delete_admin" on public.courses;
create policy "courses_delete_admin"
  on public.courses for delete
  to authenticated
  using (
    institution_id = public.jwt_institution_id()
    and public.jwt_user_role() in ('admin','super_admin')
  );

-- ENROLLMENTS --------------------------------------------------------
drop policy if exists "enrollments_select_tenant" on public.enrollments;
create policy "enrollments_select_tenant"
  on public.enrollments for select
  to authenticated
  using (institution_id = public.jwt_institution_id());

drop policy if exists "enrollments_insert_student_self_or_admin" on public.enrollments;
create policy "enrollments_insert_student_self_or_admin"
  on public.enrollments for insert
  to authenticated
  with check (
    institution_id = public.jwt_institution_id()
    and (
      (public.jwt_user_role() = 'student' and student_id = auth.uid())
      or public.jwt_user_role() in ('admin','super_admin')
    )
  );

drop policy if exists "enrollments_delete_admin_or_self" on public.enrollments;
create policy "enrollments_delete_admin_or_self"
  on public.enrollments for delete
  to authenticated
  using (
    institution_id = public.jwt_institution_id()
    and (
      student_id = auth.uid()
      or public.jwt_user_role() in ('admin','super_admin')
    )
  );

-- TASKS --------------------------------------------------------------
drop policy if exists "tasks_select_tenant" on public.tasks;
create policy "tasks_select_tenant"
  on public.tasks for select
  to authenticated
  using (institution_id = public.jwt_institution_id());

drop policy if exists "tasks_insert_teacher_admin" on public.tasks;
create policy "tasks_insert_teacher_admin"
  on public.tasks for insert
  to authenticated
  with check (
    institution_id = public.jwt_institution_id()
    and public.jwt_user_role() in ('teacher','admin','super_admin')
    and exists (
      select 1 from public.courses c
      where c.id = tasks.course_id
        and c.institution_id = public.jwt_institution_id()
        and (c.teacher_id = auth.uid() or public.jwt_user_role() in ('admin','super_admin'))
    )
  );

drop policy if exists "tasks_update_teacher_admin" on public.tasks;
create policy "tasks_update_teacher_admin"
  on public.tasks for update
  to authenticated
  using (
    institution_id = public.jwt_institution_id()
    and (
      created_by = auth.uid()
      or public.jwt_user_role() in ('admin','super_admin')
    )
  )
  with check (institution_id = public.jwt_institution_id());

drop policy if exists "tasks_delete_teacher_admin" on public.tasks;
create policy "tasks_delete_teacher_admin"
  on public.tasks for delete
  to authenticated
  using (
    institution_id = public.jwt_institution_id()
    and (
      created_by = auth.uid()
      or public.jwt_user_role() in ('admin','super_admin')
    )
  );

-- SUBMISSIONS --------------------------------------------------------
drop policy if exists "submissions_select_student_or_teacher" on public.submissions;
create policy "submissions_select_student_or_teacher"
  on public.submissions for select
  to authenticated
  using (
    institution_id = public.jwt_institution_id()
    and (
      student_id = auth.uid()
      or public.jwt_user_role() in ('admin','super_admin')
      or exists (
        select 1 from public.tasks t
        join public.courses c on c.id = t.course_id
        where t.id = submissions.task_id
          and c.teacher_id = auth.uid()
      )
    )
  );

drop policy if exists "submissions_insert_student_self" on public.submissions;
create policy "submissions_insert_student_self"
  on public.submissions for insert
  to authenticated
  with check (
    institution_id = public.jwt_institution_id()
    and student_id = auth.uid()
    and public.jwt_user_role() = 'student'
    and exists (
      select 1 from public.enrollments e
      join public.tasks t on t.course_id = e.course_id
      where t.id = submissions.task_id
        and e.student_id = auth.uid()
    )
  );

drop policy if exists "submissions_update_student_self" on public.submissions;
create policy "submissions_update_student_self"
  on public.submissions for update
  to authenticated
  using (
    institution_id = public.jwt_institution_id()
    and student_id = auth.uid()
    and status = 'submitted'
  )
  with check (institution_id = public.jwt_institution_id() and student_id = auth.uid());

-- GRADES -------------------------------------------------------------
drop policy if exists "grades_select_student_or_teacher" on public.grades;
create policy "grades_select_student_or_teacher"
  on public.grades for select
  to authenticated
  using (
    institution_id = public.jwt_institution_id()
    and (
      public.jwt_user_role() in ('admin','super_admin','teacher')
      or exists (
        select 1 from public.submissions s
        where s.id = grades.submission_id and s.student_id = auth.uid()
      )
    )
  );

drop policy if exists "grades_insert_teacher" on public.grades;
create policy "grades_insert_teacher"
  on public.grades for insert
  to authenticated
  with check (
    institution_id = public.jwt_institution_id()
    and teacher_id = auth.uid()
    and public.jwt_user_role() in ('teacher','admin','super_admin')
    and exists (
      select 1 from public.submissions s
      join public.tasks t on t.id = s.task_id
      join public.courses c on c.id = t.course_id
      where s.id = grades.submission_id
        and (c.teacher_id = auth.uid() or public.jwt_user_role() in ('admin','super_admin'))
    )
  );

drop policy if exists "grades_update_teacher" on public.grades;
create policy "grades_update_teacher"
  on public.grades for update
  to authenticated
  using (
    institution_id = public.jwt_institution_id()
    and (teacher_id = auth.uid() or public.jwt_user_role() in ('admin','super_admin'))
  )
  with check (institution_id = public.jwt_institution_id());
