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
