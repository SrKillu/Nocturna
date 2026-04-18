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
