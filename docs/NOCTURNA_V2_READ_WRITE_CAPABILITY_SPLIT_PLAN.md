# Nocturna V2 Read/Write Capability Split Plan

STATUS: PENDING_REVIEW

- Date: June 21, 2026
- Branch: `feature/nocturna-c26-read-write-capability-split-plan-v2`
- Base: `main`
- Base commit: `d14324b`
- Scope: technical planning only; no capability, role, route, navigation, runtime, Supabase, or production change

## 1. Executive summary

Nocturna V2 must separate permission to see data from permission to create, change, approve, publish, export, archive, or revoke it before domain data is integrated with Supabase. A broad capability such as `canManageAttendance` is acceptable for a visual foundation, but it is unsafe as a direct RLS or endpoint policy because it does not distinguish reading attendance from recording it, correcting history, or approving a correction.

The distinction becomes essential when Nocturna serves many users across multiple institutions and handles student identity, attendance, grades, guardian relationships, staff assignments, official documents, and audit events. Each operation must be constrained by both a capability and a data relationship such as same institution, assigned section, own record, or linked guardian-student relationship.

C26 changes no permissions. It defines a target vocabulary and migration order so future capability additions can preserve the current effective role matrix while preparing deny-by-default RLS and endpoint policy.

## 2. Current capability state

| Current capability | Category | Current roles | Dependent modules | Contract quality | Direct-to-RLS risk | Recommended direction | Priority |
|---|---|---|---|---|---|---|---|
| `canManageInstitution` | Privileged write / overloaded | Owner | Future institution administration; currently excludes student self view | Very broad | Could permit unrelated settings, membership, security, and lifecycle writes | Keep as highest-level institution authority; introduce narrower write capabilities beneath it | P0 |
| `canViewInstitutionSettings` | Read | Owner, admin | Settings | Good read contract | Low if combined with same-institution scope | Keep; add `canManageInstitutionSettings` for writes | P1 |
| `canViewAuditLog` | Operational read | Owner, admin | Audit log | Good read contract | Export/redaction scope is not expressed | Keep; add `canExportAuditLog` | P2 |
| `canViewSchedule` | Read | Owner, admin, teacher, assistant | Schedule | Good route-purpose read contract | Must still be section/institution scoped | Keep; add schedule management capabilities only when needed | P2 |
| `canAccessLibrary` | Read/access | Owner, admin, teacher, assistant | Library | Good route-purpose access contract | Catalog access does not imply circulation management | Keep; add library management and loan capabilities | P3 |
| `canViewLinkedStudents` | Relational read | Guardian | Guardian space | Good intent; relationship incomplete | Dangerous without an explicit guardian-student link policy | Keep; require verified link and field projection | P0 |
| `canViewNotifications` | Personal/operational read | All V2 roles | Notifications | Good inbox contract | Recipient scoping is not encoded by capability alone | Keep; enforce recipient ownership in RLS | P2 |
| `canManageUsers` | Overloaded write | Owner, admin | Staff | Viewing staff is coupled to invitations, suspension, and identity administration | Could expose or mutate all institution identities | Split directory read, invitations, assignments, and suspension | P0 |
| `canManageCourses` | Mixed/overloaded | Owner, admin | Courses, students, enrollments; contributes to course workspace | One capability drives multiple domains | Could grant course writes, student reads, and enrollment writes together | Add read capabilities first, then narrow management actions | P0 |
| `canManageSections` | Overloaded write | Owner, admin | Future sections/groups | No routed module yet | Could imply staff assignment, roster mutation, schedule changes, and archive | Split viewing, management, and staff assignment | P1 |
| `canGrade` | Mixed/overloaded | Owner, admin, teacher, assistant | Courses, students, evaluations, gradebook | Used for both viewing and mutation | Could grant student-directory reads, evaluation changes, score entry, approval, and publication | Separate evaluation, gradebook, entry, approval, and publication | P0 |
| `canSubmit` | Personal/self-service mixed | Owner, student | Courses and student self view | Submission intent is also used to infer route visibility | Mapping it to general insert policy could allow wrong resource types or owner self-space | Add explicit self-view and domain submission actions | P1 |
| `canViewReports` | Operational read | Owner, admin, teacher, assistant, guardian, support | Reports only for staff roles; capability exists for guardian/support too | Read semantics are good but role scope differs by module | Exported files and broad aggregates could leak more than on-screen views | Keep view; separate export and scheduled reporting | P1 |
| `canManageMaterials` | Mixed/overloaded | Owner, admin, teacher, assistant | Materials | Viewing, metadata edits, upload, and archive are combined | Could expose Storage writes or deletion with simple read access | Split view, metadata management, upload, and archive | P1 |
| `canUseChat` | Operational/pending scopes | All V2 roles | Legacy/general communication, no V2 module contract in C25 | Too generic for future messaging policy | Could imply reading any conversation or messaging any user | Retain temporarily; later split conversation view/send/moderate scopes | P3 |
| `canManageAttendance` | Mixed/overloaded | Owner, admin, teacher, assistant | Attendance | Read, record, correction, and approval are combined | Historical corrections require stronger authority and audit than daily entry | Split view, record, correct, and approve correction | P0 |
| `canManageCertificates` | Mixed/overloaded | Owner, admin | Certificates | Viewing, issuing, revoking, template management, and verification are combined | Official document lifecycle and public verification require distinct policies | Split view, manage templates, issue, revoke, and verify | P1 |

