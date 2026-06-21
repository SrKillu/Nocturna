STATUS: PENDING_REVIEW

# C37 Adapter Integration Boundary

## Current state

The V2 UI remains mock-backed. C37 does not modify runtime code, endpoints,
middleware or environment configuration. Real adapters begin only after clean
database reconstruction and policy tests are approved.

## Adapter rules

- Real database access is server-side.
- Browser code never receives privileged credentials.
- The client cannot supply authoritative `institution_id`, role, capability,
  membership, assignment or enrollment scope.
- Active membership is resolved from the authenticated user and current
  Supabase session on the server.
- Direct object IDs are authorized server-side and by RLS.
- Adapters return stable view models; raw database rows are not the UI contract.
- Feature flags select mock versus real adapters per environment/module.
- Missing flags or configuration fail closed to mock/disabled behavior, never
  production by accident.
- Logs contain correlation and error class, not tokens or full sensitive rows.

## Request flow

1. Server validates Auth V2 session.
2. Server resolves active membership for the current `session_id`.
3. Server checks route capability.
4. Adapter queries through the authenticated RLS context.
5. RLS validates tenant and relationship scope.
6. Adapter maps minimal rows into an existing V2 view model.
7. UI renders the established state contract.

No step trusts a client-selected tenant without server/database validation.

## UI state contract

| State | Adapter meaning | UI behavior |
|---|---|---|
| Loading | server/streamed data pending | existing skeleton/loading state |
| Empty | authorized query returned no rows | contextual empty state, not an error |
| Denied | authenticated relationship exists but operation capability is absent | controlled denied state |
| Safe not-found | row absent or outside permitted scope | identical non-disclosing not-found response |
| Problem | profile/membership/institution context invalid or service unavailable | controlled recovery/problem state |

## First slice: Courses + Sections read-only

Recommended scope:

- list authorized courses/sections;
- read one authorized course/section workspace projection;
- preserve deterministic sorting/pagination;
- owner/admin same-institution access;
- exact teacher/assistant assignment access;
- student access only after enrollment policies pass;
- no guardian/support access unless explicitly approved;
- no create, edit, archive, assignment or enrollment mutation.

## Feature flags

Flags should be server-evaluated and environment-specific, for example:

- global real-adapter enablement;
- Courses + Sections read adapter enablement;
- actor/tenant allowlist only in synthetic staging if needed.

Flags do not bypass capability or RLS. Disabling a flag must restore mock or
controlled unavailable behavior without data mutation.

## Legacy isolation

- Legacy rows and IDs are not queried by the clean adapter.
- V1 profile role/institution fields are not final V2 authority.
- Legacy and clean clients are configured separately.
- No dual-write is introduced in the read-only slice.
- Any future compatibility adapter requires a separate retention/migration
  decision and tests.

## Write gate

No write adapter is allowed until:

- read grants/RLS tests pass;
- operation-specific write capabilities are approved;
- mutation constraints and concurrency behavior are designed;
- audit events are defined;
- positive and negative write policies pass;
- staging recovery/forward-fix procedure is demonstrated.

Verdict: `C37_ADAPTER_BOUNDARY_DRAFTED`.
