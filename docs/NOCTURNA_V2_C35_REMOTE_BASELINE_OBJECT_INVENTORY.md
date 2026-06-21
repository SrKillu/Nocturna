STATUS: PENDING_REVIEW

# C35 Remote Baseline Object Inventory

## Scope

This inventory is derived only from the C34 schema-only snapshot and checked-in
migrations. It contains no row data and makes no remote connection.

Reconciliation statuses:

- `VERSIONED_MATCH`
- `VERSIONED_DIFFERS`
- `REMOTE_ONLY_UNVERSIONED`
- `LOCAL_ONLY_NOT_REMOTE`
- `RUNTIME_EXPECTED_MISSING`
- `FUTURE_CONTRACT_MISSING`
- `NEEDS_DECISION`

## 1. Enums and types

| Object | Remote exists | Local migration source | Runtime dependency | Reconciliation status | Notes |
|---|---:|---|---|---|---|
| `public.user_role` | Yes | `0001_helper_functions.sql` | V1 auth/JWT | `VERSIONED_MATCH` values, broader auth model differs | student, teacher, admin, super_admin |
| `public.submission_status` | Yes | `0001_helper_functions.sql` | V1 submissions | `VERSIONED_MATCH` values | submitted, graded, late, returned |
| `public.file_bucket` | No | `0010_storage_hardening.sql` | V1 file metadata | `LOCAL_ONLY_NOT_REMOTE` | Remote `file_objects.bucket_id` is text |
| `public.file_scan_status` | No | `0010_storage_hardening.sql` | V1 file metadata | `LOCAL_ONLY_NOT_REMOTE` | Remote scan status is text |

## 2. Tables

| Object | Remote exists | Local migration source | Runtime dependency | Reconciliation status | Notes |
|---|---:|---|---|---|---|
| `audit_log` | Yes | `0002`, `0005` | V1/audit UI | `VERSIONED_DIFFERS` | Remote nullability, policies and indexes differ |
| `course_sections` | Yes | None | Not target V2 sections | `REMOTE_ONLY_UNVERSIONED` | No tenant, term, lifecycle or staff model |
| `courses` | Yes | `0002`, `0003`, `0005`, `0011` | V1 and future academic bridge | `VERSIONED_DIFFERS` | Nullable tenant/creator and duplicate institution FKs |
| `daily_work` | Yes | `0022` | V1 | `VERSIONED_DIFFERS` | Core shape close; grants and policy baseline still differ |
| `daily_work_submissions` | Yes | `0022` | V1 | `VERSIONED_DIFFERS` | Remote shape uses auth.users relations |
| `enrollments` | Yes | `0002`, `0003`, `0005` | V1 and V2 dependency | `VERSIONED_DIFFERS` | `created_at` remote vs `enrolled_at` local |
| `file_objects` | Yes | `0010` | V1 storage metadata | `VERSIONED_DIFFERS` | Remote owner/bucket/name model differs materially |
| `final_grades` | Yes | None | Legacy/unknown | `REMOTE_ONLY_UNVERSIONED` | Nullable course/student; timestamp without timezone |
| `grades` | Yes | `0002`, `0003`, `0005` | V1 | `VERSIONED_DIFFERS` | Numeric precision, timestamps and constraints differ |
| `institutions` | Yes | `0002`, `0005` | V1 and Auth V2 | `VERSIONED_DIFFERS` | Missing `updated_at`, policy set and V2 `status` |
| `materials` | Yes | None | Legacy/unknown | `REMOTE_ONLY_UNVERSIONED` | Not represented by a migration |
| `messages` | Yes | None | Legacy/unknown | `REMOTE_ONLY_UNVERSIONED` | Permissive SELECT policy |
| `profiles` | Yes | `0002`, `0003`, `0005`, `0008` | V1 auth bridge | `VERSIONED_DIFFERS` | Nullable tenant/role/name, fewer indexes/policies |
| `student_invites` | Yes | `0020` | V1 | `VERSIONED_DIFFERS` | Remote policy and timestamp shape differ |
| `submissions` | Yes | `0002`, `0003`, `0005`, `0010` | V1 | `VERSIONED_DIFFERS` | Nullable core columns and timestamp naming differ |
| `tasks` | Yes | `0002`, `0003`, `0005`, `0016` | V1 | `VERSIONED_DIFFERS` | Nullable core columns, attachment columns remote |
| `teacher_invites` | Yes | `0020` | V1 | `VERSIONED_DIFFERS` | Remote constraints/policies differ |
| `roles` | No | None | Auth V2 runtime | `RUNTIME_EXPECTED_MISSING` | Runtime joins `roles:role_id` |
| `institution_memberships` | No | None | Auth V2 runtime | `RUNTIME_EXPECTED_MISSING` | Runtime queries it directly |
| `membership_session_selections` | No | None | C32/C33 contract | `FUTURE_CONTRACT_MISSING` | Needed for session-bound selection |
| `role_capabilities` | No | None | Not currently runtime-required | `NEEDS_DECISION` | Capabilities remain TypeScript |
| `academic_terms` | No | None | Future academic contract | `FUTURE_CONTRACT_MISSING` | Blocks target section/enrollment model |
| exact `sections` | No | None | Future academic contract | `FUTURE_CONTRACT_MISSING` | `course_sections` is not equivalent |
| `section_staff` | No | None | Future academic contract | `FUTURE_CONTRACT_MISSING` | Required for assignment scope |
| `students` | No | None | Future domain contract | `NEEDS_DECISION` | V1 treats profile as student |

