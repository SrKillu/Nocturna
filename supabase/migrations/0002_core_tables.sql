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
