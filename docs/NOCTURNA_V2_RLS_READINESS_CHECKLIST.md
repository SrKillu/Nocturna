# Nocturna V2 RLS Readiness Checklist

STATUS: PENDING_REVIEW

- Date: June 21, 2026
- Base commit: `d14324b`
- Purpose: determine when a visual V2 module is ready for reviewed Supabase schema and RLS design

## Readiness rule

A module is not ready for real Supabase integration merely because its route, mock, and tests exist. It is ready only when its data contracts, read/write capabilities, tenant relationships, RLS policy matrix, indexing, audit, query behavior, and staging strategy are all approved.

## C29 planning update

- Entity and relationship contracts are drafted in `NOCTURNA_V2_DOMAIN_DATA_CONTRACTS.md` and `NOCTURNA_V2_ENTITY_RELATIONSHIP_DRAFT.md`.
- Operation contracts are drafted in `NOCTURNA_V2_DOMAIN_OPERATION_CONTRACTS.md`.
- Three first vertical-slice candidates and a recommendation are documented in `NOCTURNA_V2_FIRST_VERTICAL_SLICE_CANDIDATES.md`.
- C27/C28 explicit read capabilities are now defined and adopted for current route admission.
- No schema SQL is approved.
- No executable migration exists for C29.
- No SQL RLS policy matrix is approved.
- Every C29 entity, index and policy statement remains conceptual and `PENDING_REVIEW`.

## C30 Courses + Sections planning update

- A review-only Courses + Sections schema/RLS draft now documents probable tables, constraints, tenant paths and read policies.
- A fully commented pseudo-SQL artifact exists under `docs/sql-drafts/`; it is not a migration and must not be applied.
- Positive and negative policy cases are specified for owner, admin, assigned/unassigned staff, enrolled/unenrolled student, guardian, support, cross-institution, unauthenticated and inactive-membership actors.
- Tenant, relationship and deterministic-pagination indexes are proposed.
- A synthetic two-institution seed plan and rollback/safety notes are proposed.
- No executable migration is approved.
- No remote Supabase change occurred.
- Courses and sections remain **not ready for integration** until human review approves active-membership context, SQL, policies, projections, seed, rollback and test evidence.

## C31 review and hardening update

- C30 was reviewed against the current V2 role/capability, Courses mock and route contracts.
- A trusted active-membership DB context plan is drafted, recommending
  server-managed per-session selection plus current DB membership validation.
- Student visibility options are compared; real student data is allowed only with
  minimal students/enrollments and complete policy tests.
- A staff projection/RLS recursion plan recommends a generic label for the first
  slice and forbids private-profile or `SECURITY DEFINER` shortcuts.
- Historical visibility is drafted: archived hidden by default, closed-term
  history owner/admin-only through an explicit filter, staff/student deferred.
- Policy tests now include revocation, multi-session context, exact section scope,
  safe projections, views and historical behavior.
- C30 still has blockers and is **not approved for migration conversion**.
- No executable migration is approved and no remote Supabase change occurred.

## C32 active membership and schema reconciliation update

- A concrete active-membership DB context specification is drafted around
  `auth.uid()`, JWT `session_id`, per-session selection and current DB status.
- A future `membership_session_selections` concept is documented; its final
  name/schema/grants are not SQL-approved.
- The active-membership policy test matrix covers multi-device, selector abuse,
  revocation, inactive profile/institution, stale JWT/cookie and direct IDs.
- Existing local schema reconciliation is complete for files in the repo but
  formally `INCOMPLETE_LOCAL_ONLY`: Auth V2 runtime queries
  `institution_memberships` and `roles` that no local migration creates.
- Existing V1 courses/enrollments and tenant-wide policies conflict with the
  relationship-scoped C30 model and require a planned transition.
- `current_active_membership_id()` remains an identified blocker, now tied to the
  C32 specification rather than an unspecified placeholder.
- No executable migration is approved and no remote Supabase change occurred.

## C33 Auth V2 schema/context fix update

- Auth V2 schema inventory drafted; runtime/migrations drift is confirmed.
- Target Auth V2 contract drafted for profiles, institutions, roles,
  institution memberships and per-session selections.
