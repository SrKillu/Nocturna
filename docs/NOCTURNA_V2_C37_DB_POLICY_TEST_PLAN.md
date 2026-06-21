STATUS: PENDING_REVIEW

# C37 Database Policy Test Plan

## Test environment

Tests run only in a disposable database or an explicitly approved clean,
synthetic staging project. They reconstruct schema from migrations, provision
synthetic actors, apply synthetic fixtures and exercise SQL grants plus RLS.
No production or legacy row is used.

| Suite | Actors | Positive Cases | Negative Cases | Required Evidence |
|---|---|---|---|---|
| Auth context | active user/profile; inactive profile; anon | active profile resolves self | anon, missing/inactive profile resolve no context | helper result assertions and no row leakage |
| Membership lifecycle | active, invited, suspended, left memberships | active membership authorizes tenant context | all non-active states denied | lifecycle matrix |
| Session selection | multi-membership user sessions A/B | A→Alpha and B→Beta independently | foreign, revoked, missing or mismatched selector denied | per-session assertions |
| Institution isolation | Alpha and Beta actors | same-tenant approved reads | cross-tenant list/direct IDs denied | zero-row/direct-ID evidence |
| Course/section access | owner/admin/related actors | approved same-tenant course/section reads | sibling-section and Beta reads denied | list and direct lookup cases |
| Staff assignment | assigned/unassigned teacher/assistant | exact assigned section | unassigned, revoked and cross-tenant assignment | assignment lifecycle evidence |
| Student enrollment | enrolled/unenrolled students | own active enrollment scope | peer, inactive enrollment and other section | projection and direct-ID evidence |
| Guardian link | linked/unlinked guardians | approved linked-student projection | unlinked student, inactive link and cross-tenant | minimal-column assertions |
| Support access | scoped and unscoped support | only explicitly approved projection | tenant-wide academic enumeration | default-deny evidence |
| Storage policy | approved related actor and unrelated actor | approved object list/read when introduced | path guessing, cross-tenant and unauthorized operations | object-operation matrix |
| Stale JWT/cookie | actor revoked after token/selector issue | refreshed valid state works | stale role, membership, institution and selector denied | current-row override evidence |
| Negative direct ID | every actor class | own in-scope ID | valid foreign/sibling UUID indistinguishable from absent | safe result/error assertions |
| Grants + RLS | anon, authenticated, operational role | exact permitted operation | operation denied by grant or policy as designed | privilege snapshot plus query cases |
| V1 legacy non-interference | legacy route/test contract | V1 remains isolated during future opt-in | V2 context cannot widen V1 access; legacy cannot assert V2 authority | regression suite |

## Required test properties

### Auth and context

- `auth.uid()` and `session_id` are both required.
- Session selection belongs to the current profile.
- Membership and institution are current and active.
- Session A and B do not overwrite each other.
- Role/capability hints in JWT or client payload do not grant authority.

### Tenant and relationship isolation

- Test list filtering and direct IDs separately.
- Test valid UUIDs from another tenant, not only random nonexistent IDs.
- Test same-tenant but unrelated section/student rows.
- Test lifecycle transitions without issuing a new client token.
- Test every role against both Alpha and Beta.

### Grants

- Confirm `anon` has no core table access.
- Confirm `authenticated` cannot mutate read-only slice tables.
- Confirm RLS remains enabled on exposed tables.
- Confirm views/functions do not create bypasses.
- Confirm privileged helper execute grants are exact and `PUBLIC` is revoked.

### Policy quality

- Detect recursive-policy errors.
- Verify helpers fail closed on unexpected state.
- Verify policies do not rely on client `institution_id`.
- Verify query plans use tenant/relationship indexes at synthetic scale.
- Verify unauthorized and absent direct objects share safe behavior where
  disclosure matters.

## CI execution order

1. Start disposable PostgreSQL/Supabase-compatible services.
2. Apply future migrations from zero.
3. Provision synthetic auth context.
4. Apply synthetic fixtures.
5. Assert schema/grant invariants.
6. Run helper tests.
7. Run table policy suites.
8. Run Storage suites only when Storage exists.
9. Run application typecheck, unit tests and build.
10. Produce redacted test evidence.
11. Destroy the disposable environment.

## Failure policy

Any cross-tenant read, unexpected mutation, stale-state authorization, helper
bypass or missing RLS stops adapter promotion. Flaky policy tests are failures,
not retries to ignore. Logs must not dump tokens, credentials or full personal
rows.

## Exit criteria for first read slice

- Auth context, lifecycle and session suites pass.
- Alpha/Beta isolation passes for list and direct IDs.
- Owner/admin and exact staff relationships pass.
- Student/guardian paths are either fully tested or explicitly excluded.
- Authenticated writes are denied.
- Clean reconstruction passes repeatedly.
- Human review accepts the evidence.

Verdict: `C37_DB_POLICY_TEST_PLAN_DRAFTED`.

## C38 Execution Follow-up

C38 maps these suites into a future disposable execution order:

1. schema/grant assertions;
2. context helpers;
3. membership/session lifecycle;
4. tenant list and direct-ID isolation;
5. staff/student/guardian relationships;
6. stale-state transitions;
7. grants and mutation denial;
8. V1/application regression.

C38 does not execute any suite or start a database. Future evidence records only
suite/test IDs, synthetic labels and pass/fail results. Any cross-tenant access,
unexpected grant, recursion, stale-state authorization, secret emission or
cleanup failure blocks promotion.
