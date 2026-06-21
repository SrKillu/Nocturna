STATUS: PENDING_REVIEW

# C36 Next Step Recommendation

## Main recommendation

Proceed with:

`C36_RECOMMEND_C37_CLEAN_SUPABASE_V2_ARCHITECTURE_DRAFT_WITH_LEGACY_RETENTION_GATE`

C37 may design a clean, migration-first V2 architecture and synthetic staging
fixtures. It must not create a project, apply SQL, copy real data or retire the
legacy project without new approval.

## If owner confirms no critical data

Next:

**C37 Clean Supabase V2 Architecture Draft**

Scope:

- migration order and naming;
- Auth V2 core contract;
- academic core dependencies;
- deny-by-default grants/RLS;
- synthetic seed and DB policy-test design;
- environment and CI strategy.

## If owner confirms critical data

Next:

**C37 Legacy Data Baseline and Migration Governance Plan**

Scope:

- custodians and retention rules;
- Auth identity continuity;
- domain mapping;
- backup/recovery;
- approved audit levels;
- dry-run and reconciliation plan.

## If owner has not answered

Clean architecture design may continue with synthetic data only.

Blocked:

- cutover;
- real adapters;
- export/migration;
- legacy archival/deletion;
- use of legacy IDs/data in staging.

## Approval required

- owner-completed questionnaire;
- permission to create clean staging in a future batch;
- explicit authorization for any Level 1+ audit;
- separate approval for export/migration or retirement.
