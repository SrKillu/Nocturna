STATUS: PENDING_REVIEW

# C38 Evidence and Redaction Plan

## Evidence principles

- Allowlist what may be emitted; do not redact an unrestricted dump afterward.
- Use synthetic actor labels, test IDs and object categories only.
- Keep evidence sufficient to reproduce the commit/tooling context.
- Treat cleanup confirmation as required evidence.

## Prohibited output

- tokens, JWTs or API keys;
- passwords or password-like values;
- database URLs and connection strings;
- real names, emails, IDs or files;
- full row dumps;
- complete environment variables;
- local secret-file contents;
- remote project references.

## Evidence manifest

| Field | Allowed value |
|---|---|
| Repository commit | full commit hash |
| Harness version | source commit/path |
| CLI/container versions | public version identifiers |
| Migration result | ordered names/checksums, no SQL dump |
| Schema assertions | assertion ID and pass/fail |
| Policy tests | suite/test ID, synthetic actor label, pass/fail |
| Application checks | command name, exit result, aggregate test counts |
| Failure summary | category and redacted diagnostic |
| Cleanup | verified disposable project ID hash/label and status |

## Redaction pipeline

1. Commands avoid secret-bearing output modes.
2. Child-process output passes through a redaction filter.
3. Only allowlisted structured fields enter final reports.
4. A secret-pattern scanner examines evidence artifacts.
5. Any match quarantines the artifact and fails the run.
6. Human review checks the manifest before sharing.

## Failure summaries

Report:

- suite and assertion identifier;
- expected versus observed access class;
- synthetic tenant/actor labels;
- affected schema/table category;
- correlation ID.

Do not report:

- raw token/session value;
- full SQL result;
- full row contents;
- connection parameters.

## Retention

Local disposable evidence may be retained as text/JSON artifacts after
redaction. Raw process logs and ephemeral credentials are deleted with the
environment. CI artifact retention requires a separately approved duration.

Verdict: `C38_EVIDENCE_REDACTION_PLAN_DRAFTED`.
