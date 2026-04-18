-- ===================================================================
-- Nocturna - Custom Access Token Auth Hook
-- Injects user_role + institution_id into the JWT claims on every auth event.
-- Configure in Supabase Dashboard:
--   Authentication -> Hooks -> Custom Access Token
--   Function: public.custom_access_token_hook
-- ===================================================================

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims            jsonb;
  app_meta          jsonb;
  v_user_role       text;
  v_institution_id  uuid;
begin
  select role::text, institution_id
    into v_user_role, v_institution_id
  from public.profiles
  where id = (event ->> 'user_id')::uuid;

  claims := coalesce(event -> 'claims', '{}'::jsonb);
  app_meta := coalesce(claims -> 'app_metadata', '{}'::jsonb);

  app_meta := jsonb_set(app_meta, '{user_role}', to_jsonb(coalesce(v_user_role, 'student')));

  if v_institution_id is not null then
    app_meta := jsonb_set(app_meta, '{institution_id}', to_jsonb(v_institution_id::text));
  else
    app_meta := app_meta - 'institution_id';
  end if;

  claims := jsonb_set(claims, '{app_metadata}', app_meta);
  claims := jsonb_set(claims, '{user_role}', to_jsonb(coalesce(v_user_role, 'student')));
  if v_institution_id is not null then
    claims := jsonb_set(claims, '{institution_id}', to_jsonb(v_institution_id::text));
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- Supabase auth service must be allowed to execute the hook.
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
