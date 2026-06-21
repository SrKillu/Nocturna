# Nocturna V2 Domain Data Contracts

STATUS: PENDING_REVIEW

## 1. Executive summary

This document inventories data contracts; it does not implement a database, API, migration, repository, or RLS policy. It translates the current V2 types, mocks, tests, routes, and visual states into candidate real-data boundaries for a future C30 Supabase schema/RLS draft.

No module is database-ready merely because it has a page and mock fixture. Before integration, every domain needs approved entity identity, institution isolation, relationship rules, lifecycle constraints, operation capabilities, indexes, audit behavior, query limits, policy tests, and synthetic staging data.

Current labels such as `courseName`, `sectionLabel`, `teacherName`, `periodLabel`, percentages, summaries, counts, `nextAction`, and status labels are projections. They must not become duplicated sources of truth when normalized entities exist.

## 2. Cross-domain contract rules

- Every institution-owned record needs an immutable primary identifier and an explicit `institution_id` or a reviewed, non-ambiguous relationship path to one.
- User identity, profile, membership, student, guardian, and staff records are related but distinct concepts.
- A capability permits an operation category; institution, assignment, enrollment, ownership, or guardian linkage determines which rows qualify.
- Relationship-derived access must use current database relationships, not client input or editable user metadata.
- Real timestamps should be timezone-aware; labels such as “today” or “current” are presentation output.
- Business lifecycle values should remain reviewable and evolvable; they are conceptual states here, not SQL enums.
- List contracts require bounded cursor pagination, deterministic sorting with an identifier tie-breaker, and tenant predicates on every query.
- Aggregate cards must identify source scope, freshness, and whether the value is authoritative or eventually consistent.
- Sensitive projections should return only fields required by the current view.
- Archive is preferred over destructive deletion for academic, identity, official-document, and audit records.

## 3. Current evidence map

| Domain | Related V2 routes | Current types / mocks / tests | Current visual evidence |
|---|---|---|---|
| Institutions, memberships, roles/capabilities | All `/v2`; `/auth/v2-session` | Auth/session types, capability matrix, route-role tests | Institution switcher, denied and problem states |
| Academic terms | Courses, students, enrollments, settings, reports | Period labels across domain fixtures; settings academic panel | Current/previous period filters |
| Courses and sections | `/v2/courses`, `/v2/courses/[courseId]` | `courses-v2`; course mocks/tests | List, workspace, roster/evaluation/material previews, loading, not-found |
| Students and profiles | `/v2/students`, `/v2/students/[studentId]`, `/v2/my-space` | `students-v2`, `my-space-v2`; mocks/tests | Directory, profile, own-space, filters, empty, loading, not-found |
| Guardians and links | `/v2/guardian-space` | `guardian-space-v2`; mocks/tests | Linked-student cards, attendance/evaluation/alert projections, empty |
| Staff and assignments | `/v2/staff` | `staff-v2`; mocks/tests | Directory, workload and invitation previews |
| Enrollments | `/v2/enrollments` | `enrollments-v2`; mocks/tests | Queue, capacity, transition preview, filters, empty |
| Schedule | `/v2/schedule` | `schedule-v2`; mocks/tests | Week grid, conflicts, upcoming sessions, filters, empty |
| Attendance | `/v2/attendance` | `attendance-v2`; mocks/tests | Sessions, student status summary, alerts, filters, empty |
| Evaluations | `/v2/evaluations` | `evaluations-v2`; mocks/tests | Evaluation list, deadlines, submission counts, filters, empty |
| Gradebook | `/v2/gradebook` | `gradebook-v2`; mocks/tests | Student averages, distribution, risk list, filters, empty |
| Materials | `/v2/materials` | `materials-v2`; mocks/tests | Metadata list, recent items, filters, empty; no real Storage data |
| Library | `/v2/library` | `library-v2`; mocks/tests | Catalog, collections, featured resources, filters, empty |
| Reports | `/v2/reports` | `reports-v2`; mocks/tests | Catalog, insights, schedules, filters, empty; no exports |
| Certificates | `/v2/certificates` | `certificates-v2`; mocks/tests | Readiness, templates, eligibility, filters, empty |
| Notifications | `/v2/notifications` | `notifications-v2`; mocks/tests | Inbox, digest, preferences, filters, empty |
| Audit log | `/v2/audit-log` | `audit-log-v2`; mocks/tests | Event search, risk signals, recent activity, empty |
| Institution settings | `/v2/settings` | `settings-v2`; mocks/tests | Read-only panels, statuses, empty |
| Dashboard | `/v2/dashboard` | `dashboard-v2`; mock | Cross-domain metrics, queue and activity |
| Support/diagnostics | Dashboard and notifications only | No dedicated domain types or route | Future-only contract |

