-- ====================================================================
-- Nocturna · 0020 · invites.sql
-- Sistema de invitaciones por QR (tokens firmados).
--   * teacher_invites  → admin invita profesores a la institución
--   * student_invites  → teacher invita estudiantes a un curso
-- Idempotente. Usa claims inline (no depende de funciones auth.*).
-- ====================================================================

-- ────────────────────────────────────────────────────────────────────
-- 1. Tablas
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.teacher_invites (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid not null references public.institutions(id) on delete cascade,
  token           uuid not null unique default gen_random_uuid(),
  created_by      uuid not null references auth.users(id) on delete cascade,
  email_hint      text,
  expires_at      timestamptz not null default (now() + interval '7 days'),
  used            boolean not null default false,
  used_at         timestamptz,
  used_by         uuid references auth.users(id) on delete set null,
  revoked         boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists teacher_invites_institution_idx
  on public.teacher_invites (institution_id);
create index if not exists teacher_invites_token_idx
  on public.teacher_invites (token);

create table if not exists public.student_invites (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid not null references public.institutions(id) on delete cascade,
  course_id       uuid not null references public.courses(id) on delete cascade,
  token           uuid not null unique default gen_random_uuid(),
  created_by      uuid not null references auth.users(id) on delete cascade,
  expires_at      timestamptz not null default (now() + interval '7 days'),
  used            boolean not null default false,
  used_at         timestamptz,
  used_by         uuid references auth.users(id) on delete set null,
  revoked         boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists student_invites_institution_idx
  on public.student_invites (institution_id);
create index if not exists student_invites_course_idx
  on public.student_invites (course_id);
create index if not exists student_invites_token_idx
  on public.student_invites (token);

-- ────────────────────────────────────────────────────────────────────
-- 2. RLS
-- ────────────────────────────────────────────────────────────────────
alter table public.teacher_invites enable row level security;
alter table public.student_invites enable row level security;

-- Limpieza de policies previas.
do $$
declare pol record;
begin
  for pol in
    select policyname, tablename
      from pg_policies
     where schemaname = 'public'
       and tablename in ('teacher_invites', 'student_invites')
  loop
    execute format('drop policy if exists %I on public.%I;', pol.policyname, pol.tablename);
  end loop;
end $$;

-- Helpers inline (no dependencia de auth.user_role()).
-- institution_id del JWT
--   coalesce(app_metadata.institution_id, institution_id)
-- user_role del JWT
--   coalesce(app_metadata.user_role, user_role, 'student')

-- ── teacher_invites ──────────────────────────────────────────────
-- SELECT: staff del mismo tenant.
create policy teacher_invites_select_staff on public.teacher_invites
  for select to authenticated
  using (
    institution_id = coalesce(
      (current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'institution_id')::uuid,
      (current_setting('request.jwt.claims', true)::json ->> 'institution_id')::uuid
    )
    and coalesce(
      current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'user_role',
      current_setting('request.jwt.claims', true)::json ->> 'user_role',
      'student'
    ) in ('admin', 'super_admin')
  );

-- INSERT: staff del mismo tenant.
create policy teacher_invites_insert_staff on public.teacher_invites
  for insert to authenticated
  with check (
    institution_id = coalesce(
      (current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'institution_id')::uuid,
      (current_setting('request.jwt.claims', true)::json ->> 'institution_id')::uuid
    )
    and coalesce(
      current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'user_role',
      current_setting('request.jwt.claims', true)::json ->> 'user_role',
      'student'
    ) in ('admin', 'super_admin')
  );

-- UPDATE / DELETE (revocar): solo creador o staff del tenant.
create policy teacher_invites_update_staff on public.teacher_invites
  for update to authenticated
  using (
    institution_id = coalesce(
      (current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'institution_id')::uuid,
      (current_setting('request.jwt.claims', true)::json ->> 'institution_id')::uuid
    )
    and coalesce(
      current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'user_role',
      current_setting('request.jwt.claims', true)::json ->> 'user_role',
      'student'
    ) in ('admin', 'super_admin')
  );

create policy teacher_invites_delete_staff on public.teacher_invites
  for delete to authenticated
  using (
    institution_id = coalesce(
      (current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'institution_id')::uuid,
      (current_setting('request.jwt.claims', true)::json ->> 'institution_id')::uuid
    )
    and coalesce(
      current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'user_role',
      current_setting('request.jwt.claims', true)::json ->> 'user_role',
      'student'
    ) in ('admin', 'super_admin')
  );

-- ── student_invites ──────────────────────────────────────────────
-- SELECT: staff del tenant o teacher dueño del curso.
create policy student_invites_select on public.student_invites
  for select to authenticated
  using (
    institution_id = coalesce(
      (current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'institution_id')::uuid,
      (current_setting('request.jwt.claims', true)::json ->> 'institution_id')::uuid
    )
    and (
      coalesce(
        current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'user_role',
        current_setting('request.jwt.claims', true)::json ->> 'user_role',
        'student'
      ) in ('admin', 'super_admin')
      or exists (
        select 1 from public.courses c
        where c.id = student_invites.course_id
          and c.teacher_id = auth.uid()
      )
    )
  );

-- INSERT: staff o teacher dueño del curso.
create policy student_invites_insert on public.student_invites
  for insert to authenticated
  with check (
    institution_id = coalesce(
      (current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'institution_id')::uuid,
      (current_setting('request.jwt.claims', true)::json ->> 'institution_id')::uuid
    )
    and (
      coalesce(
        current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'user_role',
        current_setting('request.jwt.claims', true)::json ->> 'user_role',
        'student'
      ) in ('admin', 'super_admin')
      or exists (
        select 1 from public.courses c
        where c.id = student_invites.course_id
          and c.teacher_id = auth.uid()
      )
    )
  );

create policy student_invites_update on public.student_invites
  for update to authenticated
  using (
    institution_id = coalesce(
      (current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'institution_id')::uuid,
      (current_setting('request.jwt.claims', true)::json ->> 'institution_id')::uuid
    )
    and (
      coalesce(
        current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'user_role',
        current_setting('request.jwt.claims', true)::json ->> 'user_role',
        'student'
      ) in ('admin', 'super_admin')
      or exists (
        select 1 from public.courses c
        where c.id = student_invites.course_id
          and c.teacher_id = auth.uid()
      )
    )
  );

create policy student_invites_delete on public.student_invites
  for delete to authenticated
  using (
    institution_id = coalesce(
      (current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'institution_id')::uuid,
      (current_setting('request.jwt.claims', true)::json ->> 'institution_id')::uuid
    )
    and (
      coalesce(
        current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'user_role',
        current_setting('request.jwt.claims', true)::json ->> 'user_role',
        'student'
      ) in ('admin', 'super_admin')
      or exists (
        select 1 from public.courses c
        where c.id = student_invites.course_id
          and c.teacher_id = auth.uid()
      )
    )
  );

notify pgrst, 'reload schema';

-- Diagnostic
select 'teacher_invites' as t, count(*)::int as n from public.teacher_invites;
select 'student_invites' as t, count(*)::int as n from public.student_invites;
select policyname, cmd
  from pg_policies
 where schemaname = 'public'
   and tablename in ('teacher_invites', 'student_invites')
 order by tablename, policyname;
