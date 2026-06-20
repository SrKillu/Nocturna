# Nocturna V2 RBAC Cleanup Notes

STATUS: PENDING_REVIEW

- Batch: C24 RBAC Capability Cleanup V2
- Date: June 20, 2026
- Branch: `feature/nocturna-c24-rbac-capability-cleanup-v2`
- Base: `main` at merge commit `b37a5ba`

## Summary

C24 replaces five temporary visual-foundation authorization substitutes with explicit route-purpose capabilities. Navigation and direct server-side route access now use the same capability contract. The effective role access matrix remains unchanged.

No existing capability was removed or broadened. No Supabase, database, endpoint, server action, migration, package, deployment, production, or V1 change is included.

## Before and after

| Module | Previous gate | C24 gate | Effective roles |
|---|---|---|---|
| Audit log | `canViewInstitutionSettings` plus owner/admin | `canViewAuditLog` plus owner/admin | Owner, admin |
| Schedule | `canManageAttendance` plus staff role scope | `canViewSchedule` plus the same role scope | Owner, admin, teacher, assistant |
| Library | `canManageMaterials` plus staff role scope | `canAccessLibrary` plus the same role scope | Owner, admin, teacher, assistant |
| Guardian space | `canViewReports` plus guardian role | `canViewLinkedStudents` plus guardian role | Guardian |
| Notifications | Role allow-list with no capability | `canViewNotifications` plus the same role allow-list | All V2 roles |

## New capabilities

| Capability | Owner | Admin | Teacher | Assistant | Student | Guardian | Support |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `canViewAuditLog` | Yes | Yes | No | No | No | No | No |
| `canViewSchedule` | Yes | Yes | Yes | Yes | No | No | No |
| `canAccessLibrary` | Yes | Yes | Yes | Yes | No | No | No |
| `canViewLinkedStudents` | No | No | No | No | No | Yes | No |
| `canViewNotifications` | Yes | Yes | Yes | Yes | Yes | Yes | Yes |

## Unchanged capabilities

The assignments for the following capabilities remain unchanged:

- `canManageInstitution`
- `canViewInstitutionSettings`
- `canManageAttendance`
- `canManageMaterials`
- `canViewReports`
- `canSubmit`
- `canGrade`

## Modules and contracts affected

- Navigation definitions for audit log, schedule, library, guardian space, and notifications.
- Server-side access helpers used by those five routes.
- Notifications route now supplies the active membership capabilities to its access helper.
- Capability matrix, navigation contract, and module access unit tests.

## Effective behavior by role

| Role | Audit log | Schedule | Library | Guardian space | Notifications |
|---|:---:|:---:|:---:|:---:|:---:|
| Owner | Yes | Yes | Yes | No | Yes |
| Admin | Yes | Yes | Yes | No | Yes |
| Teacher | No | Yes | Yes | No | Yes |
| Assistant | No | Yes | Yes | No | Yes |
| Student | No | No | No | No | Yes |
| Guardian | No | No | No | Yes | Yes |
| Support | No | No | No | No | Yes |

## Security assertions

- Institution-settings visibility no longer grants audit-log access.
- Attendance management no longer grants schedule visibility.
- Materials management no longer grants library access.
- Report visibility no longer grants guardian-space access.
- Academic capabilities do not grant notifications access.
- Role restrictions remain in place in addition to the new capabilities.

## Remaining risks

- These are application-level contracts, not RLS policies.
- Several other modules still combine read and write permissions.
- Linked guardian/student relationships still require real data policy design.
- Notifications need recipient-level data authorization when persistence is introduced.
- Audit data will require immutable storage, retention, and redaction rules.

## Recommended next phase

1. Split remaining read/write capabilities before domain endpoint design.
2. Convert the route-role matrix into a reusable contract test covering every V2 route.
3. Map capabilities to institution- and relationship-aware RLS requirements.
4. Keep schema and endpoint integration in small reviewed vertical slices.
