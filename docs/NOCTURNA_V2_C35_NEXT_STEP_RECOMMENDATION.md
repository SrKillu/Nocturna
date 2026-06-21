STATUS: PENDING_REVIEW

# C35 Next Step Recommendation

## Recommended immediate batch

**C36 Data Retention Audit**

The technical destination is clean Supabase V2 staging, but the current
database cannot be retired or migrated until its records and obligations are
classified.

## Why C36 retention comes first

- C34 was schema-only and intentionally read no rows.
- The current project may contain Auth identities, files or academic records.
- A clean staging project can be designed safely, but cutover scope depends on
  what must be retained.
- The audit prevents both accidental data loss and unnecessary bulk migration.

## What C36 should do

- collect owner answers to the retention questionnaire;
- classify each domain as critical/useful/test/unknown;
- document identity and Storage continuity needs;
- define archive and access requirements;
- choose the migration path per domain;
- recommend whether the next technical batch is clean architecture or current
  baseline reconstruction.

## What C36 must not do

- read or export real records without explicit authorization;
- create a Supabase project;
- execute SQL;
- migrate, delete or archive data;
- modify runtime or production;
- request secrets in chat.

## Approval needed

Human owner approval is required for:

- data classification;
- retention duration;
- whether Auth identities must remain;
- whether clean staging may be created;
- whether any future export/migration is authorized.

## Subsequent batch

If no critical data blocks the strategy:

**C37 Clean Supabase V2 Architecture Draft**

That batch should define clean migrations, environment boundaries, synthetic
seed, CI reconstruction and policy-test structure without creating a remote
project.

## Verdicts

- Strategic: `C35_RECOMMEND_HYBRID_CLEAN_STAGING_THEN_MIGRATE`
- Immediate: `C35_RECOMMEND_DATA_RETENTION_AUDIT`
