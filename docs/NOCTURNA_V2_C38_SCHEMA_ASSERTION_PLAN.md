STATUS: PENDING_REVIEW

# C38 Schema Assertion Plan

Assertions compare the reconstructed database to a reviewed manifest. They do
not infer correctness merely because migrations completed.

| Assertion | Purpose | Expected Evidence | Failure Meaning |
|---|---|---|---|
| Required schemas | Confirm only approved exposed/private namespaces | schema name/owner manifest | missing dependency or unexpected exposure |
| Required tables | Confirm exact core object set | schema-qualified table list | incomplete migration or drift |
| Required columns | Validate names, types, nullability and defaults | normalized column manifest | contract mismatch |
| Primary/unique constraints | Protect identity and business invariants | constraint definitions | duplicates or unstable identity possible |
| Foreign keys | Prove relationship and tenant consistency | FK/action manifest | orphan/cross-tenant relation possible |
| Check constraints | Enforce lifecycle/date/value domains | normalized expressions | invalid state accepted |
| Required indexes | Support FK, tenant and relationship access paths | index columns/predicates | locking/performance/policy risk |
| RLS enabled | Protect every exposed tenant table | per-table RLS status | table may expose rows |
| FORCE RLS decision | Prevent owner bypass where approved | explicit per-table manifest | owner-path assumptions unclear |
| Exact grants | Separate object reachability from row visibility | role/object/operation matrix | overgrant or broken Data API access |
| Policy inventory | Confirm exact operation/role policies | policy name/command/roles | missing or unexpected authorization |
| Function properties | Validate schema, owner, volatility and fixed search path | function manifest | hijack/bypass risk |
| PUBLIC execute revoked | Prevent accidental function API | ACL assertion | callable privileged surface |
| Approved extensions only | Reduce supply/privilege surface | extension/version manifest | undocumented dependency |
| Exposed schemas/tables | Ensure Data API boundary is deliberate | exposed-object allowlist | unreviewed endpoint surface |
| Anonymous grants absent | Prove core data is non-public | zero unexpected anon privileges | unauthenticated reachability |
| Seed invariants | Confirm only synthetic expected labels/count classes | aggregate labels, no rows | fixture drift or real-data risk |
| Migration history | Confirm deterministic order/checksums | ordered checksum manifest | reconstruction cannot be trusted |

## Manifest format

The future manifest should be version-controlled, machine-readable and stable
across runs. It stores definitions and expected privilege relationships, never
credentials or row contents.

## RLS and FORCE RLS

RLS is mandatory for exposed tenant tables. `FORCE ROW LEVEL SECURITY` is an
explicit per-table decision, not a blanket substitute for correct ownership and
test roles. Assertions must document any table that intentionally omits it.

## Functions

Any privileged helper assertion must verify:

- private/non-exposed schema;
- schema-qualified references;
- fixed minimal search path;
- exact execute roles;
- no execute for `PUBLIC`;
- expected security mode;
- approved scalar signature.

## Failure handling

Unexpected objects are failures, not automatically added to the manifest.
Manifest updates require the same review as migration changes.

Verdict: `C38_SCHEMA_ASSERTION_PLAN_DRAFTED`.
