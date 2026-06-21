# Nocturna V2 Courses + Sections Schema/RLS Draft

STATUS: PENDING_REVIEW

## 1. Executive summary

This is a review-only design for the first real Nocturna V2 data slice: **Courses + Sections read-only**. No SQL was executed, no migration was created or applied, and no remote Supabase project was accessed.

The draft defines probable PostgreSQL entities, constraints, indexes, tenant relationships, conceptual RLS policies, policy-test actors, synthetic staging seed, rollback notes, and future adapters for `/v2/courses` and `/v2/courses/[courseId]`.

The companion file under `docs/sql-drafts/` is fully commented pseudo-SQL. It is not an executable migration and must not be copied into `supabase/migrations/` without human review, reconciliation with the existing schema, local verification, policy tests, and explicit approval.

## 2. Scope

### Included

- `institutions`
- `profiles`
- `memberships`
- `academic_terms`
- `courses`
- `sections`
- `section_staff`
- minimal `students` and `enrollments` only to preserve the current student course visibility contract
- read-only list/detail projections for courses and embedded sections
- conceptual RLS, indexes, seed and policy tests

### Explicitly excluded

- Course or section writes.
- Staff-assignment mutations.
- Enrollment mutations.
- Student profiles or sensitive roster details.
- Attendance, evaluations, gradebook, materials and reports.
- New endpoints, server actions or runtime adapters.
- UI real-data integration.
- Remote Supabase access, migration application, deploy or production.

## 3. Target V2 routes and current states

| Route | Current behavior | Future read contract |
|---|---|---|
| `/v2/courses` | Mock-backed list; search; status, level and category filters; empty/filtered-empty; denied/problem states | Bounded list of courses visible through active institution, staff assignment, or student enrollment |
| `/v2/courses/[courseId]` | Mock-backed workspace; loading; denied/problem; safe not-found | One authorized course with visible sections, public staff summary and safe aggregates |

The workspace currently contains roster, evaluation, material and work-queue previews. C30 does not authorize those domains. A first real adapter should either keep those panels on explicit mock/demo adapters or return controlled empty/unavailable states until their own contracts are approved.

## 4. Capabilities

- `canViewCourses`: route and course projection read gate.
- `canViewSections`: section projection read gate.
- `canManageCourses`: retained as a future write capability; it must not grant route read by itself.
- `canManageSections`: retained as a future write capability; it must not grant route read by itself.

Capability is necessary but not sufficient. RLS also requires current active membership and an approved row relationship.

## 5. Scope decision: student visibility

C30 includes minimal `students` and `enrollments` because the current route-role contract permits students to view courses/workspaces. Excluding enrollment relationships would either break the effective role matrix or force unsafe institution-wide student visibility.

The minimal records contain only:

- student identity key, institution, optional authenticated profile link, code and status;
- enrollment identity, institution, student, section, term and status.

No student profile, guardian link, attendance, grade, note, contact or roster-detail contract is included.

## 6. Entity design

### 6.1 `institutions`

- Purpose: root tenant.
- Columns: opaque `institution_id`, code, display name, status, locale, timezone, created/updated/archived timestamps.
- PK: opaque UUID candidate.
- Isolation: direct root for every slice record.
- Sensitive fields: legal/contact details are intentionally excluded.
- Lifecycle: `provisioning`, `active`, `suspended`, `archived`.
- Uniqueness: normalized institution code.
- Indexes: status; normalized code unique.
- Audit: lifecycle changes.
- Delete behavior: archive; no cascade delete of academic history.

### 6.2 `profiles`

- Purpose: application identity linked to Supabase Auth.
- Columns: `profile_id`, `auth_user_id`, display name, status, timestamps.
- PK/FK: opaque PK; unique FK to `auth.users`.
- Isolation: not tenant-owned alone; access derives through memberships.
- Sensitive fields: auth identifier and display name.
- Lifecycle: `active`, `inactive`, `archived`.
- Indexes: unique auth user; status.
- Audit: status and auth linkage.
- Delete behavior: archive.

### 6.3 `memberships`

- Purpose: a profile’s role within an institution.
- Columns: `membership_id`, `institution_id`, `profile_id`, `role_key`, status, effective dates, session version, timestamps.
- FKs: institution and profile; role representation must reconcile with the existing Auth V2 model.
- Isolation: authoritative tenant relationship.
- Sensitive fields: role, status and revocation/session metadata.
- Lifecycle: `invited`, `active`, `suspended`, `revoked`, `expired`.
- Uniqueness: reviewed active-membership rule per institution/profile/role.
- Indexes: profile/status, institution/role/status, institution/profile/status.
- Audit: every role/status transition.
- Delete behavior: revoke/archive.

### 6.4 `academic_terms`

