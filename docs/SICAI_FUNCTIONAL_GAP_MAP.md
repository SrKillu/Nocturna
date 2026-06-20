# Nocturna V2 SICAI-Like Functional Gap Map

STATUS: PENDING_REVIEW

- Analysis date: June 20, 2026
- Branch: `feature/nocturna-c23-module-inventory-sicai-gap-map`
- Base commit: `2d2e9b0e5b473bf6e1a4632e4226a14dff6b2c91`

> Este documento compara Nocturna V2 contra una matriz funcional tipo sistema académico-administrativo inspirado en necesidades similares a SICAI, sin afirmar compatibilidad oficial ni copiar elementos propietarios.

This is a repository-based planning comparison. It does not rely on an official SICAI specification, internet research, or proprietary implementation details.

## Maturity scale

- **No existe:** no meaningful product foundation is present.
- **Visual mock:** protected UI, types, fixtures, and unit coverage exist, but no real domain persistence.
- **Parcial:** some real infrastructure exists, but the end-to-end production capability is incomplete.
- **Listo para integración:** contracts and policy design are sufficiently stable to begin a reviewed integration slice.
- **Funcional real:** production-capable behavior is implemented and validated.

## Functional gap matrix

| Area | Expected academic-administrative equivalent | Current Nocturna state | Route/foundation | Level | Roles | Required Supabase data | RLS requirement | Likely future endpoints | Principal risk | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| Authentication and session | Secure login, session continuity, logout, recovery | Real user/session validation and V2 boundary; lifecycle is incomplete | `/login`, `/v2`, Auth V2 APIs | Parcial | All | Auth users, profiles, session metadata | User owns session; institution membership must be active | Session/profile read, recovery and observability contracts | Session edge cases and account lifecycle | P0 |
| Multi-institution memberships | Users belong to one or more institutions with an active context | Active membership resolution and cookie selection exist | V2 layout, membership API | Parcial | All | Institutions, memberships, roles, membership status/history | Strict institution isolation; user can select only own active membership | List/select active membership | Cross-tenant leakage | P0 |
| Roles and permissions | Role and capability authorization | Static typed role capability matrix and route gates | RBAC libraries and tests | Parcial | All | Roles, permissions, overrides, membership-role bindings | Institution-scoped grants; privileged changes audited | Capability read and controlled role administration | Capability drift and over-broad grants | P0 |
| Student directory | Searchable institution student roster | Typed visual directory with filters and states | `/v2/students` | Visual mock | Owner, admin, teacher, assistant | Students, profiles, identifiers, enrollment summaries | Institution and authorized section scope | Student list/search | Sensitive data overexposure | P1 |
| Student profile | Academic and personal student record | Typed visual profile and safe not-found state | `/v2/students/[studentId]` | Visual mock | Owner, admin, teacher, assistant | Student profile, guardians, enrollments, attendance, grades | Field-level and relationship-aware access | Student detail aggregate | Excessive profile projection | P1 |
| Student self-service | Personal courses, tasks, progress, notices | Typed visual self view | `/v2/my-space` | Visual mock | Student | Own enrollments, submissions, grades, attendance, notices | Student can access only own records | My-space aggregate | Accidental peer access | P1 |
| Guardians | Linked-student academic visibility | Typed visual guardian space | `/v2/guardian-space` | Visual mock | Guardian | Guardian-student links, consent, visible summaries | Only explicitly linked students and allowed fields | Linked-student summary | Relationship and custody complexity | P1 |
| Staff directory | Staff roster, assignments, status | Typed visual staff directory | `/v2/staff` | Visual mock | Owner, admin | Staff profiles, contracts/assignments, memberships | Institution-scoped; identity admin separated from viewing | Staff list/detail | Mixing directory access with user administration | P2 |
| Courses | Course catalog and teaching assignments | Typed visual list and workspace | `/v2/courses`, `/v2/courses/[courseId]` | Visual mock | Owner, admin, teacher, assistant, student | Courses, terms, instructors, memberships, status | Institution plus enrollment/teaching relationship | Course list/detail | Overloaded course aggregate | P1 |
| Sections and groups | Course offerings, class groups, rosters | Represented conceptually inside mocks; no dedicated contract | Course/enrollment foundations | Visual mock | Owner, admin, teacher, assistant, student | Sections, groups, term, instructor, roster | Section membership and assigned staff | Section list/detail/roster | Missing core scheduling unit | P1 |
| Enrollments | Admission/enrollment lifecycle and course placement | Typed visual queue and status views | `/v2/enrollments` | Visual mock | Owner, admin | Applications, enrollments, transitions, reasons, term | Institution-scoped mutation with audited transitions | Enrollment list/create/transition | Duplicate or invalid state transitions | P1 |
| Schedule | Timetable and calendar conflict management | Typed visual calendar/list | `/v2/schedule` | Visual mock | Owner, admin, teacher, assistant | Time blocks, rooms, sections, staff, exceptions | Institution and assigned-section visibility | Schedule list/manage/conflict check | Time-zone and collision errors | P2 |
| Attendance | Session roster and attendance capture | Typed visual attendance workspace | `/v2/attendance` | Visual mock | Owner, admin, teacher, assistant | Attendance sessions, entries, reasons, corrections | Assigned-section write; scoped read; correction audit | Sessions, roster, record/correct attendance | Untracked corrections and bulk errors | P1 |
| Evaluations | Assessment definition and lifecycle | Typed visual evaluation management | `/v2/evaluations` | Visual mock | Owner, admin, teacher, assistant | Assessments, categories, weights, due dates, status | Assigned-course management | Evaluation CRUD and publish | Invalid weighting and lifecycle changes | P1 |
| Gradebook | Grade entry, calculation, locking, publication | Typed visual grade matrix | `/v2/gradebook` | Visual mock | Owner, admin, teacher, assistant | Grade items, scores, formulas, overrides, history | Assigned-course write; student/guardian scoped read | Gradebook read/write/publish | Calculation integrity and silent edits | P1 |
| Materials | Course resources and controlled file access | Typed visual resource library | `/v2/materials` | Visual mock | Owner, admin, teacher, assistant | Material metadata, course links, versions | Course-scoped metadata and Storage object policies | Material metadata and signed upload/download | Storage leakage and orphan files | P2 |
| Library | Catalog, copies, circulation, holds | Typed visual catalog/circulation foundation | `/v2/library` | Visual mock | Owner, admin, teacher, assistant | Titles, copies, borrowers, loans, holds, fines | Institution scope and borrower privacy | Catalog and circulation endpoints | Inventory and overdue-state inconsistency | P3 |
| Reports | Academic/operational reporting and exports | Typed visual report catalog | `/v2/reports` | Visual mock | Owner, admin, teacher, assistant | Reporting views, aggregates, export jobs | Scope results to authorized institution/sections | Report query and export jobs | Heavy queries and data leakage in exports | P2 |
| Certificates | Document templates, issuance, revocation, verification | Typed visual issuance foundation | `/v2/certificates` | Visual mock | Owner, admin | Templates, issued documents, signatures, revocations | Privileged issuance; public verification exposes minimum data | Issue/revoke/verify certificate | Fraud, immutable record requirements | P2 |
| Notifications | In-app notices, preferences, delivery state | Typed visual notification center | `/v2/notifications` | Visual mock | All | Notification events, recipients, preferences, deliveries, read state | Recipient-only access; controlled broadcaster permissions | Inbox, read state, preferences, send jobs | Duplicate delivery and privacy | P2 |
| Audit log | Trace privileged and sensitive actions | Typed visual audit explorer | `/v2/audit-log` | Visual mock | Owner, admin | Append-only events, actor, target, metadata, retention | Read only for dedicated auditors/admin; no client writes | Audit search/export | Tampering, secret/PII capture, retention | P1 |
| Institution settings | Institution profile and operational configuration | Read-only visual foundation | `/v2/settings` | Visual mock | Owner, admin | Institution settings, branding metadata, policy flags, versions | Separate read/write capabilities; institution scope | Settings read/update with validation | Configuration drift and privilege escalation | P2 |
| Security policies | Session, CSRF, route, endpoint, and data access controls | Middleware/session boundary exists; domain policies do not | Middleware, V2 layout, Auth V2 APIs | Parcial | All | Policy-relevant membership and audit data | Deny-by-default per domain and tenant | Policy diagnostics only if safe | Uneven controls across new endpoints | P0 |
| Imports and exports | Controlled bulk onboarding and data exchange | No domain import/export implementation | None | No existe | Owner, admin | Import jobs, mappings, validation errors, export jobs | Privileged jobs; generated files time-limited | Async import/export jobs | Formula injection, malformed data, bulk corruption | P3 |
| Official academic documents | Transcripts, constancias, official records | Certificate UI does not yet constitute official document support | Certificate/report foundations | No existe | Owner, admin | Document definitions, snapshots, signatures, verification | Privileged generation; minimal public verification | Generate/verify official document | Legal validity and record immutability | P3 |
| Institutional analytics | Trends, KPIs, cohorts, operational insights | Dashboard/report visuals use mock indicators | `/v2/dashboard`, `/v2/reports` | Visual mock | Owner, admin, selected staff | Aggregates, snapshots, dimensions, authorized metrics | Prevent cross-institution and unauthorized cohort inference | Analytics query/snapshot endpoints | Misleading metrics and expensive queries | P3 |
| Support operations | Support visibility without broad administration | Support receives dashboard/notifications only | `/v2/dashboard`, `/v2/notifications` | Visual mock | Support | Tickets, diagnostics, consented context, access logs | Least privilege, time-bound impersonation if ever allowed | Support case/diagnostic endpoints | Support role becoming a privilege bypass | P3 |
| Public API | External integrations and stable machine contracts | No public domain API | None | No existe | Future service principals | API clients, scopes, keys, webhooks, usage logs | Scoped service access and tenant isolation | Versioned public API/webhooks | Data exfiltration and compatibility burden | P4 |
| Mobile/Flutter application | Mobile academic workflows and offline strategy | No mobile client or mobile API contract | None | No existe | Role-dependent | Same domain data plus device/push metadata | Equivalent tenant and role policy across clients | Mobile-oriented API and push registration | Divergent authorization and offline conflicts | P4 |

