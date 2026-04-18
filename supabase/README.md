# Nocturna · Supabase migrations

Apply **strictly in order** from the Supabase SQL editor (each file is one atomic phase):

| # | File | Purpose |
|---|------|---------|
| 1 | `0001_helper_functions.sql` | Extensions, enums, `auth.institution_id()`, `auth.user_role()`, `auth.is_super_admin()`, `public.update_updated_at()`, `public.handle_new_user()` |
| 2 | `0002_core_tables.sql` | Core tenant tables (institutions, profiles, courses, enrollments, tasks, submissions, grades) + append-only `audit_log` |
| 3 | `0003_indexes.sql` | Performance indexes on every `institution_id` + FK hot paths |
| 4 | `0004_triggers.sql` | `updated_at` triggers and the `auth.users → profiles` signup trigger |
| 5 | `0005_rls_policies.sql` | Enables + **forces** RLS on every table; tenant-isolated policies with `WITH CHECK` on all INSERT/UPDATE |
| 6 | `0006_auth_hook.sql` | `public.custom_access_token_hook` — inject `user_role` + `institution_id` into JWT |
| 7 | `0007_storage.sql` | Private `submissions` bucket + object-level RLS |

## One-time dashboard steps

1. **Authentication → Hooks → Custom Access Token** → enable + select `public.custom_access_token_hook`.
2. **Authentication → Providers → Email** → disable *Confirm email* for local testing, or keep it enabled and rely on `createUser({ email_confirm: true })` from the service role (what Nocturna's signup service already does).
3. Confirm the `submissions` bucket exists and is **not public**.

## Invariants enforced by the schema

- `institution_id` never comes from the client. All writes either default it from `auth.institution_id()` or are explicitly set by a service-role bootstrap (signup).
- Every `INSERT`/`UPDATE` policy repeats `institution_id = auth.institution_id()` inside its `WITH CHECK`.
- `auth.role()` is **never** referenced — role comes from the signed JWT claim only.
- `audit_log` has **no** `UPDATE`/`DELETE` policies; those operations are denied by RLS.
- `super_admin` bypass is limited to `institutions` and `audit_log` SELECT — never a blanket `USING (true)`.
- `handle_new_user()` reads only `raw_app_meta_data` (server-set), never `raw_user_meta_data` (client-set).
- RLS is `FORCE ROW LEVEL SECURITY` on every table so table owners cannot bypass policies in SQL sessions.

## Rollback

Because each phase is idempotent (`create if not exists` / `drop policy if exists`), re-running any phase is safe. To drop everything, drop the `public` tables in reverse dependency order (audit_log → grades → submissions → tasks → enrollments → courses → profiles → institutions) and recreate.
