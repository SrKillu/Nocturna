# Nocturna V2 Courses + Sections Policy Test Plan

STATUS: PENDING_REVIEW

These tests are specifications. They have not been executed against Supabase or PostgreSQL, and no test database or migration was created in C30.

## 1. Future targets

- Course-list repository/query for `/v2/courses`.
- Course-detail/workspace repository/query for `/v2/courses/[courseId]`.
- Base RLS tables: `academic_terms`, `courses`, `sections`, `section_staff`, minimal `students`, minimal `enrollments`.
- Trusted active-membership resolution.

## 2. Test actors

| Actor key | Role | Institution | Relationship |
|---|---|---|---|
| `alpha_owner` | owner | Alpha | Active membership |
| `alpha_admin` | admin | Alpha | Active membership |
| `alpha_teacher_assigned` | teacher | Alpha | Active assignment to Alpha Algebra section A |
| `alpha_teacher_unassigned` | teacher | Alpha | No assignment |
| `alpha_assistant_assigned` | assistant | Alpha | Active assignment to Alpha Algebra section B |
| `alpha_assistant_unassigned` | assistant | Alpha | No assignment |
| `alpha_student_enrolled` | student | Alpha | Active enrollment in Alpha Algebra section A |
| `alpha_student_unenrolled` | student | Alpha | No enrollment |
| `alpha_guardian` | guardian | Alpha | No course relationship |
| `alpha_support` | support | Alpha | No course relationship |
| `beta_owner` | owner | Beta | Active membership |
| `beta_admin` | admin | Beta | Active membership |
| `alpha_teacher_revoked` | teacher | Alpha | Revoked assignment |
| `alpha_student_withdrawn` | student | Alpha | Withdrawn enrollment |
| `no_active_membership` | teacher | Alpha | Membership suspended/revoked |
| `unauthenticated` | none | none | No user |

## 3. Seed records

- Alpha and Beta institutions.
- `MAT-10` course in each institution.
- Alpha active and closed terms.
- Alpha Algebra active course with sections A and B.
- Alpha archived course.
- Alpha course in closed term.
- Beta Algebra active course and section.
- Active/revoked assignments.
- Active/withdrawn enrollments.
- Stable opaque IDs known to tests for direct-object cases.

## 4. Policy cases

| ID | Future query | Table target | Actor | Relationship | Expected | Reason |
|---|---|---|---|---|---|---|
| C30-P01 | List courses | `courses` | `alpha_owner` | Same active institution | Allow Alpha visible courses | Owner institution scope |
| C30-P02 | List courses | `courses` | `alpha_admin` | Same active institution | Allow Alpha visible courses | Admin institution scope |
| C30-P03 | List courses | `courses` | assigned teacher | Active section assignment | Allow assigned course only | Staff relationship |
| C30-P04 | List courses | `courses` | unassigned teacher | None | Empty | Capability without relationship is insufficient |
| C30-P05 | List courses | `courses` | assigned assistant | Active section assignment | Allow assigned course only | Assistant relationship |
| C30-P06 | List courses | `courses` | unassigned assistant | None | Empty | No assignment |
| C30-P07 | List courses | `courses` | enrolled student | Active enrollment | Allow enrolled course only | Student relationship |
| C30-P08 | List courses | `courses` | unenrolled student | None | Empty | No enrollment |
| C30-P09 | List courses | `courses` | guardian/support | None | Deny/route excluded | Current route matrix |
| C30-P10 | List courses | `courses` | unauthenticated | None | Deny | No authenticated principal |
| C30-P11 | List courses | `courses` | no active membership | Suspended/revoked | Deny | Active membership required |
| C30-P12 | Course detail Alpha | `courses` | assigned teacher | Assigned section A | Allow course | At least one visible section |
| C30-P13 | Course detail Alpha | `courses` | unassigned teacher | Same institution only | Safe not-found | Avoid existence disclosure |
| C30-P14 | Direct Beta course ID | `courses` | Alpha owner/admin | Cross institution | Safe not-found | Tenant isolation |
| C30-P15 | Direct Alpha course ID | `courses` | Beta owner/admin | Cross institution | Safe not-found | Tenant isolation |
| C30-P16 | Section A detail/projection | `sections` | assigned teacher A | Assigned | Allow A | Exact assignment |
| C30-P17 | Section B projection | `sections` | assigned teacher A | Not assigned to B | Deny B | No course-wide section escalation |
| C30-P18 | Section A projection | `sections` | enrolled student A | Enrolled | Allow A | Exact enrollment |
| C30-P19 | Section B projection | `sections` | enrolled student A | Not enrolled | Deny B | No peer section access |
| C30-P20 | Staff summary | `section_staff` | owner/admin | Same institution | Allow public summary | No private profile fields |
| C30-P21 | Staff summary | `section_staff` | assigned teacher | Own assignment | Allow own approved assignment summary only | Avoid recursive co-staff policy |
| C30-P22 | Enrollment count | `enrollments` | assigned staff | Visible section | Allow aggregate only | No student rows |
| C30-P23 | Enrollment row | `enrollments` | unrelated staff | No assignment | Deny | Prevent roster leakage |
| C30-P24 | Own enrollment relation | `enrollments` | enrolled student | Own active enrollment | Allow relationship check | Student course visibility |
| C30-P25 | Another student enrollment | `enrollments` | enrolled student | Peer | Deny | No peer data |
| C30-P26 | Revoked assignment | `section_staff` / `courses` | revoked teacher | Revoked | Deny immediately | Status freshness |
| C30-P27 | Withdrawn enrollment | `enrollments` / `courses` | withdrawn student | Withdrawn | Deny current course | Status freshness |
| C30-P28 | Archived course | `courses` | owner/admin | Same institution | Hidden by default | Proposed historical rule |
| C30-P29 | Closed-term course | term/course | owner/admin | Same institution | Decision-dependent | Must lock approved historical rule |
| C30-P30 | Closed-term course | term/course | assigned staff/student | Historical relationship | Decision-dependent | Avoid accidental historic expansion |

