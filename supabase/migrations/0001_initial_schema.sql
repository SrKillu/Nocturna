-- ===================================================================
-- Nocturna - Initial schema
-- Multi-tenant academic platform. All sensitive tables include institution_id.
-- ===================================================================

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type public.user_role as enum ('student', 'teacher', 'admin', 'super_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.submission_status as enum ('submitted', 'graded', 'late', 'returned');
exception when duplicate_object then null; end $$;

-- Helpers ------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Institutions -------------------------------------------------------
create table if not exists public.institutions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_institutions_updated on public.institutions;
create trigger trg_institutions_updated
before update on public.institutions
for each row execute function public.touch_updated_at();

-- Profiles -----------------------------------------------------------
-- profiles.id == auth.users.id (1:1).
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  institution_id  uuid references public.institutions(id) on delete set null,
  role            public.user_role not null default 'student',
  email           text not null,
  full_name       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_profiles_institution on public.profiles(institution_id);
create index if not exists idx_profiles_role on public.profiles(role);

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
before update on public.profiles
for each row execute function public.touch_updated_at();

-- Courses ------------------------------------------------------------
create table if not exists public.courses (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid not null references public.institutions(id) on delete cascade,
  name            text not null,
  description     text,
  teacher_id      uuid references public.profiles(id) on delete set null,
  created_by      uuid not null references public.profiles(id) on delete restrict,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_courses_institution on public.courses(institution_id);
create index if not exists idx_courses_teacher on public.courses(teacher_id);

drop trigger if exists trg_courses_updated on public.courses;
create trigger trg_courses_updated
before update on public.courses
for each row execute function public.touch_updated_at();

-- Enrollments --------------------------------------------------------
create table if not exists public.enrollments (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid not null references public.institutions(id) on delete cascade,
  course_id       uuid not null references public.courses(id) on delete cascade,
  student_id      uuid not null references public.profiles(id) on delete cascade,
  enrolled_at     timestamptz not null default now(),
  unique (course_id, student_id)
);

create index if not exists idx_enrollments_institution on public.enrollments(institution_id);
create index if not exists idx_enrollments_course on public.enrollments(course_id);
create index if not exists idx_enrollments_student on public.enrollments(student_id);

-- Tasks --------------------------------------------------------------
create table if not exists public.tasks (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid not null references public.institutions(id) on delete cascade,
  course_id       uuid not null references public.courses(id) on delete cascade,
  title           text not null,
  description     text,
  due_date        timestamptz,
  max_score       integer not null default 100 check (max_score > 0),
  created_by      uuid not null references public.profiles(id) on delete restrict,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_tasks_institution on public.tasks(institution_id);
create index if not exists idx_tasks_course on public.tasks(course_id);

drop trigger if exists trg_tasks_updated on public.tasks;
create trigger trg_tasks_updated
before update on public.tasks
for each row execute function public.touch_updated_at();

-- Submissions --------------------------------------------------------
create table if not exists public.submissions (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid not null references public.institutions(id) on delete cascade,
  task_id         uuid not null references public.tasks(id) on delete cascade,
  student_id      uuid not null references public.profiles(id) on delete cascade,
  content         text,
  file_path       text,
  status          public.submission_status not null default 'submitted',
  submitted_at    timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (task_id, student_id)
);

create index if not exists idx_submissions_institution on public.submissions(institution_id);
create index if not exists idx_submissions_task on public.submissions(task_id);
create index if not exists idx_submissions_student on public.submissions(student_id);

drop trigger if exists trg_submissions_updated on public.submissions;
create trigger trg_submissions_updated
before update on public.submissions
for each row execute function public.touch_updated_at();

-- Grades -------------------------------------------------------------
create table if not exists public.grades (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid not null references public.institutions(id) on delete cascade,
  submission_id   uuid not null unique references public.submissions(id) on delete cascade,
  teacher_id      uuid not null references public.profiles(id) on delete restrict,
  score           numeric(10,2) not null check (score >= 0),
  feedback        text,
  graded_at       timestamptz not null default now()
);

create index if not exists idx_grades_institution on public.grades(institution_id);
create index if not exists idx_grades_submission on public.grades(submission_id);
