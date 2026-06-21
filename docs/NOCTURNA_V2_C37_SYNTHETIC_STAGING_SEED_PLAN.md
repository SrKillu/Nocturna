STATUS: PENDING_REVIEW

# C37 Synthetic Staging Seed Plan

## Purpose

Provide deterministic, invented fixtures for disposable and future clean
staging databases. The seed proves authorization relationships; it does not
simulate production volume or copy legacy records.

## Rules

- Use only invented names, domains, UUIDs and academic content.
- Never reuse real emails, IDs, files, logos or student information.
- Keep credentials outside the repository and logs.
- Make domain seed idempotent and environment-gated.
- Use deterministic identifiers only within test/staging fixtures.
- Separate auth-user provisioning from ordinary SQL migration content.
- Tag every fixture as synthetic.

## Synthetic tenants

- **Alpha Institute:** active institution with the complete positive matrix.
- **Beta Institute:** active institution for cross-tenant and multi-membership
  denial tests.
- **Gamma Suspended Institute:** minimal tenant used only for lifecycle denial.

## Actor matrix

| Seed Actor | Purpose | Allowed Access | Denied Access | Notes |
|---|---|---|---|---|
| Alpha Owner | tenant administration read baseline | Alpha tenant rows | Beta rows | active owner membership |
| Alpha Admin | admin read baseline | approved Alpha rows | Beta rows and ungranted writes | admin is not owner |
| Alpha Teacher A | exact staff assignment | Alpha Section A1 | Alpha A2 and all Beta sections | assigned only to A1 |
| Alpha Assistant A | narrow assignment | Alpha Section A1 | A2/Beta and future teacher-only writes | assigned only to A1 |
| Alpha Student A | enrollment relationship | own profile projection and A1 | other students and A2/Beta | enrolled only in A1 |
| Alpha Student B | negative peer actor | own approved rows | Student A private rows | not enrolled in A1 if needed |
| Alpha Guardian A | linked-student relationship | Student A approved projection | Student B and Beta students | one active link |
| Alpha Support A | support default-deny case | explicitly approved operational projection only | academic rows without scope | no implicit broad access |
| Alpha Suspended Member | lifecycle revocation | none | all tenant rows | stale selection retained for denial test |
| Alpha Left Member | historical lifecycle | none | all tenant rows | cannot reactivate via cookie |
| Multi-Tenant User | session isolation | Alpha in session A; Beta in session B | opposite tenant per session | two active memberships |
| Beta Owner | cross-tenant control | Beta rows | Alpha rows | independent identity |
| Unauthenticated Actor | anon baseline | no core data | all core rows | no session |

## Academic fixtures

Alpha:

- active term Alpha-2026;
- closed term Alpha-2025 for historical tests;
- courses ALPHA-MATH and ALPHA-LANG;
- sections A1 and A2 in Alpha-2026;
- Teacher A and Assistant A assigned only to A1;
- Student A enrolled only in A1;
- Student B used for peer/direct-ID denial;
- Guardian A linked only to Student A.

Beta:

- active term Beta-2026;
- one course and one section;
- independent owner, teacher and student relationships.

Gamma:

- suspended institution;
- one otherwise-active membership and selection to prove institution lifecycle
  overrides the actor state.

## Session-selection fixtures

- Session A for Multi-Tenant User selects Alpha.
- Session B for the same user selects Beta.
- A revoked session-selection record proves fail-closed behavior.
- A selection pointing to a suspended membership is retained only in disposable
  tests to prove rejection.
- A selector owned by another user is submitted as a negative case.

## Seed lifecycle

1. Reconstruct empty database from future migrations.
2. Provision synthetic auth identities with a test-only mechanism.
3. Seed stable roles.
4. Seed institutions, profiles and memberships.
5. Seed per-session selections through controlled test setup.
6. Seed academic relationships.
7. Run invariants and policy tests.
8. Remove/destroy the disposable environment.

Future persistent staging refreshes require an approved cleanup/reset runbook;
C37 does not execute one.

## Prohibited seed content

- real names or email addresses;
- legacy UUIDs or external identifiers;
- production exports or transformed row samples;
- real files, logos, messages or academic results;
- passwords, tokens, JWT secrets or privileged keys;
- data presented as official academic records.

## Evidence

The test run must record only synthetic actor labels, test names and pass/fail
results. Failure diagnostics must redact credentials and avoid dumping complete
rows.

Verdict: `C37_SYNTHETIC_SEED_PLAN_DRAFTED`.
