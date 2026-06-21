STATUS: PENDING_REVIEW

# C38 Policy Test Execution Plan

| Suite | Setup Needed | Positive Cases | Negative Cases | Evidence | Blocks Promotion? |
|---|---|---|---|---|---|
| Auth context | active/inactive synthetic profiles and sessions | active identity resolves minimal context | anon, missing/inactive profile | named assertions only | Yes |
| Membership lifecycle | active/invited/suspended/left rows | active membership resolves | every non-active lifecycle denied | role/lifecycle matrix | Yes |
| Session selection | multi-membership actor, sessions A/B | A→Alpha; B→Beta | foreign, missing, revoked, mismatched selection | per-session result summary | Yes |
| Tenant isolation | Alpha/Beta rows and actors | same-tenant approved rows | cross-tenant list and valid direct UUID | zero-leak matrix | Yes |
| Direct-ID denial | known in-scope/out-of-scope/absent IDs | authorized object | sibling, foreign and absent share safe behavior | response class, no row dump | Yes |
| Courses/sections | active terms, courses and sections | owner/admin and approved relationships | unassigned, unenrolled and Beta rows | actor/object matrix | Yes |
| Staff assignment | exact teacher/assistant assignments | assigned section | sibling, revoked, cross-tenant assignment | assignment assertions | Yes |
| Student enrollment | profile-linked student and enrollment | own active section | peer, inactive, other section/tenant | minimal projection assertions | Yes if enabled |
| Guardian links | active/inactive links | linked-student projection | unlinked, inactive and cross-tenant | column allowlist evidence | Yes if enabled |
| Support denial | support with/without explicit future scope | only approved scoped projection | tenant-wide academic access | denial matrix | Yes |
| Stale state | revoke profile/membership/institution/relationship after session | refreshed valid context | stale token/cookie cannot authorize | before/after assertion IDs | Yes |
| Grants + RLS | anon/authenticated/test operational roles | exact approved operation | unexpected operation/object reach | privilege and policy manifest | Yes |
| Policy recursion | context and relationship helper paths | helper returns deterministic result | recursive/infinite/error path | isolated helper results | Yes |
| V1 non-interference | legacy regression contracts, no legacy data copy | unchanged V1 tests | V1 claims cannot assert V2 authority | application regression result | Yes |

## Execution phases

1. Schema/grant assertions before fixture queries.
2. Context helpers in isolation.
3. Lifecycle and session tests.
4. Tenant list/direct-ID tests.
5. Relationship tests.
6. Stale-state transitions.
7. Grants and mutation-denial tests.
8. V1/application regression checks.

## Actor simulation

The future runner must set Auth/JWT context using the supported local test
mechanism and must not grant tests a bypass role accidentally. Each test records
the effective database role and synthetic actor label.

## Transaction strategy

Use transaction-isolated database tests where practical so state transitions do
not leak between suites. Seed/bootstrap invariants run separately. Tests must
not conceal cleanup failure by relying only on transaction rollback.

## Promotion rule

Any suite marked blocking must pass repeatedly from an empty reconstruction.
Excluded student/guardian/Storage behavior must remain denied and documented,
not silently untested.

Verdict: `C38_POLICY_TEST_EXECUTION_PLAN_DRAFTED`.
