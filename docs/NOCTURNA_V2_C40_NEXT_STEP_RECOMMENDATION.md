STATUS: PENDING_REVIEW

# C40 Next Step Recommendation

## Recommendation

`C40_RECOMMEND_C41_LOCAL_SUPABASE_START_APPROVAL_PLAN`

## Why

The three dry-run executions failed closed only on expected inherited state,
produced valid/redacted evidence and executed no external or destructive
action. No harness defect requiring C41 hardening was found.

## C41 scope

C41 should design and request approval for:

- an isolated local disposable workdir/project ID;
- no inherited link or remote profile;
- exact permitted startup/status/stop commands;
- safe CLI output modes;
- ports, Docker resources and process checks;
- ephemeral credentials and redaction;
- target-specific cleanup;
- a human go/no-go checkpoint.

## C41 exclusions

- no service startup during the planning batch;
- no SQL, migration or policy test execution;
- no remote project;
- no legacy or real data;
- no production or deployment.

## Human approval still required

After C41 review, a separate execution authorization must explicitly allow
starting the isolated local Supabase stack. Approval of this recommendation is
not itself permission to run `supabase start`.
