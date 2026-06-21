STATUS: PENDING_REVIEW

# C35 Remote / Local Migration Diff Matrix

## Summary

The C34 remote snapshot and local migrations describe different baselines.
Differences affect structural integrity, authorization and reconstruction. No
single local migration sequence can currently be assumed to recreate remote.

## Table and domain matrix

| Area | Remote shape | Local migration shape | Difference | Risk | Recommendation |
|---|---|---|---|---|---|
| institutions columns | id/name/slug/created_at | adds required updated_at | Missing remote timestamp | Medium | Preserve remote evidence; decide additive repair |
| institutions status | absent | absent | Runtime-required column missing both | Critical V2 | Separate forward Auth V2 draft |
| institutions RLS | enabled, not forced, no policy found | forced; select/update policies | Effective access differs | High V1 | Reconstruct and policy-test |
| profiles nullability | tenant/role/name nullable | all required | Integrity mismatch | High | Measure/backfill only in disposable DB first |
| profiles indexes | institution only | institution, role, lower(email), active | Missing query/support indexes | Medium | Reconcile from observed query paths |
| profiles policies | one tenant SELECT | select + self/admin update | Capability mismatch | High | Preserve V1 behavior until tests define target |
| profiles authority | enum role + one tenant | same local intent | V1 authority remains | Critical V2 | Add membership authority later, do not replace first |
| courses nullability | institution/teacher/creator nullable | tenant and creator required | Weak remote integrity | High | Baseline exact state, then additive/backfill plan |
| courses FKs | duplicate institution FKs | one cascade FK | Duplicate/conflicting metadata | Medium | Decide canonical FK in forward-fix |
| courses indexes | institution, teacher | also creator | Missing creator index | Low/Medium | Validate workload then reconcile |
| courses policies | two SELECT plus write policies | different tenant/write policy history | Overlap/effective behavior differs | High | Dedicated RLS regression suite |
| enrollments timestamp | `created_at` | `enrolled_at` | Naming drift | High API/migration | Pick canonical name with compatibility strategy |
| enrollments uniqueness | constraint + duplicate unique index | one unique constraint | Redundant object | Low/Medium | Preserve baseline, remove only after approval |
| enrollments indexes | course/student | institution/course/student | Missing tenant index | Medium | Add only after baseline reconstruction |
| enrollments policies | SELECT only | SELECT/INSERT/DELETE | Remote write behavior differs | High | Test current and intended actors |
| course_sections | simple remote-only table | no migration | Unversioned, not target sections | Critical academic | Baseline separately; do not rename in place |
| final_grades | remote-only nullable legacy shape | no migration | Unknown source | High | Owner decision: retain, map or retire later |
| materials | remote-only | no migration | Unknown source and policy posture | High | Baseline and usage audit before integration |
| messages | remote-only, permissive SELECT | no migration | Unversioned and permissive | Critical security | Block real adapter; reconstruct and test |
| user_role enum | four V1 values | same four values | Values match | Low V1 / critical V2 | Preserve bridge; add V2 role table separately |
| file_objects | owner/bucket_id/name/text status | uploader/bucket/path/custom enums | Different domain model | High | Treat as divergent, not a normal migration update |
| grades | numeric without intended constraints and timestamp differences | stronger checks and graded_at | Integrity/time drift | Medium/High | Baseline then forward-fix |
| tasks/submissions | several nullable core columns | required tenant/course/actor fields | Integrity drift | High | Protect V1; test before tightening |
| invites | timestamp/column/policy differences | explicit indexes and role policies | Behavior differs | High | Reconstruct current behavior and negative tests |

## Functions and helpers

| Area | Remote shape | Local migration shape | Difference | Risk | Recommendation |
|---|---|---|---|---|---|
| custom token hook | public SECURITY DEFINER reading profile fields | versioned hook with hardened intent | Body/grants need exact comparison | High auth | Test claim output in disposable stack |
| tenant helper | public JWT helpers | local auth-schema helpers | Naming/schema drift | High RLS | Do not mix helpers without policy graph review |
| role helper | public helper defaults to student | local auth helper | Silent fallback differs | High auth | Remove fallback only in later approved design |
| update/trigger helpers | absent snapshot | several local functions/triggers | Local-only metadata | High reconstruction | Verify reconstruction and schema scope |
| business RPCs | absent snapshot | local grade/audit RPCs | Not remotely evidenced | Medium/High | Mark local-only until verified |

## Constraints, indexes and timestamps

| Area | Remote shape | Local migration shape | Difference | Risk | Recommendation |
|---|---|---|---|---|---|
| NOT NULL | relaxed on many core columns | strict | Existing rows may violate local intent | High | Data-free baseline cannot prove backfill safety |
| defaults | missing tenant defaults remotely | auth-derived defaults locally | Insert behavior differs | High | Test both server and RLS behavior |
| FKs | duplicates on courses/profiles | canonical single FKs | Ambiguous dependency behavior | Medium | Normalize only after impact review |
| timestamp types | some `timestamp without time zone` | intended timestamptz | Time semantics differ | Medium | Define conversion before migration |
| index names | remote non-`idx_` names | local `idx_` names | Duplicate creation risk | Medium | Reconcile by definition, not name alone |
| missing indexes | many local indexes absent | broader index set | Performance/locking risk | Medium | Validate with disposable schema and query paths |

## RLS and grants

| Area | Remote shape | Local migration shape | Difference | Risk | Recommendation |
|---|---|---|---|---|---|
| RLS enabled | 14 public tables | module-defined set | Similar coverage, different details | High | Build table-by-table matrix in C36 |
| FORCE RLS | eight core tables | eight intended core tables | Partial match | Medium | Verify exact ownership/test roles |
| policy coverage | several tables have zero policies | local policies more extensive | Deny-all or service-only behavior possible | High | Positive and negative tests |
| permissive policies | messages/invites use true | no matching migration source | Potential broad tenant access | Critical | Do not connect V2 adapters |
| table grants | ALL to anon/authenticated/service_role | local grants not equivalent | RLS is only row boundary | Critical | Least-privilege review with RLS |
| default privileges | broad future-object grants | not explicitly versioned | New objects inherit broad access | High | Decide explicit grant baseline |

## Runtime and compatibility impact

- V1 can break if local strict constraints or policies are applied blindly.
- Auth V2 remains blocked because roles, memberships, institution status and
  session selection are absent.
- The remote `course_sections` table cannot be adopted as target `sections`
  without an explicit mapping.
- An incremental migration over this baseline could create duplicate objects,
  fail on existing nulls or silently change effective RLS.

## Diff verdict

`C35_REMOTE_LOCAL_DIFF_MAPPED`

Next safe action: `C35_READY_FOR_DISPOSABLE_DB_RECONSTRUCTION`.
