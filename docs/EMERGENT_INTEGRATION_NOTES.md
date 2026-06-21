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