- Purpose: institution academic period.
- Columns: `academic_term_id`, institution, code, name, start/end dates, status, timestamps.
- FKs: institution.
- Isolation: direct institution.
- Lifecycle: `planning`, `active`, `closed`, `archived`.
- Constraints: start date not after end date; code non-empty.
- Uniqueness: `(institution_id, normalized_code)`.
- Indexes: institution/status/start date; institution/end date.
- Audit: activation and closure.
- Delete behavior: archive.

### 6.5 `courses`

- Purpose: institution course catalog definition.
- Columns: `course_id`, institution, code, name, description, level, category, status, timestamps, archived timestamp.
- FKs: institution.
- Isolation: direct institution plus policy relationship.
- Sensitive fields: generally low; descriptions may contain internal context and should remain bounded.
- Lifecycle: `planning`, `active`, `completed`, `archived`.
- Constraints: non-empty code/name; reviewed level/category/status values.
- Uniqueness: `(institution_id, normalized_code)`, allowing the same code in different institutions.
- Indexes:
  - institution/status/name/id for list pagination;
  - institution/status/code;
  - institution/level/category/status;
  - normalized name/code search index only after measured query selection.
- Audit: create/status/archive and future metadata changes.
- Delete behavior: archive; restrict destructive deletion when sections exist.

### 6.6 `sections`

- Purpose: term-specific course offering/group.
- Columns: `section_id`, institution, course, academic term, code, display name, level label source, capacity, room label source, schedule label source, status, timestamps, archived timestamp.
- FKs: institution, course and academic term.
- Isolation: direct institution must match course and term institution.
- Sensitive fields: capacity and room are operational, not public.
- Lifecycle: `planning`, `open`, `active`, `completed`, `cancelled`, `archived`.
- Constraints: capacity non-negative; code non-empty; cross-entity institution equality must be enforced by schema design/validated composite references or trusted write path.
- Uniqueness: `(institution_id, academic_term_id, course_id, normalized_code)`.
- Indexes: institution/course/term/status; course/status; term/status; institution/status/code/id.
- Audit: capacity, status, course/term binding and archive.
- Delete behavior: archive/cancel.

### 6.7 `section_staff`

- Purpose: staff membership assignment to a section.
- Columns: `section_staff_id`, institution, section, membership, assignment role, status, effective dates, timestamps.
- FKs: institution, section and membership.
- Isolation: all three must resolve to the same institution.
- Sensitive fields: expose only display name and assignment role in course projection; no contact/HR data.
- Lifecycle: `planned`, `active`, `ended`, `revoked`.
- Constraints: valid dates; membership role must be teacher/assistant for this slice.
- Uniqueness: one active assignment for `(section_id, membership_id, assignment_role)`.
- Indexes: section/status/membership; membership/status/section; institution/status.
- Audit: assign/end/revoke.
- Delete behavior: end/revoke; preserve history.

### 6.8 Minimal `students`

- Purpose: authenticated student relationship anchor only.
- Columns: `student_id`, institution, optional profile, student code, status, timestamps.
- FKs: institution and optional profile.
- Isolation: direct institution.
- Sensitive fields: no profile/contact data in this slice.
- Lifecycle: `active`, `inactive`, `withdrawn`, `graduated`, `archived`.
- Uniqueness: `(institution_id, normalized_student_code)`; optional active profile uniqueness.
- Indexes: profile/status; institution/status.
- Audit: linkage/status.
- Delete behavior: archive.

### 6.9 Minimal `enrollments`

- Purpose: student-to-section relationship for course/section read visibility.
- Columns: `enrollment_id`, institution, student, section, academic term, status, effective dates, timestamps.
- FKs: institution, student, section and term.
- Isolation: all referenced records must share institution; term must match section term.
- Sensitive fields: only existence/count is projected here.
- Lifecycle: `pending`, `active`, `suspended`, `completed`, `withdrawn`, `rejected`.
- Uniqueness: reviewed rule preventing duplicate active enrollment for student/section/term.
- Indexes: student/status/section; section/status/student; institution/status; term/status.
- Audit: every future transition, although no mutation is in C30.
- Delete behavior: terminal transition/archive, never destructive deletion.

## 7. Tenant isolation model

### Trusted current membership

Before implementation, Auth V2’s selected `activeMembership` must have a database-visible, tamper-resistant representation. C30 uses a conceptual helper named `current_active_membership_id()` only as a placeholder.

It must:

- resolve from trusted server/database state;
- bind to `auth.uid()`;
- require membership status `active`;
- never trust `institution_id`, role, capability or membership ID from arbitrary client input;
- handle multi-device membership selection explicitly;
- avoid editable `user_metadata`;
- define freshness/revocation behavior.

Until this decision is approved, the SQL draft cannot become a migration.

### Row rules

