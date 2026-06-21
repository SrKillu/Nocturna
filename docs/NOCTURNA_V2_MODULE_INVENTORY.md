# Nocturna V2 Module Inventory

STATUS: PENDING_REVIEW

- Analysis date: June 20, 2026
- Branch: `feature/nocturna-c23-module-inventory-sicai-gap-map`
- Base: `main`
- Base commit: `2d2e9b0e5b473bf6e1a4632e4226a14dff6b2c91`
- Scope: repository inspection only; no production, Supabase, endpoint, migration, or deployment changes

## Executive summary

Nocturna V2 currently has a protected, server-rendered application shell and 20 routed module views. Authentication, active-membership resolution, route protection, and capability derivation are partially integrated with Supabase. The academic and administrative modules are typed, tested visual foundations backed by local mock data; they are not yet connected to production data, persistence, Storage, or domain APIs.

The next safe milestone is not broad database implementation. It is to stabilize capability names, route-to-role contracts, data contracts, and UI quality before designing the reviewed PostgreSQL/RLS model.

## Status definitions

- **Functional real:** production-capable domain behavior with real persistence and authorization.
- **Partial:** real infrastructure exists, but the full production flow is incomplete.
- **Visual mock:** protected UI, types, fixtures, and state coverage exist, but domain data is local.
- **Not implemented:** no usable foundation exists yet.

## Route and module inventory

