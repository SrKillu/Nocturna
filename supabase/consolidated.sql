-- ============================================================
-- 0001_helper_functions.sql
-- ============================================================
-- ====================================================================
-- Nocturna · Phase 1/7 · helper_functions.sql
-- ====================================================================
-- Helpers that read the JWT *server-side* and enums shared by the schema.
-- NEVER rely on data coming from the client.
-- Apply BEFORE any table creation.
-- ====================================================================

create extension if not exists "pgcrypto";

-- --------------------------------------------------------------------
-- Enums
-- --------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('student', 'teacher', 'admin', 'super_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.submission_status as enum ('submitted', 'graded', 'late', 'returned');
exception when duplicate_object then null; end $$;

-- --------------------------------------------------------------------
-- auth.institution_id()
-- Returns the current institution UUID from the JWT. NEVER from the client body.
-- --------------------------------------------------------------------
create or replace function auth.institution_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select nullif(
           coalesce(
             auth.jwt() -> 'app_metadata' ->> 'institution_id',
             auth.jwt() ->> 'institution_id'
           ),
           ''
         )::uuid;
$$;

-- --------------------------------------------------------------------
-- auth.user_role()
-- Returns the current user role from the JWT. Defaults to 'student' if missing.
-- --------------------------------------------------------------------
create or replace function auth.user_role()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
           auth.jwt() -> 'app_metadata' ->> 'user_role',
           auth.jwt() ->> 'user_role',
           'student'
         );
$$;

-- --------------------------------------------------------------------
-- auth.is_super_admin()
-- Convenience boolean used in RLS for cross-tenant access on *specific* tables.
-- --------------------------------------------------------------------
create or replace function auth.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select auth.user_role() = 'super_admin';
$$;

-- --------------------------------------------------------------------
-- public.update_updated_at()
-- Generic BEFORE UPDATE trigger helper to keep updated_at fresh.
-- --------------------------------------------------------------------
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- --------------------------------------------------------------------
-- public.handle_new_user()
-- Creates the public.profiles row for every new auth.users row.
-- IMPORTANT: reads ONLY from raw_app_meta_data (server-controlled), never
-- from raw_user_meta_data (client-mutable).
-- --------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_institution_id uuid;
  v_role           public.user_role;
  v_full_name      text;
begin
  v_institution_id := nullif(new.raw_app_meta_data ->> 'institution_id', '')::uuid;
  v_role := coalesce(
              (new.raw_app_meta_data ->> 'user_role')::public.user_role,
              'student'::public.user_role
            );
  v_full_name := coalesce(new.raw_app_meta_data ->> 'full_name', '');

  insert into public.profiles (id, email, full_name, role, institution_id)
  values (new.id, new.email, v_full_name, v_role, v_institution_id)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- --------------------------------------------------------------------
-- Permissions
-- --------------------------------------------------------------------
grant usage on schema public to authenticated, anon;

grant execute on function auth.institution_id() to authenticated, anon;
grant execute on function auth.user_role()      to authenticated, anon;
grant execute on function auth.is_super_admin() to authenticated;

-- update_updated_at and handle_new_user are only invoked via triggers, no direct grants needed.

-- ============================================================
-- 0002_core_tables.sql
-- ============================================================
-- ====================================================================
-- Nocturna · Phase 2/7 · core_tables.sql
-- ====================================================================
-- All tenant-scoped tables use:
--   institution_id uuid NOT NULL DEFAULT auth.institution_id()
-- Every FK has an explicit ON DELETE rule. Every critical column is NOT NULL.
-- ====================================================================

-- --------------------------------------------------------------------
-- institutions
-- The institution itself; its own id IS the tenant id.
-- --------------------------------------------------------------------
create table if not exists public.institutions (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  slug        text        not null unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- --------------------------------------------------------------------
-- profiles
-- 1:1 with auth.users. institution_id is MANDATORY.
-- --------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid            primary key references auth.users(id) on delete cascade,
  institution_id  uuid            not null default auth.institution_id()
                    references public.institutions(id) on delete cascade,
  role            public.user_role not null default 'student',
  email           text             not null,
  full_name       text             not null default '',
  created_at      timestamptz      not null default now(),
  updated_at      timestamptz      not null default now()
);

