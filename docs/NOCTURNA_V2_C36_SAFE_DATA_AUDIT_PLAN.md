STATUS: PENDING_REVIEW

# C36 Safe Future Data Audit Plan

## Principle

Use the least access necessary. Each level requires a separate, explicit scope
and approval. C36 operates at Level 0 only.

## Level 0 — No row access

Allowed:

- owner answers;
- schema-only evidence;
- data-domain classification;
- retention/legal questions;
- documentation and decision gates.

Not allowed:

- counts, samples, exports or content review.

Current status: approved and completed by C36.

## Level 1 — Aggregate counts only

Potential future scope:

- count records by explicitly approved table;
- count Storage objects by approved bucket;
- no row content;
- no PII values;
- no grouping that can identify a person;
- results reported as aggregate numbers only.

Requirements:

- explicit owner authorization;
- exact table/bucket allowlist;
- approved read-only mechanism;
- query review;
- no secrets in chat or reports;
- access log and deletion of temporary outputs.

## Level 2 — Minimal redacted sample review

Use only if counts and owner knowledge cannot classify a domain.

Controls:

- minimum necessary records/columns;
- redact names, emails, IDs, message bodies and file paths;
- no unrestricted `SELECT *`;
- secure reviewer and local handling;
- documented purpose and disposal;
- explicit owner/privacy approval.

## Level 3 — Export or migration

This is a separate project, not an audit command.

Requirements:

- formal export scope;
- source/target mapping;
- encryption and access control;
- checksums/count reconciliation;
- PII handling and audit logs;
- retry/idempotence plan;
- rejected-row process;
- retention/deletion schedule;
- rollback and owner sign-off.

## Recommended next posture

Remain at Level 0 until the owner questionnaire is complete.

Do not interpret permission to design clean staging as permission to inspect,
copy or migrate legacy data.
