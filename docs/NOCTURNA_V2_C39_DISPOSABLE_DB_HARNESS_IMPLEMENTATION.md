STATUS: PENDING_REVIEW

# C39 Disposable DB Harness Implementation

## Summary

C39 implements a safe, testable scaffold for the future disposable database
workflow. It is permanently dry-run in this batch and executes no external
database command.

Verdict: `C39_DISPOSABLE_DB_HARNESS_IMPLEMENTED_DRY_RUN_ONLY`.

## Implemented

- immutable safe-default configuration;
- approved-root and planned command/path preflight;
- metadata-only detection of `.env*` and `supabase/.temp`;
- string/object redaction utilities;
- allowlisted evidence manifest builder;
- exact-target cleanup planning;
- simulated phase runner;
- 25 focused unit tests.

## Not implemented

- Supabase service startup/shutdown;
- SQL or migration execution;
- Docker cleanup;
- remote/project access;
- synthetic Auth creation;
- evidence file emission;
- schema/RLS execution;
- runtime adapters or production changes.

## Scripts

| File | Responsibility |
|---|---|
| `harness-config.ts` | safe defaults, forbidden commands/paths, phases and allowlists |
| `preflight.ts` | pure preflight checks and redacted CLI JSON |
| `redaction.ts` | redact tokens, credentials, URLs, emails and secret-like values |
| `evidence.ts` | build and validate allowlisted dry-run evidence |
| `cleanup-plan.ts` | plan exact-target cleanup without executing it |
| `run-harness.ts` | orchestrate simulated phases only |
| `README.md` | safety and future usage boundary |

## Safe defaults

- `dryRun` is always `true`.
- Remote mode is always disabled.
- Missing `--dry-run` does not enable execution.
- Planned forbidden commands and paths block preflight.
- Existing `supabase/.temp` blocks future execution planning.
- Existing `.env*` creates a warning; contents are never read.

## Redaction and evidence

Evidence accepts only approved fields. All text is redacted before inclusion.
Unknown fields such as raw environment objects are rejected. The harness does
not automatically write evidence in C39.

## Cleanup

Cleanup is a plan of target-specific actions with a target ID, absolute path,
safety check and dry-run label. Generic stop-all, delete-all, volume-prune and
parent-directory actions are rejected.

## Tests

Five suites cover configuration, preflight, redaction, evidence and cleanup.
They execute pure/local logic and do not start Supabase or invoke external
commands.

## Future execution

After human approval, C40 may run only the dry-run runner to capture redacted
evidence. Starting local Supabase remains a later, separate approval.

## Approval still required

- approval to execute the dry-run CLI in C40;
- review of actual dry-run blockers and evidence;
- separate approval before any local Supabase startup;
- later approval for executable migrations and policy tests.