| Actor | Course visibility | Section visibility |
|---|---|---|
| Owner/admin | Same institution as active membership | Same institution as active membership |
| Assigned teacher/assistant | Course with at least one active assigned section | Assigned active section only |
| Unassigned teacher/assistant | Denied, including same institution | Denied |
| Enrolled student | Course with at least one active enrollment in a visible section | Active enrolled section only |
| Unenrolled student | Denied | Denied |
| Guardian/support | Denied | Denied |
| Cross-institution actor | Denied even with direct ID | Denied |
| Unauthenticated / no active membership | Denied | Denied |

Course-level access for staff assigned to one section does not imply access to all sections. Course detail must filter its embedded section collection independently.

## 8. Query contracts

### 8.1 Course list

Input:

- Active membership from trusted session context.
- `query`: optional normalized search over course name/code and permitted public staff display names.
- `status`, `level`, `category`, `academicTermId`: optional filters.
- `sort`: `name_asc` default, `code_asc`, `recent_desc`.
- Opaque cursor and `limit`: default 25, maximum 100.

Deterministic ordering:

- Name sort: normalized name, normalized code, `course_id`.
- Code sort: normalized code, `course_id`.
- Recent sort: `updated_at desc`, `course_id desc`.

Projection:

- Course ID, name, code, status, level/category keys and labels.
- Visible section summary.
- Assigned-staff display summary only after a separate safe projection is approved; otherwise use a generic label rather than reading private profiles.
- Safe active-enrollment count only for sections visible to the actor.
- Schedule/location labels derived from visible sections.
- `nextAction` derived in the application; not persisted as source of truth.

States:

- Empty collection: successful empty result.
- Filtered empty: successful empty result with applied filters.
- Denied/no membership: controlled denied/session problem.
- Cross-tenant identifiers are irrelevant to list queries and must never broaden tenant scope.

### 8.2 Course detail/workspace

Input:

- Opaque `course_id`.
- Trusted active membership context.

Projection:

- Course catalog fields.
- Visible sections only.
- Active/closed term labels derived from terms.
- Staff summary limited to an approved public display projection. The first adapter may use a generic “Equipo docente” label rather than broaden profile access.
- Safe enrollment count aggregate, not student identities.
- No roster, evaluations, materials, attendance, grades or private notes in the first real slice.

Behavior:

- Unauthorized and nonexistent IDs produce the same safe not-found response at the server boundary.
- Archived courses are hidden by default; explicit historical visibility is an open decision.
- A staff assignment to one section returns that course plus only the assigned section.
- A student enrollment returns that course plus only enrolled sections.

### 8.3 Embedded section projection

Fields:

- Section ID, code/display name, course ID, term ID/name, status, capacity, optional safe room/schedule labels, public staff summary and safe enrollment count.

There is no dedicated V2 section route in C30. Section detail remains an internal projection contract.

## 9. Conceptual RLS policy matrix

All exposed tables require RLS. `TO authenticated` alone is never sufficient.

| Table | Owner/admin | Teacher/assistant | Student | Guardian/support | Cross-tenant |
|---|---|---|---|---|---|
| `courses` SELECT | Active same-institution membership | `EXISTS` active `section_staff` on any active/allowed section in course | `EXISTS` active enrollment on any active/allowed section in course | Deny | Deny |
| `sections` SELECT | Active same-institution membership | Active assignment to that section | Active enrollment in that section | Deny | Deny |
| `academic_terms` SELECT | Terms referenced by same-institution visible scope | Terms referenced by assigned visible sections | Terms referenced by enrolled visible sections | Deny | Deny |
| `section_staff` SELECT | Same-institution public assignment projection | Own assignment and assignments required for visible course summary, subject to projection | Public staff summary for enrolled section only, if approved | Deny | Deny |
| `students` SELECT | Not needed for course projection except controlled aggregate path | Deny direct student rows in C30 | Own minimal relationship only if required by policy plumbing | Deny | Deny |
| `enrollments` SELECT | Not exposed as general enrollment rows by this slice | Existence for assigned section only through policy-safe aggregate | Own active enrollment relationship | Deny | Deny |

Implementation should prefer security-invoker queries/views or server-side composition that preserves base-table RLS. No `SECURITY DEFINER` shortcut is approved.

## 10. Policy test matrix

