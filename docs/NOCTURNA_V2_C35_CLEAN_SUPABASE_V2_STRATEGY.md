STATUS: PENDING_REVIEW

# C35 Clean Supabase V2 Strategy

## 1. Objective

Design a new **staging-only** Supabase V2 foundation. This document does not
create a project, execute SQL or authorize production cutover.

## 2. Principles

- Migrations start from zero and remain version-controlled.
- No manual table/policy changes through the dashboard.
- RLS is enabled immediately on exposed tables.
- Policies are deny-by-default and relationship-aware.
- Grants are explicit and reviewed separately from RLS.
- `service_role` never reaches browser code.
- Staging uses no real production data.
- Seeds are synthetic, deterministic and disposable.
- Schema reconstruction and policy tests run before real adapters.
- V1 and the current database remain untouched.
- Auth context comes from current DB state, not client input or user metadata.

## 3. Recommended migration order

### A. Core auth context

1. institutions and lifecycle status;
2. global profiles;
3. roles;
4. institution memberships;
5. session-bound active membership selections;
6. narrowly scoped auth/RLS helpers;
7. grants and base RLS;
8. audit events for security-sensitive context changes.

### B. Academic core

1. academic terms;
2. courses;
3. sections;
4. section staff assignments;
5. students or approved student projection;
6. term/section enrollments;
7. indexes and relationship RLS.

### C. Operational slices

Adopt one reviewed slice at a time:

1. attendance;
2. evaluations;
3. gradebook;
4. materials and Storage;
5. reports;
6. certificates;
7. notifications;
8. audit log;
9. institution settings.

Each slice requires schema, permissions, policy tests, synthetic seed and
adapter acceptance before the next slice.

## 4. Staging validation matrix

Synthetic actors:

- Tenant Alpha and Tenant Beta.
- owner, admin, teacher, assistant, student, guardian, support.
- one user with memberships in both tenants.
- session A selecting Alpha and session B selecting Beta.
- active, invited, suspended and left memberships.
- active and suspended institutions.

Required tests:

- role and capability projections;
- teacher/assistant assignment scope;
- student enrollment scope;
- guardian linked-student scope;
- direct-ID cross-tenant denial;
- list filtering and object lookup equivalence;
- stale JWT and stale cookie rejection;
- disabled membership/institution denial;
- session-selection isolation across devices;
- grants plus RLS behavior;
- Storage path/object parity.

## 5. Frontend integration and cutover

1. Keep domain UI mock-backed.
2. Define server adapter interfaces matching existing view models.
3. Put real adapters behind server-side feature flags.
4. Enable one read-only slice in clean staging.
5. Compare mock and real behavior.
6. Add mutation paths only after read boundaries pass.
7. Preserve V1 routes and current DB throughout validation.
8. Decide data migration only after the retention audit.

## 6. Rollback

- Disable the adapter/feature flag.
- Return the V2 UI to mocks.
- Keep the old database and V1 runtime unchanged.
- Do not drop or mutate legacy objects.
- Fix forward in staging and rerun reconstruction/policy suites.

## 7. Drift prevention controls

- Clean rebuild in CI from migration zero.
- Migration checksum/history review.
- Schema diff against the expected staging baseline.
- No merge when policy tests fail.
- Restricted dashboard permissions.
- Explicit human approval before staging-to-production promotion.

## Status

This is an architecture strategy only.

`C35_RECOMMEND_HYBRID_CLEAN_STAGING_THEN_MIGRATE`
