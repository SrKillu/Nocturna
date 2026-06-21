STATUS: PENDING_REVIEW

# C38 Migration Skeleton Boundary

`C38 does not create executable migrations.`

## Review-only location

SQL skeletons live under `docs/sql-drafts/c38/`. Every line remains commented.
They describe responsibilities and test gates, not applicable statements.

## Conversion gate

A skeleton may become a real file under `supabase/migrations/` only in a future
explicitly approved batch after:

- the C39 harness preflight/cleanup controls are reviewed;
- exact schema decisions are approved;
- migration ordering and dependencies are stable;
- positive and negative tests exist beside the migration;
- no remote target is linked or used;
- the change can reconstruct in a disposable database.

## Required approvals

- product owner: scope and retention boundary;
- database reviewer: tables, constraints, indexes and evolution;
- security reviewer: grants, RLS, helpers and Data API exposure;
- application reviewer: TypeScript/adapter contract compatibility;
- operator: local/CI isolation, evidence and cleanup.

## Evidence for each future migration PR

- object inventory and dependency rationale;
- exact diff and migration checksum;
- forward-fix and recovery notes;
- synthetic fixture delta;
- schema assertion delta;
- grants/RLS positive and negative tests;
- clean reconstruction evidence;
- query-plan evidence for relevant access paths;
- redaction and no-real-data confirmation.

## Non-destructive evolution

- Prefer additive, transactional changes and reviewed forward fixes.
- Separate destructive proposals into their own approval and retention gate.
- Do not combine data movement with structural creation.
- Do not rewrite legacy objects to make clean V2 convenient.
- Validate foreign-key indexes and tenant consistency constraints.
- Avoid broad policy replacement without before/after actor matrices.

## Versioning boundaries

### Roles and seeds

Role keys are stable reference data. Their deterministic seed is versioned
separately from synthetic test actors. Capability behavior remains an
application contract until a separate DB persistence decision.

### Helpers and grants

Helper signatures, volatility, schema, ownership, search path and execute grants
are versioned together. A helper change carries recursion and bypass tests.

### Auth core

Institutions, profiles and roles precede memberships and session selections.
Auth context must pass before academic policies depend on it.

### Academic core

Terms/courses/sections precede assignments, students, guardians and
enrollments. Composite tenant consistency is established before policies.

### Storage

Storage is a separate later package with bucket/object policies and object-level
tests. It is not included in the first read slice.

### Adapters

Adapter support comes after executed read-policy evidence. It must not be
combined with initial write policies.

## Skeleton-to-migration rule

Review-only skeleton numbering communicates dependency groups but is not a
future timestamp. When authorized, the Supabase CLI must create migration files
using its current supported command and naming convention.

Verdict: `C38_MIGRATION_SKELETON_BOUNDARY_DRAFTED`.
