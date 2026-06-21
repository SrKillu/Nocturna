# Emergent Integration Notes

STATUS: PENDING_REVIEW

## C30 Courses + Sections read-only draft

- There is no real-data UI integration in C30.
- The current Courses V2 frontend remains fully mock-backed.
- A future server-side adapter must map normalized institution, term, course, section, staff-assignment and optional enrollment rows into the existing `courses-v2` view models.
- `courseName`, `sectionLabel`, `teacherName`, `periodLabel`, `scheduleLabel`, `roomLabel`, counts and status labels are projections, not sources of truth.
- `nextAction`, work-queue entries and presentation audiences are UI decisions, not persisted authorization.
- Evaluation, material and roster previews must remain mock/controlled-empty until their own domains are approved.
- No Emergent-generated UI may bypass server-side session, active-membership, capability or relationship authorization.
- Frontend code must not trust `institution_id`, membership ID, role, capability, course scope, section scope or enrollment scope from client input.
- Direct object access must be authorized on the server and protected by reviewed row policies.
- Unauthorized and nonexistent course IDs must map to the same safe not-found behavior.
- Browser code must never receive or use a Supabase `service_role` credential.
- Real integration must preserve loading, empty, denied, problem and safe not-found states already represented by the V2 runtime.

## C32 Active membership and tenant context

- Frontend/Emergent must never send `institution_id` as authorization authority.
- The institution selector may submit a membership/opaque selector, but the
  server validates ownership and current status before persisting it.
- Active membership selection is server-side and bound to the current Supabase
  `session_id`; it is not global across all devices.
- A cookie HTTP-only may remember the selector, but every future data adapter
  depends on a server-authorized context derived from current DB state.
- Membership, profile and institution suspension/revocation must override stale
  cookies or JWT claims.
- Role and capabilities displayed by UI are presentation; the client cannot
  assert them for authorization.
- Future adapters must preserve relationship checks after tenant resolution:
  assignment for staff and enrollment for students.
- No `service_role` credential or RLS-bypass client may exist in browser code.
- Direct object IDs remain server-authorized and map out-of-scope rows to safe
  not-found behavior.

## C33 Auth V2 schema context

- Frontend/Emergent must not treat V1 `profiles.role` or
  `profiles.institution_id` as final V2 authority.
- Real-data adapters must wait for `activeMembership` resolved and revalidated by
  the server.
- UI never generates or asserts role/capabilities.
- The institution switcher selects an authorized membership, not an arbitrary
  institution ID.
- Multi-device selection belongs to the current Supabase `session_id`.
- Future adapters must wait until roles, institution memberships and session
  selections are versioned and policy-tested.
- Mock-backed modules remain explicit while schema reconciliation is incomplete.
- No client adapter may use service role or bypass RLS during the transition.

## C34 Remote schema inspection result

- The remote database does not contain `institution_memberships`, `roles`,
  `membership_session_selections` or `institutions.status`.
- Auth V2 schema is therefore not remotely available or locally versioned.
- Remote V1 tables also differ from the checked-in migrations.
- Frontend modules must remain explicitly mock-backed until baseline
  reconciliation and real adapters are separately approved.
- V1 profile claims remain a temporary bridge, not final authorization
  authority.
- No browser code may receive `service_role` credentials.
- Real adapters remain blocked until active membership, role and session
  selection are DB-backed, server-validated and RLS-tested.
