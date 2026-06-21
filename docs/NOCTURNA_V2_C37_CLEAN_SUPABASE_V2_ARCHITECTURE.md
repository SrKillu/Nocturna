STATUS: PENDING_REVIEW

# C37 Clean Supabase V2 Architecture

## Executive summary

Nocturna V2 should be built on a clean, migration-first Supabase foundation in
a dedicated staging environment. The current Supabase project remains a
temporary legacy boundary. C37 creates architecture only: no project was
created, no SQL was executed, no migration was applied and no real row was
read or copied.

The design starts with server-validated Auth V2 context, then adds the minimum
academic core needed for a read-only Courses + Sections slice. Every future
database object must be reproducible from versioned migrations, synthetic
fixtures and automated policy tests.

Verdict: `C37_CLEAN_SUPABASE_V2_ARCHITECTURE_DRAFTED`.

## Objective

Create a future Supabase V2 foundation that:

- derives tenant authority from current database state;
- isolates institutions by default;
- distinguishes identity, membership, role and academic relationships;
- can be rebuilt from zero in a disposable database;
- is introduced through small, reviewable vertical slices;
- does not inherit undocumented legacy DDL or permissive grants.

## What is preserved

- Next.js V2 routes, components and view models.
- Auth V2 server-side validation contracts.
- Central RoleKey and capability contracts.
- Route-role contract tests.
- Loading, empty, denied, safe not-found and problem states.
- Existing unit/build checks and CI guardrails.
- Documentation and review history from C29–C36.
- Mock adapters while real-data boundaries remain unapproved.

## What the clean V2 database replaces

- Dashboard-created or unversioned DDL.
- V1 profile fields used as final tenant/role authority.
- Broad grants not justified per operation.
- Tenant-wide access where assignment, enrollment or guardian linkage is
  required.
- Global active-institution state that leaks across user sessions/devices.
- Unknown or overlapping RLS policies that cannot be reconstructed from source.

## Temporary legacy boundary

The current database remains available only as a legacy system while retention
and migration decisions are unresolved. It is not the authority for clean V2
design. Legacy identifiers, rows, files, policies and claims must not be copied
into clean staging by convenience.

## Architecture principles

1. **Migration-first:** every object originates in reviewed, versioned
   migrations; no manual dashboard DDL.
2. **Staging-first:** integration is proven outside production before any
   cutover consideration.
3. **Synthetic-data-only:** fixtures use invented identities and content.
4. **Deny-by-default RLS:** absence of an explicit policy means no row access.
5. **Least-privilege grants:** SQL grants and RLS are reviewed together.
6. **No service role in browser:** privileged credentials remain in controlled
   server/operations boundaries only.
7. **Current-state authorization:** stale JWT, cookies or UI capabilities never
   override current profile, membership, institution and relationship state.
8. **Server-side tenant resolution:** clients cannot assert `institution_id`,
   role, capability or relationship scope.
9. **Feature-flagged adapters:** real adapters can be disabled without changing
   the V2 UI contract.
10. **Rebuildable CI:** schema, seed and policy evidence are reproducible from
    zero in a disposable database.
11. **Forward fixes:** early staging corrections use reviewed forward
    migrations; destructive shortcuts are not the default.
12. **Small slices:** read policy evidence precedes write integration.

## Main components

### Auth and tenant context

`profiles` represents global identity linked one-to-one with `auth.users`.
`institution_memberships` establishes institution, role and lifecycle
authority. A per-session `membership_session_selections` record binds the JWT
`session_id` to one currently valid membership. The database revalidates all
links rather than trusting client input.

### Academic core

`academic_terms`, `courses`, `sections`, `section_staff`, `students`,
`guardian_links` and `enrollments` model the minimum relationships needed for
tenant-safe reads. Course and section are separate concepts. Staff assignment,
student enrollment and guardian linkage narrow access below institution level.

### Operational modules

Attendance, evaluations, gradebook, materials, notifications, reports,
certificates, settings and other operational modules remain deferred. Each
requires its own schema, capability-to-operation map, RLS matrix and policy
tests after the academic core proves safe.

### Storage

Storage is a later reviewed migration group. Object paths must encode
non-authoritative identifiers only; policy authorization still derives current
membership and domain relationships. No public bucket is assumed.

### Audit

Security-sensitive events require append-oriented audit records with tenant,
actor, action, target and redacted metadata. Audit events do not replace
database constraints or RLS and must not store credentials or excessive
personal data.

### Testing

Tests run against a disposable database reconstructed from zero. They cover
grants and RLS together, cross-tenant direct IDs, lifecycle revocation,
multi-device selection and relationship scope. Synthetic staging acceptance
follows only after disposable tests pass.

## Proposed deployment topology

1. **Legacy/current Supabase:** preserved, isolated and not modified by C37.
2. **Disposable local/CI database:** future migration and policy-test target.
3. **Clean staging Supabase V2:** future synthetic-only integration target,
   requiring separate approval to create.
4. **Future production:** out of scope until retention, migration, recovery,
   security and acceptance gates are complete.

## Legacy-retention gate

Until the owner completes the C36 classification and approves a scenario:

- no cutover;
- no legacy data or file copy;
- no export or transform;
- no retirement, archival or deletion of legacy;
- no use of legacy IDs as clean V2 identifiers;
- no use of legacy profile claims as final V2 authority;
- no production adapter activation.

Clean architecture, synthetic fixtures and disposable tests may proceed behind
this gate.

## First integration slice

The recommended first slice is **Courses + Sections read-only**:

- server-side adapters only;
- current active membership required;
- owner/admin same-institution reads;
- teacher/assistant exact assignment reads;
- student exact enrollment reads only after student/enrollment policies pass;
- guardian and support access remain explicit, narrow decisions;
- no write adapter until read policies and negative tests pass.

## Approval gates

- Human review of the core schema and migration sequence.
- Disposable database reconstruction plan.
- Reviewable migration skeletons, still unapplied.
- Automated grants/RLS test harness.
- Approval to create a clean staging project.
- Retention decision before any real-data movement.
- Separate approval for write adapters, Storage and production.

## Recommended next batch

`C37_RECOMMEND_C38_DISPOSABLE_DB_RECONSTRUCTION_PLAN`

C38 should define tooling, migration skeleton boundaries, deterministic
synthetic seed mechanics and policy-test execution for an ephemeral database.
It must remain non-production and must not create or modify remote Supabase
without separate approval.
