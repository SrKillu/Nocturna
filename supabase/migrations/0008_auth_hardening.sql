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
