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
