STATUS: PENDING_REVIEW

# C35 Auth V2 Forward Migration Plan

## Purpose

This is a future migration plan, not executable SQL and not approval to modify
Supabase. It remains separate from the observed-baseline reconstruction.

## A. Baseline reconciliation

1. Reconstruct the C34 public schema in a disposable database.
2. Compare reconstructed metadata with the C34 snapshot.
3. Map remote-only objects to historical ownership decisions.
4. Verify V1 functions, triggers, policies and grants.
5. Establish a reviewed baseline artifact without applying it remotely.

Exit gate: deterministic reconstruction and documented exceptions.

## B. Additive Auth V2 tables

Future draft objects:

- additive `institutions.status` with approved vocabulary and safe default;
- `roles` with stable unique role key and lifecycle state;
- `institution_memberships` linking profile, institution and role;
- `membership_session_selections` linking Supabase session to active membership.

Required constraints:

- PKs on every object;
- FKs with explicit delete behavior;
- one active/eligible membership relation per intended rule;
- approved status checks;
- timestamps as `timestamptz`;
- no destructive change to profile tenant/role columns.

Required indexes:

- membership by profile/status/institution;
- membership by institution/role/status;
- membership unique relation as approved;
- selection by session and profile;
- FK indexes for role, institution, profile and membership;
- institution status lookup only if justified by access paths.

`role_capabilities` remains deferred unless database customization is approved.

## C. Non-destructive V1 to V2 backfill

1. Map each V1 profile institution/role to a proposed membership.
2. Define explicit mapping for `super_admin`; never silently convert it to
   tenant owner.
3. Report profiles with null/invalid institutions or roles.
4. Create memberships idempotently in a disposable database.
5. Keep `profiles.role` and `profiles.institution_id` intact.
6. Compare membership-derived authority with V1 claims.

No backfill may run remotely without a separately reviewed migration and data
impact report.

## D. Active membership selection

- Bind selection to Supabase `session_id`.
- Validate profile ownership, membership status and institution status.
- Permit only one current selection per session.
- Invalidate or reject stale selections after suspension/revocation.
- Treat HTTP-only cookies as selectors, never authority.
- Define cleanup and expiry behavior.

## E. Auth V2 helper and RLS context

Future helpers must derive context from current DB state:

- authenticated profile;
- current session;
- selected active membership;
- active institution;
- role key.

Policy posture:

- SECURITY INVOKER by default;
- narrowly scoped SECURITY DEFINER only with explicit internal schema,
  `search_path`, auth checks and revoked PUBLIC execution;
- no trust in user-editable metadata;
- grants reviewed separately from RLS;
- SELECT/INSERT/UPDATE/DELETE policies split;
- UPDATE includes both USING and WITH CHECK;
- cross-tenant and direct-object denial tests mandatory.

## F. Courses and sections dependency unlock

Only after Auth V2 context passes tests:

1. Decide whether legacy `course_sections` is retained, mapped or retired.
2. Add target academic terms and sections additively.
3. Add section staff assignments.
4. Evolve enrollments toward term/section/student lifecycle.
5. Preserve V1 `courses.teacher_id` and course enrollment behavior during the
   bridge.
6. Cut over one read slice at a time.

## G. Disposable DB and staging verification

Required before any remote approval:

- clean baseline reconstruction;
- forward migration application on disposable DB;
- idempotence where intended;
- backfill dry-run and reconciliation counts;
- V1 route/API regression tests;
- Auth V2 active-membership tests;
- stale JWT/session tests;
- role and capability tests;
- RLS positive/negative tests for every role;
- cross-institution denial;
- direct-object access denial;
- grants/advisors review;
- rollback or forward-fix rehearsal.

## Rollback and forward-fix posture

- Prefer additive changes so rollback can disable new read paths.
- Do not drop V1 columns during first adoption.
- For data-bearing Auth V2 tables, prefer forward-fix over destructive rollback.
- Version every helper/policy change with an explicit compatibility window.
- Record cutover and recovery decisions before deployment.

## Decision

`C35_AUTH_V2_FORWARD_PLAN_DRAFTED_NOT_APPROVED_FOR_SQL`

The next batch should validate the baseline in a disposable database before
authoring an applicable Auth V2 migration.