### Classification summary

- **Read/visualization:** `canViewInstitutionSettings`, `canViewSchedule`, `canAccessLibrary`, `canViewNotifications`.
- **Relational read:** `canViewLinkedStudents`.
- **Operational read:** `canViewAuditLog`, `canViewReports`.
- **Write/management:** `canManageInstitution`, `canManageSections`.
- **Mixed or overloaded:** `canManageUsers`, `canManageCourses`, `canGrade`, `canSubmit`, `canManageMaterials`, `canManageAttendance`, `canManageCertificates`.
- **Operational with future scopes:** `canUseChat`.
- **Temporary substitutes:** none among the five routes cleaned in C24; remaining debt is read/write overloading rather than semantic substitution.

## 3. Capabilities already suitable as read contracts

- `canViewInstitutionSettings`: retain for read-only institution settings. Do not use it for writes.
- `canViewAuditLog`: retain for redacted audit search. Export requires `canExportAuditLog`.
- `canViewSchedule`: retain for schedule visibility, constrained by institution or assigned section.
- `canAccessLibrary`: retain for catalog/resource access. Circulation requires separate capabilities.
- `canViewLinkedStudents`: retain only with a verified active guardian-student relationship.
- `canViewNotifications`: retain for recipient-owned inbox access.
- `canViewReports`: retain for in-app reports; exports and scheduled delivery must be separate.
- `canUseChat`: retain only as a transitional top-level feature flag. Future policy needs conversation membership and send/moderate scopes.

## 4. Overloaded capability findings

### `canManageCourses`

Currently contributes to course viewing, student directory access, enrollments, and course management. It should not become a single policy for `SELECT`, `INSERT`, `UPDATE`, and enrollment transitions.

### `canManageSections`

Sections are a central tenancy boundary for rosters, schedules, attendance, and grades. Section viewing, editing, staff assignment, and archival need distinct authority.

### `canManageAttendance`

Daily attendance recording is not equivalent to viewing history, changing a prior record, or approving a correction. Every correction should preserve before/after state and actor identity.

### `canManageMaterials`

Metadata viewing, metadata editing, Storage upload, replacement, and archival have different risk. Storage object policy must not inherit a generic material-management boolean.

### `canManageCertificates`

Certificate viewing, template administration, issuance, revocation, and public verification differ in legal and audit impact.

### `canManageUsers`

Staff directory access, invitations, role changes, assignment management, suspension, and account lifecycle should not share one grant.

### `canGrade`

The current capability admits staff to student/evaluation/gradebook views and implies future score mutation. Viewing gradebook, entering scores, approving changes, and publishing results must be separate.

