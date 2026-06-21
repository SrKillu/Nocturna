STATUS: PENDING_REVIEW

# C36 Retention Scenario Decision Tree

## Decision flow

```text
Owner can classify legacy data?
├─ No
│  └─ Design clean staging with synthetic data only.
│     Block cutover, migration and legacy retirement.
└─ Yes
   ├─ No critical real data
   │  └─ Clean V2 architecture; legacy retained temporarily.
   ├─ Useful but non-critical data
   │  └─ Clean V2 architecture; selective migration later.
   └─ Critical real data
      └─ Formal baseline/data migration governance before cutover.
```

## Scenario A — No critical real data

Recommendation:

- advance C37 Clean Supabase V2 Architecture Draft;
- keep old DB as temporary legacy;
- use synthetic seed only;
- do not bulk migrate.

Verdict:
`C36_RECOMMEND_C37_CLEAN_SUPABASE_V2_ARCHITECTURE_DRAFT`

## Scenario B — Useful but non-critical data

Recommendation:

- advance clean staging architecture;
- create a later manual mapping/export plan;
- do not block V2 architecture;
- do not perform automatic whole-database migration.

Verdict:
`C36_RECOMMEND_C37_CLEAN_SUPABASE_V2_ARCHITECTURE_DRAFT_WITH_SELECTIVE_MIGRATION_LATER`

## Scenario C — Critical real data

Recommendation:

- do not abandon or reset current DB;
- reconcile baseline and establish formal migration governance;
- preserve Auth identity continuity where required;
- use disposable copies/dry-runs before any change;
- clean V2 may remain the target, but migration becomes a controlled program.

Verdict:
`C36_RECOMMEND_C37_BASELINE_RECONCILIATION_OR_DATA_MIGRATION_PLAN`

## Scenario D — Owner cannot answer yet

Recommendation:

- block cutover and legacy retirement;
- allow clean technical architecture and synthetic staging design;
- prohibit real data copy or adapters;
- keep all legacy objects unchanged.

Verdict:
`C36_RECOMMEND_OWNER_DECISION_REQUIRED_BEFORE_CUTOVER`

## Current scenario

C36 has no owner classifications, so Scenario D applies for governance. Clean
architecture design can proceed behind a legacy-retention gate.

Primary recommendation:
`C36_RECOMMEND_C37_CLEAN_SUPABASE_V2_ARCHITECTURE_DRAFT_WITH_LEGACY_RETENTION_GATE`
