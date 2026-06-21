STATUS: PENDING_REVIEW

# C35 Clean Rebuild vs Current DB Reconciliation Decision

## Executive decision

Nocturna should use a **hybrid clean-staging strategy**:

1. keep the current Supabase project untouched as a temporary V1/legacy
   reference;
2. design and validate Nocturna V2 on a new, clean staging environment whose
   schema is built only from reviewed, version-controlled migrations;
3. audit data-retention obligations before deciding whether any legacy data
   must be migrated;
4. cut over only proven server adapters, one domain slice at a time.

Verdict: `C35_RECOMMEND_HYBRID_CLEAN_STAGING_THEN_MIGRATE`

This is not a recommendation to restart Nocturna. The frontend, routes,
security contracts, tests, documentation and product decisions remain valuable.
The recommendation changes only the future database starting point.

## Why this decision

C34 proved that the current remote database, local migrations and Auth V2
runtime are three different contracts:

- four remote tables have no migration history;
- shared V1 tables differ in nullability, names, constraints, indexes,
  functions, policies and grants;
- Auth V2 roles, memberships, institution status and session selection are
  absent;
- the academic V2 foundation is also absent;
- broad grants leave RLS as the decisive row boundary.

Repair is possible, but it combines baseline recovery, V1 preservation,
backfill, security-policy correction and new V2 architecture in one risk path.
A clean staging project separates those concerns and provides a deterministic
environment without altering the legacy database.

## Option A — Repair/reconcile the current database

### Advantages

- Preserves existing users and data in place.
- Avoids moving Auth identities if they are production-critical.
- Can retain V1 URLs and integrations with fewer environment changes.
- Makes sense when legal, contractual or operational data retention requires
  continuity in the current project.

### Risks and complexity

- Historical drift must be reconstructed before new work.
- Existing nullable tenant fields and duplicate constraints complicate
  hardening.
- Remote-only tables need ownership and lifecycle decisions.
- Permissive/missing policies and broad grants require careful live-system
  analysis.
- V1 claims remain active while V2 authority is introduced.
- Backfill and policy changes can break V1 or expose cross-tenant data.
- Every migration must account for unknown existing row states.

### Relative cost and time

- Technical cost: high.
- Audit cost: very high.
- Relative delivery time: slowest path to a trustworthy V2 staging slice.
- Operational risk: high if the database carries real users or data.

### Auth V2 impact

Auth V2 additions must be strictly additive, with a non-destructive backfill and
a long compatibility bridge. The old profile role/tenant claims cannot be
removed early.

### Courses + Sections and future modules

`course_sections` cannot be treated as target `sections`. Courses, enrollments,
terms, section staff and students require explicit mapping and staged cutover.
Every later module inherits the reconciled legacy complexity.

### When Option A makes sense

- The current database holds critical real data.
- Existing Auth user IDs must remain authoritative.
- Downtime or identity migration is unacceptable.
- Retention rules prohibit archiving and replacement.
- The organization accepts a longer audit/backfill program.

## Option B — Create a clean Supabase V2 staging database

### Advantages

- Deterministic migrations from zero.
- No inherited unknown rows, duplicate constraints or manual tables.
- Auth V2 can be authoritative from the first schema version.
- Deny-by-default RLS and least-privilege grants can be tested before adapters.
- Synthetic multi-tenant fixtures make negative authorization tests repeatable.
- Future modules share one coherent academic and tenancy model.
- Rollback is simple while the frontend still uses mocks/feature flags.

### Risks and complexity

- Auth identities and any useful legacy data do not move automatically.
- Environment/configuration management must be deliberate.
- A data migration plan may still be needed after the retention audit.
- Temporary dual-system operation requires clear ownership.
- A clean project can still drift if dashboard changes bypass migrations.

### Relative cost and time

- Initial architecture cost: medium.
- Security/test setup cost: medium/high but bounded.
- Relative time to trustworthy V2 staging: faster than repairing current drift.
- Production cutover time: unknown until data retention is decided.

### What is preserved

- Next.js frontend and `/v2` routes.
- Auth V2 server/runtime concepts, adapted to the final DB contract.
- Dashboard and domain UI.
- capabilities and route-role contracts.
- mocks, view models and unit tests.
- C29–C34 contracts, RLS designs, risk findings and roadmap.

### What is discarded or not copied automatically

- Unversioned remote DDL as a target design.
- permissive policies and broad default privileges.
- duplicate constraints and nullable tenant assumptions.
- V1 claims as final authority.
- any unknown/unused legacy tables unless retention justifies migration.

### How drift is prevented

- Every schema change begins as a migration in Git.
- No manual dashboard DDL.
- Local/preview/staging validation precedes any production environment.
- CI reconstructs the schema from zero and runs policy tests.
- Synthetic seeds are versioned and contain no real records.
- Schema drift checks become a release gate.

### When Option B makes sense

- There is no critical legacy data, or data can be selectively migrated.
- V2 is still pre-production/mock-backed.
- Security and maintainability matter more than preserving accidental DDL.
- The team can operate legacy and V2 staging separately during validation.

## Comparison

| Criterion | Repair current DB | Clean Supabase V2 |
|---|---|---|
| Security | Must unwind unknown policies/grants in place | Deny-by-default from first migration |
| Speed | Slow due to audit and backfill | Faster to a trustworthy staging baseline |
| Risk | High live-system regression risk | Lower staging risk; later migration risk remains |
| Complexity | Historical + V1 + V2 combined | New V2 complexity isolated |
| V1 compatibility | Native but fragile during changes | V1 remains untouched in legacy |
| V2 compatibility | Requires bridge around old authority | Auth V2 can be native |
| Scalability | Constrained by legacy model until migrated | Coherent terms/sections/memberships model |
| Maintainability | Continued reconciliation burden | Clear migration history |
| Migration clarity | Ambiguous starting point | Deterministic from zero |
| Testability | Existing data complicates repeatability | Synthetic fixtures and clean rebuilds |
| Production risk | High if modified directly | Low during staging; cutover separately governed |
| Recommendation | Only if critical data requires it | Preferred technical destination |

## Data-retention caveat

C34 inspected schema only. It did not determine whether the current database
contains critical users, institutions, academic records, messages, files or
legal records.

Therefore:

- begin architecture planning for clean V2 staging;
- do not delete, reset or decommission the current project;
- complete a human-led data-retention audit before deciding migration scope.

## Final recommendation

`C35_RECOMMEND_HYBRID_CLEAN_STAGING_THEN_MIGRATE`

Immediate governance gate: `C35_RECOMMEND_DATA_RETENTION_AUDIT`.
