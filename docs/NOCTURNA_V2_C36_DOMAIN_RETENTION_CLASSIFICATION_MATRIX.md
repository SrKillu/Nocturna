STATUS: PENDING_REVIEW

# C36 Domain Retention Classification Matrix

Schema presence shows only that a domain could contain data. It does not prove
record existence, ownership or business value.

| Domain/Object | Possible Data | Current Evidence | Owner Classification Needed | Default Safe Action | Future Migration Need |
|---|---|---|---|---|---|
| `auth.users` | identity/email/session references | Auth FKs/hooks exist | real/test; ID continuity | preserve legacy; no inspection | likely if real identities |
| `profiles` | name/email/role/institution | remote table exists | PII and active users | preserve; do not migrate | yes if real users |
| `institutions` | organization identity | remote table exists | real/demo ownership | preserve | yes if real |
| `courses` | course metadata | remote table exists | real/demo | preserve | selective/transform |
| `enrollments` | student-course links | remote table exists | real/demo/sensitive | preserve | transform to V2 model |
| `course_sections` | legacy sections/content | remote-only table | ownership and equivalence | preserve as unknown | manual mapping decision |
| `final_grades` | final scores | remote-only table | official/test/obsolete | preserve; high caution | formal migration if real |
| `grades` | scores/feedback | remote table exists | official/test | preserve | formal migration if real |
| `materials` | URLs/files/metadata | remote-only table | ownership/copyright | preserve | selective plus Storage mapping |
| `messages` | communications | remote-only table | real/demo/privacy | preserve; restrict | likely archive, not bulk seed |
| Storage objects | files/documents | schema references only | existence/sensitivity | preserve; no copy | domain-specific |
| `file_objects` | file metadata | divergent remote table | real/demo mapping | preserve | reconcile with Storage |
| `student_invites` | emails/tokens/status | remote table exists | active/expired/demo | preserve; security review | generally no migration |
| `teacher_invites` | emails/tokens/status | remote table exists | active/expired/demo | preserve; security review | generally no migration |
| `tasks` | assignments/files | remote table exists | academic/demo | preserve | selective transform |
| `submissions` | student work/files | remote table exists | real/sensitive | preserve; high caution | formal migration if required |
| `daily_work` | daily assignments | remote table exists | academic/demo | preserve | selective transform |
| `daily_work_submissions` | responses/content | remote table exists | real/sensitive | preserve | formal migration if required |
| `audit_log` | actor/action metadata | remote table exists | compliance/security value | preserve | archive or migrate selectively |

## Remote-only objects

All remote-only tables identified by C34 default to:

- classification: unknown ownership;
- action: preserve as legacy;
- migration: none until owner/domain review;
- deletion: prohibited without approval.

## Default decision

No domain is cleared for deletion or migration.

`C36_RETENTION_AUDIT_DRAFTED_OWNER_INPUT_REQUIRED`
