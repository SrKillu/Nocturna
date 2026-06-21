STATUS: PENDING_REVIEW

# C38 Disposable DB Reconstruction Plan

## Executive summary

C38 defines how a future empty, ephemeral Supabase-compatible database will be
rebuilt from reviewed migrations, populated only with synthetic fixtures,
tested for schema/grants/RLS behavior, used for application checks and then
destroyed. C38 is planning only: no database was started, no SQL was executed,
no project was created and no migration was applied.

Verdict: `C38_DISPOSABLE_DB_RECONSTRUCTION_PLAN_DRAFTED`.

## Objective

The disposable database is a repeatable proof environment between architecture
and clean staging. It must establish that source-controlled migrations alone
produce the expected Auth V2 and academic-core security boundary.

## Why it precedes clean staging

- Detects ordering, dependency and extension mistakes without persistent state.
- Proves grants and RLS together before a remote project exists.
- Makes failures cheap to reproduce and discard.
- Prevents manual dashboard DDL from becoming hidden source of truth.
- Produces safe evidence before adapters or staging promotion.

## Reconstruction scope

- approved schemas and extensions;
- Auth/tenant core;
- roles and deterministic role seed;
- memberships and per-session selection;
- reviewed helpers, grants and RLS;
- academic terms, courses, sections and relationship tables;
- synthetic Auth/domain actors;
- schema assertions and policy tests;
- application typecheck, unit tests and build.

## Deferred scope

- real or legacy data;
- remote Supabase and clean staging;
- Storage buckets and operational modules unless separately approved;
- production and deployment;
- real adapters and write operations;
- cutover, migration, retirement or legacy cleanup.

## Principles

- Empty database first.
- Deterministic migration ordering.
- Synthetic seed only.
- No legacy identifiers, files or rows.
- No production or remote Supabase connection.
- Fail closed on ambiguous environment identity.
- Destroy after test and confirm cleanup.
- Redact credentials, connection strings and row contents from evidence.
- Repeated reconstruction must produce equivalent manifests.

## Future flow

1. Verify explicit disposable-environment marker and network isolation.
2. Start a fresh local/CI Supabase stack under approved tooling.
3. Apply reviewed migrations from zero in deterministic order.
4. Provision synthetic Auth identities at runtime.
5. Apply deterministic domain fixtures.
6. Assert schemas, tables, constraints, indexes, RLS, grants and helper safety.
7. Run Auth context, tenant and relationship policy suites.
8. Run application typecheck, unit tests and build.
9. Produce a redacted evidence manifest and failure summary.
10. Stop services, remove disposable state and confirm cleanup.

## Determinism requirements

- Pin and record the CLI/container/runtime versions used by the harness.
- Never depend on a linked project or remote migration history.
- Use stable migration checksums and synthetic fixture labels.
- Generate ephemeral credentials during execution.
- Normalize evidence timestamps and volatile container identifiers where
  comparison matters.
- Run reconstruction twice before calling the harness reliable.

## Authorization required for future execution

- approval to initialize/start local disposable Supabase;
- approval of the harness scripts and cleanup boundary;
- reviewed migration files and synthetic fixtures;
- approved policy-test runner and expected manifests;
- confirmation that Docker/resource cleanup cannot affect other projects;
- approval of any CI secret mechanism;
- explicit assurance that no remote project reference is used.

## Promotion gates

Clean staging remains blocked until:

- reconstruction succeeds repeatedly;
- all required schema assertions pass;
- grants/RLS suites have no cross-tenant defect;
- cleanup is confirmed;
- evidence is reviewed;
- the owner separately approves project creation.

## Safety statement

C38 does not start Supabase, execute SQL, create executable migrations, inspect
real rows, alter remote state or modify application runtime.

## Next step

`C38_RECOMMEND_C39_DISPOSABLE_DB_HARNESS_IMPLEMENTATION`

C39 should implement the local/CI harness controls and dry command orchestration
before executable migration content is authored or applied.