## 5. Query and pagination cases

| ID | Case | Expected |
|---|---|---|
| C30-Q01 | Default list limit | 25 or approved default; never unbounded |
| C30-Q02 | Requested limit over maximum | Validation error or clamp according to approved API contract |
| C30-Q03 | Name ascending | Stable order by normalized name, code, ID |
| C30-Q04 | Code ascending | Stable order by normalized code, ID |
| C30-Q05 | Recent descending | Stable order by updated time desc, ID desc |
| C30-Q06 | Cursor reused with different filters | Validation failure; cursor cannot widen scope |
| C30-Q07 | Search by repeated code | Only records allowed for active tenant/relationship |
| C30-Q08 | Empty tenant/relationship | Successful empty list, no error |
| C30-Q09 | Unknown course ID | Same public response as unauthorized course ID |
| C30-Q10 | Course with two sections, one visible | Return course with only the visible section |

## 6. Structural and integrity cases

- Course code uniqueness is tenant-scoped; Alpha and Beta may both use `MAT-10`.
- Section code uniqueness is scoped to institution, term and course.
- Course/section/term institution mismatch is rejected.
- Section staff membership institution mismatch is rejected.
- Student/enrollment/section institution mismatch is rejected.
- Enrollment term must match the section term.
- Duplicate active staff assignment is rejected.
- Duplicate active enrollment is rejected under the approved active-state rule.
- Capacity cannot be negative.
- Invalid lifecycle status is rejected.
- Foreign-key columns needed by policy joins have indexes.

## 7. Projection cases

- Course list does not expose institution internals, auth IDs or private staff fields.
- Staff summary contains only approved display name and assignment role; co-staff visibility requires a separately reviewed safe projection.
- Student list/roster identities are absent from the first real workspace projection.
- Enrollment count does not expose student IDs.
- `teacherName`, `termLabel`, `sectionLabel`, `scheduleLabel` and `roomLabel` are derived projections.
- `nextAction` is application behavior, not stored authority.

## 8. Edge cases

- User belongs to Alpha and Beta but selects Alpha: approved trusted active-membership mechanism must prevent Beta rows in the Alpha request.
- Active membership changes during a request: define transaction/request snapshot behavior.
- Assignment or enrollment revoked between list and detail: detail must reauthorize.
- Course archived between pages: detail becomes safe not-found.
- Section completed while course stays active: historical visibility decision applies.
- All sections hidden from actor: course must not remain visible solely because its ID was known.
- Empty public staff summary must not reveal hidden assignments.

## 9. Acceptance gate

Before any real-data UI integration:

1. Every case above is implemented against an isolated local/staging database.
2. Cross-institution direct-ID tests pass.
3. Unassigned staff and unenrolled student tests pass.
4. Multi-membership active-context behavior is approved and tested.
5. RLS advisors/review show no unprotected exposed table.
6. Query plans confirm relationship checks use expected indexes.
7. No browser path uses `service_role`.
8. Human review approves SQL, seed, rollback and policy evidence.

## 10. C31 hardening cases

