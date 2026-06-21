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