## Priority interpretation

- **P0 — Security and tenancy prerequisites:** authentication lifecycle, active membership, RBAC cleanup, route contracts, institution isolation, and audit design.
- **P1 — Academic core:** students, guardians, courses, sections, enrollments, attendance, evaluations, and gradebook.
- **P2 — Operational support:** materials, staff, reports, certificates, notifications, settings, and schedule.
- **P3 — Extended administration:** library, imports/exports, official documents, analytics, and support tooling.
- **P4 — External surfaces:** public integrations and mobile clients after stable internal contracts.

## Findings

1. Nocturna V2 has broad visual coverage but no domain module is yet functionally real.
2. Auth/session, active membership, middleware protection, and RBAC are the only partial real integration layer.
3. The highest-value gap is not another visual module; it is a reviewed tenant-safe data model for the academic core.
4. Capability semantics need cleanup before RLS and endpoint policy are encoded.
5. A vertical-slice strategy is safer than creating all tables and endpoints at once.

## Recommended target before Supabase domain integration

Move the academic core from **Visual mock** to **Listo para integración** by completing:

- Explicit read/write capability decisions.
- Route-role-capability contract tests.
- Stable entity identifiers and TypeScript data contracts.
- Pagination, sorting, empty/error, and mutation-state conventions.
- Institution, section, student, guardian, and staff access rules written as policy requirements.
- UI quality assurance across owner, admin, teacher, assistant, student, guardian, and support roles.
