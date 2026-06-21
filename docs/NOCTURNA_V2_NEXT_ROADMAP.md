# Nocturna V2 Recommended Roadmap

STATUS: PENDING_REVIEW

- Analysis date: June 20, 2026
- Branch: `feature/nocturna-c23-module-inventory-sicai-gap-map`
- Base commit: `2d2e9b0e5b473bf6e1a4632e4226a14dff6b2c91`
- Planning constraint: no production or remote Supabase work is authorized by this document

## Roadmap principle

Nocturna V2 already has enough visual breadth. The next phase should convert selected foundations into tenant-safe vertical slices, beginning only after authorization semantics and data contracts are stable.

The ordering is:

1. Stabilize frontend and authorization contracts.
2. Design the data model and RLS without applying remote changes.
3. Integrate small academic-core slices.
4. Validate in controlled staging.

## Phase D — Frontend and authorization stabilization

### Goal

Make the existing V2 visual runtime internally consistent and ready for data-contract review.

### Work

- Clean up navigation ordering, labels, grouping, and duplicated destinations.
- Complete C26 read/write capability split planning before adding further domain permissions.
- Implement the approved read/write capability matrix in a future safe batch without broadening effective role access.
- Update centralized route-role contracts in the same change that adopts new read capabilities.
- Replace temporary capability substitutions:
  - audit log from settings visibility to `canViewAuditLog`
  - schedule from attendance management to schedule-specific view/manage capabilities
  - library from materials management to library-specific access/manage capabilities
  - guardian space from report visibility to linked-student access
- Separate read and write capabilities for students, courses, attendance, gradebook, certificates, staff, enrollments, and institution settings.
- Add route-role-capability contract tests covering all V2 routes and roles.
- Verify that hidden navigation and direct route access enforce the same policy.
- Complete role-by-role responsive QA for desktop and mobile layouts.
- Audit every navigation link, breadcrumb, card action, and empty-state action for broken or placeholder destinations.
- Review loading, empty, denied, error, not-found, and problem states for consistent language and recovery actions.
- Complete a copy audit for terminology, role-sensitive wording, mock-data notices, and action labels.
- Validate dark mode contrast, state colors, focus treatment, charts, tables, and overlays.
- Inventory all mock data contracts, identifiers, filters, sorting, pagination, and mutation expectations.
- Mark mock/demo content visibly wherever it could be interpreted as live institutional data.

### Deliverables

- Approved capability matrix.
- Route authorization contract table and automated tests.
- Stable TypeScript domain contract inventory.
- UI QA report by role and module.
- Prioritized list of contracts ready for schema design.

### Exit criteria

- No route depends on a semantically unrelated capability.
- Read/write distinctions are approved.
- Every V2 route has an explicit role/capability test.
- Core mock contracts are stable enough to map to normalized entities.
- No production database work has begun.

## Phase E — PostgreSQL, Supabase, and RLS design

### Goal

Design the tenant-safe academic data foundation without applying unreviewed migrations.

### Work

- Review the current Supabase schema and migration history without changing the remote project.
- Require an approved capability-to-RLS operation mapping before drafting each domain migration.
- Model institutions, terms, memberships, roles, students, guardians, staff, courses, sections, groups, enrollments, and assignments.
- Model attendance, evaluations, grade items, scores, materials, notifications, audit events, and settings in dependency order.
- Define immutable identifiers, foreign keys, lifecycle states, uniqueness constraints, timestamps, soft-delete/archive policy, and audit requirements.
- Design indexes from access paths, tenant filters, relationship checks, uniqueness rules, and expected reporting workloads.
- Specify institution isolation and relationship-aware access for:
  - assigned teachers/assistants
  - enrolled students
  - linked guardians
  - institution administrators
  - support personnel
- Design RLS policies as deny-by-default.
- Design Storage buckets and object policies for materials and future official documents.
- Define service-role usage boundaries and prohibit browser exposure.
- Draft migrations, seed strategy, rollback notes, and policy tests for review only.

### Deliverables

- Entity relationship model.
- Table and constraint specification.
- RLS policy matrix by table and role relationship.
- Storage policy design.
- Draft migration sequence and verification plan.

### Exit criteria