| Module | Route | State | Roles | Capability contract | Principal implementation | Types, mocks, and tests | Integration and primary risk | Recommended next step |
|---|---|---|---|---|---|---|---|---|
| V2 entry | `/v2` | Partial | All authenticated memberships | Session and active membership | Redirects to dashboard through the protected V2 layout | Auth and middleware tests | Real session boundary; no domain data | Keep as the single authenticated V2 entry |
| Dashboard | `/v2/dashboard` | Visual mock | All roles, with role variants | Authenticated membership; no module capability | Dashboard shell, summary cards, work queue, role-aware navigation | `dashboard-v2` types/mocks; no dedicated dashboard unit suite | Mock academic indicators could be mistaken for live data | Define dashboard query contracts and freshness rules |
| Courses | `/v2/courses` | Visual mock | Owner, admin, teacher, assistant, student | Any of `canManageCourses`, `canGrade`, `canSubmit` | Courses page, filters, cards/table, responsive views | `courses-v2` types/mocks/tests | Read and manage permissions are conflated | Split view/manage capabilities and define course/section contracts |
| Course workspace | `/v2/courses/[courseId]` | Visual mock | Owner, admin, teacher, assistant, student | Same as courses | Workspace header, overview, roster, activity and state panels; loading/not-found | Shared `courses-v2` types/mocks/tests | Route is typed but entirely fixture-backed | Define course-detail aggregate and membership-scoped access |
| Students | `/v2/students` | Visual mock | Owner, admin, teacher, assistant | Any of `canManageCourses`, `canGrade` | Student directory, filters, summary, desktop/mobile views | `students-v2` types/mocks/tests | No dedicated student-view capability | Add view/manage distinction and institution scoping |
| Student profile | `/v2/students/[studentId]` | Visual mock | Owner, admin, teacher, assistant | Same as students | Profile header, academic summary, attendance, guardians and state panels; loading/not-found | Shared `students-v2` types/mocks/tests | Sensitive student data requires field-level policy decisions | Define authorized profile projection by role |
| Student self view | `/v2/my-space` | Visual mock | Student | `canSubmit`, while excluding managerial capabilities | Student summary, courses, tasks, performance and state panels | `my-space-v2` types/mocks/tests | Capability inference is indirect | Add an explicit student-space access contract |
| Guardian space | `/v2/guardian-space` | Visual mock | Guardian | `canViewLinkedStudents` plus guardian role | Linked-student summary, progress, attendance, notices and state panels | `guardian-space-v2` types/mocks/tests | Relationship authorization and linked-student RLS are absent | Define guardian relationship and field-level RLS |
| Attendance | `/v2/attendance` | Visual mock | Owner, admin, teacher, assistant | `canManageAttendance` | Session summary, roster, filters, status controls and states | `attendance-v2` types/mocks/tests | Read and write authority are combined | Separate view/record/correct permissions and define audit rules |
| Evaluations | `/v2/evaluations` | Visual mock | Owner, admin, teacher, assistant | `canGrade` | Evaluation list, filters, status and summary components | `evaluations-v2` types/mocks/tests | Evaluation design and grade entry share one permission | Define assessment lifecycle and grading permissions |
| Materials | `/v2/materials` | Visual mock | Owner, admin, teacher, assistant | `canManageMaterials` | Material library, filters, cards/table and states | `materials-v2` types/mocks/tests | No Storage integration or upload policy | Design metadata, Storage paths, quotas, and signed access |
| Gradebook | `/v2/gradebook` | Visual mock | Owner, admin, teacher, assistant | `canGrade` | Grade matrix, filters, summaries and responsive views | `gradebook-v2` types/mocks/tests | No grading rules, locking, or historical audit | Define grade schema, calculation rules, and immutable history |
| Reports | `/v2/reports` | Visual mock | Owner, admin, teacher, assistant | `canViewReports` plus explicit role restriction | Report catalog, metrics, filters and states | `reports-v2` types/mocks/tests | No query/export contract or large-data strategy | Define report scopes, exports, and asynchronous generation |
| Certificates | `/v2/certificates` | Visual mock | Owner, admin | `canManageCertificates` | Certificate list, filters, issuance summaries and states | `certificates-v2` types/mocks/tests | No official-document lifecycle, signing, or verification | Define templates, issuance, revocation, and public verification |
| Staff | `/v2/staff` | Visual mock | Owner, admin | `canManageUsers` | Staff directory, summaries, filters and state components | `staff-v2` types/mocks/tests | User management and staff viewing are conflated | Separate directory viewing from identity/role administration |
| Enrollments | `/v2/enrollments` | Visual mock | Owner, admin | `canManageCourses` plus explicit role restriction | Enrollment queue, filters, summaries and states | `enrollments-v2` types/mocks/tests | No enrollment lifecycle or concurrency rules | Define application, enrollment, withdrawal, and transfer states |
| Schedule | `/v2/schedule` | Visual mock | Owner, admin, teacher, assistant | `canViewSchedule` | Calendar/list views, filters, event cards and states | `schedule-v2` types/mocks/tests | Read access is explicit; schedule management remains undefined | Add schedule management capability and conflict rules |
| Library | `/v2/library` | Visual mock | Owner, admin, teacher, assistant | `canAccessLibrary` | Catalog, circulation summaries, filters and states | `library-v2` types/mocks/tests | Read access is explicit; circulation authority remains undefined | Add library management capability and loan lifecycle |
| Institution settings | `/v2/settings` | Visual mock | Owner, admin | `canViewInstitutionSettings` plus explicit role restriction | Settings sections, institution profile, preferences, integrations and states | `settings-v2` types/mocks/tests | Read-only visual contract; no persistence or separate write capability | Design read/write settings capabilities and configuration schema |
| Audit log | `/v2/audit-log` | Visual mock | Owner, admin | `canViewAuditLog` plus explicit role restriction | Audit list, event details, filters, summaries and states | `audit-log-v2` types/mocks/tests | Retention, redaction, and immutable event storage remain undefined | Define audit persistence and privacy policy |
| Notifications | `/v2/notifications` | Visual mock | All roles | `canViewNotifications` plus explicit role allow-list | Inbox, filters, summaries, preferences and state components | `notifications-v2` types/mocks/tests | Delivery, read state, and preferences are local only | Define notification events, channels, preferences, and delivery tracking |

## Authentication and authorization infrastructure