## 4. Domain contracts

### 4.1 Core tenancy and identity

| Domain | Probable entities and key fields | Identifiers and relationships | Tenant boundary and sensitive fields | Lifecycle and operations | Query contract, states, audit, RLS notes and risks |
|---|---|---|---|---|---|
| Institutions | `institutions`: legal/display name, code, locale, timezone, status, timestamps | Opaque `institution_id`; parent of settings, memberships and every academic domain | Root tenant. Legal identifiers, contacts and branding references are sensitive | `provisioning → active → suspended → archived`; read, update ordinary settings, suspend/archive only through privileged workflow | Lookup by user membership or code; no unrestricted list. Audit create/status/critical settings. Risk: cross-tenant root compromise |
| Institution settings | `institution_settings`, optional version history: academic defaults, module flags, notification/security policies, branding metadata | `institution_settings_id`, unique active row/version per institution | Same institution plus `canViewInstitutionSettings`; secrets and integration credentials must not be stored in readable settings projections | `draft/configured/review/disabled`; read, versioned update, restore reviewed version | Detail-oriented, no broad pagination. Validation and conflict on stale version. Audit before/after with redaction. Risk: privilege/configuration escalation |
| Profiles | `profiles`: auth user link, display name, locale, active status, avatar metadata | `profile_id`; unique `auth_user_id`; may link to multiple memberships and person records | User-owned base profile; contact and identity data sensitive | `invited/active/inactive/archived`; self read/update limited fields; admin lifecycle separate | Exact lookup only; never expose global directory. Audit status and identity linkage. Risk: confusing auth identity with student/staff identity |
| Memberships | `memberships`: institution, profile, role, status, joined/ended timestamps, session version | `membership_id`; unique active membership per institution/profile/role policy | Direct tenant membership boundary. Role, status and revocation data sensitive | `invited/active/suspended/revoked/expired`; list own memberships, select active, invite, suspend, revoke | Filter status/institution, deterministic order. Empty/no active membership already modeled. Audit every transition. RLS must use active membership from current DB state |
| Roles and capabilities | Static or institution-scoped `roles`, `capabilities`, `role_capabilities`, optional reviewed overrides | Stable role/capability keys; bindings scoped to institution only if customization is approved | Authorization data; no editable client metadata as authority | Role definitions reviewed/versioned; grants active/revoked | Read effective grants for current membership; privileged mutation deferred. Audit every grant/revoke. Risk: stale or over-broad claims |
| Academic terms | `academic_terms`: institution, code, name, start/end dates, status, ordering | `academic_term_id`; unique `(institution_id, code)` | Institution-owned; dates generally non-sensitive | `planning/active/closed/archived`; create, activate, close, archive | Filter status/year; sort start date desc. Conflict on overlapping “active” policy. Audit activation/closure. RLS same institution |

### 4.2 Academic structure and people

