# Nocturna · Test Suite

Automated validation of the security model required by **PROMPT 8 — Definition
of Done**. Tests are split in two tiers:

* **Unit tier** — pure, mock-based, runs offline. Validates rate limiting,
  CSRF, magic-byte file validation, the middleware decision tree and the
  grading race-condition semantics.
* **E2E tier** — talks to a real Supabase project. Validates RLS isolation
  across tenants, JWT invalidation via `session_version`, audit-log
  integrity and the full role permission matrix.

## Running

```bash
# Run everything (E2E auto-skips when creds are placeholders)
npm test

# Run only the unit tier (fast, no network)
npm run test:unit

# Run only the E2E tier (requires real creds in .env)
npm run test:e2e

# Continuous watch mode during development
npm run test:watch
```

## Required environment for E2E

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

When any of those are missing or left as `YOUR_*` placeholders, every E2E
`describe` is automatically marked `skip` via `tests/helpers/env.ts`. The unit
tier keeps running, so `npm test` always produces a signal in CI.

## Test ↔ PROMPT mapping

| Prompt test | File | Tier |
|-------------|------|------|
| T11 — Rate limiting             | `tests/unit/rate-limit.test.ts`        | unit |
| T12 — CSRF double-submit        | `tests/unit/csrf.test.ts`              | unit |
| T13 — Session expiration        | `tests/unit/middleware-auth.test.ts` + `tests/e2e/jwt-invalidation.test.ts` | unit + e2e |
| T14 — Race conditions           | `tests/unit/race-conditions.test.ts`   | unit |
| T15 — Multi-tenant integrity    | `tests/unit/middleware-auth.test.ts` + `tests/e2e/rls-isolation.test.ts`    | unit + e2e |
| T15b — Permission matrix        | `tests/e2e/permissions.test.ts`        | e2e  |
| T16 — Audit logging             | `tests/e2e/audit-log.test.ts`          | e2e  |
| T17 — JWT invalidation          | `tests/e2e/jwt-invalidation.test.ts`   | e2e  |
| T18 — File security             | `tests/unit/file-magic.test.ts`        | unit |

## Seeding

E2E tests create their own throw-away tenant per suite (`seedTenant(tag)`)
and clean up in `afterAll` via `teardownTenant`. The helper in
`tests/helpers/supabase.ts` creates an `institutions` row plus one admin,
one teacher and one student with real Supabase auth users and matching
`app_metadata` (`user_role`, `institution_id`). Parallel test files are
namespaced by a timestamped slug so they never collide.

## Extending

Add a new file under `tests/unit/` or `tests/e2e/`; vitest will auto-pick up
any `*.test.ts`. E2E suites must gate themselves with:

```ts
import { hasRealSupabase } from '../helpers/env';
const d = hasRealSupabase() ? describe : describe.skip;
```
