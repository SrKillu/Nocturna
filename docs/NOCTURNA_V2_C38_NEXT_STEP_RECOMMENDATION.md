STATUS: PENDING_REVIEW

# C38 Next Step Recommendation

## Recommendation

`C38_RECOMMEND_C39_DISPOSABLE_DB_HARNESS_IMPLEMENTATION`

## Why harness first

The schema skeletons now have clear boundaries, but executable migrations should
not precede the mechanism that proves target isolation, deterministic ordering,
secret-safe evidence and exact cleanup. A harness-first batch makes future SQL
review measurable rather than aspirational.

## C39 scope

C39 should:

- implement dry-run/preflight-first local harness scripts;
- verify CLI/Docker/version prerequisites;
- reject linked/remote configuration;
- define a unique disposable project/work directory;
- orchestrate future migration, seed, assertion and policy-test phases;
- implement output redaction and evidence manifests;
- implement target-verified cleanup;
- add unit tests for orchestration without starting Supabase by default.

## C39 exclusions

- no remote Supabase;
- no staging or production project creation;
- no real/legacy data;
- no adapters or runtime integration;
- no deployment;
- no automatic execution without explicit approval;
- no broad executable schema rollout.

## Approval needed

Human approval is required to create harness scripts and, separately, to run
`supabase start`/local reset operations. Migration implementation and execution
remain later approvals.

## Retention gate

The C36 gate remains unchanged. Harness and synthetic disposable testing may
advance, but no legacy audit/export/copy/cutover/retirement is authorized.
