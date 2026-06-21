STATUS: PENDING_REVIEW

# C37 Migration Sequence Draft

No migration is executed or created under `supabase/migrations` in C37. Every
item below remains review-only until explicitly approved and must first
reconstruct successfully in a disposable database.

| Future Migration | Purpose | Depends On | Must Test | Rollback/Forward-fix Notes |
|---|---|---|---|---|
| A. Base extensions and types | Enable only approved extensions and lifecycle types | Empty database | clean install; extension availability; type constraints | Prefer forward fixes; no unnecessary extension |
| B. Institutions and profiles | Establish tenant root and global Auth-linked identity | A, `auth.users` | auth FK; lifecycle denial; profile self projection | Preserve auth identities; correct constraints forward |
| C. Roles and role seed | Create stable RoleKey catalog with synthetic/system seed | A | exact seven keys; idempotent deterministic seed; no capability broadening | Role keys are immutable contracts |
| D. Institution memberships | Establish tenant/role authority and lifecycle | B, C | tenant consistency; active/invited/suspended/left; duplicate rules | Transition mistakes require reviewed forward migration |
| E. Session selections | Bind current session to one validated membership | D | multi-device; stale session; revoked membership; cross-user selector | Revocation must fail closed |
| F. Base RLS helpers and grants | Resolve current context and deny by default | B–E | anon denial; authenticated least privilege; recursion; stale claims | Helpers versioned separately when behavior changes |
| G. Academic terms | Add institution periods and history states | F | tenant isolation; date constraints; closed/archive visibility | Historical semantics require forward policy change |
| H. Courses | Add tenant course definitions | G | same-tenant listing/direct ID; stable pagination; lifecycle | No write adapter yet |
| I. Sections | Add term-specific course offerings | G, H | composite tenant consistency; relationship reads | No implicit course-wide staff access |
| J. Section staff | Add exact staff assignment scope | D, I | assigned/unassigned teacher/assistant; support denial/scope | Avoid helper-policy recursion |
| K. Students and guardians | Add academic students and guardian links | D, G | safe projections; self/linked scope; cross-tenant denial | Personal-data retention requires separate approval |
| L. Enrollments | Bind students to sections/terms | I, K | enrolled/unenrolled reads; lifecycle revocation; guardian projection | Writes remain deferred |
| M. Audit events | Add append-oriented security/domain evidence | D, F | actor/tenant correlation; redaction; immutable client behavior | Retention/partitioning reviewed before scale |
| N. Storage buckets and policies | Add private object boundaries for approved domains | F and relevant domain tables | object/direct-path denial; assignment/enrollment scope | No bucket creation before separate approval |
| O. Courses + Sections read adapter support | Add only indexes/views/functions proven necessary for read adapter | H–L and passing policies | query plans; safe not-found; no RLS bypass | Adapter remains feature-flagged |

## Ordering rules

- A later migration cannot compensate for missing tenant consistency in an
  earlier table.
- Grants and RLS are introduced with the objects they protect or in the
  immediately following reviewed migration.
- A table is not exposed to authenticated clients during an unprotected gap.
- Seed users are provisioned through approved test tooling, never embedded as
  real credentials in migrations.
- Views inherit an explicit security model; no view is assumed safe by default.
- Indexes follow tested access paths and policy predicates, not speculative
  completeness.

## Review packages

Each future migration PR should include:

1. migration file;
2. forward-fix/rollback reasoning;
3. synthetic fixture delta;
4. positive and negative grants/RLS tests;
5. schema reconstruction evidence;
6. query-plan evidence for affected list/direct-ID paths;
7. no-drift result;
8. explicit statement that no real data is included.

## Disposable database gate

Before clean staging:

- initialize from an empty database;
- apply all migrations in timestamp order;
- provision synthetic auth actors safely;
- apply deterministic synthetic domain seed;
- run policy and grant tests;
- run application typecheck, unit tests and build;
- compare generated schema to the migration-defined expectation;
- destroy the disposable environment.

## C38 recommendation

C38 should specify the disposable reconstruction harness and, if approved,
create **migration draft skeletons only**. Project creation, remote application
and real-data work remain separate approvals.

Verdict: `C37_RECOMMEND_C38_DISPOSABLE_DB_RECONSTRUCTION_PLAN`.