## 3. Constraints

| Object group | Remote exists | Local migration source | Runtime dependency | Reconciliation status | Notes |
|---|---:|---|---|---|---|
| Primary keys on 17 remote tables | Yes | Mixed | Identity/object access | `VERSIONED_DIFFERS` | Four PKs belong to remote-only tables |
| `institutions.slug` unique | Yes | `0002` | Institution lookup | `VERSIONED_MATCH` | Preserve |
| course/student enrollment uniqueness | Twice | `0002` | Enrollment integrity | `VERSIONED_DIFFERS` | Constraint plus duplicate unique index |
| course institution FKs | Twice | `0002` | Tenant integrity | `VERSIONED_DIFFERS` | One cascade, one default action |
| profile institution FKs | Twice | `0002` | Tenant integrity | `VERSIONED_DIFFERS` | One cascade, one default action |
| grades submission uniqueness | Twice | `0002` | One grade/submission | `VERSIONED_DIFFERS` | Duplicate unique constraints |
| local NOT NULL/check constraints | Partial remote | `0002` and later | V1 integrity | `VERSIONED_DIFFERS` | Remote is materially weaker |
| Auth V2 membership/role constraints | No | None | Auth V2 | `RUNTIME_EXPECTED_MISSING` | Must be designed separately |

## 4. Indexes

Remote custom indexes:

- `audit_log_actor_idx`
- `audit_log_institution_idx`
- `courses_institution_idx`
- `courses_teacher_idx`
- `daily_work_course_idx`
- `daily_work_submissions_student_idx`
- `daily_work_submissions_work_idx`
- `enrollments_course_idx`
- `enrollments_student_idx`
- `enrollments_unique`
- `file_objects_owner_idx`
- `grades_teacher_idx`
- `idx_messages_course_created`
- `profiles_institution_idx`
- `submissions_student_idx`
- `submissions_task_idx`
- `tasks_course_idx`

| Area | Remote exists | Local migration source | Runtime dependency | Reconciliation status | Notes |
|---|---:|---|---|---|---|
| Core tenant/join indexes | Partial | `0003` | V1 query paths | `VERSIONED_DIFFERS` | Several local institution/status indexes absent |
| File object indexes | Different | `0010` | File workflows | `VERSIONED_DIFFERS` | Remote uses owner; local uses uploader/bucket/path |
| Invite indexes | Not shown | `0020` | Invite lookup | `LOCAL_ONLY_NOT_REMOTE` | Needs disposable DB verification |
| Auth V2 indexes | No | None | Membership/session resolution | `RUNTIME_EXPECTED_MISSING` | Forward-plan item |

## 5. Functions

