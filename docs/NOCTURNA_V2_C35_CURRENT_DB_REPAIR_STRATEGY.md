STATUS: PENDING_REVIEW

# C35 Current Database Repair Strategy

## Viability

Repairing the current database is technically viable, but it is the higher-risk
path. It should be chosen only when retention, identity continuity or contractual
requirements make a clean target insufficient.

## Required sequence

### C35 — Baseline reconciliation

- inventory remote objects;
- map every object to migration source or unknown origin;
- preserve observed DDL as review evidence;
- identify effective policy/grant behavior.

### C36 — Disposable DB reconstruction

- reconstruct the remote public baseline in isolation;
- prove deterministic metadata;
- reconcile missing functions/triggers/schema scope;
- make no remote changes.

### C37 — Auth V2 migration draft

- additive institutions status, roles, memberships and session selections;
- compatibility helpers;
- no removal of V1 authority.

### C38 — Backfill dry-run

- classify existing profiles/users;
- map V1 tenant/role to memberships;
- isolate invalid/null/ambiguous records;
- resolve `super_admin` explicitly;
- produce counts and exceptions without remote write.

### C39 — RLS and grant tests

- actor and relationship matrix;
- cross-tenant/direct-ID denial;
- stale claims/session cases;
- permissive policy replacement;
- Storage parity.

### C40 — Staging cutover

- apply only to an isolated staging clone/environment;
- run V1 regression and V2 acceptance;
- document rollback/forward-fix;
- require human approval before any production action.

## Main risks

- Unversioned remote DDL.
- Tables with no migration history.
- Nullable tenant/core columns.
- Duplicate constraints and indexes.
- Permissive or missing policies.
- Broad table/default grants.
- V1 claims used as authority.
- Unknown real records and data quality.
- Delicate backfill and identity continuity.
- Longer audit and recovery planning.

## Relative assessment

| Factor | Assessment |
|---|---|
| Feasibility | Possible |
| Engineering effort | High |
| Audit effort | Very high |
| V1 regression risk | High |
| Time to V2 staging | Slow |
| Data continuity | Best option when mandatory |
| Recommended default | No |

## Conclusion

Current DB reconciliation remains the contingency path for critical legacy data.
It is not the preferred technical foundation for a pre-production V2.

`C35_RECOMMEND_CURRENT_DB_RECONCILIATION` only if retention requires in-place
continuity.
