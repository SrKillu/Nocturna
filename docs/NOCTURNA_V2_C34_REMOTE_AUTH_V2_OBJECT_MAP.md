STATUS: PENDING_REVIEW

# C34 Remote Auth V2 Object Map

## Status legend

- **Compatible**: remote object supports the current contract.
- **Incompatible**: object exists but does not satisfy the V2 contract.
- **Missing**: exact object is absent.
- **Unknown**: schema-only metadata cannot establish runtime behavior.
- **Decision required**: design or transition approval remains necessary.

## Object map

| Object | Remote state | Critical shape | RLS/policies/grants | Runtime/C33 correspondence | Classification |
|---|---|---|---|---|---|
| `profiles` | Present | Global user id, but still carries nullable V1 tenant and enum role; active/version fields present | FORCE RLS; tenant SELECT policy; broad grants | Runtime profile lookup works, but V1 claims remain authority | Incompatible |
| `institutions` | Present | id/name/slug/created_at; no status | RLS enabled; no policy found; broad grants | Runtime requires status | Incompatible |
| `roles` | Absent | No role rows, keys or lifecycle | N/A | Runtime joins `roles.key` | Missing |
| `institution_memberships` | Absent | No profile/institution/role/status relation | N/A | Runtime queries it directly | Missing |
| `role_capabilities` | Absent | Capabilities remain TypeScript | N/A | C33 intentionally defers DB persistence | Decision required |
| `membership_session_selections` | Absent | No session-bound active membership | N/A | C32/C33 require it for DB-backed selection | Missing |
| `custom_access_token_hook` | Present | Reads V1 profile tenant/role/active/version | SECURITY DEFINER; PUBLIC revoked; auth admin/service grants | Compatible only with V1 bridge | Incompatible for final V2 |
| `get_institution_id()` | Present | Reads institution claim | Executable by anon/authenticated/service | V1 tenant helper | Incompatible for final V2 |
| `get_user_role()` | Present | Reads role claim with student fallback | Executable by anon/authenticated/service | V1 enum role helper | Incompatible for final V2 |
| `courses` | Present | Single teacher and tenant fields | FORCE RLS; overlapping SELECT policies; staff writes | V1 bridge only | Incompatible |
| `enrollments` | Present | Course/profile relation, no term/section lifecycle | FORCE RLS; SELECT policy only | V1 bridge only | Incompatible |
| `course_sections` | Present | Course/title/position only | RLS enabled; no policy found | Not the C30/C33 `sections` contract | Incompatible |
| `academic_terms` | Absent | No term authority | N/A | Required by future academic contract | Missing |
| `section_staff` | Absent | No exact assignment authority | N/A | Required for teacher/assistant scope | Missing |
| `students` | Absent | Student identity inferred from profiles | N/A | C33 leaves entity decision open | Decision required |

## Critical relationships

### Current remote V1

```text
auth.users
  └─ profiles
       ├─ institution_id ──> institutions
       └─ role: user_role enum

institutions
  └─ courses
       ├─ teacher_id ──> profiles
       └─ enrollments ──> profiles (student)
```

### Required Auth V2 direction

```text
auth.users
  └─ profiles
       └─ institution_memberships
            ├─ institution_id ──> institutions
            └─ role_id ──> roles

auth.sessions
  └─ membership_session_selections
       └─ membership_id ──> institution_memberships
```

The second graph has no remote database representation today.

## Role keys and statuses

Remote role keys are limited to:

- student
- teacher
- admin
- super_admin

V2 expects:

- owner
- admin
- teacher
- assistant
- student
- guardian
- support

No membership status vocabulary exists because memberships do not exist.
`institutions.status` is also absent. Exact status constraints therefore remain
a decision required before a migration draft.

## Policy and grant implications

- Broad table grants mean RLS is the effective row boundary.
- Several tables have RLS but no policies in the snapshot.
- Existing helpers derive authority from V1 JWT claims.
- No policy can validate active membership or session selection because those
  objects are absent.
- Real Auth V2 adapters remain blocked.

## Compatibility decision

No remote object set is sufficient to support Auth V2 as currently implemented.
The V1 bridge can continue temporarily, but the database source of truth must be
reconciled and versioned before real V2 integration.

Verdict: `C34_REMOTE_SCHEMA_DRIFT_CONFIRMED`