- V1→V2 non-destructive transition plan drafted.
- Review-only, fully commented Auth context pseudo-SQL added under
  `docs/sql-drafts/`; it is not a migration.
- Blocker resolution map identifies what C33 reduces and what still prevents
  migration readiness.
- Capabilities remain a versioned TypeScript contract temporarily; no DB
  capability persistence is introduced.
- Courses + Sections remains blocked on Auth context, academic relationship
  entities, local DB tests, grants and remote drift confirmation.
- C33 status: blockers reduced, not migration-ready.
- No executable migration is approved and no remote Supabase change occurred.

Statuses:

- **Done:** present and usable for planning.
- **Partial:** present but requires refinement for real data.
- **Missing:** not yet defined.
- **N/A:** not required for the current module.

## Checklist criteria

| Code | Criterion |
|---|---|
| C1 | Route exists |
| C2 | Domain types exist |
| C3 | Safe mocks exist |
| C4 | Unit tests exist |
| C5 | Central route-role contract exists |
| C6 | Read capability is explicitly defined |
| C7 | Write capability is explicitly defined when applicable |
| C8 | Entity/data contract is defined |
| C9 | Institution isolation is defined |
| C10 | Relationship access is defined |
| C11 | RLS policy matrix is defined |
| C12 | Preliminary indexes are defined |
| C13 | Audit requirements are defined |
| C14 | Error/empty/loading/denied states are defined |
| C15 | Pagination, sorting, and filtering behavior is defined |
| C16 | Synthetic seed and staging strategy is defined |

## Module readiness matrix

| Module | Existing foundation (C1–C5) | Capabilities (C6–C7) | Data and policy (C8–C13) | Operations (C14–C16) | Current readiness |
|---|---|---|---|---|---|
| Courses | C1–C5 Done | C6 Done (`canViewCourses`); C7 Partial (`canManageCourses`) | C8–C13 Drafted review-only | C14 Done; C15–C16 Drafted | Not ready — human approval and executed policy evidence missing |
| Sections | C1 Missing; C2–C4 Partial through course mocks; C5 Missing | C6 Done (`canViewSections`); C7 Partial (`canManageSections`) | C8–C13 Drafted review-only | C14 Partial; C15–C16 Drafted | Not ready — no route and no executed policy evidence |
| Students | C1–C5 Done | C6 Done (`canViewStudents`, `canViewStudentProfiles`, `canViewOwnStudentProfile`); C7 Missing/narrowing needed | C8, C9, C10, C12, C13 Drafted; C11 Missing | C14 Done; C15 Drafted; C16 Missing | Not ready |
| Guardians | C1–C5 Done through guardian space | C6 Done (`canViewLinkedStudents`); C7 Missing (`canManageGuardianLinks`) | C8, C9, C10, C12, C13 Drafted; C11 Missing | C14 Done; C15 Drafted/N/A; C16 Missing | Not ready |
| Staff | C1–C5 Done | C6 Done (`canViewStaff`); C7 Partial (`canManageUsers`) | C8, C9, C10, C12, C13 Drafted; C11 Missing | C14 Done; C15 Drafted; C16 Missing | Not ready |
| Enrollments | C1–C5 Done | C6 Done (`canViewEnrollments`); C7 Missing | C8, C9, C10, C12, C13 Drafted; C11 Missing | C14 Done; C15 Drafted; C16 Missing | Not ready |
| Schedule | C1–C5 Done | C6 Done (`canViewSchedule`); C7 Missing | C8, C9, C10, C12, C13 Drafted; C11 Missing | C14 Done; C15 Drafted; C16 Missing | Not ready |
| Attendance | C1–C5 Done | C6 Done (`canViewAttendance`); C7 Missing/narrowing needed | C8, C9, C10, C12, C13 Drafted; C11 Missing | C14 Done; C15 Drafted; C16 Missing | Not ready |
| Evaluations | C1–C5 Done | C6 Done (`canViewEvaluations`); C7 Missing/narrowing needed | C8, C9, C10, C12, C13 Drafted; C11 Missing | C14 Done; C15 Drafted; C16 Missing | Not ready |
| Gradebook | C1–C5 Done | C6 Done (`canViewGradebook`, own/linked grade reads reserved); C7 Missing/narrowing needed | C8, C9, C10, C12, C13 Drafted; C11 Missing | C14 Done; C15 Drafted; C16 Missing | Not ready |
| Materials | C1–C5 Done | C6 Done (`canViewMaterials`); C7 Missing/narrowing needed | C8, C9, C10, C12, C13 Drafted; C11 and Storage policy Missing | C14 Done; C15 Drafted; C16 Missing | Not ready |
| Library | C1–C5 Done | C6 Done (`canAccessLibrary`); C7 Missing | C8, C9, C10, C12, C13 Drafted; C11 Missing | C14 Done; C15 Drafted; C16 Missing | Not ready |
| Reports | C1–C5 Done | C6 Done (`canViewReports`); C7 Missing for export/schedule | C8, C9, C10, C12, C13 Drafted; C11 Missing | C14 Done; C15 Drafted; C16 Missing | Not ready |
| Certificates | C1–C5 Done | C6 Done (`canViewCertificates`); C7 Missing/narrowing needed | C8, C9, C10, C12, C13 Drafted; C11 Missing | C14 Done; C15 Drafted; C16 Missing | Not ready |
| Notifications | C1–C5 Done | C6 Done (`canViewNotifications`); C7 Missing | C8, C9, C10, C12, C13 Drafted; C11 Missing | C14 Done; C15 Drafted; C16 Missing | Not ready |
| Audit log | C1–C5 Done | C6 Done (`canViewAuditLog`); C7 N/A except export | C8, C9, C10, C12, C13 Drafted; C11 Missing | C14 Done; C15 Drafted; C16 Missing | Not ready |
| Settings | C1–C5 Done | C6 Done (`canViewInstitutionSettings`); C7 Missing (`canManageInstitutionSettings`) | C8, C9, C10, C12, C13 Drafted; C11 Missing | C14 Done; C15 Drafted/N/A; C16 Missing | Not ready |