- Schema and RLS are reviewed together.
- Every table has an institution-isolation decision.
- Sensitive columns have projection/access rules.
- Migration and rollback strategy is approved.
- No remote migration is applied until explicit authorization.

## Phase F — Incremental real integration

### Goal

Replace mocks with real data through small, testable vertical slices.

### Slice F1 — Academic identity and structure

- Students and authorized student profiles.
- Courses, terms, sections/groups, and staff assignments.
- Enrollments and roster projections.
- Server-side repositories/endpoints with shared validation and stable error contracts.

Exit signal: owner/admin can manage the minimum structure; staff and students see only authorized records.

### Slice F2 — Attendance

- Attendance sessions and roster generation.
- Record, correct, and audit attendance.
- Student/guardian read projections.

Exit signal: assigned staff can record attendance and every correction is attributable and policy-tested.

### Slice F3 — Evaluations and gradebook

- Evaluation lifecycle, categories, weights, and publication.
- Score entry, calculation, locking, overrides, and history.
- Student/guardian result projections.

Exit signal: calculation rules are deterministic, tested, and auditable.

### Slice F4 — Materials and Storage

- Material metadata, course linkage, upload/download, versioning, and archival.
- Signed access and object-level policy tests.

Exit signal: no user can enumerate or retrieve materials outside an authorized course.

### Slice F5 — Operational services

- Notifications and preferences.
- Reports and asynchronous exports.
- Certificates and verification lifecycle.
- Institution settings and audit explorer.

Exit signal: operational jobs are observable, retry-safe, and do not leak cross-tenant data.

### Integration rules

- Keep one domain slice per reviewable PR series.
- Add policy tests before enabling writes.
- Preserve mock adapters only where needed for isolated UI development.
- Avoid a generic catch-all domain endpoint.
- Instrument failures without logging secrets or excessive personal data.
- Do not combine schema, broad UI redesign, and multiple domain integrations in one batch.

## Phase G — Controlled staging validation

### Goal

Prove the integrated system safely before production consideration.

### Work

- Use a dedicated staging project and non-production accounts.
- Apply reviewed migrations in sequence and verify rollback/recovery steps.
- Seed synthetic institutions, roles, sections, students, guardians, and academic activity.
- Run end-to-end tests against the deployed non-production environment.
- Execute role-based acceptance tests for owner, admin, teacher, assistant, student, guardian, and support.
- Test cross-institution isolation and direct-object access attempts.
- Validate session expiry, membership changes, disabled profiles, and revoked access.
- Test concurrency for enrollment transitions, attendance correction, and grade updates.
- Validate export privacy, notification recipient selection, audit redaction, and Storage access.
- Confirm secure logging, alerting, traces, and operational observability without secrets or unnecessary personal data.
- Verify backup creation, retention, restore procedure, and recovery objectives.
- Measure page/query performance and identify required indexes.
- Perform accessibility and responsive QA on the integrated states.
- Deploy to a non-production target first; require explicit human approval before any production deployment.

### Deliverables

- Staging runbook.
- Migration verification report.
- RLS and authorization test evidence.
- Role-based acceptance report.
- Performance and accessibility findings.
- Production-readiness risk register.

### Exit criteria

- No known cross-tenant access defect.
- Critical role workflows pass in staging.
- Migration and recovery procedures are demonstrated.
- Logs and audit events are useful without exposing secrets.
- Performance is acceptable for agreed staging volumes.
- Human approval is recorded before any production activity.

## Recommended sequence of decisions

1. Approve the capability cleanup proposal.
2. Add route-role contract tests.
3. Approve the academic-core data contracts.
4. Review the schema and RLS design.
5. Authorize only the first vertical slice.
6. Validate it in controlled staging before expanding scope.

## Explicitly deferred

- Production deployment.
- Remote Supabase changes.
- Unreviewed migrations or SQL.
- Public API and mobile client.
- Bulk import/export.
- Official academic document claims.
- Real payment, messaging, or external integration workflows.

## Success measure

The roadmap succeeds when Nocturna V2 moves from broad visual coverage to a small number of fully authorized, auditable, tenant-safe workflows—without sacrificing the V1 boundary or creating a large unreviewable database rollout.
