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