### `canSubmit`

This currently supports student course visibility and self-space admission. Future writes must be resource-specific and limited to the authenticated student, an active enrollment, and an allowed submission window.

### `canManageInstitution`

This should remain an owner-only umbrella for exceptional institution authority, not the default gate for every settings, membership, security, billing, or lifecycle operation.

## 5. Recommended split by domain

| Domain | Proposed capabilities | Purpose |
|---|---|---|
| Courses | `canViewCourses`, `canManageCourses`, `canViewSections`, `canManageSections`, `canAssignCourseStaff` | Separate discovery, course mutation, section visibility, section lifecycle, and staff assignment |
| Students | `canViewStudents`, `canManageStudents`, `canViewStudentProfiles`, `canManageStudentProfiles`, `canViewOwnStudentProfile` | Separate directory, record administration, sensitive profile projection, and self-service |
| Guardians | `canViewLinkedStudents`, `canManageGuardianLinks` | Separate guardian relationship reads from link administration |
| Enrollments | `canViewEnrollments`, `canManageEnrollments`, `canApproveEnrollments`, `canWithdrawEnrollments` | Separate queue visibility, edits, approval, and lifecycle termination |
| Attendance | `canViewAttendance`, `canRecordAttendance`, `canCorrectAttendance`, `canApproveAttendanceCorrections` | Separate ordinary reads/entry from historical correction and approval |
| Evaluations | `canViewEvaluations`, `canManageEvaluations`, `canPublishEvaluations` | Separate visibility, authoring, and publication |
| Gradebook | `canViewGradebook`, `canEnterGrades`, `canApproveGradeChanges`, `canPublishGrades`, `canViewOwnGrades`, `canViewLinkedStudentGrades` | Separate staff workflows from student/guardian projections |
| Materials | `canViewMaterials`, `canManageMaterials`, `canUploadMaterials`, `canArchiveMaterials` | Separate metadata read/edit, Storage write, and lifecycle archive |
| Library | `canAccessLibrary`, `canManageLibrary`, `canManageLibraryLoans` | Separate catalog access, collection administration, and circulation |
| Reports | `canViewReports`, `canExportReports`, `canScheduleReports` | Separate UI queries, generated files, and recurring delivery |
| Certificates | `canViewCertificates`, `canManageCertificates`, `canIssueCertificates`, `canRevokeCertificates`, `canVerifyCertificates` | Separate directory/template administration from irreversible lifecycle actions |
| Staff | `canViewStaff`, `canManageUsers`, `canManageStaffAssignments`, `canInviteUsers`, `canSuspendUsers` | Separate directory, identity, assignment, invitation, and suspension |
| Settings | `canViewInstitutionSettings`, `canManageInstitutionSettings`, `canManageInstitution` | Separate reads, ordinary configuration writes, and owner-only institution authority |
| Audit log | `canViewAuditLog`, `canExportAuditLog` | Separate redacted exploration from data extraction |
| Notifications | `canViewNotifications`, `canManageNotifications`, `canSendInstitutionNotifications` | Separate personal inbox, configuration, and institution-wide broadcasting |
| Support | `canUseSupportTools`, `canViewSupportDiagnostics`, `canManageSupportCases` | Create explicit least-privilege support operations |

## 6. Proposed role matrix

This is a planning proposal, not an implemented permission change.

| Role | Current capability posture | Recommended future capability posture |
|---|---|---|
| Owner | Broad institution/course/user/academic management; all C24 route reads except linked students | All institution-scoped read/write capabilities; high-risk approval/revoke actions; no guardian-link read unless a real guardian relationship also exists |
| Admin | Institution settings read; user/course/section/attendance/material/certificate management; grading/reporting | Institution-wide operational reads; course/section/student/enrollment/staff management; attendance correction approval; grade-change approval/publication if policy approves; settings write; no owner-only institution lifecycle |
| Teacher | Grade/report/material/attendance management; schedule/library/notification reads | Assigned course/section/student reads; manage/publish own evaluations; enter grades; record attendance; view materials/library; upload/manage own course materials; no institution-wide approval by default |
| Assistant | Same current matrix as teacher | Assigned course/section/student reads; record attendance and enter grades only where delegated; manage course materials within assignment; publication/approval withheld by default |
| Student | Submit, chat, notifications; course and self-space access | View own profile, courses, sections, evaluations, materials, schedule, attendance, and grades; submit only own work within active enrollment |
| Guardian | Linked-student, report, notification, chat capabilities | View only explicitly linked students and approved attendance/grade/report projections; no institutional directory access |
| Support | Report/chat/notification capabilities but only dashboard/notifications routes | Notifications plus explicit support cases/diagnostics; no academic records unless time-bound, consented, audited support policy is separately approved |

