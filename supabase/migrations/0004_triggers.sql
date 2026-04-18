-- ====================================================================
-- Nocturna · Phase 4/7 · triggers.sql
-- ====================================================================
-- Attaches update_updated_at() to every table with updated_at and wires the
-- handle_new_user() signup trigger. audit_log has NO updated_at by design.
-- ====================================================================

-- --------------------------------------------------------------------
-- updated_at triggers
-- --------------------------------------------------------------------
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'institutions', 'profiles', 'courses', 'tasks', 'submissions', 'grades'
  ]
  loop
    execute format(
      'drop trigger if exists trg_%1$s_updated_at on public.%1$s;',
      tbl
    );
    execute format(
      'create trigger trg_%1$s_updated_at
         before update on public.%1$s
         for each row execute function public.update_updated_at();',
      tbl
    );
  end loop;
end $$;

-- --------------------------------------------------------------------
-- auth.users -> public.profiles
-- --------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