| Object | Remote exists | Local migration source | Runtime dependency | Reconciliation status | Notes |
|---|---:|---|---|---|---|
| `custom_access_token_hook(jsonb)` | Yes | `0006`, `0008` | V1 JWT | `VERSIONED_DIFFERS` | Remote reads profile tenant/role/status/version |
| `get_institution_id()` | Yes | No exact public source | Remote RLS | `REMOTE_ONLY_UNVERSIONED` | Reads JWT institution claim |
| `get_user_institution_id()` | Yes | No exact source | Remote RLS | `REMOTE_ONLY_UNVERSIONED` | Reads app metadata/top-level claim |
| `get_user_role()` | Yes | No exact source | Remote RLS | `REMOTE_ONLY_UNVERSIONED` | Defaults to student |
| `auth.institution_id()` | Not in public snapshot | `0001` | Local migration policies | `LOCAL_ONLY_NOT_REMOTE`/scope-limited | C34 snapshot covered public |
| `update_updated_at()` | No | `0001` | Local triggers | `LOCAL_ONLY_NOT_REMOTE` | No public function in snapshot |
| `handle_new_user()` | No | `0001`, `0008` | Signup bridge | `LOCAL_ONLY_NOT_REMOTE` | Auth-schema trigger scope may need separate evidence |
| business/file helper functions | No | `0008`–`0010` | V1 | `LOCAL_ONLY_NOT_REMOTE` | Not present in public snapshot |

## 6. Triggers

No `CREATE TRIGGER` statement appears in the C34 public snapshot.

Local migrations define updated-at triggers, `on_auth_user_created`, file object
updated-at and submission file-integrity triggers. Their remote status is
`LOCAL_ONLY_NOT_REMOTE` based on the available snapshot, with a decision to
verify system/auth schema scope in a disposable reconstruction.

## 7. RLS policies

Remote policy groups:

- courses: 5
- daily_work: 4
- daily_work_submissions: 4
- enrollments: 1
- messages: 2
- profiles: 1
- student_invites: 2
- tasks: 4

RLS is enabled on 14 public tables. Several enabled tables have no policy in the
snapshot, including institutions, audit_log, course_sections, file_objects,
grades and submissions. FORCE RLS appears on eight core tables, not all
RLS-enabled tables.

Status: `VERSIONED_DIFFERS`.

High-risk observed policies include `messages_select USING (true)` and invite
policies using unconditional `true`. Overlapping course SELECT policies also
require reconciliation.

## 8. Grants

- USAGE on `public` is granted to postgres, anon, authenticated, service_role
  and supabase_auth_admin.
- All remote public tables grant `ALL` to anon, authenticated and service_role.
- Default privileges grant broad access on future tables, functions and
  sequences.
- Helper functions are broadly executable except the custom auth hook, whose
  PUBLIC execution is revoked.

Status: `VERSIONED_DIFFERS` and `NEEDS_DECISION`.

RLS is the primary row boundary under these grants; grants and policies must be
tested together.

## 9. Storage-related public objects

`public.file_objects` exists remotely but its shape differs from migration
`0010`. Storage schema policies were outside the C34 public-schema snapshot and
are not inferred.

## 10. Remote-only objects

| Object | Status | Why it matters |
|---|---|---|
| `course_sections` | `REMOTE_ONLY_UNVERSIONED` | Not equivalent to target sections |
| `final_grades` | `REMOTE_ONLY_UNVERSIONED` | Unknown source and lifecycle |
| `materials` | `REMOTE_ONLY_UNVERSIONED` | Unknown source and access contract |
| `messages` | `REMOTE_ONLY_UNVERSIONED` | Includes permissive SELECT policy |
| `get_institution_id()` | `REMOTE_ONLY_UNVERSIONED` | Used by remote profile policy |
| `get_user_institution_id()` | `REMOTE_ONLY_UNVERSIONED` | V1 claim helper |
| `get_user_role()` | `REMOTE_ONLY_UNVERSIONED` | V1 role helper |

## Baseline verdict

`C35_BASELINE_RECONCILIATION_DRAFTED`

The inventory is sufficient to start a disposable-database reconstruction, not
to approve a remote migration.
