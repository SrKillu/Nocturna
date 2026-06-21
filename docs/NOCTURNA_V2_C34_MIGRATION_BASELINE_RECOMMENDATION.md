STATUS: PENDING_REVIEW

# C34 Migration Baseline Recommendation

## Recommended path

Choose **Option B**:

> Remote schema has unversioned and divergent objects. Create a
> baseline/reconciliation migration draft locally, without applying it.

Final recommendation:
`C34_RECOMMEND_C35_SCHEMA_BASELINE_RECONCILIATION`

## C35 Baseline Reconciliation Follow-up

C35 implemented the recommendation as review-only documentation:

- complete remote public-object inventory;
- remote/local migration diff matrix;
- reconstruction draft derived from the C34 snapshot;
- separate Auth V2 forward migration plan;
- baseline risk register and owner explanation.

The work confirms Option B. It does not approve SQL or a migration. The next
safe gate is disposable-database reconstruction and validation.

Follow-up verdicts:

- `C35_BASELINE_RECONCILIATION_DRAFTED`
- `C35_REMOTE_LOCAL_DIFF_MAPPED`
- `C35_READY_FOR_DISPOSABLE_DB_RECONSTRUCTION`

## Why Option B

The remote database is neither equivalent to the checked-in migrations nor
ready for the Auth V2 additions:

- remote-only tables exist;
- shared tables differ in columns, nullability, constraints, indexes and
  policies;
- Auth V2 membership and role tables are absent;
- `institutions.status` is absent;
- the remote still uses V1 profile/JWT role and tenant authority.

An incremental migration written only from C33 would assume a trustworthy
baseline that does not exist.

## Options considered

### Option A — Incremental local migration draft

Pros:

- smaller apparent change;
- direct path to Auth V2 objects.

Risks:

- may conflict with unversioned remote DDL;
- may encode incorrect assumptions about nullable columns and existing
  constraints;
- may preserve or worsen duplicate FKs, policies and indexes;
- provides no reconstruction story.

Decision: reject for now.

### Option B — Baseline/reconciliation draft

Pros:

- creates an auditable remote/local map;
- separates existing drift from new Auth V2 design;
- allows disposable-database reconstruction and policy tests;
- protects V1 while defining a controlled bridge.

Risks:

- larger review effort;
- requires careful distinction between baseline representation and changes to
  apply;
- may reveal historical migration gaps that need owner decisions.

Decision: recommended.

### Option C — Block because Auth V2 is absent remotely

Pros:

- safest immediate posture for real adapters.

Risks:

- does not itself repair migration history.

Decision: apply as an operational constraint within Option B. Real Auth V2
integration remains blocked, but documentation work can continue.

### Option D — Retry inspection

The schema-only inspection completed successfully, so another retry is not the
next useful step.

Decision: not required.

## C35 proposed scope

C35 should remain local and review-only:

1. Treat the C34 snapshot as evidence, not as an executable migration.
2. Inventory every remote `public` table, function, enum, constraint, index,
   policy and grant.
3. Map each item to a checked-in migration, consolidated script or unknown
   source.
4. Produce a normalized baseline draft that can reconstruct current remote
   structure in a disposable database.
5. Produce a separate forward migration draft for:
   - `institutions.status`;
   - `roles`;
   - `institution_memberships`;
   - `membership_session_selections`.
6. Keep `role_capabilities` deferred unless persistence is separately approved.
7. Define a non-destructive V1-to-V2 backfill and compatibility plan.
8. Add tests for cross-tenant denial, membership lifecycle, session selection,
   stale claims and V1 regression.

No C35 artifact should be applied remotely without a new explicit approval.

## V1 impact

- Preserve `profiles.role` and `profiles.institution_id` during transition.
- Preserve current JWT hook behavior until the new context has proven tests.
- Do not rename or remove remote columns in the first reconciliation pass.
- Reconcile policy differences before changing effective access.

## V2 impact

- Keep mock-backed academic modules explicit.
- Do not enable real membership/session adapters yet.
- Runtime access to missing Auth V2 tables must remain treated as an integration
  blocker rather than assumed available.

## Safety decision

`C34_RECOMMEND_C35_SCHEMA_BASELINE_RECONCILIATION`
