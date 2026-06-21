STATUS: PENDING_REVIEW

# C37 Environment and CI Plan

## Environment boundaries

| Environment | Purpose | Data Allowed | Secrets Policy | Deployment Policy | Owner Approval Needed |
|---|---|---|---|---|---|
| Legacy/current Supabase | Temporary V1 continuity and retention decision source | Existing legacy data; no C37 reads/copies | Existing secrets remain outside repo/logs | No C37 changes or cutover | Any audit, export, migration or retirement |
| Clean disposable DB | Reconstruct migrations and run policy tests | Synthetic fixtures only | Ephemeral local/CI secrets; redacted logs | Created/destroyed by future approved harness | Harness/tooling approval |
| Clean staging Supabase V2 | Prove integrated V2 with synthetic actors | Synthetic data only | Dedicated staging secrets in protected platform stores | Separate project/create/deploy approval; migration-only DDL | Project creation and every promotion gate |
| Future production | Serve approved V2 | Only approved retained/migrated or newly collected data | Production-only managed secrets | No direct dashboard DDL; reviewed promotion only | Explicit production/cutover approval |
| Vercel preview/staging | Exercise frontend/server adapters | Synthetic staging responses | Environment-scoped server secrets; never client-exposed | Feature flags off by default until policy evidence | Connecting to clean staging |
| Railway/background staging | Future jobs only if needed | Synthetic job payloads | Server-only scoped secrets | No production jobs from C37 | Service creation/deployment |

## Environment rules

- Legacy and clean V2 credentials, projects and data never overlap implicitly.
- Preview deployments cannot point at production by default.
- Browser bundles contain only public client configuration, never privileged
  credentials.
- Environment names are explicit; fail closed when an adapter target is absent.
- Clean staging uses synthetic identity domains and visible non-production
  labeling.
- No dashboard DDL is accepted as source of truth.

## CI reconstruction pipeline

1. Checkout an immutable commit.
2. Install dependencies through the repository's lockfile policy.
3. Start a disposable database.
4. Apply all reviewed migrations from zero in deterministic order.
5. Provision synthetic auth actors with test-only tooling.
6. Apply deterministic synthetic seed.
7. Assert expected schema, RLS enablement and grants.
8. Run DB helper and policy tests.
9. Run `npm run typecheck`.
10. Run `npm run test:unit`.
11. Run `npm run build`.
12. Perform schema drift comparison against migration output.
13. Publish redacted pass/fail evidence.
14. Destroy ephemeral resources.

## CI safety controls

- No production project reference or credentials.
- No secrets printed in command echo, artifacts or test snapshots.
- No real row fixtures.
- No network path to legacy/current Supabase during disposable tests.
- Synthetic seed cannot run unless the environment identifies itself as
  disposable or approved staging.
- Migration checksum/history changes are reviewed.
- Drift is a failure, not repaired automatically against remote.
- Failed policy tests prevent adapter/deployment promotion.

## Branching and promotion

- Pull requests: disposable reconstruction and application checks only.
- Main: same reconstruction, plus signed/redacted evidence retention if
  approved.
- Clean staging promotion: manual approval after CI success.
- Production promotion: not defined by C37 and explicitly blocked.

## Drift checks

Future CI should compare:

- empty-database migration result;
- expected table/constraint/index/policy/grant inventory;
- migration history;
- generated application types when adopted.

It must not pull remote production schema as an automatic repair mechanism.
Remote inspection requires a separate read-only authorization.

## Recovery expectations

Disposable environments are recreated rather than repaired. Clean staging must
gain backup/restore and forward-fix runbooks before persistent integration.
Future production requires demonstrated recovery objectives and rollback/cutover
approval.

Verdict: `C37_ENVIRONMENT_CI_PLAN_DRAFTED`.

## C38 Reconstruction Follow-up

C38 refines the disposable CI stage into an explicit state machine with
preflight, start, migrate, synthetic Auth/domain seed, assertions, policy tests,
application checks, redacted evidence and verified destruction.

Future CI requirements:

- pinned CLI/container versions;
- no linked or remote project configuration;
- unique disposable project identifier;
- exact schema/grant/RLS manifests;
- allowlisted evidence fields and secret-pattern scanning;
- cleanup that targets only the verified harness instance;
- failure on incomplete cleanup or nondeterministic reconstruction.

C38 does not execute this pipeline. Harness implementation and local stack
startup require future approval.