### Suggested capability grants by role

The following lists show likely future grants, subject to human policy review:

- **Owner:** all institution-scoped capabilities except relationship-derived `canViewLinkedStudents`, `canViewOwnStudentProfile`, `canViewOwnGrades`, and `canViewLinkedStudentGrades` unless those relationships independently apply.
- **Admin:** all institutional view capabilities; manage courses, sections, students, enrollments, staff assignments, attendance, evaluations, grades, materials, reports, certificates, notifications, and ordinary settings; no `canManageInstitution` by default.
- **Teacher:** view assigned courses/sections/students; view/record attendance; view/manage/publish assigned evaluations; view/enter grades; view reports; view/upload/manage assigned materials; view schedule/library/notifications.
- **Assistant:** same read scope as assigned teacher support; record attendance, enter grades, and manage materials only where delegated; no approval or publication by default.
- **Student:** own-profile, own-grade, enrolled-course/material/evaluation reads; own submissions; notifications.
- **Guardian:** linked-student profile, attendance, grade, and approved report projections; notifications.
- **Support:** support diagnostics/cases and notifications only, with no implicit academic-domain grants.

## 7. Impact on RLS

| Domain / probable tables | Read policy | Write policy | Required relationship | Audit requirement | Principal risk |
|---|---|---|---|---|---|
| Courses: `courses`, `course_staff` | Same institution; assigned staff; enrolled student | Institution admin or assigned course manager | Same institution plus assignment/enrollment | Course lifecycle and staff assignment | Cross-institution catalog or unauthorized edits |
| Sections: `sections`, `section_staff`, `section_members` | Same institution and assignment/enrollment | Admin/authorized section manager | Assigned section | Staff/roster changes | Sections become a privilege bridge to attendance/grades |
| Students: `students`, `student_profiles` | Authorized institution staff; own record; linked guardian projection | Narrow student-record administrators | Institution, own user, or verified guardian link | Sensitive field changes | Excessive profile exposure |
| Guardians: `guardian_student_links` | Linked guardian and authorized administrators | Approved relationship administrators | Verified active link | Link create/revoke | Unauthorized child linkage |
| Staff: `staff_profiles`, memberships/assignments | Institution staff directory scope | User/admin/assignment-specific grants | Same institution | Invite, role, suspension, assignment | Identity privilege escalation |
| Enrollments: `enrollments`, transition history | Institution admins; assigned staff; own student projection | Manage/approve/withdraw separated | Institution, section, student | Every transition | Duplicate or invalid lifecycle transitions |
| Schedule: `schedule_entries`, rooms | Institution or assigned section | Future schedule managers | Same institution/assigned section | Conflict overrides | Collision and unauthorized visibility |
| Attendance: `attendance_sessions`, `attendance_entries`, corrections | Assigned staff; own/linked projections | Record/correct/approve separated | Section assignment, own student, linked guardian | Before/after correction log | Silent historical edits |
| Evaluations: `evaluations`, categories | Assigned staff; enrolled student when published | Manage and publish separated | Course/section assignment/enrollment | Publish/unpublish and weight changes | Premature disclosure or invalid weighting |
| Gradebook: `grade_items`, `scores`, grade history | Assigned staff; own/linked published projection | Enter/approve/publish separated | Course/section assignment, own/linked student | Immutable grade-change history | Undetected grade manipulation |
| Materials: metadata plus Storage objects | Assigned/enrolled course scope | Manage/upload/archive separated | Course relationship | Upload, replace, archive | Storage object leakage |
| Library: titles, copies, loans | Institution catalog; borrower-owned circulation details | Collection and loan managers | Same institution/borrower | Loan overrides and write-offs | Borrower privacy and inventory drift |
| Reports: report definitions, jobs, artifacts | Capability plus authorized source scope | Export/schedule separately | Derived from every source relationship | Export requester and artifact access | Bulk data exfiltration |
| Certificates: templates, issued certificates, revocations | Authorized staff; minimum verification projection | Manage/issue/revoke separated | Institution and subject | Immutable issue/revoke events | Fraud and legal validity |
| Notifications: events, recipients, preferences | Recipient owns row | Broadcaster/preferences policies | Recipient or approved institution sender | Broadcast and preference change | Wrong recipients or duplicate delivery |
| Audit log: append-only audit events | Redacted admin/auditor view | No ordinary client writes | Institution scope | Audit system is itself immutable | Tampering and PII/secrets in metadata |
| Settings: institution settings/version history | Same institution plus view capability | Ordinary settings manager; owner for critical lifecycle | Same institution | Every critical setting change | Configuration privilege escalation |