-- --------------------------------------------------------------------
-- courses
-- --------------------------------------------------------------------
create table if not exists public.courses (
  id              uuid        primary key default gen_random_uuid(),
  institution_id  uuid        not null default auth.institution_id()
                    references public.institutions(id) on delete cascade,
  name            text        not null,
  description     text,
  teacher_id      uuid        references public.profiles(id) on delete set null,
  created_by      uuid        not null references public.profiles(id) on delete restrict,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- --------------------------------------------------------------------
-- enrollments
-- --------------------------------------------------------------------
create table if not exists public.enrollments (
  id              uuid        primary key default gen_random_uuid(),
  institution_id  uuid        not null default auth.institution_id()
                    references public.institutions(id) on delete cascade,
  course_id       uuid        not null references public.courses(id)  on delete cascade,
  student_id      uuid        not null references public.profiles(id) on delete cascade,
  enrolled_at     timestamptz not null default now(),
  constraint enrollments_unique_student_course unique (course_id, student_id)
);

-- --------------------------------------------------------------------
-- tasks
-- --------------------------------------------------------------------
create table if not exists public.tasks (
  id              uuid        primary key default gen_random_uuid(),
  institution_id  uuid        not null default auth.institution_id()
                    references public.institutions(id) on delete cascade,
  course_id       uuid        not null references public.courses(id) on delete cascade,
  title           text        not null,
  description     text,
  due_date        timestamptz,
  max_score       integer     not null default 100
                    check (max_score between 1 and 10000),
  created_by      uuid        not null references public.profiles(id) on delete restrict,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- --------------------------------------------------------------------
-- submissions
-- --------------------------------------------------------------------
create table if not exists public.submissions (
  id              uuid            primary key default gen_random_uuid(),
  institution_id  uuid            not null default auth.institution_id()
                    references public.institutions(id) on delete cascade,
  task_id         uuid            not null references public.tasks(id)    on delete cascade,
  student_id      uuid            not null references public.profiles(id) on delete cascade,
  content         text,
  file_path       text,
  status          public.submission_status not null default 'submitted',
  submitted_at    timestamptz     not null default now(),
  updated_at      timestamptz     not null default now(),
  constraint submissions_unique_task_student unique (task_id, student_id),
  constraint submissions_has_payload check (
    (content is not null and length(content) > 0)
    or (file_path is not null and length(file_path) > 0)
  )
);

-- --------------------------------------------------------------------
-- grades
-- --------------------------------------------------------------------
create table if not exists public.grades (
  id              uuid          primary key default gen_random_uuid(),
  institution_id  uuid          not null default auth.institution_id()
                    references public.institutions(id) on delete cascade,
  submission_id   uuid          not null unique references public.submissions(id) on delete cascade,
  teacher_id      uuid          not null references public.profiles(id) on delete restrict,
  score           numeric(10,2) not null check (score >= 0),
  feedback        text,
  graded_at       timestamptz   not null default now(),
  updated_at      timestamptz   not null default now()
);

-- --------------------------------------------------------------------
-- audit_log
-- Immutable at the row level: UPDATE and DELETE are never permitted by RLS.
-- --------------------------------------------------------------------
create table if not exists public.audit_log (
  id              uuid        primary key default gen_random_uuid(),
  institution_id  uuid        not null default auth.institution_id()
                    references public.institutions(id) on delete cascade,
  actor_id        uuid        references auth.users(id) on delete set null,
  action          text        not null,
  entity_type     text        not null,
  entity_id       uuid,
  metadata        jsonb       not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- 0003_indexes.sql
-- ============================================================
-- ====================================================================
-- Nocturna · Phase 3/7 · indexes.sql
-- ====================================================================
-- Performance indexes. Every tenant-scoped table is indexed on institution_id
-- to keep RLS + joins fast. Foreign keys referenced in WHERE get dedicated indexes.
-- ====================================================================

-- profiles -----------------------------------------------------------
create index if not exists idx_profiles_institution on public.profiles (institution_id);
create index if not exists idx_profiles_role        on public.profiles (role);
create index if not exists idx_profiles_email       on public.profiles (lower(email));

-- courses ------------------------------------------------------------
create index if not exists idx_courses_institution on public.courses (institution_id);
create index if not exists idx_courses_teacher     on public.courses (teacher_id);
create index if not exists idx_courses_created_by  on public.courses (created_by);

-- enrollments --------------------------------------------------------
create index if not exists idx_enrollments_institution on public.enrollments (institution_id);
create index if not exists idx_enrollments_course      on public.enrollments (course_id);
create index if not exists idx_enrollments_student     on public.enrollments (student_id);

-- tasks --------------------------------------------------------------
create index if not exists idx_tasks_institution on public.tasks (institution_id);
create index if not exists idx_tasks_course      on public.tasks (course_id);
create index if not exists idx_tasks_due_date    on public.tasks (due_date) where due_date is not null;

-- submissions --------------------------------------------------------
create index if not exists idx_submissions_institution on public.submissions (institution_id);
create index if not exists idx_submissions_task        on public.submissions (task_id);
create index if not exists idx_submissions_student     on public.submissions (student_id);
create index if not exists idx_submissions_status      on public.submissions (status);

-- grades -------------------------------------------------------------
create index if not exists idx_grades_institution on public.grades (institution_id);
create index if not exists idx_grades_submission  on public.grades (submission_id);
create index if not exists idx_grades_teacher     on public.grades (teacher_id);

-- audit_log ----------------------------------------------------------
create index if not exists idx_audit_log_institution on public.audit_log (institution_id);
create index if not exists idx_audit_log_actor       on public.audit_log (actor_id);
create index if not exists idx_audit_log_entity      on public.audit_log (entity_type, entity_id);
create index if not exists idx_audit_log_created_at  on public.audit_log (created_at desc);

-- ============================================================
-- 0004_triggers.sql
-- ============================================================
-- ====================================================================
-- Nocturna · Phase 4/7 · triggers.sql
-- ====================================================================
-- Attaches update_updated_at() to every table with updated_at and wires the
-- handle_new_user() signup trigger. audit_log has NO updated_at by design.
-- ====================================================================

-- --------------------------------------------------------------------
-- updated_at triggers
-- --------------------------------------------------------------------
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'institutions', 'profiles', 'courses', 'tasks', 'submissions', 'grades'
  ]
  loop
    execute format(
      'drop trigger if exists trg_%1$s_updated_at on public.%1$s;',
      tbl
    );
    execute format(
      'create trigger trg_%1$s_updated_at
         before update on public.%1$s
         for each row execute function public.update_updated_at();',
      tbl
    );
  end loop;
end $$;

-- --------------------------------------------------------------------
-- auth.users -> public.profiles
-- --------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================
-- 0005_rls_policies.sql
-- ============================================================
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

-- ============================================================
-- 0006_auth_hook.sql
-- ============================================================
-- ====================================================================
-- Nocturna · Phase 6/7 · auth_hook.sql
-- ====================================================================
-- Supabase Custom Access Token Hook: injects the authoritative user_role and
-- institution_id from public.profiles into every issued access token, under
-- both `app_metadata.*` and the top-level claim (for convenience).
--
-- Configure in Supabase Dashboard:
--   Authentication -> Hooks -> Custom Access Token
--   Function: public.custom_access_token_hook
-- ====================================================================

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  claims           jsonb;
  app_meta         jsonb;
  v_user_role      text;
  v_institution_id uuid;
begin
  select role::text, institution_id
    into v_user_role, v_institution_id
  from public.profiles
  where id = (event ->> 'user_id')::uuid;

  claims   := coalesce(event -> 'claims', '{}'::jsonb);
  app_meta := coalesce(claims -> 'app_metadata', '{}'::jsonb);

  app_meta := jsonb_set(
    app_meta,
    '{user_role}',
    to_jsonb(coalesce(v_user_role, 'student'))
  );

  if v_institution_id is not null then
    app_meta := jsonb_set(app_meta, '{institution_id}', to_jsonb(v_institution_id::text));
  else
    app_meta := app_meta - 'institution_id';
  end if;

  claims := jsonb_set(claims, '{app_metadata}', app_meta);
  -- Mirror on top-level for clients that read raw claims.
  claims := jsonb_set(claims, '{user_role}', to_jsonb(coalesce(v_user_role, 'student')));
  if v_institution_id is not null then
    claims := jsonb_set(claims, '{institution_id}', to_jsonb(v_institution_id::text));
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- Permissions: only the auth service may execute the hook.
grant usage   on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

-- ============================================================
-- 0007_storage.sql
-- ============================================================
-- ====================================================================
-- Nocturna · Phase 7/7 · storage.sql
-- ====================================================================
-- Private 'submissions' bucket. Access is validated server-side via auth.uid()
-- and auth.institution_id(). Objects are laid out as:
--   {institution_id}/{student_id}/{task_id}/{filename}
--
-- NEVER mark the bucket public; always access via signed URLs (60s TTL).
-- ====================================================================

insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', false)
on conflict (id) do update set public = false;

-- --------------------------------------------------------------------
-- Policies on storage.objects (scoped to bucket 'submissions')
-- --------------------------------------------------------------------
drop policy if exists submissions_insert_own on storage.objects;
drop policy if exists submissions_select_own on storage.objects;
drop policy if exists submissions_update_own on storage.objects;
drop policy if exists submissions_delete_own on storage.objects;

-- INSERT: path must start with current institution_id and belong to current user.
create policy submissions_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = auth.institution_id()::text
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- SELECT: students see only their own objects; teachers/admins of the same
-- tenant can read any object within their institution folder.
create policy submissions_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = auth.institution_id()::text
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or auth.user_role() in ('teacher', 'admin', 'super_admin')
    )
  );