| Actor | Course list | Own institution course ID | Same institution unassigned course | Cross-institution direct ID | Section visibility |
|---|---|---|---|---|---|
| Owner | Allow institution scope | Allow | Allow | Deny/safe not-found | All institution-visible sections |
| Admin | Allow institution scope | Allow | Allow | Deny/safe not-found | All institution-visible sections |
| Assigned teacher | Assigned courses | Allow assigned | Deny | Deny/safe not-found | Assigned sections only |
| Unassigned teacher | Empty | Deny | Deny | Deny | None |
| Assigned assistant | Assigned courses | Allow assigned | Deny | Deny/safe not-found | Assigned sections only |
| Unassigned assistant | Empty | Deny | Deny | Deny | None |
| Enrolled student | Enrolled courses | Allow enrolled | Deny | Deny/safe not-found | Enrolled sections only |
| Unenrolled student | Empty | Deny | Deny | Deny | None |
| Guardian | Empty/denied by route | Deny | Deny | Deny | None |
| Support | Empty/denied by route | Deny | Deny | Deny | None |
| Cross-institution owner/admin | Own institution only | Own only | N/A | Deny/safe not-found | Own only |
| Unauthenticated | Deny | Deny | Deny | Deny | None |
| No active membership | Deny | Deny | Deny | Deny | None |

Additional cases:

- Repeated course code across institutions remains isolated.
- Archived course hidden by default.
- Closed term behavior tested according to approved historical rule.
- Revoked assignment/enrollment immediately denies.
- Cursor cannot be reused to escape filters or tenant.
- Every sort remains deterministic.
- Nonexistent and unauthorized detail produce indistinguishable public behavior.

## 11. Index plan

| Access path | Candidate index |
|---|---|
| Resolve profile from authenticated user | Unique `profiles(auth_user_id)` |
| Resolve current active membership | `memberships(profile_id, status, institution_id, membership_id)` plus approved active-selection lookup |
| Admin institution course list by status/name | `courses(institution_id, status, normalized_name, course_id)` |
| Course lookup by tenant code | Unique `courses(institution_id, normalized_code)` |
| Filters by level/category | `courses(institution_id, level, category, status, course_id)` after query evidence |
| Sections for course/term | `sections(institution_id, course_id, academic_term_id, status, section_id)` |
| Staff relationship check | `section_staff(membership_id, status, section_id)` and `section_staff(section_id, status, membership_id)` |
| Student relationship check | `students(profile_id, status, institution_id, student_id)` |
| Enrollment relationship/count | `enrollments(student_id, status, section_id)` and `enrollments(section_id, status, student_id)` |
| Terms by institution/status | `academic_terms(institution_id, status, start_date desc, academic_term_id)` |

Foreign-key columns require explicit indexes where not covered by the composites. Search indexing should be selected after query plans; C30 does not require an extension.

## 12. Synthetic staging seed

- Institutions Alpha and Beta.
- Same course code `MAT-10` in both institutions.
- One active and one closed term per institution.
- Active, planning, completed and archived courses.
- Multiple sections for one course and one section in a closed term.
- Assigned and unassigned teacher.
- Assigned and unassigned assistant.
- Enrolled and unenrolled student.
- Revoked staff assignment and withdrawn enrollment.
- Guardian and support memberships with no academic relationship.
- Owner/admin actors in each institution for cross-tenant direct-ID tests.
- No production identities, emails or secrets.

## 13. Rollback and safety notes

- C30 applies nothing remotely.
- The SQL artifact is fully commented and is not a migration.
- A future migration must be small, transactional where supported, and paired with rollback/forward-fix notes.
- No destructive cleanup is approved.
- RLS and relationship tests must pass before any UI uses real rows.
- Table exposure through the Data API and grants must be reviewed separately from RLS.
- `service_role` must never be exposed to browser code or used to bypass policy design.
- Any future view must enforce base RLS, such as with a reviewed security-invoker design.
- Production remains out of scope.

## 14. Open decisions before implementation

1. How the selected active membership becomes trusted database context across devices without trusting client input.
2. Whether student visibility ships in the first implementation or follows after institution/staff isolation is proven.
3. Exact lifecycle values and historical visibility for archived courses and closed terms.
4. Whether sections are always term-bound.
5. Whether a teacher assigned to one section sees only that section or any course-wide catalog metadata beyond it.
6. Exact public staff-summary fields and whether a dedicated projection/read model is needed to avoid broad profile access or recursive RLS.
7. Whether enrollment counts are visible to students.
8. Pagination defaults/maximums and approved sort options.
9. Audit event names and retention.
10. Existing-schema reconciliation, naming and ID strategy.
11. Whether course codes may be reused after archive.
12. Whether normalized search uses expression indexes, generated columns, or a later text-search strategy.

## 15. Current Supabase design notes

Official guidance reviewed for this draft reinforces that:

- exposed tables require RLS and policies must include row authorization, not only `TO authenticated`;
- database views require a reviewed security-invoker posture to preserve RLS;
- authorization must not depend on editable user metadata;
- Data API exposure/grants are distinct from RLS;
- current declarative schema tooling is experimental and is not part of C30.

Sources: [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security), [tables/view security](https://supabase.com/docs/guides/database/tables), and [April 2026 changelog](https://supabase.com/changelog).