| Domain | Probable entities and key fields | Identifiers and relationships | Tenant boundary and sensitive fields | Lifecycle and operations | Query contract, states, audit, RLS notes and risks |
|---|---|---|---|---|---|
| Courses | `courses`: institution, code, name, description, level, category, status | `course_id`; unique active `(institution_id, code)`; offered through sections | Institution admins see institution scope; staff by assignment; students by active enrollment | `planning/active/completed/archived`; list/detail/create/update/archive | Search code/name; filter term, level, category, status; sort name/code/recent; cursor page 25/100 max. Loading/empty/denied/error/not-found exist. Audit lifecycle. Risk: treating catalog visibility as section access |
| Sections/groups | `sections`: course, term, section code, capacity, room/default schedule, status | `section_id`; unique `(institution_id, academic_term_id, course_id, code)` | Institution relation through course/term. Roster and schedule are sensitive | `planning/open/active/completed/cancelled/archived`; create/update/cancel/archive | Filter term/course/status/staff; capacity and conflict validations. Audit capacity/status. RLS via admin, section staff, or active enrollment |
| Course staff assignments | `section_staff`: section, membership/staff profile, assignment role, start/end, status | `section_staff_id`; unique active `(section_id, membership_id, role)` | Same institution and active staff membership | `planned/active/ended/revoked`; assign, change scope, end | Filter section/staff/status; no public search. Audit every assignment. RLS is a key relationship predicate for courses, students, attendance, grades and materials |
| Students | `students`: institution, student code, profile link if authenticated, status, admission metadata | `student_id`; unique `(institution_id, student_code)`; optional unique active profile link | Directory fields limited; legal identity, contacts and support indicators sensitive | `applicant/active/follow_up/inactive/graduated/withdrawn/archived`; read directory, create/update/archive deferred | Search code/name; filter status, level, course/section, risk; sort name/code/status; cursor 25/100. Empty/denied/not-found modeled. Audit identity/status. Risk: institution-wide exposure to assigned staff |
| Student profiles | `student_profiles`: student, preferred/display data, academic summary inputs, support notes/flags | `student_profile_id`, usually unique `student_id` | Field-level projections differ for admin, assigned staff, self and linked guardian | Versioned active profile; updates restricted and audited | Detail projection, no global list. Not-found and denied distinct. Sensitive notes must be separated from general profile. RLS requires institution plus assignment/own/link relationship |
| Guardians | `guardians`: institution, profile link, contact/verification state | `guardian_id`; optional profile; many-to-many with students | Contact, custody/consent and verification fields highly sensitive | `invited/pending_verification/active/suspended/archived`; read own identity, link management deferred | Exact self lookup; no institution-wide guardian list for ordinary staff. Audit verification/status |
| Guardian-student links | `guardian_student_links`: guardian, student, relationship, permissions/projection, consent, effective dates, status | `guardian_student_link_id`; unique active `(guardian_id, student_id, relationship)` | Relationship itself is sensitive. Must belong to same institution | `pending/verified/active/suspended/revoked/expired`; request, verify, activate, revoke | List linked students for current guardian only; stable name order. Empty state exists. Audit all transitions. Risk: unauthorized child linkage |
| Staff | `staff_profiles`: institution, membership/profile, staff code, area, employment/active status | `staff_profile_id`; unique `(institution_id, staff_code)` and active membership relationship | Contact, contract, workload and HR data need separate projections | `invited/active/follow_up/inactive/archived`; directory read; identity/admin actions separate | Search name/code; filter role, status, area, assignment; sort name/area/status; cursor. Empty/denied modeled. Audit status and identity links |
| Enrollments | `enrollments` plus transition history: student, section, term, type, status, effective dates, reason | `enrollment_id`; unique active `(student_id, section_id, academic_term_id)` | Same institution through student and section; student/guardian projections limited | `pending/review/active/suspended/completed/withdrawn/rejected`; create, approve, transfer, suspend, withdraw | Search student code/name; filter term/course/section/status/type/risk; sort updated/name; cursor. Empty/denied modeled. Audit immutable transitions. Risk: duplicate active enrollment and capacity races |

### 4.3 Academic operations

