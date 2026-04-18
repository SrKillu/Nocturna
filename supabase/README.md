# Nocturna · Supabase migrations

Apply in order from the Supabase SQL editor (or `supabase db push` if using the CLI):

1. `0001_initial_schema.sql` — enums, tables, indexes, updated_at triggers.
2. `0002_rls_policies.sql` — enables RLS on every tenant table and wires JWT-claim based policies.
3. `0003_auth_hook.sql` — creates `public.custom_access_token_hook`. **After running**, enable it in `Dashboard → Authentication → Hooks → Custom Access Token` and point it at this function.
4. `0004_signup_trigger.sql` — safety-net trigger so every `auth.users` row gets a matching `public.profiles` row.

## Storage

Create a **private** bucket called `submissions` (matches `SUPABASE_STORAGE_BUCKET`). Access is only via signed URLs (60 s) issued by the backend.

## Claims reminder

The custom access token hook injects:

- `user_role`
- `institution_id`

Both directly on the JWT and inside `app_metadata` for compatibility with `supabase.auth.getUser()` on the server.