| Area | Current state | Evidence | Remaining work |
|---|---|---|---|
| Supabase authentication | Partial | Server-side user resolution through Auth | Recovery, enrollment, hardening, observability, and staging validation |
| Active membership | Partial | Institution membership, role, institution, cookie selection, and capability derivation | Membership lifecycle, revocation behavior, policy tests, and production readiness |
| V2 route protection | Partial | Protected `/v2` boundary and server-side layout validation | Broader contract tests, telemetry, and controlled staging verification |
| Handler-validated V2 APIs | Partial | `/api/auth/me-v2` and `/api/memberships/active` validate session inputs | Domain endpoints, rate limits, error contracts, and API policy inventory |
| CSRF and middleware bridge | Partial | CSRF executes before handler-validated bypass; V1 remains on its existing path | Regression coverage across future endpoint additions |
| Domain persistence | Not implemented | Domain routes consume local mocks | Reviewed schema, RLS, repositories/endpoints, and staged migration plan |

## Role-to-visible-module matrix

The matrix reflects the current navigation and route contracts, not a proposed future policy.

| Role | Visible V2 modules |
|---|---|
| Owner | Dashboard, notifications, settings, audit log, courses, students, enrollments, staff, attendance, schedule, evaluations, gradebook, reports, certificates, materials, library |
| Admin | Dashboard, notifications, settings, audit log, courses, students, enrollments, staff, attendance, schedule, evaluations, gradebook, reports, certificates, materials, library |
| Teacher | Dashboard, notifications, courses, students, attendance, schedule, evaluations, gradebook, reports, materials, library |
| Assistant | Dashboard, notifications, courses, students, attendance, schedule, evaluations, gradebook, reports, materials, library |
| Student | Dashboard, notifications, courses, my space |
| Guardian | Dashboard, notifications, guardian space |
| Support | Dashboard, notifications |

## Current role capability matrix

| Capability | Owner | Admin | Teacher | Assistant | Student | Guardian | Support |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `canManageInstitution` | Yes | No | No | No | No | No | No |
| `canViewInstitutionSettings` | Yes | Yes | No | No | No | No | No |
| `canViewAuditLog` | Yes | Yes | No | No | No | No | No |
| `canViewSchedule` | Yes | Yes | Yes | Yes | No | No | No |
| `canAccessLibrary` | Yes | Yes | Yes | Yes | No | No | No |
| `canViewLinkedStudents` | No | No | No | No | No | Yes | No |
| `canViewNotifications` | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| `canManageUsers` | Yes | Yes | No | No | No | No | No |
| `canManageCourses` | Yes | Yes | No | No | No | No | No |
| `canManageSections` | Yes | Yes | No | No | No | No | No |
| `canGrade` | Yes | Yes | Yes | Yes | No | No | No |
| `canSubmit` | Yes | No | No | No | Yes | No | No |
| `canViewReports` | Yes | Yes | Yes | Yes | No | Yes | Yes |
| `canManageMaterials` | Yes | Yes | Yes | Yes | No | No | No |
| `canUseChat` | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| `canManageAttendance` | Yes | Yes | Yes | Yes | No | No | No |
| `canManageCertificates` | Yes | Yes | No | No | No | No | No |

## Module-to-capability matrix

