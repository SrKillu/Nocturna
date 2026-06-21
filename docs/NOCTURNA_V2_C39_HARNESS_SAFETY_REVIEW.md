STATUS: PENDING_REVIEW

# C39 Harness Safety Review

## Review conclusion

The C39 implementation is appropriate for dry-run-only planning and unit
testing. It is not approved to start a disposable database.

## Controls

| Area | Control | Result |
|---|---|---|
| Remote blocking | remote mode false; no network/external command code | Pass |
| Approved checkout | canonical absolute repo root check | Pass |
| Forbidden commands | normalized planned-command denylist | Pass |
| Forbidden paths | exact/descendant path denylist | Pass |
| Linked state | `supabase/.temp` existence blocks | Pass |
| `.env` handling | existence only; no content reads | Pass |
| Secrets | text/object redaction and allowlisted evidence | Pass |
| SQL | no client, query or process execution code | Pass |
| Supabase startup | command appears only in denylist/docs | Pass |
| Cleanup | plan only; exact target ID/path required | Pass |
| Generic destruction | stop-all/delete-all/prune patterns rejected | Pass |
| Tests | 25 pure unit tests | Pass |

## Important limitations

- Pattern-based redaction is defense in depth, not permission to ingest raw
  logs.
- The canonical root is intentionally machine-specific for this checkout.
- Filesystem checks detect existence but do not prove process/network isolation.
- No process-spawn wrapper exists yet because C39 executes nothing.
- No evidence file writer exists yet.
- Tool versions are placeholders in the simulated manifest.
- The runner has not been executed as a CLI in C39.
- Cleanup actions are text plans and have not been mapped to safe commands.

## Current Supabase considerations

- Current CLI documentation confirms local start/reset/test commands can create,
  reset or query local state, so C39 does not invoke them.
- CLI status environment output can expose local credentials and is excluded.
- Current platform defaults increasingly require explicit grants separately
  from RLS; future assertions must test both.
- CLI/container/Postgres versions must be pinned before executable testing.

## Required next hardening

C40 should execute the runner only in dry-run mode, capture redacted output,
confirm the expected blocker for inherited Supabase state and review whether
preflight needs stronger isolation checks. It must not start services.