| Domain | Probable entities and key fields | Identifiers and relationships | Tenant boundary and sensitive fields | Lifecycle and operations | Query contract, states, audit, RLS notes and risks |
|---|---|---|---|---|---|
| Schedule | `schedule_entries`, rooms/resources, exceptions: section, staff, room, start/end, recurrence/type/status | `schedule_entry_id`; section/term relationship | Staff by assignment, admins by institution; student visibility later via enrollment | `pending/scheduled/in_progress/completed/cancelled/rescheduled`; create/reschedule/cancel | Filter date range, course, section, staff, room, status; sort start time; bounded windows. Empty/conflict states exist. Audit overrides. Use overlap constraints/index concepts in C30. Risk: timezone and collisions |
| Attendance | `attendance_sessions`, `attendance_entries`, `attendance_corrections`: section/date, student enrollment, status, reason, actor | Separate immutable IDs; one entry per session/enrollment | Assigned staff and admins; own/linked projections later. Health/support reasons sensitive | Session `pending/open/recorded/locked`; entry `present/late/absent/excused/pending`; correction `requested/approved/rejected/applied` | Filter term/date range/course/section/status/student; sort date desc/name; cursor for history. Empty/denied/error modeled. Audit every record/correction with before/after. Risk: silent historical edits |
| Evaluations | `evaluations`, `evaluation_categories`: section, title, type, weight, due/open/close dates, visibility, status | `evaluation_id`, `evaluation_category_id`; unique category ordering per section/term | Staff by section assignment; students only when published and enrolled | `draft/active/review/completed/archived`; create/update/publish/close/archive | Search title; filter term/course/section/type/status/date window; sort due date/status; cursor. Empty states exist. Audit publish/weight changes. Risk: invalid totals and premature disclosure |
| Gradebook | `grade_items`, `grade_scores`, immutable grade history/change requests: evaluation/category, enrollment, score, status, published_at | IDs per item/score/change; unique `(grade_item_id, enrollment_id)` | Assigned staff/admin; self and guardian only approved published projections | Item `draft/open/locked/published/archived`; score `pending/entered/review/approved/published`; change `requested/approved/rejected/applied` | Filter term/course/section/status/range/student; sort student/name/average; cursor. Empty/denied modeled. Audit every score change. Risk: calculation drift and unauthorized alteration |
| Materials | `materials`, `material_versions`: course/section, title, type, visibility, status, object metadata, checksum | `material_id`, `material_version_id`; object path derived from tenant/course/material/version, never trusted from client | Assigned staff and enrolled students according to visibility; object metadata sensitive | `draft/pending/published/archived`; create metadata, upload version, publish, replace, archive | Search title; filter course/section/type/visibility/status/period; sort updated/title; cursor. Empty/denied modeled. Audit upload/publish/archive. Storage policy must mirror metadata relationship |
| Library | `library_items`, `library_copies`, `library_loans`, collections: bibliographic metadata, copy barcode/status, borrower, due/return | Item/copy/loan/collection IDs; unique tenant catalog code/barcode | Institution catalog; borrower loan history private | Item `draft/active/archived`; copy `available/reference/loaned/lost/repair`; loan `active/overdue/returned/lost/waived` | Search title/author/code; filter collection/type/course/level/availability; sort title/recent; cursor. Empty states exist. Audit loan overrides/write-offs. Risk: inventory drift and borrower privacy |

### 4.4 Operational services