-- UPDATE: owner only.
create policy submissions_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = auth.institution_id()::text
    and (storage.foldername(name))[2] = auth.uid()::text
  )
  with check (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = auth.institution_id()::text
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- DELETE: owner or institution admin.
create policy submissions_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = auth.institution_id()::text
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or auth.user_role() in ('admin', 'super_admin')
    )
  );

-- ============================================================
-- 0008_auth_hardening.sql
-- ============================================================
-- ====================================================================
-- Nocturna · Phase 8/8 · auth_hardening.sql
-- ====================================================================
-- Adds the integrity fields required by the hardened auth flow and updates
-- the signup trigger + access-token hook so that:
--   * profiles carry `is_active` and `session_version`
--   * the JWT NEVER carries institution_id when the profile is missing or inactive
--   * admins can invalidate active sessions by bumping session_version
-- Apply AFTER 0007_storage.sql.
-- ====================================================================

-- --------------------------------------------------------------------
-- Schema additions
-- --------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_active boolean not null default true;

alter table public.profiles
  add column if not exists session_version integer not null default 0;

create index if not exists idx_profiles_is_active on public.profiles (is_active);

-- --------------------------------------------------------------------
-- Refresh handle_new_user() to set is_active = true explicitly
-- --------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_institution_id uuid;
  v_role           public.user_role;
  v_full_name      text;
