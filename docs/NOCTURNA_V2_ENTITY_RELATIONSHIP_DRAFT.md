# Nocturna V2 Entity Relationship Draft

STATUS: PENDING_REVIEW

This is a conceptual normalized entity inventory, not SQL. Names, keys, constraints, indexes, deletion behavior, and priorities require C30 review together with RLS.

## Design conventions

- Use opaque immutable IDs for externally addressed records; retain human codes as tenant-scoped alternate keys.
- Normalize core relationships; use structured metadata only for optional attributes, never to hide tenant or authorization relationships.
- Every foreign-key access path needs a reviewed index. Every list path begins with tenant or relationship scope.
- Timestamps are timezone-aware; date-only academic boundaries use dates.
- Business states are conceptual and may become checked text or reference tables after lifecycle review.
- Soft delete/archive is mandatory where history, audit, grades, attendance, enrollments, official documents, or identity links matter.

## Core tenancy

| Entity | Purpose | Probable keys and institution path | Main relationships | Candidate uniqueness and indexes | Archive / audit / sensitivity | Priority |
|---|---|---|---|---|---|---|
| `institutions` | Tenant root | PK `institution_id` | Has settings, terms, memberships and all domain records | Unique code/slug; status index | Archive, never hard-delete with domain history; legal/contact data sensitive | P0 |
| `institution_settings` | Versioned institution configuration | PK; direct `institution_id` | Institution, optional superseded version | Unique active version; `(institution_id, version desc)` | Version/archive; audit before/after with redaction | P1 |
| `profiles` | Application identity profile linked to Auth | PK; no tenant ownership by itself | Auth user; memberships; optional student/guardian/staff person links | Unique auth user; active-status index | Archive; PII sensitive | P0 |
| `memberships` | User participation in an institution | PK; direct `institution_id`; `profile_id` | Institution, profile, role | Unique active membership policy; indexes on profile/status and institution/role/status | Revoke/archive; every transition audited | P0 |
| `roles` | Stable or institution-defined role vocabulary | PK/key; global or optional institution scope | Role-capability grants, memberships | Unique role key per scope | Version changes audited; authorization-sensitive | P0 |
| `capabilities` | Stable operation vocabulary | PK/key | Role-capability grants | Unique capability key | Append/retire rather than silent rename | P0 |
| `role_capabilities` | Role-to-capability binding | Composite or surrogate PK; institution path through role | Role, capability | Unique `(role_id, capability_id)`; both FK indexes | Grant/revoke audited | P0 |
| `academic_terms` | Institution academic periods | PK; direct `institution_id` | Sections, enrollments, schedule, evaluations | Unique institution/code; `(institution_id, status, start_date desc)` | Archive after close; dates operational | P0 |

## Academic core

| Entity | Purpose | Probable keys and institution path | Main relationships | Candidate uniqueness and indexes | Archive / audit / sensitivity | Priority |
|---|---|---|---|---|---|---|
| `courses` | Reusable course catalog definition | PK; direct `institution_id` | Sections, materials/report scope | Unique institution/code; tenant/status/name indexes | Archive; lifecycle audited | P0 |
| `sections` | Term-specific course offering/group | PK; direct institution plus course/term | Course, term, staff, enrollments, schedule | Unique institution/term/course/code; indexes term/status and course | Archive; capacity/status audited | P0 |
| `section_staff` | Staff assignment to a section | PK; institution via section and membership | Section, membership/staff profile | Unique active section/member/role; indexes both FKs/status | End/revoke; fully audited | P0 |
| `students` | Institution student identity | PK; direct `institution_id` | Profile, student profile, enrollments, guardian links | Unique institution/student code; profile link where applicable; search key | Archive; identity/status audited; PII | P0 |
| `student_profiles` | Sensitive and academic student detail | PK; institution via student | Student; optional version history | Unique active student profile; student index | Version/archive; field-level sensitivity | P0 |
| `guardians` | Institution guardian identity | PK; direct institution | Profile, guardian links | Unique institution/profile when linked; status index | Archive; contact/custody sensitive | P1 |
| `guardian_student_links` | Verified guardian relationship and projection scope | PK; institution via both parties | Guardian, student | Unique active guardian/student/relationship; indexes guardian/status and student/status | Revoke, never erase history; highly sensitive | P0 |
| `staff_profiles` | Institution staff directory record | PK; direct institution | Membership/profile, section assignments | Unique institution/staff code; membership and status indexes | Archive; HR/contact fields sensitive | P1 |
| `enrollments` | Student placement in a section/term | PK; institution via explicit column plus student/section | Student, section, term, transitions | Unique active student/section/term; indexes section/status, student/status, term/status | Archive; lifecycle sensitive | P0 |
| `enrollment_transitions` | Immutable enrollment state history | PK; institution via enrollment | Enrollment, actor membership | `(enrollment_id, occurred_at desc)`; actor index | Append-only audit record; reasons sensitive | P0 |

## Operations

