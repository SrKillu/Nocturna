-- ====================================================================
-- Nocturna · 0016 · tasks_attachments.sql
-- Extiende public.tasks con columnas de archivo adjunto + crea el bucket
-- `task_files` + policies de storage.objects para upload/download seguros.
-- Idempotente. No borra datos.
-- ====================================================================

-- 1. Columnas en public.tasks.
alter table public.tasks
  add column if not exists file_url  text;
alter table public.tasks
  add column if not exists file_name text;
alter table public.tasks
  add column if not exists file_size bigint;

-- 2. Bucket privado.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('task_files', 'task_files', false, 25 * 1024 * 1024, null)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit;

-- 3. Limpieza previa de policies en storage.objects bound al bucket.
do $$
declare pol record;
begin
  for pol in
    select policyname
      from pg_policies
     where schemaname = 'storage'
       and tablename  = 'objects'
       and policyname like 'task_files_%'
  loop
    execute format('drop policy if exists %I on storage.objects;', pol.policyname);
  end loop;
end $$;

-- 4. INSERT (upload) · admin/super_admin siempre; teacher si es el teacher_id
--    del curso (segundo segmento del path institution/course/task/filename).
create policy task_files_insert_staff on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'task_files'
    and (
      coalesce(
        current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'user_role',
        current_setting('request.jwt.claims', true)::json ->> 'user_role',
        'student'
      ) in ('admin', 'super_admin')
      or exists (
        select 1
          from public.courses c
         where c.id::text    = split_part(name, '/', 2)
           and c.teacher_id  = auth.uid()
      )
    )
  );

-- 5. SELECT (download via signed URL) · staff del tenant o estudiante enrolled.
create policy task_files_select_access on storage.objects
  for select to authenticated
  using (
    bucket_id = 'task_files'
    and (
      coalesce(
        current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'user_role',
        current_setting('request.jwt.claims', true)::json ->> 'user_role',
        'student'
      ) in ('admin', 'super_admin')
      or exists (
        select 1
          from public.courses c
         where c.id::text   = split_part(name, '/', 2)
           and c.teacher_id = auth.uid()
      )
      or exists (
        select 1
          from public.enrollments e
         where e.course_id::text = split_part(name, '/', 2)
           and e.student_id     = auth.uid()
      )
    )
  );

-- 6. DELETE · solo teacher dueño del curso o admin (para reemplazar archivo).
create policy task_files_delete_staff on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'task_files'
    and (
      coalesce(
        current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'user_role',
        current_setting('request.jwt.claims', true)::json ->> 'user_role',
        'student'
      ) in ('admin', 'super_admin')
      or exists (
        select 1
          from public.courses c
         where c.id::text   = split_part(name, '/', 2)
           and c.teacher_id = auth.uid()
      )
    )
  );

notify pgrst, 'reload schema';

-- Diagnostic
select 'tasks columns' as kind, column_name
  from information_schema.columns
 where table_schema = 'public'
   and table_name   = 'tasks'
   and column_name in ('file_url', 'file_name', 'file_size');

select 'storage policies' as kind, policyname, cmd
  from pg_policies
 where schemaname = 'storage'
   and tablename  = 'objects'
   and policyname like 'task_files_%'
 order by policyname;