begin
  v_institution_id := nullif(new.raw_app_meta_data ->> 'institution_id', '')::uuid;
  v_role := coalesce(
              (new.raw_app_meta_data ->> 'user_role')::public.user_role,
              'student'::public.user_role
            );
  v_full_name := coalesce(new.raw_app_meta_data ->> 'full_name', '');

  insert into public.profiles (id, email, full_name, role, institution_id, is_active, session_version)
  values (new.id, new.email, v_full_name, v_role, v_institution_id, true, 0)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- --------------------------------------------------------------------
-- Hardened Custom Access Token Hook.
-- Rules:
--   * If the profile does not exist         -> DO NOT inject any claim.
--   * If the profile exists but is inactive -> inject user_role + is_active=false
--     WITHOUT institution_id (protected routes will reject).
--   * Always include session_version (monotonic counter).
-- --------------------------------------------------------------------
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  claims            jsonb;
  app_meta          jsonb;
  v_user_role       text;
  v_institution_id  uuid;
  v_is_active       boolean;
  v_session_version integer;
begin
  select role::text, institution_id, is_active, session_version
    into v_user_role, v_institution_id, v_is_active, v_session_version
  from public.profiles
  where id = (event ->> 'user_id')::uuid;

  claims := coalesce(event -> 'claims', '{}'::jsonb);

  -- No profile -> return token unchanged. Server will refuse access.
  if v_user_role is null then
    return event;
  end if;

  app_meta := coalesce(claims -> 'app_metadata', '{}'::jsonb);

  app_meta := jsonb_set(app_meta, '{user_role}',       to_jsonb(v_user_role));
  app_meta := jsonb_set(app_meta, '{is_active}',       to_jsonb(coalesce(v_is_active, false)));
  app_meta := jsonb_set(app_meta, '{session_version}', to_jsonb(coalesce(v_session_version, 0)));

  -- institution_id is ONLY issued for active users. Inactive users still get
  -- a (degraded) token so they can see error pages, but they cannot access tenant data.
  if v_institution_id is not null and coalesce(v_is_active, false) then
    app_meta := jsonb_set(app_meta, '{institution_id}', to_jsonb(v_institution_id::text));
  else
    app_meta := app_meta - 'institution_id';
  end if;

  claims := jsonb_set(claims, '{app_metadata}', app_meta);

  -- Mirror the critical claims on the top-level for quick access.
  claims := jsonb_set(claims, '{user_role}',       to_jsonb(v_user_role));
  claims := jsonb_set(claims, '{is_active}',       to_jsonb(coalesce(v_is_active, false)));
  claims := jsonb_set(claims, '{session_version}', to_jsonb(coalesce(v_session_version, 0)));
  if v_institution_id is not null and coalesce(v_is_active, false) then
    claims := jsonb_set(claims, '{institution_id}', to_jsonb(v_institution_id::text));
  else
    claims := claims - 'institution_id';
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- Keep the execution grants consistent with 0006_auth_hook.sql.
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