| Entity | Purpose | Probable keys and institution path | Main relationships | Candidate uniqueness and indexes | Archive / audit / sensitivity | Priority |
|---|---|---|---|---|---|---|
| `schedule_entries` | Scheduled section sessions and exceptions | PK; direct institution plus section | Section, staff, room/resource, term | `(institution_id, start_at)`, section/start, staff/start, room/start; overlap strategy reviewed later | Cancel/archive; overrides audited | P1 |
| `attendance_sessions` | Attendance event for a section/date | PK; direct institution plus section | Section, schedule entry, actor | Unique section/session date or schedule occurrence; section/date desc | Lock, not delete; opening/locking audited | P1 |
| `attendance_entries` | Per-enrollment attendance result | PK; institution via session/enrollment | Session, enrollment/student | Unique session/enrollment; enrollment/date history index | Preserve history; PII/academic | P1 |
| `attendance_corrections` | Requested/applied attendance changes | PK; institution via entry | Entry, requester, approver | Entry/status/created indexes | Append-only decisions and before/after | P1 |
| `evaluation_categories` | Section/term assessment grouping and weight | PK; institution via section | Section, evaluations | Unique section/name; section/order index | Archive; weight changes audited | P1 |
| `evaluations` | Assessment definition | PK; direct institution plus section/category | Section, category, grade items | Section/status/due indexes; optional unique section/title policy | Archive; publish/weight changes audited | P1 |
| `grade_items` | Gradebook column/rule linked to evaluation or category | PK; institution via section | Evaluation/category, scores | Section/order/status; evaluation unique where one-to-one | Lock/archive; formula changes audited | P1 |
| `grade_scores` | Per-enrollment score | PK; institution via grade item/enrollment | Grade item, enrollment | Unique item/enrollment; enrollment/status and item/status indexes | Never hard-delete; sensitive academic record | P1 |
| `grade_change_history` | Immutable score changes/requests/approvals | PK; institution via score | Score, actor/approver memberships | Score/occurred desc, status indexes | Append-only before/after/reason | P1 |
| `materials` | Course/section material metadata | PK; direct institution plus course/section | Course, section, creator, versions | Tenant/status/updated, course/status, section/status | Archive; metadata audited | P2 |
| `material_versions` | Immutable content/object versions | PK; institution via material | Material, uploader, Storage object reference | Unique material/version; checksum; material/created desc | Retain/archive; object metadata sensitive | P2 |
| `library_collections` | Catalog grouping | PK; direct institution | Library items | Unique institution/name; status/order | Archive; low sensitivity | P3 |
| `library_items` | Bibliographic/catalog resource | PK; direct institution | Collection, copies, optional course | Tenant/title search, collection/status, course/status | Archive; external link metadata reviewed | P3 |
| `library_copies` | Physical/digital inventory unit | PK; direct institution | Item, loans | Unique tenant barcode/object reference; item/status | Lost/archive; inventory changes audited | P3 |
| `library_loans` | Borrower circulation history | PK; direct institution | Copy, borrower membership/profile | Copy/status/due, borrower/status/due | Retain history; borrower privacy; overrides audited | P3 |
| `report_definitions` | Approved report/query catalog | PK; direct institution or global template | Optional course/section scope | Tenant/category/status/name | Archive/version; definition changes audited | P2 |
| `report_exports` | Asynchronous report artifact lifecycle | PK; direct institution | Definition, requester, artifact | Requester/created desc, status/created, expires_at | Expire artifact, retain audit metadata; highly sensitive | P2 |
| `certificate_templates` | Versioned official document template | PK; direct institution | Issued certificates | Unique institution/type/active version | Retire/version; template changes audited | P2 |
| `issued_certificates` | Immutable issued document snapshot | PK; direct institution | Template, subject, course/term, issuer | Unique verification code; subject/type/term; issued_at | Never mutate content after issue; sensitive/official | P2 |
| `certificate_revocations` | Immutable revocation record | PK; institution via certificate | Certificate, actor | Unique active revocation per certificate; occurred desc | Append-only reason; public projection minimal | P2 |
| `notifications` | Notification event/template payload | PK; direct institution or system scope | Sender, recipient rows | Tenant/module/created/status | Cancel/archive; payload may contain PII | P2 |
| `notification_recipients` | Per-membership delivery/read state | PK; institution via notification/membership | Notification, membership, delivery attempts | Unique notification/membership; membership/status/created | Archive read state; delivery status audited selectively | P2 |
| `notification_preferences` | Per-membership channel/module choices | PK; institution via membership | Membership | Unique membership/module/channel | Version/update audit for security-critical settings | P2 |
| `audit_events` | Immutable security/domain event stream | Time-sortable PK; direct institution when applicable | Actor membership, target references | Tenant/occurred desc; actor/occurred; target type/id; severity/outcome | Append-only, retained/redacted; highly sensitive | P0 |
| `support_cases` | Future support workflow | PK; direct institution | Requester, assignee, access grants | Tenant/status/updated; case reference unique | Archive; support data sensitive | P4 |
| `support_access_grants` | Time-bound approved diagnostic scope | PK; direct institution | Case, support membership, approver | Active grant by case/support; expires index | Expire/revoke; every use audited | P4 |

## Relationship spine

```text
institution
├─ academic_term
├─ membership ─ profile/auth user
├─ course
│  └─ section ─ section_staff ─ membership/staff_profile
│              ├─ enrollment ─ student ─ student_profile
│              │              └─ guardian_student_link ─ guardian
│              ├─ schedule_entry
│              ├─ attendance_session ─ attendance_entry ─ attendance_correction
│              ├─ evaluation/category ─ grade_item ─ grade_score ─ grade_change_history
│              └─ material ─ material_version
├─ library collection/item/copy/loan
├─ report definition/export
├─ certificate template/issued/revocation
├─ notification ─ notification_recipient/preference
├─ institution_settings
└─ audit_event
```

## Decisions required before SQL

1. ID strategy and whether externally exposed IDs need opacity/time ordering.
2. Whether roles are global, institution-defined, or global with reviewed institution overrides.
3. Whether student/staff/guardian person records can exist without authenticated profiles.
4. Exact course-versus-section semantics and whether enrollment targets sections only.
5. Academic term overlap and “one active term” rules.
6. Sensitive student profile field projections.
7. Grade calculation, locking and publication rules.
8. Storage object naming and retention.
9. Audit retention/redaction and report artifact expiry.
10. RLS policy matrix and policy-test fixtures for every relationship path.
