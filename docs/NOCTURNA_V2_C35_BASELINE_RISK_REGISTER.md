STATUS: PENDING_REVIEW

# C35 Baseline Risk Register

| Risk | Evidence | Impact | Likelihood | Mitigation | Blocks migration? |
|---|---|---|---|---|---:|
| Remote-only tables lack migrations | course_sections, final_grades, materials, messages | Remote cannot be reconstructed | High | Baseline them and assign ownership | Yes |
| Local migrations do not match remote | Nullability, names, constraints, policies | Migration failure or behavior change | High | Disposable reconstruction and exact diff | Yes |
| Runtime expects missing Auth V2 objects | roles/memberships/status absent | Auth V2 real integration fails | Certain | Separate additive forward plan | Yes |
| Broad grants rely on RLS | ALL to anon/authenticated | Policy error becomes exposure | High | Least-privilege and RLS tests together | Yes |
| RLS tables have no policies | Several enabled tables lack policies | Deny-all or privileged-only surprises | High | Actor matrix tests | Yes |
| Permissive policies | messages/invites use true | Cross-tenant access risk | High | Block adapters; replace after tests | Yes |
| Duplicate FKs/uniques | courses, profiles, enrollments, grades | Ambiguous DDL and duplicate work | Medium | Canonical constraint map | Yes |
| Nullable tenant/core columns | profiles/courses/tasks/submissions | Broken isolation and backfill failures | High | Profile data only in approved dry-run environment | Yes |
| V1 JWT claims remain authority | Remote helpers/token hook | Stale or single-tenant authority | High | Preserve bridge, add DB-validated V2 context | Yes for V2 |
| course_sections is not target sections | Missing term/tenant/staff lifecycle | Wrong academic authorization model | High | Explicit mapping decision | Yes for academic V2 |
| Incremental migration over unknown baseline | Confirmed remote/local drift | Duplicate/failing/destructive migration | High | Baseline first | Yes |
| Breaking V1 during tightening | Local intent is stricter than remote | Production regressions | High | Non-destructive bridge and V1 tests | Yes |
| Accidental service_role usage | Broad privileged grant exists | RLS bypass/exposure | Medium | Never in browser; audit server boundaries | Yes |
| Rollback ambiguity | Data-bearing future tables/backfill | Incomplete recovery | Medium | Forward-fix plan and rehearsed recovery | Yes |
| Timestamp type/name drift | created_at/enrolled_at and timestamp without TZ | Semantic/data conversion defects | High | Decide canonical forms and conversion tests | Yes |
| Trigger/function drift | Local helpers absent from snapshot | Signup/update behavior differs | Medium/High | Reconstruct and exercise triggers | Yes |
| Snapshot covers public schema | Auth/storage details not fully evidenced | False completeness assumption | Medium | Mark scope; add controlled evidence if needed | No for public baseline |

## Highest-priority blockers

1. Establish deterministic disposable reconstruction.
2. Resolve remote-only table ownership.
3. Test effective grants and RLS.
4. Preserve V1 while introducing Auth V2 additively.
5. Prove backfill and session-selection behavior before remote approval.

## Risk verdict

The baseline is documented but not safe for direct migration.

`C35_READY_FOR_DISPOSABLE_DB_RECONSTRUCTION`
