STATUS: PENDING_REVIEW

# C35 Data Retention Decision

## Owner questions

These questions require human/business answers. C34 did not read rows.

1. Does the current database contain real data that must be preserved?
2. Are there real user accounts?
3. Are there real institutions?
4. Are courses, materials or messages real?
5. Are there official academic documents or grades?
6. Is any stored information sensitive or regulated?
7. Can the current project be archived as read-only legacy?
8. Can clean staging begin without migrating data?
9. Will a selective export/import be required?
10. Is there a legal, contractual or operational retention obligation?

Additional evidence to collect without exposing records in chat:

- owner classification per domain;
- approximate record/Storage volume;
- last business use date;
- identity continuity requirements;
- retention duration;
- deletion/archive authority;
- approved migration custodian.

## Scenario 1 — No critical data

Recommendation:

- create clean V2 staging;
- use synthetic seed only;
- retain the old project temporarily as evidence;
- do not migrate demo/test rows;
- plan retirement separately.

Strategic verdict:
`C35_RECOMMEND_HYBRID_CLEAN_STAGING_THEN_MIGRATE`

## Scenario 2 — Useful but non-critical data

Recommendation:

- create clean V2 staging;
- classify and manually review export candidates;
- migrate only mapped, validated records after schema stabilization;
- avoid automatic whole-database migration.

Strategic verdict:
`C35_RECOMMEND_HYBRID_CLEAN_STAGING_THEN_MIGRATE`

## Scenario 3 — Critical real data

Recommendation:

- do not abandon or reset the current project;
- perform baseline reconciliation and controlled migration planning;
- maintain backup/recovery and identity mapping;
- test backfill against a disposable copy;
- consider clean V2 as target, but govern migration as a formal data program.

Conditional verdict:
`C35_RECOMMEND_CURRENT_DB_RECONCILIATION`

## Decision gate

Until the owner answers the ten questions:

- no legacy decommission;
- no production migration;
- no automated data copy;
- no clean project promoted beyond synthetic staging.

Immediate recommendation:
`C35_RECOMMEND_DATA_RETENTION_AUDIT`

## C36 Data Retention Audit Follow-up

C36 created a Level 0 documentary audit, owner questionnaire, domain
classification matrix, scenario tree and safe future audit plan.

- Owner input is still required.
- No rows, counts, samples or exports were accessed.
- No migration or database change was performed.
- Legacy retirement remains prohibited.
- Clean V2 architecture may proceed only with synthetic data and a retention
  gate.

Current status:
`C36_RETENTION_AUDIT_DRAFTED_OWNER_INPUT_REQUIRED`