| Domain | Probable entities and key fields | Identifiers and relationships | Tenant boundary and sensitive fields | Lifecycle and operations | Query contract, states, audit, RLS notes and risks |
|---|---|---|---|---|---|
| Reports | `report_definitions`, `report_exports`, optional schedules: category, scope, parameters, status, artifact metadata | Definition/export IDs; source relationships by institution/course/section | Results inherit every source-domain restriction; artifacts are sensitive bulk data | Definition `active/archived`; export `queued/running/completed/failed/expired`; schedule `active/paused` | Filter category, scope, period, status; sort updated; cursor. Empty/error modeled. Audit request/download/expiry. Risk: bulk exfiltration and expensive queries |
| Certificates | `certificate_templates`, `issued_certificates`, `certificate_revocations`: subject snapshot, type, status, verification code, issue/revoke metadata | Template/issued/revocation IDs; unique opaque verification code | Institution admins; public verification exposes minimum non-sensitive projection only | Template `draft/active/retired`; certificate `pending/review/issued/blocked/revoked`; revocation immutable | Search recipient/code; filter type/course/term/status/eligibility; sort recent; cursor. Empty modeled. Audit issue/revoke. Risk: fraud and mutable official snapshots |
| Notifications | `notifications`, `notification_recipients`, `notification_preferences`, optional delivery attempts | Notification/recipient/preference IDs; unique recipient row per notification/membership | Recipient owns inbox row; broadcaster constrained by institution and capability. Payload may contain academic PII | Notification `draft/queued/sent/cancelled`; recipient `pending/delivered/unread/read/archived/failed`; preference active/versioned | Search title/detail; filter module/type/priority/status/channel/date; sort occurred desc; cursor. Empty modeled. Audit broadcasts and preference changes. Risk: wrong recipients/duplicate delivery |
| Audit log | Append-only `audit_events`: institution, actor membership, action, target type/id, severity, outcome, redacted metadata, occurred_at, request correlation | Time-sortable opaque event ID; target references may be polymorphic but not authoritative FKs | Owner/admin redacted view; no ordinary client inserts/updates/deletes. Never store secrets | Append-only; review state may live separately from immutable event | Filter date range/module/action/severity/outcome/actor/target; sort occurred desc/id; cursor only. Empty modeled. Audit system must resist tampering. Risk: PII/secrets in metadata and retention overreach |
| Dashboard | Read model/queries over authorized domains; optional materialized snapshots later | No standalone source-of-truth entity required initially | Must derive from already-authorized records and preserve same scope | Read-only aggregate; freshness contract required | One bounded aggregate per role/context; loading/problem/empty modeled. Risk: misleading stale metrics and authorization bypass through aggregates |
| Support/diagnostics | Future `support_cases`, `support_case_access_grants`, redacted diagnostics, access events | Case/grant IDs; explicit institution and expiration | No academic access by role alone; time-bound approved grants only if policy is approved | Case `open/investigating/waiting/resolved/closed`; grant `pending/active/expired/revoked` | Search case reference/status; no broad person search. Audit every access. Risk: support becoming a privilege bypass |

## 5. Common endpoint-shape requirements

These are contracts, not endpoint implementations:

- List input: tenant context from validated membership, opaque cursor, bounded `limit`, documented filters, deterministic `sort`.
- List output: `items`, `nextCursor`, optional `totalEstimate`, applied filters, and freshness when aggregate data is shown.
- Detail input: opaque domain ID; never authorize from a display code alone.
- Detail output: role/relationship-specific projection; do not serialize hidden fields as null placeholders.
- Mutation input: validated lifecycle transition, expected version for concurrency-sensitive rows, reason for high-risk changes.
- Error vocabulary: unauthenticated, no active membership, denied, not found (without leaking cross-tenant existence), validation, conflict, stale version, invalid transition, rate limited, dependency unavailable, unknown.
- State mapping: existing V2 pages already model authentication redirect, membership selection, institution unavailable, access denied, generic problem, module empty, filtered empty, loading for dynamic course/student routes, and safe not-found.

## 6. Mock-to-real conversion rules

- Replace label fields with joins/projections from normalized records.
- Replace `audiences` arrays with server-side relationship predicates.
- Replace `period: current/recent/previous` with term/date filters and presentation mapping.
- Replace computed percentages/counts/risk labels with documented calculation/query contracts.
- Replace `nextAction` strings with UI decisions derived from capabilities and lifecycle state.
- Keep fixtures as synthetic test adapters until equivalent real query contracts and policy tests exist.

## 7. Recommended dependency order for C30

1. Institutions, profiles, memberships, role/capability bindings and academic terms.
2. Courses, sections and section staff assignments.
3. Students, student profiles, guardians and guardian-student links.
4. Enrollments and immutable enrollment transitions.
5. Schedule and attendance.
6. Evaluations and gradebook.
7. Materials/Storage and library.
8. Reports, certificates, notifications, audit and settings.
9. Support tooling only after a separate least-privilege decision.

Courses plus sections is the recommended first read-only vertical slice because it establishes the relationship spine used by students, enrollments, attendance, evaluations, gradebook, materials and reporting.
