STATUS: PENDING_REVIEW

# C38 Reconstruction Harness Plan

## Components of the future harness

| Component | Responsibility | Safety boundary |
|---|---|---|
| Runner script | Coordinate phases and stop on first unsafe condition | Requires explicit disposable marker; no linked/remote mode |
| Environment preflight | Verify CLI, Docker, ports, disk and approved versions | Does not start services |
| Migration apply step | Rebuild from reviewed migration directory in order | Local ephemeral target only |
| Synthetic Auth provisioning | Create runtime-only invented users/sessions | No credentials in repo or stdout |
| Synthetic seed step | Add deterministic Alpha/Beta/Gamma domain fixtures | Reject production-like identifiers |
| Schema assertion step | Compare actual objects with reviewed manifest | Unexpected objects/grants fail |
| RLS/grants test step | Execute positive/negative actor matrix | Cross-tenant or unexpected write fails |
| App check step | Run typecheck, unit tests and build | No real adapter activation |
| Evidence step | Emit redacted machine/human summaries | Allowlisted fields only |
| Cleanup/destroy step | Stop and remove only this harness instance | Verify project ID/path before removal |

## Future commands

```powershell
# FUTURE ONLY — DO NOT RUN IN C38
npx supabase start
npx supabase db reset
npx supabase test db
npm run test:db-policy
```

These are examples, not approved commands. C39 must discover exact CLI syntax
with `--help`, pin compatible versions and obtain approval before execution.
`supabase status -o env` must not be captured because it can print local
credentials.

## Inputs

- reviewed migration files;
- synthetic Auth and domain fixture definitions;
- actor/relationship matrix;
- expected schema manifest;
- expected grants/RLS manifest;
- pinned tool/container versions;
- unique disposable project identifier;
- evidence redaction allowlist.

## Outputs

- redacted reconstruction log;
- migration checksum/order report;
- schema assertion report;
- grants/RLS policy test result;
- application check result;
- failure summary without row dumps;
- cleanup confirmation;
- evidence manifest with commit and tool versions.

## State machine

`PREFLIGHT → STARTED → MIGRATED → SEEDED → ASSERTED → POLICY_TESTED →
APP_CHECKED → EVIDENCE_WRITTEN → DESTROYED`

Any failed phase jumps to `FAILED_CLEANUP_REQUIRED`; cleanup runs once against
the verified disposable identifier. Cleanup failure is itself a blocking
result.

## Failure policy

Fail immediately on:

- cross-tenant access;
- missing RLS or unexpected exposed object;
- unexpected grants, including anonymous access;
- policy recursion or helper bypass;
- stale JWT/cookie state authorizing access;
- real or legacy data;
- a secret-like value in output;
- linked/remote project configuration;
- migration drift or nondeterministic result;
- incomplete cleanup.

## Isolation controls

- Dedicated working directory and project ID per run.
- No inherited Supabase project reference.
- Explicit local host allowlist.
- No remote database URL inputs.
- No shared cleanup command such as stopping all local projects.
- Timeout and resource limits.
- Evidence directory distinct from database volumes.

## Recommended implementation shape

C39 should create small scripts with dry-run/preflight as the default and a
single explicit execution switch. Script logic should be testable without
starting containers. Migration implementation follows only after the harness
can verify inputs, redact output and target cleanup safely.

Verdict: `C38_RECONSTRUCTION_HARNESS_PLAN_DRAFTED`.