| Module | Current capability gate | Effective roles | Contract quality |
|---|---|---|---|
| Dashboard | Authenticated active membership | All | Acceptable baseline |
| Notifications | `canViewNotifications` and explicit role allow-list | All | Purpose-specific read capability |
| Settings | `canViewInstitutionSettings` and owner/admin | Owner, admin | Purpose-specific read capability |
| Audit log | `canViewAuditLog` and owner/admin | Owner, admin | Purpose-specific read capability |
| Courses/workspace | Any of `canManageCourses`, `canGrade`, `canSubmit` | Owner, admin, teacher, assistant, student | Overloaded view/manage contract |
| Students/profile | Any of `canManageCourses`, `canGrade` | Owner, admin, teacher, assistant | Overloaded and indirect |
| Enrollments | `canManageCourses` and owner/admin | Owner, admin | Indirect |
| Staff | `canManageUsers` and owner/admin | Owner, admin | Management-heavy for read access |
| Attendance | `canManageAttendance` | Owner, admin, teacher, assistant | Read/write combined |
| Schedule | `canViewSchedule` | Owner, admin, teacher, assistant | Purpose-specific read capability |
| Evaluations | `canGrade` | Owner, admin, teacher, assistant | Reasonable but broad |
| Gradebook | `canGrade` | Owner, admin, teacher, assistant | Read/write combined |
| Reports | `canViewReports` and staff-like role | Owner, admin, teacher, assistant | Purpose-specific but role-limited |
| Certificates | `canManageCertificates` and owner/admin | Owner, admin | Read/write combined |
| Materials | `canManageMaterials` | Owner, admin, teacher, assistant | Read/write combined |
| Library | `canAccessLibrary` | Owner, admin, teacher, assistant | Purpose-specific access capability |
| My space | `canSubmit` plus exclusion of managerial capabilities | Student | Indirect role inference |
| Guardian space | `canViewLinkedStudents` and guardian role | Guardian | Purpose-specific relationship capability |

## Capability cleanup status

C24 replaced the first wave of temporary visual-foundation capability substitutions with explicit route-purpose capabilities. Read/write capability separation remains pending for future data integration.

Completed in C24:

- Audit log uses `canViewAuditLog`.
- Schedule uses `canViewSchedule`.
- Library uses `canAccessLibrary`.
- Guardian space uses `canViewLinkedStudents`.
- Notifications uses `canViewNotifications`.

Still pending:

- Student and course directories infer read access from management, grading, or submission capabilities.
- Attendance, gradebook, certificates, staff, enrollments, settings, schedule, and library still need read/write or view/manage separation before real data integration.

## Recommended future capabilities

Prioritize smaller read/write distinctions instead of granting broader management rights:

- `canManageSchedule`
- `canManageLibrary`
- `canManageNotifications`
- `canViewStudents` and `canManageStudents`
- `canViewCourses`
- `canViewAttendance` and `canRecordAttendance`
- `canViewGradebook`
- `canViewCertificates`
- `canViewStaff`
- `canManageEnrollments`
- `canExportReports`
- `canManageInstitutionSettings`

## Test and component coverage

- Eighteen domain mock/type pairs cover attendance, audit log, certificates, courses, dashboard, enrollments, evaluations, gradebook, guardian space, library, materials, my space, notifications, reports, schedule, settings, staff, and students.
- Eighteen domain unit suites validate mock selectors, filters, state helpers, and access-related behavior.
- Capability tests verify the role matrix; auth and middleware tests cover the V2 session boundary.
- Dynamic course and student routes include loading and safe not-found states.
- Current repository baseline after C27: 25 unit test files and 211 passing tests.
- Component foundations exist for desktop/mobile lists, filters, summaries, detail panels, and controlled empty, denied, error, loading, and problem states.

## Cross-cutting risks

1. Visual completeness can be confused with functional readiness.
2. Several capabilities combine read and write authority or act as semantic substitutes.
3. Domain entities do not yet have reviewed PostgreSQL identities, relationships, lifecycle states, or RLS policies.
4. Institution isolation has not been validated against real domain data.
5. Reports, exports, certificates, notifications, audit retention, and Storage require asynchronous and operational design.
6. Mock contracts may change once real data constraints, pagination, and failure modes are introduced.

## Recommended immediate action

Complete capability cleanup, route-role contract tests, UI QA, and a domain data-contract inventory before proposing schema or RLS migrations. Database work should proceed only through small reviewed vertical slices.

C25 added centralized route-role contract tests to reduce drift between navigation visibility and direct route authorization before database/RLS integration.

C27 added explicit read capabilities for overloaded domains while preserving current route behavior. Route adoption remains pending.
