STATUS: PENDING_REVIEW

# C34 Remote Schema Drift Inspection

## Executive summary

C34 inspected the linked Supabase project's `public` schema with Supabase CLI
2.107.0 using a schema-only `pg_dump` path. The snapshot contains DDL,
constraints, indexes, RLS policies and grants. It contains no table-row
`INSERT` or `COPY` statements.

No business or user rows were queried. No SQL was executed manually. No
Supabase write, migration, `db push`, `db pull`, `migration up` or `db reset`
was performed.

The inspection confirms material drift:

- the remote schema does not contain `institution_memberships`, `roles`,
  `role_capabilities` or `membership_session_selections`;
- `public.institutions` exists remotely but has no `status` column;
- Auth V2 runtime queries objects that are absent remotely and locally;
- the remote V1 schema differs from the checked-in migrations in nullability,
  column names, constraints, indexes, policies and extra unversioned tables.

Verdict: `C34_REMOTE_SCHEMA_DRIFT_CONFIRMED`

## Scope and connection status

- Supabase CLI: 2.107.0.
- Existing CLI authentication: valid.
- Linked-project marker: present and non-empty.
- Project reference: intentionally not recorded.
- Inspected schema: `public`.
- Snapshot: `docs/schema-snapshots/C34_REMOTE_SCHEMA_READONLY_SNAPSHOT.sql`.
- Data rows inspected: none.
- Secrets captured: none detected.

The repository `.env.local` was neither read nor modified. Because the CLI
attempted to parse that file and rejected its encoding, the successful dump ran
from an isolated temporary work directory containing only the local
`supabase/` metadata required for the existing link.

## Remote/local/runtime matrix

| Object | Exists remote | Exists local migrations | Runtime expects | Drift | Notes |
|---|---:|---:|---:|---|---|
| `institution_memberships` | No | No | Yes | Critical | `active-membership.ts` queries it directly |
| `roles` | No | No | Yes | Critical | Runtime joins `roles:role_id` and expects `roles.key` |
| `role_capabilities` | No | No | No, capabilities remain TypeScript | Expected/deferred | Do not create until persistence is approved |
| `membership_session_selections` | No | No | Contract/spec | Critical for DB-backed selection | Active selection remains unversioned |
| `institutions.status` | No | No | Yes | Critical | Remote institution has only id/name/slug/created_at |
| `profiles` | Yes | Yes | Yes | Material | Remote nullability and indexes differ from migrations |
| `courses` | Yes | Yes | Yes | Material | Remote has nullable tenant/creator and duplicate tenant FKs |
| `enrollments` | Yes | Yes | Yes | Material | Remote uses `created_at`; local migration defines `enrolled_at` |
| `academic_terms` | No | No | Future academic contract | Missing | No remote or versioned term authority |
| `sections` | No | No | Future academic contract | Missing | Remote has non-equivalent `course_sections` |
| `section_staff` | No | No | Future academic contract | Missing | Remote still relies on `courses.teacher_id` |
| `students` | No | No | Future domain contract | Missing | V1 uses profiles/enrollments instead |

## Remote Auth and tenant objects

### `public.institutions`

- Columns: `id`, `name`, `slug`, `created_at`.
- Primary key: `id`.
- Unique constraint: `slug`.
- `status`: absent.
- `updated_at`: absent remotely, present in local migration `0002`.
- RLS: enabled, not forced.
- Policies in snapshot: none.
- Grants: table-level `ALL` to `anon`, `authenticated` and `service_role`.

The broad grants do not themselves bypass RLS, but the absence of an explicit
institution policy must be reconciled and tested before integration.

### `public.profiles`

- Columns: `id`, nullable `institution_id`, nullable `role` with default
  `student`, `email`, nullable `full_name`, `is_active`, `session_version`,
  timestamps.
- Primary key: `id`.
- FKs: `id -> auth.users`; two institution FKs are present, one with cascade.
- Indexes: only `profiles_institution_idx` appears in the snapshot.
- RLS: enabled and forced.
- Policy: one tenant SELECT policy using `get_institution_id()`.
- Grants: table-level `ALL` to `anon`, `authenticated` and `service_role`.

Local migrations declare `institution_id`, `role` and `full_name` as
`NOT NULL`, add role/email/is-active indexes and use a larger policy set. The
remote schema is therefore not reconstructible from the local migration intent.

### V1 role authority