## Per-module approval checklist

Use this template for every module before a schema or integration PR:

- [ ] C1 — Route and direct-access boundary confirmed.
- [ ] C2 — TypeScript domain/entity contracts approved.
- [ ] C3 — Mock fixtures contain no production identifiers or secrets.
- [ ] C4 — Unit tests cover selectors, states, and authorization helpers.
- [ ] C5 — Central route-role contract includes the module.
- [ ] C6 — Read capability has an approved role matrix.
- [ ] C7 — Each write/action capability has an approved role matrix.
- [ ] C8 — Entities, identifiers, lifecycle states, constraints, and projections are documented.
- [ ] C9 — Institution isolation path is explicit.
- [ ] C10 — Assignment, ownership, enrollment, or guardian relationship access is explicit.
- [ ] C11 — `SELECT`, `INSERT`, `UPDATE`, `DELETE`, and action policy expectations are documented.
- [ ] C12 — Tenant, relationship, lookup, uniqueness, and reporting indexes are proposed.
- [ ] C13 — Audit events, retention, redaction, and before/after requirements are defined.
- [ ] C14 — Loading, empty, denied, validation, conflict, not-found, and error behavior is defined.
- [ ] C15 — Pagination, sorting, filtering, search, and maximum page sizes are defined.
- [ ] C16 — Synthetic seed, staging actors, policy tests, and cleanup strategy are defined.

## Required evidence before “ready for integration”

A module may be marked ready only when:

1. C1–C16 are Done or explicitly approved as N/A.
2. Read and write policies are separated.
3. Positive and negative policy cases exist for every relevant role and relationship.
4. Cross-institution denial is tested.
5. Direct object access is tested, not only list filtering.
6. Any Storage object path is covered by equivalent object-level policy.
7. High-risk mutations have audit and concurrency requirements.
8. The migration remains reviewable as one small domain slice.

## Current conclusion