RLS must combine capabilities with data relationships. A capability alone must never satisfy a multi-tenant policy.

## 8. Impact on future endpoints

| Domain | Read endpoints | Write/action endpoints | Required capability examples |
|---|---|---|---|
| Courses/sections | `GET /courses`, `GET /courses/:id`, `GET /sections/:id` | `POST /courses`, `PATCH /courses/:id`, `POST /sections`, `POST /sections/:id/staff` | `canViewCourses`, `canManageCourses`, `canViewSections`, `canManageSections`, `canAssignCourseStaff` |
| Students | `GET /students`, `GET /students/:id`, `GET /me/student-profile` | `POST /students`, `PATCH /students/:id` | `canViewStudents`, `canViewStudentProfiles`, `canViewOwnStudentProfile`, `canManageStudents`, `canManageStudentProfiles` |
| Guardians | `GET /guardian/linked-students` | `POST /guardian-links`, `DELETE /guardian-links/:id` | `canViewLinkedStudents`, `canManageGuardianLinks` |
| Enrollments | `GET /enrollments`, `GET /enrollments/:id` | `POST /enrollments`, `PATCH /enrollments/:id`, `POST /enrollments/:id/approve`, `POST /enrollments/:id/withdraw` | `canViewEnrollments`, `canManageEnrollments`, `canApproveEnrollments`, `canWithdrawEnrollments` |
| Attendance | `GET /attendance/sessions`, `GET /attendance/students/:id` | `POST /attendance/sessions/:id/entries`, `PATCH /attendance/entries/:id`, `POST /attendance/corrections/:id/approve` | `canViewAttendance`, `canRecordAttendance`, `canCorrectAttendance`, `canApproveAttendanceCorrections` |
| Evaluations | `GET /evaluations`, `GET /evaluations/:id` | `POST /evaluations`, `PATCH /evaluations/:id`, `POST /evaluations/:id/publish` | `canViewEvaluations`, `canManageEvaluations`, `canPublishEvaluations` |
| Gradebook | `GET /gradebook`, `GET /me/grades`, `GET /guardian/students/:id/grades` | `PATCH /scores/:id`, `POST /grade-changes/:id/approve`, `POST /gradebooks/:id/publish` | `canViewGradebook`, `canViewOwnGrades`, `canViewLinkedStudentGrades`, `canEnterGrades`, `canApproveGradeChanges`, `canPublishGrades` |
| Materials | `GET /materials`, `GET /materials/:id` | `POST /materials`, `POST /materials/uploads`, `PATCH /materials/:id`, `DELETE /materials/:id` as archive | `canViewMaterials`, `canManageMaterials`, `canUploadMaterials`, `canArchiveMaterials` |
| Library | `GET /library`, `GET /library/:id`, `GET /library/loans/me` | `POST/PATCH /library/items`, `POST /library/loans`, `POST /library/loans/:id/return` | `canAccessLibrary`, `canManageLibrary`, `canManageLibraryLoans` |
| Reports | `GET /reports`, `GET /reports/:id` | `POST /report-exports`, `POST /report-schedules` | `canViewReports`, `canExportReports`, `canScheduleReports` |
| Certificates | `GET /certificates`, `GET /certificates/:id`, `GET /verify/:code` | `POST/PATCH /certificate-templates`, `POST /certificates/issue`, `POST /certificates/:id/revoke` | `canViewCertificates`, `canVerifyCertificates`, `canManageCertificates`, `canIssueCertificates`, `canRevokeCertificates` |
| Staff/users | `GET /staff`, `GET /staff/:id` | `POST /invites`, `PATCH /staff/:id/assignments`, `POST /users/:id/suspend` | `canViewStaff`, `canInviteUsers`, `canManageStaffAssignments`, `canSuspendUsers`, `canManageUsers` |
| Settings | `GET /institution/settings` | `PATCH /institution/settings`, critical institution actions | `canViewInstitutionSettings`, `canManageInstitutionSettings`, `canManageInstitution` |
| Audit log | `GET /audit-log`, `GET /audit-log/:id` | `POST /audit-log/exports` only; no ordinary update/delete | `canViewAuditLog`, `canExportAuditLog` |
| Notifications | `GET /notifications`, `GET /notification-preferences` | `PATCH /notification-preferences`, `POST /institution-notifications` | `canViewNotifications`, `canManageNotifications`, `canSendInstitutionNotifications` |
| Support | `GET /support/cases`, `GET /support/diagnostics/:scope` | `POST/PATCH /support/cases` | `canUseSupportTools`, `canViewSupportDiagnostics`, `canManageSupportCases` |

