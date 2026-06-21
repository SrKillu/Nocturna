STATUS: PENDING_REVIEW

# C37 Core Schema Contract

This is a contract, not executable SQL. Names and constraints remain subject to
human review and disposable-database validation.

## Global conventions

- Primary identifiers are opaque UUIDs.
- Event timestamps use `timestamptz`.
- Mutable records have `created_at` and `updated_at`.
- Institution-scoped rows carry an explicit `institution_id` even when a
  relationship can derive it; composite consistency constraints are preferred.
- Lifecycle values are closed, reviewed sets. Lookup tables or checked text are
  preferred where lifecycle evolution is expected.
- Client-supplied tenant, role and capability values are never authorization
  authority.
- Sensitive profile fields are exposed through minimal projections, not broad
  joins.

## Auth and tenant core

| Table | Purpose | Tenant Path | Sensitive Fields | Key Constraints | RLS Boundary | Notes |
|---|---|---|---|---|---|---|
| `institutions` | Tenant and lifecycle root | Self | status, settings metadata | UUID PK; unique stable slug; status in `active/trial/suspended/archived` | Current active membership; suspended/archived fail closed | Trial access needs explicit product decision |
| `profiles` | Global application identity | Through memberships, not a tenant column | display name, contact/profile state | `id = auth.users.id`; one profile per auth user; active-state contract | Self-safe projection or authorized relationship projection | No final V2 role/institution fields |
| `roles` | Stable RoleKey catalog | Global reference | None expected | unique immutable `key`; keys owner/admin/teacher/assistant/student/guardian/support | Authenticated read only if needed; writes operational-only | Capabilities remain versioned app contract initially |
| `institution_memberships` | Tenant and role authority | Direct `institution_id` | lifecycle, role, profile relationship | FKs institution/profile/role; lifecycle `active/invited/suspended/left`; reviewed uniqueness for current memberships | Self membership plus approved institution administration | Current DB state overrides JWT/UI |
| `membership_session_selections` | Active membership per Supabase session | Through membership | session identifier, selection/revocation timestamps | one current selection per `session_id`; profile/session/membership consistency | Current user/session only; no browser mutation grant | Prefer private schema if Data API exposure is unnecessary |
| `audit_events` | Security and domain action evidence | Direct `institution_id`, nullable only for approved global events | actor, target, redacted metadata, request correlation | append-oriented ID/time ordering; action vocabulary; immutable event body | Narrow owner/admin/support projections; no client writes | Retention and redaction require separate approval |

## Academic core

| Table | Purpose | Tenant Path | Sensitive Fields | Key Constraints | RLS Boundary | Notes |
|---|---|---|---|---|---|---|
| `academic_terms` | Institution academic periods | Direct `institution_id` | dates, lifecycle | date ordering; unique institution/code; lifecycle draft/active/closed/archived | Same institution; historical visibility explicit | Closed/archived access fails closed unless approved |
| `courses` | Reusable course definition | Direct `institution_id` | internal code/status | unique institution/code; reviewed lifecycle | Same institution plus role/capability | Does not imply section assignment |
| `sections` | Scheduled course offering in a term | Direct institution plus course and term | schedule/room labels | course and term must share institution; unique reviewed section key | Admin same tenant or exact staff/enrollment relationship | Separate from course by design |
| `section_staff` | Teacher/assistant/support assignment | Direct institution plus section and membership | assignment role/status | membership and section same institution; one current assignment per approved role | Self assignment; admin management; no peer enumeration by default | Support assignment must be explicitly approved and scoped |
| `students` | Institution academic student entity | Direct `institution_id`; optional profile link | student code, profile link, academic status | unique institution/student code; optional profile unique per institution; lifecycle | Admin, self-linked student, linked guardian or authorized staff relationship | Separate from global profile |
| `guardian_links` | Guardian-to-student relationship | Direct institution plus guardian membership/student | relationship and verification state | all references same institution; reviewed active uniqueness | Guardian sees own active links; admin management | A link grants only approved student projections |
| `enrollments` | Student enrollment in section/term | Direct institution plus student/section/term | lifecycle and academic dates | all references same institution and term; reviewed uniqueness for active enrollment | Admin; assigned staff; own student; linked guardian projections | Lifecycle proposed: invited/active/withdrawn/completed |

## Authority decisions

### Profiles

- `profiles.id` equals and references `auth.users.id`.
- A profile is global and does not select a tenant by itself.
- Missing or inactive profiles fail closed.
- Profile projections expose only fields required by the relationship.

### Memberships and roles

- `institution_memberships` is the source of current tenant and role authority.
- `roles.key` is stable and maps to the V2 RoleKey contract.
- `active` is required for ordinary access; `invited`, `suspended` and `left`
  confer no active tenant authority.
- `canManageInstitution` and other capabilities are not stored in session
  selections.

### Active session selection

- Selection is keyed by the Supabase JWT `session_id`, not globally per user.
- The selected membership must belong to `auth.uid()`'s profile.
- Membership, profile and institution lifecycle are revalidated on each
  protected database path.
- Session A may select Alpha while session B selects Beta.
- Missing, stale, revoked or inconsistent selection returns no context.

### Academic relationships

- Courses describe curriculum; sections describe term-specific delivery.
- `section_staff` is required for teacher/assistant relationship access.
- Support receives no broad academic access unless an explicit scoped
  assignment and capability contract are approved.
- `students` is an academic entity, optionally linked to a global profile.
- `guardian_links` is explicit and current-state validated.
- `enrollments` binds student, section and term with lifecycle.

## Proposed consistency strategy

- Use composite candidate keys such as `(id, institution_id)` where they enable
  foreign keys that prove tenant consistency.
- Keep RLS predicates simple; constraints prevent impossible cross-tenant links.
- Add partial uniqueness only after lifecycle transitions are modeled and
  tested.
- Avoid JSON for core relationships, roles, lifecycle or authorization state.
- Use JSON metadata only for bounded, non-authoritative, redacted attributes.

## Deferred tables

Attendance, evaluations, gradebook, materials, notifications, certificates,
settings, reports and Storage metadata are not part of this core contract.
Their future schemas depend on the approved academic relationships above.

## Open decisions before migration drafting

- Exact schema placement for private context tables and helpers.
- Whether lifecycle sets use lookup tables, checked text or PostgreSQL enums.
- Trial-institution access semantics.
- Membership uniqueness/history model.
- Student-to-profile optionality and onboarding flow.
- Guardian verification lifecycle.
- Support assignment model.
- Audit retention, partitioning and redacted projection.

Verdict: `C37_CORE_SCHEMA_CONTRACT_DRAFTED`.
