-- ====================================================================
-- Nocturna · Phase 11 · courses_insert_staff.sql
-- ====================================================================
-- Fase A · Fix crítico:
--   * Reemplaza todas las policies de INSERT/UPDATE/DELETE en public.courses
--     por una única familia `*_staff` que admite admin/super_admin (siempre)
--     y teacher (solo sus propios cursos).
--   * Idempotente: DROP IF EXISTS + CREATE. Seguro de reejecutar.
--   * Al final: NOTIFY pgrst + SELECT de diagnóstico para confirmar las
--     policies activas.
--
-- Contexto:
--   La policy anterior `courses_insert_admin` estaba rechazando INSERT con
--   42501 incluso cuando el JWT traía user_role='admin' e institution_id
--   correctos (SELECT/UPDATE funcionaban). Las causas más probables son:
--     (a) la policy quedó DROPeada pero no recreada en la ejecución parcial
--         del consolidated.sql, dejando a courses con FORCE RLS + sin
--         policy de INSERT → Postgres rechaza todo;
--     (b) la policy se creó pero con una condición incorrecta y quedó oculta.
--   Este archivo deja el estado final deseado sin depender de qué pasó antes.
-- ====================================================================

-- 1. Limpieza de cualquier policy previa relacionada.
drop policy if exists courses_insert_admin on public.courses;
drop policy if exists courses_insert_staff on public.courses;
drop policy if exists courses_update_admin on public.courses;
drop policy if exists courses_update_staff on public.courses;
drop policy if exists courses_delete_admin on public.courses;

-- 2. INSERT · admin/super_admin en cualquier curso del tenant
--    · teacher solo si crea el curso para sí mismo (teacher_id = auth.uid()).
create policy courses_insert_staff on public.courses
  for insert to authenticated
  with check (
    institution_id = auth.institution_id()
    and created_by = auth.uid()
    and (
      auth.user_role() in ('admin', 'super_admin')
      or (
        auth.user_role() = 'teacher'
        and teacher_id = auth.uid()
      )
    )
  );

-- 3. UPDATE · admin/super_admin en cualquier curso del tenant
--    · teacher solo en los cursos donde ya está asignado.
create policy courses_update_staff on public.courses
  for update to authenticated
  using (
    institution_id = auth.institution_id()
    and (
      auth.user_role() in ('admin', 'super_admin')
      or (
        auth.user_role() = 'teacher'
        and teacher_id = auth.uid()
      )
    )
  )
  with check (
    institution_id = auth.institution_id()
    and (
      auth.user_role() in ('admin', 'super_admin')
      or (
        auth.user_role() = 'teacher'
        and teacher_id = auth.uid()
      )
    )
  );

-- 4. DELETE · solo admin/super_admin del tenant.
create policy courses_delete_admin on public.courses
  for delete to authenticated
  using (
    institution_id = auth.institution_id()
    and auth.user_role() in ('admin', 'super_admin')
  );

-- 5. Refrescar el schema cache de PostgREST para que tome las policies al vuelo.
notify pgrst, 'reload schema';

-- 6. Diagnóstico · lista las policies actualmente activas en public.courses.
--    Deberías ver exactamente 4 filas:
--      courses_select_tenant  · SELECT
--      courses_insert_staff   · INSERT
--      courses_update_staff   · UPDATE
--      courses_delete_admin   · DELETE
select polname                                as policy_name,
       case polcmd
         when 'r' then 'SELECT'
         when 'a' then 'INSERT'
         when 'w' then 'UPDATE'
         when 'd' then 'DELETE'
         else polcmd::text
       end                                    as cmd,
       pg_get_expr(polqual,       polrelid)   as using_expr,
       pg_get_expr(polwithcheck,  polrelid)   as check_expr
  from pg_policy
 where polrelid = 'public.courses'::regclass
 order by polname;