Every endpoint must independently validate session, active membership, capability, institution/relationship scope, input, and lifecycle state. UI visibility is not endpoint authorization.

## 9. Recommended implementation order

### C27 — Safe read capability additions

- Add the lowest-risk read capabilities without removing existing grants.
- Define a complete role matrix and tests.
- Preserve current visible access.

### C28 — Route contract update for read capabilities

- Move route admission from overloaded management capabilities to explicit read capabilities.
- Update navigation and direct-access contract tests together.
- Keep write capabilities available only for future actions.

### C29 — Domain data contract inventory

- Define entity identifiers, projections, filters, pagination, lifecycle states, and error contracts.
- Mark sensitive fields and relationship requirements.

### C30 — Supabase schema/RLS draft for academic core

- Draft courses, sections, students, guardian links, enrollments, and assignments.
- Map each table operation to approved capabilities and relationships.
- Keep migrations `PENDING_REVIEW`; no remote database push.

### C31 — First vertical slice planning

- Select one small read-first vertical slice.
- Define migration, repository/endpoint, RLS tests, UI adapter, staging seed, observability, and rollback.

## 10. Security rules

- No new capability may broaden effective access without explicit tests and human review.
- Every capability must have a complete role matrix.
- Every route must remain in the centralized route-role contract.
- Every future endpoint must have positive and negative policy tests.
- RLS must be deny-by-default.
- `service_role` must never reach the browser.
- No multi-tenant table may omit an approved `institution_id` or equivalent relationship path.
- Read capability never implies create, update, delete, approve, publish, export, revoke, or archive.
- Relationship-derived access must be validated from current database state, not trusted client claims.
- High-risk transitions must be audited with actor, target, before/after state, and reason where applicable.

## Decision required before implementation

Human review should approve:

1. Naming and granularity of the proposed capabilities.
2. Whether teacher and assistant write scopes differ by default or by assignment.
3. Which admin actions require owner approval.
4. Which student/guardian data projections are visible.
5. Which actions require immutable audit history.

Until those decisions are approved, this document is a plan and must not be treated as an implemented authorization model.

C27 added the first safe read capability vocabulary in code. These capabilities are not yet used for route admission; C28 should adopt them without changing effective role access.
