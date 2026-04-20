-- ====================================================================
-- Nocturna · 0022 · daily_work.sql
-- Módulo 3 – Trabajos cotidianos (paralelo a tareas, más simple, sin archivo).
--   * daily_work                ← prop puestos por el teacher / admin
--   * daily_work_submissions    ← respuestas rápidas de los estudiantes
-- Idempotente. Claims inline.
-- ====================================================================

create table if not exists public.daily_work (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  course_id      uuid not null references public.courses(id) on delete cascade,
  title          text not null,
  description    text,
  created_by     uuid not null references auth.users(id) on delete cascade,
  created_at     timestamptz not null default now()
);

create index if not exists daily_work_course_idx
  on public.daily_work (course_id, created_at desc);

create table if not exists public.daily_work_submissions (
  id          uuid primary key default gen_random_uuid(),
  work_id     uuid not null references public.daily_work(id) on delete cascade,
  student_id  uuid not null references auth.users(id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (work_id, student_id)
);

create index if not exists daily_work_submissions_work_idx
  on public.daily_work_submissions (work_id, created_at desc);
create index if not exists daily_work_submissions_student_idx
  on public.daily_work_submissions (student_id);

-- RLS
alter table public.daily_work enable row level security;
alter table public.daily_work_submissions enable row level security;

-- Limpieza previa
do $$
declare pol record;
begin
  for pol in
    select policyname, tablename
      from pg_policies
     where schemaname = 'public'
       and tablename in ('daily_work', 'daily_work_submissions')
  loop
    execute format('drop policy if exists %I on public.%I;', pol.policyname, pol.tablename);
  end loop;
end $$;

-- Helper SQL: institution_id del JWT.
-- Inlined en cada policy para evitar depender de funciones auth.* que pueden faltar.

-- daily_work ─────────────────────────────────────────────────────────────────────────────
-- SELECT: mismo tenant + (staff, teacher dueno, student enrolled)
create policy daily_work_select on public.daily_work
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
        where c.id = daily_work.course_id and c.teacher_id = auth.uid()
      )
      or exists (
        select 1 from public.enrollments e
        where e.course_id = daily_work.course_id and e.student_id = auth.uid()
      )
    )
  );

-- INSERT: staff o teacher dueno
create policy daily_work_insert on public.daily_work
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
        where c.id = daily_work.course_id and c.teacher_id = auth.uid()
      )
    )
  );

-- UPDATE / DELETE: creator, staff o teacher dueno
create policy daily_work_update on public.daily_work
  for update to authenticated
  using (
    institution_id = coalesce(
      (current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'institution_id')::uuid,
      (current_setting('request.jwt.claims', true)::json ->> 'institution_id')::uuid
    )
    and (
      created_by = auth.uid()
      or coalesce(
        current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'user_role',
        current_setting('request.jwt.claims', true)::json ->> 'user_role',
        'student'
      ) in ('admin', 'super_admin')
      or exists (
        select 1 from public.courses c
        where c.id = daily_work.course_id and c.teacher_id = auth.uid()
      )
    )
  );

create policy daily_work_delete on public.daily_work
  for delete to authenticated
  using (
    institution_id = coalesce(
      (current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'institution_id')::uuid,
      (current_setting('request.jwt.claims', true)::json ->> 'institution_id')::uuid
    )
    and (
      created_by = auth.uid()
      or coalesce(
        current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'user_role',
        current_setting('request.jwt.claims', true)::json ->> 'user_role',
        'student'
      ) in ('admin', 'super_admin')
      or exists (
        select 1 from public.courses c
        where c.id = daily_work.course_id and c.teacher_id = auth.uid()
      )
    )
  );

-- daily_work_submissions ───────────────────────────────────────────────────────────────────
-- SELECT: student propietario, staff tenant o teacher dueno del curso del work.
create policy daily_work_subs_select on public.daily_work_submissions
  for select to authenticated
  using (
    student_id = auth.uid()
    or exists (
      select 1
        from public.daily_work w
        join public.courses    c on c.id = w.course_id
       where w.id = daily_work_submissions.work_id
         and (
           c.teacher_id = auth.uid()
           or coalesce(
             current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'user_role',
             current_setting('request.jwt.claims', true)::json ->> 'user_role',
             'student'
           ) in ('admin', 'super_admin')
         )
    )
  );

-- INSERT / UPDATE: solo el student propietario y solo si está enrolled.
create policy daily_work_subs_insert on public.daily_work_submissions
  for insert to authenticated
  with check (
    student_id = auth.uid()
    and exists (
      select 1
        from public.daily_work w
        join public.enrollments e
          on e.course_id = w.course_id
         and e.student_id = auth.uid()
       where w.id = daily_work_submissions.work_id
    )
  );

create policy daily_work_subs_update on public.daily_work_submissions
  for update to authenticated
  using (student_id = auth.uid());

-- DELETE: el propio student o staff del tenant.
create policy daily_work_subs_delete on public.daily_work_submissions
  for delete to authenticated
  using (
    student_id = auth.uid()
    or coalesce(
      current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'user_role',
      current_setting('request.jwt.claims', true)::json ->> 'user_role',
      'student'
    ) in ('admin', 'super_admin')
  );

notify pgrst, 'reload schema';

select 'daily_work rows' as kind, count(*)::int from public.daily_work;
select 'daily_work_submissions rows' as kind, count(*)::int from public.daily_work_submissions;
select policyname, cmd
  from pg_policies
 where schemaname = 'public'
   and tablename in ('daily_work', 'daily_work_submissions')
 order by tablename, policyname;
