STATUS: PENDING_REVIEW

# C36 Data Retention Audit

## Executive summary

C36 performs a Level 0 retention audit: schema evidence, prior documentation
and owner questions only. It does not read rows, count records, inspect PII,
export data or connect to Supabase.

The current database may remain as a temporary legacy system. Nothing should be
deleted, migrated automatically or treated as disposable until the owner
classifies its users, institutions, academic records, messages and files.

Clean V2 staging may proceed as architecture and synthetic-data work, but not as
a cutover or replacement.

Verdict: `C36_RETENTION_AUDIT_DRAFTED_OWNER_INPUT_REQUIRED`

## Why this audit exists

C34 confirmed schema drift and C35 recommended a hybrid strategy:

- preserve the product and current V1 database;
- build a clean V2 staging foundation;
- decide data retention before migration, archival or retirement.

The audit separates technical architecture from business/legal custody of data.

## What is known

- The remote public schema contains 17 tables.
- It includes V1 profiles, institutions, courses and enrollments.
- It includes remote-only course sections, final grades, materials and
  messages.
- It includes tasks, submissions, grades, invites, daily work, file metadata
  and audit log structures.
- The current database remains V1-shaped.
- No Auth V2 membership/session authority exists remotely.
- C34 read schema only and no table rows.

## What is not known

Without row access, C36 cannot establish:

- whether tables contain any records;
- whether records are real, synthetic, abandoned or duplicated;
- whether Auth users are active people;
- whether institutions/courses/students are operational;
- whether grades or documents are official;
- whether Storage objects exist or contain sensitive files;
- who owns each dataset;
- applicable retention law, policy or contract;
- record age, quality, completeness or migration value.

Absence of evidence is not evidence that data may be deleted.

## Potential data domains

| Domain | Potential content | Retention concern |
|---|---|---|
| Auth users | identities, email, sessions | identity continuity, privacy |
| profiles | names, email, tenant/role | PII and authorization history |
| institutions | organization identity | business ownership |
| courses | academic offering | operational/academic record |
| enrollments | student participation | sensitive educational relationship |
| course_sections | legacy content structure | unknown ownership/source |
| final_grades | final academic result | potentially official/high retention |
| grades | submission scores/feedback | educational record |
| materials | filenames/URLs/content refs | copyright and file retention |
| messages | user communications | privacy and institutional policy |
| Storage/files | uploaded documents/assets | sensitive content and legal hold |
| audit logs | actors/actions/metadata | security/compliance evidence |
| invites | email/token lifecycle metadata | PII/security history |
| tasks/daily work | assignments/content | academic record |
| submissions | student work/files | sensitive educational content |
| daily work submissions | student responses | educational content |

## Required classification

Every domain must receive one owner-approved classification:

1. **Critical business data** — required for operations, records, identity,
   compliance or contractual continuity.
2. **Useful non-critical data** — valuable for reference but not required for
   continuity.
3. **Test/demo data** — synthetic or disposable, not suitable for migration.
4. **Unknown ownership** — cannot be acted on until a custodian decides.
5. **Obsolete** — no longer operational, but still subject to archive/deletion
   approval.

## Risk by class

| Classification | Risk of deletion/ignoring | Default action |
|---|---|---|
| Critical | data loss, legal breach, broken identity/operations | preserve; formal migration governance |
| Useful non-critical | lost reference/history | preserve; selective review later |
| Test/demo | contamination of clean staging | do not migrate; retain until confirmed |
| Unknown ownership | unauthorized deletion or disclosure | preserve and escalate |
| Obsolete | hidden retention or recovery need | archive/preserve until approved |

## Preliminary recommendation

- Do not delete anything.
- Do not migrate automatically.
- Do not use legacy rows or claims as V2 authority.
- Keep the existing project as temporary legacy.
- Design clean staging with synthetic data only.
- Do not copy Auth users, table rows or Storage objects without explicit scope.
- Require owner and, where relevant, legal/institutional approval before
  migration, archival or deletion.

## Human decisions pending

- Are there real users and identities?
- Are any academic records official?
- Does Storage contain documents that must be retained?
- Which person/institution owns each domain?
- What retention period and legal basis apply?
- Must Auth user IDs remain stable?
- Can legacy become read-only?
- Which domains may be recreated synthetically?
- Who authorizes migration/export/deletion?
- What evidence and backup are required before change?

## Current path

Clean V2 architecture may advance without real data. Cutover, legacy retirement
and data migration remain blocked.

`C36_RECOMMEND_C37_CLEAN_SUPABASE_V2_ARCHITECTURE_DRAFT_WITH_LEGACY_RETENTION_GATE`
