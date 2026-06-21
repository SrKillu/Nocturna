STATUS: PENDING_REVIEW

# C37 RLS and Grants Architecture

## Security posture

RLS and SQL grants form one authorization boundary. New tables start with no
browser mutation grants and no permissive catch-all policy. A capability can
permit an operation class, but row access still requires current tenant and
relationship authority.

## Context resolution

The protected path resolves, in order:

1. `auth.uid()` and JWT `session_id`;
2. active global profile;
3. active per-session selection;
4. active membership and allowed institution lifecycle;
5. current RoleKey/capability;
6. exact assignment, enrollment or guardian relationship;
7. target row tenant consistency.

Any missing or inconsistent step returns false/NULL and access is denied.

## Grants posture by table group

| Table group | SELECT | INSERT | UPDATE | DELETE | Browser boundary |
|---|---|---|---|---|---|
| Institutions/profiles | Minimal authenticated projections | None initially | Narrow reviewed server flow later | None | anon denied |
| Roles | Minimal authenticated reference read if runtime needs it | None | None | None | stable catalog |
| Memberships/selections | Self/context read through controlled interface | No direct browser insert | Selection change only via reviewed server flow | None; revoke by lifecycle | no arbitrary tenant selection |
| Terms/courses/sections | Relationship-scoped authenticated read | None in first slice | None in first slice | None | read-only adapter first |
| Staff/students/guardians/enrollments | Minimal relationship projections | None initially | None initially | None | sensitive peer enumeration denied |
| Audit events | Narrow projection for approved actors | No client insert | None | None | trusted server/DB emission only |
| Storage objects | Private object read only after domain policy | No uploads initially | None | None | no public bucket assumed |

The operational automation boundary may use elevated credentials only in a
controlled server/job context. It must not become a general application bypass,
and no privileged key may enter browser bundles, logs or documentation.

## Relationship rules

- **Owner/admin:** same active institution plus operation capability.
- **Teacher:** exact active `section_staff` assignment.
- **Assistant:** exact active assignment, with narrower write rights than
  teacher when writes are introduced.
- **Student:** own active student link plus active enrollment in target section.
- **Guardian:** active guardian membership plus active link to the target
  student; receives only approved projections.
- **Support:** denied by default; only explicit scoped support assignment and
  approved capability can grant access.
- **Unauthenticated:** denied to all core tenant data.
- **Suspended/left/inactive:** denied even if JWT/cookie is stale.

## Actor-operation test matrix

| Actor | Relationship | Table | Operation | Expected Access | Test Case |
|---|---|---|---|---|---|
| owner Alpha | active Alpha membership | courses/sections Alpha | SELECT | Allow | list and direct Alpha IDs |
| owner Alpha | no Beta membership | courses/sections Beta | SELECT | Deny | direct Beta UUID |
| admin Alpha | active Alpha membership | memberships Alpha | UPDATE | Deferred/deny | no browser mutation grant |
| teacher Alpha | assigned Section A1 | Section A1/course | SELECT | Allow | exact assignment |
| teacher Alpha | unassigned Section A2 | Section A2 | SELECT | Deny | direct sibling-section UUID |
| assistant Alpha | assigned Section A1 | Section A1 | SELECT | Allow | exact active assignment |
| assistant Alpha | revoked assignment | Section A1 | SELECT | Deny | stale JWT after revocation |
| student Alpha | enrolled Section A1 | Section A1/course | SELECT | Allow | own active enrollment |
| student Alpha | not enrolled Section A2 | Section A2 | SELECT | Deny | direct UUID and list filtering |
| guardian Alpha | linked Student A | approved Student A projection | SELECT | Allow | active verified link |
| guardian Alpha | unlinked Student B | Student B/sections | SELECT | Deny | direct UUID |
| support Alpha | no explicit scope | academic core | SELECT | Deny | tenant membership alone insufficient |
| unauthenticated | none | all core tables | any | Deny | anon grants and direct REST |
| suspended member | stale token/selection | all Alpha tables | SELECT | Deny | lifecycle changed after token issuance |
| session A | selects Alpha | Alpha tables | SELECT | Relationship-dependent allow | current session selection |
| session B | selects Beta | Alpha tables | SELECT | Deny | device/session isolation |

## Direct object and error behavior

List policies filter unauthorized rows. Direct object reads must not reveal
whether another institution owns an identifier. Server adapters map both absent
and out-of-scope rows to the same safe not-found state where disclosure would
leak tenant existence. A separate denied state is used only when the actor is
known to possess the object relationship but lacks an operation capability.

## Stale state rejection

- Tenant cookies are selectors, never authority.
- JWT role/capability hints are not final authority.
- Selection must match current `session_id` and user.
- Profile, membership, institution, assignment, enrollment and link lifecycle
  are checked from current rows.
- Revocation takes effect without waiting for client state refresh.

## Avoiding RLS recursion

- Context helpers depend only on identity/context tables.
- Context policies do not query academic tables.
- `section_staff` policies do not call helpers that query `section_staff`.
- Enrollment policies do not call helpers that query enrollments.
- Relationship helpers return booleans/IDs, not broad rows.
- Each helper and table policy receives an isolated recursion test.
- Prefer security invoker and simple SQL predicates.

## Security definer policy

`SECURITY DEFINER` is an exception, not the default. It may be considered only
when a private table cannot be queried safely with invoker rights and the
security property cannot be expressed otherwise.

Required controls:

- function owned by a dedicated non-login owner;
- private schema, excluded from exposed API schemas;
- fixed, minimal `search_path`;
- schema-qualified object references;
- revoke execute from `PUBLIC`;
- grant execute only to the exact runtime role;
- minimal scalar inputs/outputs;
- no dynamic SQL;
- no general row-returning bypass;
- abuse, cross-tenant and recursion tests;
- mandatory security review and audit event for sensitive state changes.

## Storage boundary

Storage remains deferred. Future object policies must:

- use private buckets;
- derive tenant and relationship from database state;
- prevent path-prefix guessing from granting authority;
- test list, read, upload, replace and remove separately;
- deny orphaned or cross-tenant metadata;
- never use a browser service credential.

## Exit criteria

- Every table has explicit grants and policies per operation.
- All negative actors and direct IDs are tested.
- Multi-session and lifecycle revocation pass.
- No recursion or elevated helper bypass exists.
- Query plans remain acceptable with policy predicates.
- Human review approves the exact SQL.

Verdict: `C37_RLS_AND_GRANTS_ARCHITECTURE_DRAFTED`.
