# Nocturna V2 First Vertical Slice Candidates

STATUS: PENDING_REVIEW

## Decision summary

The recommended first real integration is **Courses + Sections read-only**. It creates the smallest useful tenant/relationship spine for later student, enrollment, schedule, attendance, evaluation, gradebook, material and reporting work while avoiding sensitive student profile data and enrollment mutation concurrency.

This recommendation authorizes no schema, SQL, migration, endpoint, deployment, or remote Supabase change.

## Candidate 1 — Courses + Sections read-only

### Why it is a good first slice

- Courses and sections are foundational dependencies for most academic modules.
- Current routes, capabilities, mocks, loading, empty, denied and course not-found behavior already exist.
- Data sensitivity is lower than student profiles, attendance or grades.
- Relationship tests can establish admin institution scope, assigned staff scope and enrolled student scope.
- It exercises list and detail contracts without requiring lifecycle writes.

### Minimum entities

- `institutions`
- `profiles`
- `memberships`
- `academic_terms`
- `courses`
- `sections`
- `section_staff`
- minimal synthetic `students` and `enrollments` only if student course visibility is included

### Affected routes and capabilities

- `/v2/courses`
- `/v2/courses/[courseId]`
- `canViewCourses`
- `canViewSections`

### Minimum RLS requirements

- Owner/admin: active membership in the same institution.
- Teacher/assistant: active `section_staff` relationship.
- Student: active enrollment in the section if student access is included.
- Guardian/support/unrelated/cross-institution actors: denied.
- Detail lookup must not disclose whether an out-of-scope course exists.

### Staging seed

- Two institutions.
- One active and one closed term.
- Courses with repeated human codes across institutions to prove tenant-scoped uniqueness.
- Multiple sections per course.
- Assigned and unassigned teacher/assistant.
- Enrolled and unenrolled student.
- Guardian and support actors with no course access.

### Tests

- Positive/negative list and detail policy cases for every role/relationship.
- Cross-institution direct-ID denial.
- Closed/archived visibility decision.
- Pagination and stable sorting.
- Empty institution, no assignment, no enrollment and not-found states.
- Query-count/performance baseline for list and workspace projection.

### Do not include

- Course/section creation or editing.
- Staff assignment mutations.
- Enrollment mutations.
- Attendance, evaluations, grades, materials or report aggregates.
- Bulk import/export.
- Production or remote migration application.

## Candidate 2 — Students + Student Profiles read-only

### Why it is valuable

- Directly supports directory, institutional profile and future self/guardian projections.
- Forces early field-level projection and relationship decisions.
- Establishes sensitive-data policy discipline.

### Minimum entities

- Institutions, profiles and memberships.
- Students and student profiles.
- Courses, sections and section staff.
- Enrollments.
- Optional guardians and verified guardian-student links if guardian projection is included.

### Affected routes and capabilities

- `/v2/students`
- `/v2/students/[studentId]`
- `/v2/my-space` only if own-profile projection is approved
- `canViewStudents`, `canViewStudentProfiles`, `canViewOwnStudentProfile`

### Minimum RLS requirements

- Owner/admin same-institution directory/profile.
- Teacher/assistant only students in actively assigned sections.
- Student only own approved projection.
- Guardian only verified linked-student projection if included.
- Different projections for directory, staff profile detail, self and guardian.

### Staging seed and tests

- Two institutions, assigned/unassigned staff, students in multiple sections, authenticated and non-authenticated student records, verified/revoked guardian links.
- Field omission tests, cross-tenant and peer-student denial, direct-ID denial, empty directory, not-found and inactive profile cases.

### Risks

- Highest PII exposure among the candidates.
- “Student profile” is currently an aggregate of courses, attendance, evaluations and notes, which would pull multiple domains into the first slice.
- Field-level policy decisions are not approved.

### Do not include

- Attendance/grade values, private notes, guardian custody data or mutation.
- Student imports, profile editing, guardian link management.

## Candidate 3 — Enrollments basic read-only

### Why it is valuable

- Enrollment is the central relationship between a student and a section.
- It prepares capacity, roster and later attendance/grade authorization.
- Current UI already models status, type, capacity, risk and change previews.

### Minimum entities

- Institutions, terms, courses and sections.
- Students and minimal profiles.
- Enrollments and immutable transition history.

### Affected route and capability

- `/v2/enrollments`
- `canViewEnrollments`

### Minimum RLS requirements

- Initially owner/admin same-institution read only.
- Future staff/student/guardian projections remain explicitly out of scope.
- Student and section must share institution and term rules.

### Staging seed and tests

- Active, pending, review, suspended, completed and withdrawn records.
- Duplicate/cross-tenant invalid examples for policy tests.
- Capacity boundaries and transition history.
- Cursor/filter tests by term, course, section, status, type and risk.

### Risks

- Requires course, section and student foundations first.
- Capacity and lifecycle fields can be mistaken for authorization to mutate.
- Real enrollment writes require concurrency and transition auditing.

### Do not include

- Create, approve, transfer, suspend or withdraw.
- Capacity reservation logic or waitlists.
- Bulk imports.

## Comparison

| Criterion | Courses + Sections | Students + Profiles | Enrollments |
|---|---:|---:|---:|
| Dependency value | Highest | High | High |
| Sensitive data risk | Lowest | Highest | Medium |
| Relationship/RLS learning | High | Highest | High |
| Existing route/state support | Strong | Strong | Strong |
| Required prerequisite breadth | Lowest | High | Highest |
| Write/concurrency pressure | Low for read slice | Low for read slice | High if scope creeps |
| Recommended order | **1** | 2 | 3 |

## Recommendation

Proceed in C30 with a **review-only Courses + Sections schema/RLS draft**, then plan a small read integration only after schema, relationship matrix, indexes, seed, policy tests, rollback notes and human review are approved together.

The first implementation should remain read-only and should not silently add student profile aggregates. If student course visibility materially expands scope, it may be deferred so the initial slice proves institution and staff-assignment isolation first.