-- --------------------------------------------------------------------
-- Helpers for server-side session validation
-- --------------------------------------------------------------------
create or replace function auth.session_version()
returns integer
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
           (auth.jwt() -> 'app_metadata' ->> 'session_version')::integer,
           (auth.jwt() ->> 'session_version')::integer,
           0
         );
$$;

create or replace function auth.is_active()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
           (auth.jwt() -> 'app_metadata' ->> 'is_active')::boolean,
           (auth.jwt() ->> 'is_active')::boolean,
           false
         );
$$;

grant execute on function auth.session_version() to authenticated, anon;
grant execute on function auth.is_active()       to authenticated, anon;

-- --------------------------------------------------------------------
-- Privileged RPC to invalidate sessions on demand.
-- bumps session_version for the target profile, which makes every previously
-- issued JWT stale (server-side comparison will reject them).
-- Callable only by admins / super_admin of the same institution.
-- --------------------------------------------------------------------
create or replace function public.bump_session_version(target_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_caller_role        public.user_role;
  v_caller_institution uuid;
  v_target_institution uuid;
  v_new_version        integer;
begin
  v_caller_role        := auth.user_role()::public.user_role;
  v_caller_institution := auth.institution_id();

  if v_caller_role not in ('admin', 'super_admin') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select institution_id into v_target_institution
    from public.profiles
   where id = target_user_id;

  if v_target_institution is null then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;

  if v_caller_role = 'admin' and v_target_institution <> v_caller_institution then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.profiles
     set session_version = session_version + 1,
         updated_at      = now()
   where id = target_user_id
  returning session_version into v_new_version;

  -- Audit trail (best effort; do not fail the bump if audit insert fails).
  begin
    insert into public.audit_log (institution_id, actor_id, action, entity_type, entity_id, metadata)
    values (v_target_institution, auth.uid(), 'session.invalidate', 'profile', target_user_id,
            jsonb_build_object('new_session_version', v_new_version));
  exception when others then
    null;
  end;

  return v_new_version;
end;
$$;

grant execute on function public.bump_session_version(uuid) to authenticated;

-- ============================================================
-- 0009_business_rpcs.sql
-- ============================================================
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

-- ============================================================
-- 0010_storage_hardening.sql
-- ============================================================
-- ====================================================================
-- Nocturna · Phase 10 · storage_hardening.sql
-- ====================================================================
-- Private buckets (x3), file_objects registry, scan status lifecycle,
-- per-bucket Storage RLS, and an integrity trigger so submissions can only
-- reference files that have been magic-byte verified.
-- Apply AFTER 0009_business_rpcs.sql.
-- ====================================================================

-- --------------------------------------------------------------------
-- Enums
-- --------------------------------------------------------------------
do $$ begin
  create type public.file_bucket as enum ('submissions', 'avatars', 'resources');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.file_scan_status as enum ('pending', 'clean', 'suspicious', 'blocked');
exception when duplicate_object then null; end $$;

-- --------------------------------------------------------------------
-- Buckets (private)
-- --------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('submissions', 'submissions', false) on conflict (id) do update set public = false;
insert into storage.buckets (id, name, public) values ('avatars',     'avatars',     false) on conflict (id) do update set public = false;
insert into storage.buckets (id, name, public) values ('resources',   'resources',   false) on conflict (id) do update set public = false;

-- --------------------------------------------------------------------
-- file_objects registry
-- One row per storage object. The client NEVER sets scan_status.
-- The service role confirms a magic-byte check and flips it to 'clean'.
-- --------------------------------------------------------------------
create table if not exists public.file_objects (
  id               uuid                  primary key default gen_random_uuid(),
  institution_id   uuid                  not null default auth.institution_id()
                     references public.institutions(id) on delete cascade,
  bucket           public.file_bucket    not null,
  path             text                  not null unique,
  mime             text                  not null,
  size             bigint                not null check (size > 0 and size <= 10 * 1024 * 1024),
  sha256           text,
  uploaded_by      uuid                  not null references public.profiles(id) on delete cascade,
  owner_type       text,
  owner_id         uuid,
  scan_status      public.file_scan_status not null default 'pending',
  scan_error       text,
  created_at       timestamptz           not null default now(),
  updated_at       timestamptz           not null default now(),
  confirmed_at     timestamptz
);

create index if not exists idx_file_objects_institution on public.file_objects (institution_id);
create index if not exists idx_file_objects_uploader    on public.file_objects (uploaded_by);
create index if not exists idx_file_objects_bucket_path on public.file_objects (bucket, path);
create index if not exists idx_file_objects_scan        on public.file_objects (scan_status);
create index if not exists idx_file_objects_pending_age on public.file_objects (created_at) where scan_status = 'pending';

drop trigger if exists trg_file_objects_updated_at on public.file_objects;
create trigger trg_file_objects_updated_at
before update on public.file_objects
for each row execute function public.update_updated_at();

alter table public.file_objects enable row level security;
alter table public.file_objects force  row level security;

drop policy if exists file_objects_select  on public.file_objects;
drop policy if exists file_objects_insert  on public.file_objects;

-- Students see their own uploads; teachers/admins see everything in tenant.
create policy file_objects_select on public.file_objects
  for select to authenticated
  using (
    institution_id = auth.institution_id()
    and (
      uploaded_by = auth.uid()
      or auth.user_role() in ('teacher', 'admin', 'super_admin')
    )
  );

-- Inserts happen from authenticated calls when issuing an upload URL.
create policy file_objects_insert on public.file_objects
  for insert to authenticated
  with check (
    institution_id = auth.institution_id()
    and uploaded_by = auth.uid()
    and scan_status = 'pending'  -- client CANNOT pre-mark as clean
  );

-- No UPDATE/DELETE policies: status changes and cleanup go through the service role.

-- --------------------------------------------------------------------
-- Integrity trigger on public.submissions.
-- Before a submission is saved with a file_path, that path MUST exist
-- in file_objects with scan_status='clean' and belong to the same student
-- and institution. Otherwise reject.
-- --------------------------------------------------------------------
create or replace function public.enforce_submission_file_integrity()
returns trigger
language plpgsql
as $$
declare
  v_obj public.file_objects%rowtype;
begin
  if new.file_path is null or length(new.file_path) = 0 then
    return new;
  end if;

  select * into v_obj
    from public.file_objects
   where path = new.file_path
     and bucket = 'submissions';

  if not found then
    raise exception 'file object not registered' using errcode = '23514';
  end if;

  if v_obj.institution_id <> new.institution_id then
    raise exception 'file belongs to a different tenant' using errcode = '42501';
  end if;

  if v_obj.uploaded_by <> new.student_id then
    raise exception 'file uploader does not match submission student' using errcode = '42501';
  end if;

  if v_obj.scan_status <> 'clean' then
    raise exception 'file has not passed integrity verification' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_submissions_file_integrity on public.submissions;
create trigger trg_submissions_file_integrity
before insert or update of file_path on public.submissions
for each row execute function public.enforce_submission_file_integrity();

-- --------------------------------------------------------------------
-- Storage RLS: extend 0007 to cover the 3 buckets.
-- Path conventions:
--   submissions: {institution_id}/{student_id}/{task_id}/{filename}
--   avatars:     {institution_id}/{user_id}/{filename}
--   resources:   {institution_id}/shared/{filename}
-- --------------------------------------------------------------------
drop policy if exists submissions_insert_own on storage.objects;
drop policy if exists submissions_select_own on storage.objects;
drop policy if exists submissions_update_own on storage.objects;
drop policy if exists submissions_delete_own on storage.objects;

drop policy if exists avatars_insert_own on storage.objects;
drop policy if exists avatars_select_tenant on storage.objects;
drop policy if exists avatars_delete_own on storage.objects;

drop policy if exists resources_insert_staff on storage.objects;
drop policy if exists resources_select_tenant on storage.objects;
drop policy if exists resources_delete_staff on storage.objects;

-- submissions
create policy submissions_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = auth.institution_id()::text
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy submissions_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = auth.institution_id()::text
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or auth.user_role() in ('teacher', 'admin', 'super_admin')
    )
  );

create policy submissions_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = auth.institution_id()::text
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or auth.user_role() in ('admin', 'super_admin')
    )
  );

-- avatars
create policy avatars_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.institution_id()::text
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy avatars_select_tenant on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.institution_id()::text
  );

create policy avatars_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.institution_id()::text
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or auth.user_role() in ('admin', 'super_admin')
    )
  );

-- resources (teachers / admins publish, everyone in tenant can read)
create policy resources_insert_staff on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'resources'
    and (storage.foldername(name))[1] = auth.institution_id()::text
    and auth.user_role() in ('teacher', 'admin', 'super_admin')
  );

create policy resources_select_tenant on storage.objects
  for select to authenticated
  using (
    bucket_id = 'resources'
    and (storage.foldername(name))[1] = auth.institution_id()::text
  );

create policy resources_delete_staff on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'resources'
    and (storage.foldername(name))[1] = auth.institution_id()::text
    and auth.user_role() in ('teacher', 'admin', 'super_admin')
  );

