STATUS: PENDING_REVIEW

# C38 Synthetic Auth Fixture Strategy

C38 does not create users.

## Actor coverage

Future runtime provisioning creates invented actors for:

- Alpha owner, admin, teacher, assistant, student, guardian and support;
- Beta owner and relationship controls;
- Gamma actor attached to a suspended institution;
- one multi-membership Alpha/Beta user;
- session A selecting Alpha and session B selecting Beta;
- suspended and left memberships;
- inactive profile and revoked selection cases.

## Identity rules

- Use reserved synthetic domains such as `example.test`.
- Never reuse a real name, email, password, UUID or legacy identifier.
- Actor labels are stable; credentials are ephemeral.
- Auth IDs may be deterministic only inside an isolated test fixture if the
  provisioning mechanism safely supports it.
- Domain rows reference provisioned Auth IDs through an explicit fixture map.

## Credential handling

- Generate credentials at runtime.
- Keep them in memory or a local-only ignored file with restrictive access.
- Never commit credentials or include them in evidence.
- Never echo command arguments containing credentials.
- Redact token-like, password-like and connection-string values.
- Delete local-only credential material during cleanup.

## Session fixtures

- Create independent session identifiers for the multi-membership actor.
- Bind selection A to Alpha and selection B to Beta.
- Create stale/revoked state through controlled fixture transitions.
- Never forge client claims as the only authority test; current DB rows must
  determine the outcome.

## Provisioning boundary

Synthetic Auth provisioning is distinct from schema migrations and stable role
seed. It may use future test tooling against the verified disposable target
only. No remote admin API or linked project is allowed in local reconstruction.

## Cleanup

- End sessions if the local Auth service supports it.
- Remove ephemeral credential files.
- Destroy the complete disposable project/volumes.
- Confirm no fixture process or container remains.
- Record only actor labels and cleanup status.

## Staging difference

Future clean staging may retain synthetic users, but requires separate owner
approval, managed secrets and a reset/revocation runbook. Local disposable
fixtures do not imply staging authorization.

Verdict: `C38_SYNTHETIC_AUTH_FIXTURE_STRATEGY_DRAFTED`.
