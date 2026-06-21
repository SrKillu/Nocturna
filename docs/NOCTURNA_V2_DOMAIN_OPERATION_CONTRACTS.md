# Nocturna V2 Domain Operation Contracts

STATUS: PENDING_REVIEW

This document describes future operation contracts only. It does not create endpoints, server actions, SQL, migrations, repositories, or permissions.

## Contract baseline

Every operation must independently validate:

1. authenticated session and active membership;
2. capability for the operation, not merely route visibility;
3. institution and required relationship from current persisted state;
4. input shape, lifecycle transition and concurrency version;
5. non-disclosing not-found behavior across tenant boundaries;
6. audit requirements and sensitive-data redaction.

Expected common errors: `NOT_AUTHENTICATED`, `ACTIVE_MEMBERSHIP_REQUIRED`, `ACCESS_DENIED`, `NOT_FOUND`, `VALIDATION_FAILED`, `CONFLICT`, `STALE_VERSION`, `INVALID_TRANSITION`, `DEPENDENCY_UNAVAILABLE`, `RATE_LIMITED`, and `UNKNOWN`.

## Core tenancy and identity operations

| Domain | GET list / detail | POST create | PATCH update | DELETE / archive | Specific action | Future capability / roles / relationship | Validation, errors, audit and main risk | First slice |
|---|---|---|---|---|---|---|---|---|
| Institutions | Detail for current membership; no ordinary global list | Provisioning only through separately approved administration | Ordinary settings separate from lifecycle | Archive only after dependency review | Suspend/reactivate | `canManageInstitution`; owner; active owner membership in same institution | Unique code, legal status, dependencies; audit all lifecycle transitions; risk is tenant-root takeover | Deferred |
| Memberships | User lists own active memberships; admins may list same-institution memberships later | Invite/accept flow | Narrow role/status updates | Revoke, not hard-delete | Select active membership, suspend, revoke | Own relationship for selection; `canManageUsers`/future membership capabilities for admin | Current membership state, role validity, last-owner protection, session invalidation; audit all changes | Core prerequisite only |
| Roles/capabilities | Read effective grants for current membership | New role/grant creation deferred | Versioned grant update | Retire binding | Assign/revoke role | Owner/admin under explicit capability; same institution | No privilege above actor, no editable JWT metadata authority; audit before/after; risk privilege escalation | Deferred |
| Profiles | Current user detail; narrow staff/student projections elsewhere | Usually created with onboarding | Self-service limited fields; admin status separately | Archive after unlink checks | Activate/deactivate | Own profile or identity administration capability | Normalize names/locale, unique auth link; audit status; risk identity conflation | Prerequisite |
| Academic terms | Same-institution list/detail | Create planning term | Edit planning term | Archive closed term | Activate/close | Future term management; owner/admin; same institution | Date order/overlap, one-active policy, dependency conflicts; audit activate/close | Required for first slice |
| Institution settings | Current institution read | Initial version during provisioning | Versioned update | Retire version, no destructive delete | Restore prior approved version | `canViewInstitutionSettings` read; future `canManageInstitutionSettings` write; owner/admin | Schema validation, stale version, secret redaction; audit before/after; risk config escalation | Deferred |

## Academic structure and people operations

| Domain | GET list / detail | POST create | PATCH update | DELETE / archive | Specific action | Future capability / roles / relationship | Validation, errors, audit and main risk | First slice |
|---|---|---|---|---|---|---|---|---|
| Courses | Bounded tenant/assignment/enrollment list; detail by opaque ID | Create catalog course | Update metadata/status | Archive when no active dependency conflict | Activate/complete | `canViewCourses`; `canManageCourses`; admins institution-wide, staff/student relationship-scoped | Unique tenant code, valid level/category/status; not-found hides cross-tenant existence; audit lifecycle | **Allow read only** |
| Sections | Bounded list/detail by term/course and relationship | Create offering | Update capacity/room/status | Archive/cancel | Open/complete/cancel | `canViewSections`; `canManageSections`; admin or assigned/enrolled relation for read | Course/term tenant equality, capacity, code uniqueness; audit status/capacity; risk privilege bridge | **Allow read only** |
| Section staff | List assignments for authorized section/staff | Assign staff | Change role/effective dates | End/revoke | Delegate/revoke responsibility | Future `canAssignCourseStaff`; admins; active same-institution staff | No duplicate active role, effective dates, actor authority; audit every change | Seed/read only |
| Students | Directory list with minimal projection; detail uses separate profile contract | Create student record | Update directory-safe fields/status | Archive, not delete | Activate/withdraw/graduate | `canViewStudents`; future `canManageStudents`; admins or assigned staff for read | Unique student code, identity linkage, status transition; audit sensitive changes; risk broad directory exposure | Candidate 2 read only |
| Student profiles | Relationship-scoped detail only | Create profile with student | Update field-specific projection | Version/archive | Link/unlink auth profile under strict process | `canViewStudentProfiles`, `canViewOwnStudentProfile`, future manage capability; assignment/own/link | Field-level validation and projection, stale version; audit sensitive fields; risk excessive PII | Candidate 2 read only |
| Guardians | Guardian self detail; admin detail only if approved | Create/invite guardian | Update verified contact fields | Archive | Verify/suspend | Own relationship or future guardian-management capability | Contact verification, custody/legal review; audit status; risk sensitive relationship exposure | Deferred |
| Guardian links | Guardian lists own verified links; authorized admin detail | Request link | Update permissions/effective dates | Revoke, never erase | Verify/activate/suspend | `canViewLinkedStudents` for active linked guardian; future `canManageGuardianLinks` for administration | Same institution, consent, no unauthorized duplicates; audit every transition | Deferred |
| Staff | Owner/admin directory/detail with minimal employment projection | Invite/create staff profile | Update area/status/assignment metadata | Archive | Suspend/reactivate | `canViewStaff`; future invite/assignment/suspend capabilities; same institution | Unique staff code, active membership; audit identity/status; risk mixing directory and auth admin | Deferred |
| Enrollments | Owner/admin bounded list/detail initially; future student/guardian projection | Create pending enrollment | Edit while allowed | Archive only after terminal state | Approve, transfer, suspend, withdraw, complete | `canViewEnrollments`; future manage/approve/withdraw; same institution and valid student/section | Capacity, term, duplicate active enrollment, expected version; append transition audit; risk race conditions | Candidate 3 read only |