| ID | Area | Scenario | Expected |
|---|---|---|---|
| C31-A01 | Active membership | User has Alpha and Beta memberships; session A selects Alpha | Only Alpha rows; Beta IDs safe not-found |
| C31-A02 | Multi-device | Same user session A selects Alpha and session B selects Beta | Each session remains isolated; changing A does not alter B |
| C31-A03 | Selector tampering | Cookie/selector references another user's membership | Deny and require valid active context |
| C31-A04 | Revocation | Membership is suspended/revoked before a sensitive query | Current DB status denies even if JWT/cookie is stale |
| C31-A05 | During request | Membership is revoked between list and detail | Detail reauthorizes and returns safe denial/not-found |
| C31-A06 | Profile/institution | Profile or institution becomes inactive | Context resolution fails closed |
| C31-A07 | Session | Auth session is revoked | Stored selection cannot restore access |
| C31-S01 | Exact staff scope | Teacher assigned to section A opens course with A and B | Course may be visible; only A appears |
| C31-S02 | Sibling section ID | Same teacher requests section B directly | Safe not-found |
| C31-S03 | Staff label | First-slice adapter has no approved public projection | Generic “Equipo docente”; no private profile query |
| C31-S04 | Public projection | Approved minimal projection is queried | Only display label and assignment role; no email/auth/HR fields |
| C31-S05 | Recursion | Policy/view dependency graph is exercised | No recursive policy error and no bypass |
| C31-S06 | View mode | Security-invoker view is compared with an unsafe definer control | Only reviewed invoker design is grantable |
| C31-H01 | Archived default | Any actor runs ordinary list/detail | Archived course/section absent |
| C31-H02 | Closed term admin | Owner/admin supplies approved historical filter | Same-tenant closed-term rows only |
| C31-H03 | Closed term staff/student | Staff/student supplies historical filter | No scope expansion; historical access deferred |
| C31-H04 | Historical direct ID | Actor knows archived/out-of-scope ID | Safe not-found |
| C31-E01 | Student included | Active student/enrollment slice is enabled | Only exact enrolled sections and courses |
| C31-E02 | Student relation revoked | Enrollment becomes withdrawn/suspended | Current course/section access denied |
| C31-E03 | Student deferred | Enrollment policies are not in first migration | Real adapter disabled for student; mock/demo path remains explicit |
| C31-E04 | Peer privacy | Student queries peer enrollment/count detail | Denied; no peer identity leakage |
| C31-C01 | Count projection | Staff requests count for assigned section | Approved aggregate only; no student rows |
| C31-C02 | Count scope | Staff requests count for sibling/unassigned section | Denied/absent |

### Additional seed required by C31

- One authenticated user with active memberships in Alpha and Beta.
- Two simultaneous session-selection records for that user.
- Suspended membership, inactive profile and suspended institution.
- Course with two sections and non-overlapping staff assignments.
- Public staff label fixture plus private fields that must never project.
- Closed and archived records with known IDs.
- Active, completed, withdrawn and suspended enrollment relationships.

### C31 acceptance additions

- Active-membership lookup uses current DB state and a per-session selection.
- The policy dependency graph has no recursion.
- Views preserve base RLS and expose only explicitly granted columns.
- Historical filters cannot be used by unapproved roles.
- Student behavior is explicitly either fully policy-tested or mock-backed; there
  is no partial institution-wide fallback.
- Revocation cases are exercised in separate requests and documented transaction
  semantics cover changes during a request.

## 11. C32 active-membership reconciliation cases

The complete matrix lives in
`NOCTURNA_V2_ACTIVE_MEMBERSHIP_POLICY_TEST_MATRIX.md`. Courses + Sections must
include at least these gates:

| ID | Case | Expected |
|---|---|---|
| C32-P01 | One active institution and valid session selection | Only that tenant's authorized rows |
| C32-P02 | Alpha/Beta memberships; session A=Alpha, B=Beta | Independent tenant results per session |
| C32-P03 | Change selection in session A | Session B remains unchanged |
| C32-P04 | Manipulated, missing or other-user selector | Deny; no selection persisted |
| C32-P05 | Selection expired/revoked | Deny |
| C32-P06 | Membership suspended/revoked | Current DB state denies despite stale JWT/cookie |
| C32-P07 | Profile inactive | Deny before domain lookup |
| C32-P08 | Institution suspended | Deny before domain lookup |
| C32-P09 | Auth session revoked | Sensitive request denied; selection cannot restore it |
| C32-P10 | JWT role/tenant/capability stale | Current membership/configuration prevails |
| C32-P11 | Course ID from other active membership/tenant | Safe not-found |
| C32-P12 | Membership changes between list and detail | Detail reauthorizes |
| C32-P13 | Context helpers invoked independently | Fail closed and expose no private rows |
| C32-P14 | Context + assignment/enrollment helpers | No recursive policy error |
| C32-P15 | Context table without Data API grant | Not exposed; grants tested separately from RLS |

### C32 seed additions

- One profile with Alpha and Beta memberships.
- Two simultaneous Supabase session IDs.
- Per-session selections plus expired/revoked/foreign selectors.
- Membership/profile/institution status transitions.
- Stale JWT/cookie fixtures.
- Course IDs repeated/crossed across tenants.

### C32 acceptance gate

- The schema source for `institution_memberships` and `roles` is versioned.
- Session selection is keyed by trusted JWT `session_id`.
- Browser input cannot set institution, role or capabilities as authority.
- Current DB status is checked on each sensitive query.
- Helpers and policy tables have an acyclic tested dependency graph.
- Grants are explicit and context tables are not accidentally Data API-exposed.