No domain module is ready for remote Supabase integration yet. The strongest foundations are schedule, library, reports, notifications, audit log, settings, and guardian space because they already have explicit read capabilities, but each still lacks approved entity/RLS/index/audit/staging contracts.

The first academic-core readiness work should focus on courses, sections, students, guardians, and enrollments because those relationships determine the safe scope of attendance, evaluations, grades, materials, and reports.

## C34 Remote Schema Inspection Note

- Remote `public` schema inspected read-only/schema-only.
- No table rows were read and no Supabase write was performed.
- No migration is approved by this inspection.
- Auth V2 memberships, roles and session selections are absent remotely.
- The remote has broad table grants; RLS and grants must be reviewed together.
- Several RLS-enabled tables have no policy in the snapshot, while some existing
  policies are permissive or overlapping.
- Remote/local policy and schema drift blocks readiness.

Result: `C34_REMOTE_SCHEMA_DRIFT_CONFIRMED`.

Next gate: baseline reconciliation plus disposable-database RLS tests.

## C35 Rebuild Strategy Note

- No domain module is ready for real data integration.
- Auth V2 database authority remains absent.
- A clean staging baseline can reduce historical policy/grant risk.
- Clean does not mean untested: every table still needs explicit grants, RLS,
  relationship tests and cross-tenant denial.
- The current database remains legacy until retention is decided.
- Real adapters remain blocked.

Recommended posture: clean V2 staging plus synthetic policy tests, with no
production cutover until retention and migration scope are approved.

## C36 Data Retention Note

- No module is ready for real legacy data.
- Retention and ownership of current records remain unknown.
- Clean staging must use synthetic institutions, users, memberships and
  academic records.
- Real adapters remain blocked until retention/cutover decisions and DB
  authority tests are approved.
- Policy tests must not depend on copied production records.
- Any future aggregate or sample audit requires separate explicit approval.

## C37 Clean Architecture Note

- The clean Supabase V2 architecture, core schema contract and future migration
  order are drafted.
- Deny-by-default grants/RLS, per-session active membership, synthetic seed and
  database policy-test plans are documented.
- The SQL artifact is fully commented, review-only and is not a migration.
- No project was created, no SQL was executed and no real row was read or
  copied.
- No module is ready for real data: exact migration SQL, disposable
  reconstruction and executed grants/RLS evidence remain missing.
- Courses + Sections read-only remains the proposed first slice after those
  gates pass.

Next gate: a disposable database reconstruction plan and reviewable migration
draft skeletons, followed by synthetic grants/RLS test evidence.

## C38 Disposable Reconstruction Note

- The disposable reconstruction lifecycle, harness components, migration
  skeleton boundary and cleanup policy are drafted.
- Schema assertions now cover exact objects, RLS, grants, function safety,
  extensions and Data API exposure.
- Synthetic Auth fixtures, policy-suite execution and evidence redaction are
  specified.
- Six SQL skeletons are fully commented and are not migrations.
- No database was started and no policy was executed.
- No module is ready for real data because executed reconstruction and policy
  evidence still do not exist.

Next gate: implement and review a dry-run-first disposable harness, then obtain
separate approval to start local Supabase and test executable migration drafts.

## C39 Harness Implementation Note

- A dry-run-only preflight/orchestration harness now exists.
- Redaction, evidence allowlisting and target-specific cleanup planning have
  focused unit tests.
- The harness executes no SQL, service command or cleanup action.
- There is still no executed schema, grant or RLS evidence.
- No module is ready for real data or adapters.

Next gate: approved dry-run execution and evidence review, followed only later
by separate approval for local disposable Supabase execution.

## C40 Dry-run Evidence Note

- Preflight and runner were executed only in dry-run mode.
- Redacted evidence and expected blockers were captured.
- The harness failed closed on inherited `supabase/.temp` state.
- No schema, grant, RLS or policy test was executed.
- No module is ready for real data or adapters.

Next gate: an explicit local Supabase startup approval/isolation plan, or harness
hardening if that planning reveals a defect.

C40.1 stores the same redacted evidence under allowed documentation paths. It
does not add executed database-policy evidence.