The remote role authority is the `public.user_role` enum:
`student`, `teacher`, `admin`, `super_admin`.

There is no V2 `roles` table and no remote representation of
owner/assistant/guardian/support. The access-token hook reads role, institution,
active state and session version from `profiles`, confirming that the remote
authorization context is still V1-shaped.

## Remote academic objects

### `public.courses`

- Columns: id, nullable institution, name, description, nullable teacher,
  nullable creator and timestamps.
- PK: id.
- FKs: creator/profile, teacher/profile and two institution FKs.
- Indexes: institution and teacher.
- RLS: enabled and forced.
- Policies: five; two overlapping SELECT policies plus staff write policies.
- Grants: `ALL` to `anon`, `authenticated` and `service_role`.

Local migration `0002` requires tenant and creator. The duplicate institution
FKs and relaxed remote nullability are reconciliation items.

### `public.enrollments`

- Columns: id, institution, course, student, `created_at`.
- PK: id.
- FKs: institution, course, profile/student.
- Uniqueness: course/student constraint plus a second unique index.
- Indexes: course and student; no remote institution index was found.
- RLS: enabled and forced.
- Policies: one SELECT policy; no INSERT/DELETE policies in the snapshot.
- Grants: `ALL` to `anon`, `authenticated` and `service_role`.

Local migration `0002` defines `enrolled_at` and broader policy/index intent.
Applying local migrations blindly could create incompatible expectations.

### Section/student/term model

- Exact `sections`: absent.
- `course_sections`: present remotely with id, course, title, position and
  created_at; it has a PK, course FK, RLS enabled, no policy in the snapshot and
  broad table grants.
- `section_staff`: absent.
- `academic_terms`: absent.
- `students`: absent.

`course_sections` is not equivalent to the C30/C33 target because it has no
institution, term, lifecycle or staff-assignment model.

## Other remote-only or non-migration objects

The remote schema includes `course_sections`, `final_grades`, `materials` and
`messages`, but no checked-in migration creates those tables. This is direct
evidence of unversioned remote DDL.

The snapshot also shows schema-level differences in objects that do have local
migrations, including missing columns, relaxed nullability, duplicate
constraints/FKs, different policy sets and different index sets.

## Functions, policies and grants

Remote helper functions include:

- `custom_access_token_hook(event jsonb)`, SECURITY DEFINER, with PUBLIC
  execution revoked and grants to `service_role` and `supabase_auth_admin`;
- `get_institution_id()`;
- `get_user_institution_id()`;
- `get_user_role()`.

The latter three are granted to `anon`, `authenticated` and `service_role`.
Their trust model is V1 JWT/profile context, not an active V2 membership.

Several tables have RLS enabled but no policy in the snapshot. Other policies
contain permissive or overlapping behavior requiring review, notably
`messages_select USING (true)` and invite policies using `true`. C34 does not
approve or modify these policies.

Table grants are broadly `ALL` for `anon`, `authenticated` and `service_role`.
RLS remains the row boundary, so grants and policies must be reviewed together.

## Remote versus local migration conclusion

### Remote but not versioned

- `course_sections`
- `final_grades`
- `materials`
- `messages`
- portions of constraints, policies and grants that differ from migrations

### Expected by runtime but absent remote and local

- `institution_memberships`
- `roles`
- `institutions.status`

### Contract objects absent remote and local

- `membership_session_selections`
- `academic_terms`
- `sections`
- `section_staff`
- `students`

### Present in both but materially different

- `institutions`
- `profiles`
- `courses`
- `enrollments`
- additional core tables and policy/index definitions

## Auth V2 drift decision

`C34_REMOTE_SCHEMA_DRIFT_CONFIRMED`

The remote schema does not rescue the runtime/migration mismatch identified by
C33. It confirms that Auth V2 currently depends on tables and a column that do
not exist in the inspected remote schema.

## Safety conclusion

Do not proceed directly to an incremental Auth V2 migration draft. First create
a local, review-only baseline/reconciliation package that:

1. records the actual remote V1 schema without row data;
2. maps every remote object to a migration source or marks it unversioned;
3. resolves remote/local differences without applying them;
4. designs the Auth V2 additions on top of that reconciled baseline;
5. includes disposable-database and RLS regression tests before any remote
   approval.

Recommendation: `C34_RECOMMEND_C35_SCHEMA_BASELINE_RECONCILIATION`