## Academic operation contracts

| Domain | GET list / detail | POST create | PATCH update | DELETE / archive | Specific action | Future capability / roles / relationship | Validation, errors, audit and main risk | First slice |
|---|---|---|---|---|---|---|---|---|
| Schedule | Date-window list and entry detail | Create schedule entry | Reschedule/update metadata | Cancel/archive | Conflict check/override | `canViewSchedule`; future `canManageSchedule`; admin or assigned section staff | Timezone, start/end, room/staff overlap, term boundary; audit override; risk collisions | Deferred |
| Attendance | Session/history list; entry detail scoped by section/own/link | Open session | Record current session or request correction | No hard-delete | Lock, request correction, approve/reject correction | `canViewAttendance`, future record/correct/approve capabilities; assigned staff/admin/own/link | Active enrollment roster, one entry per session, locked history, expected version; full before/after audit | Deferred |
| Evaluations | Section-scoped list/detail; published student projection later | Create draft | Edit draft/review state | Archive | Publish/close/reopen under policy | `canViewEvaluations`; future manage/publish; assigned staff/admin, enrolled student for published read | Due windows, category/weight, lifecycle, visibility; audit publish/weight; risk premature disclosure | Deferred |
| Gradebook | Staff matrix/detail; own/linked published projections later | Create grade item through evaluation workflow | Enter/update score with version | Archive item only before/under approved rules | Lock, approve change, publish | `canViewGradebook`, `canViewOwnGrades`, `canViewLinkedStudentGrades`, future enter/approve/publish capabilities | Exact numeric bounds, enrolled student, locked/published state, deterministic formula; immutable audit | Deferred |
| Materials | Metadata list/detail under course relationship | Create metadata/draft version | Update metadata or add version | Archive | Publish/replace version, request signed access later | `canViewMaterials`; future manage/upload/archive; assigned staff/enrolled student | Course scope, MIME/size/checksum, object path, status; audit upload/publish/archive; risk object leakage | Deferred |
| Library | Catalog list/detail; borrower sees own loans | Create item/copy | Update metadata/copy state | Archive | Checkout/renew/return/mark lost | `canAccessLibrary`; future manage library/loans; institution and borrower relation | Copy availability, due policy, one active loan, expected version; audit overrides; risk borrower privacy/inventory drift | Deferred |

## Operational service contracts

| Domain | GET list / detail | POST create | PATCH update | DELETE / archive | Specific action | Future capability / roles / relationship | Validation, errors, audit and main risk | First slice |
|---|---|---|---|---|---|---|---|---|
| Reports | Authorized catalog/list; result detail only within source scope | Create export job | Update schedule/definition if permitted | Archive definition; expire artifact | Run/export/schedule/cancel | `canViewReports`; future export/schedule; source-domain relationships still apply | Validate parameters and max range; async status/errors; audit request/download; risk bulk exfiltration | Deferred |
| Certificates | Owner/admin list/detail; minimal public verification projection later | Create template or issuance request | Edit draft template/request only | Retire template; never delete issued record | Issue/revoke/verify | `canViewCertificates`; future manage/issue/revoke/verify; same institution and eligible subject | Snapshot completeness, unique verification code, immutable issue; audit issue/revoke; risk fraud | Deferred |
| Notifications | Recipient-owned inbox/detail | Create broadcast/event through approved service | Recipient read/archive state; preferences | Archive recipient row only | Mark read, send, retry, cancel | `canViewNotifications`; future manage/send; recipient ownership or authorized institution sender | Recipient expansion, deduplication, payload minimization; audit broadcasts; risk wrong recipients | Deferred |
| Audit log | Owner/admin redacted cursor list/detail | System/internal append only | No event mutation; separate review annotation if approved | Retention process only | Export redacted set | `canViewAuditLog`; future export; same institution, no ordinary client writes | Strict metadata schema/redaction, retention, cursor; risk secret/PII capture and tampering | Required cross-cutting |
| Dashboard | Role/context aggregate only | N/A | N/A | N/A | Refresh/recompute snapshot later | Existing route membership plus source-domain authorization | Bounded query cost, freshness, consistent source scope; risk aggregate leakage | Read models after source slice |
| Support/diagnostics | Case-owned list/detail and redacted diagnostics | Open case/request access | Update case | Close/archive | Approve/revoke/expire diagnostic grant | Future support capabilities plus time-bound approved grant | Consent, reason, scope, expiry; audit every diagnostic access; risk privilege bypass | Deferred |

## Read-only first-slice error contract

The first vertical slice should support:

- `200`-equivalent success with bounded items/detail;
- empty list without error;
- authentication and active-membership failures;
- relationship-based access denial;
- non-disclosing not-found for cross-tenant IDs;
- invalid filter/cursor validation;
- dependency unavailable and unknown problem states;
- deterministic test fixtures for owner, admin, assigned teacher/assistant, enrolled student, unrelated user, cross-institution user, guardian and support.

Writes, deletes, imports, exports, uploads, publishing, approvals and lifecycle transitions remain deferred from the first slice.
