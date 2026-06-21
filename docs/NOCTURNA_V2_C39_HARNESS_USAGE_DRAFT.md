STATUS: PENDING_REVIEW

# C39 Harness Usage Draft

## Future-only commands

```powershell
# FUTURE ONLY — DO NOT RUN WITHOUT APPROVAL
npx tsx scripts/disposable-db/preflight.ts --dry-run --json
npx tsx scripts/disposable-db/run-harness.ts --dry-run --json
npx tsx scripts/disposable-db/run-harness.ts --dry-run --explain
```

C39 does not run these commands. `tsx` already exists in the repository; no
package change is required.

## Modes

- `--dry-run`: explicit statement of the only supported mode.
- `--json`: structured redacted output.
- `--explain`: marks the result for expanded human explanation.
- no flag: still dry-run; there is no execution mode.

## Output

The runner reports:

- preflight checks, warnings and blockers;
- planned phases;
- planned migration skeleton names;
- assertion and policy-suite IDs;
- application check names;
- target-specific cleanup plan;
- evidence validation;
- a statement that nothing was executed.

## Expected local blocker

If `supabase/.temp` exists, preflight blocks. This is intentional because linked
or inherited local state must be isolated before any future executable batch.
The harness never reads the files inside that directory.

## Safety

- `.env*` content is never read.
- No external process is spawned.
- No SQL or Supabase command is executed.
- No file or Docker resource is removed.
- Output passes through redaction.
- Exit code is nonzero when blockers exist.

## Still prohibited

- Supabase start/stop/reset/test;
- migrations or SQL;
- remote/project access;
- real data;
- generic cleanup;
- adapters, deployment and production.
