# Nocturna V2 Route-Role Contracts

STATUS: PENDING_REVIEW

- Date: June 21, 2026
- Branch: `feature/nocturna-c25-route-role-contract-tests-v2`
- Base: `main`
- Base commit: `84f3e37`

## Summary

C25 centralizes the expected access contract for every routed Nocturna V2 module. The unit suite evaluates the same pure access helpers used by the server-rendered pages, compares direct access with role-aware navigation, and verifies that every contracted route has a physical `page.tsx`.

This is a frontend authorization contract. It does not replace future institution-, relationship-, and row-level policies in Supabase.

## Route-to-role matrix

| Route | Owner | Admin | Teacher | Assistant | Student | Guardian | Support | Primary capability |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| `/v2/dashboard` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Active membership |
| `/v2/notifications` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | `canViewNotifications` |
| `/v2/settings` | Yes | Yes | No | No | No | No | No | `canViewInstitutionSettings` |
| `/v2/audit-log` | Yes | Yes | No | No | No | No | No | `canViewAuditLog` |
| `/v2/courses` | Yes | Yes | Yes | Yes | Yes | No | No | Any of `canManageCourses`, `canGrade`, `canSubmit` |
| `/v2/courses/[courseId]` | Yes | Yes | Yes | Yes | Yes | No | No | Same as courses |
| `/v2/students` | Yes | Yes | Yes | Yes | No | No | No | Any of `canManageCourses`, `canGrade` |
| `/v2/students/[studentId]` | Yes | Yes | Yes | Yes | No | No | No | Same as students |
| `/v2/enrollments` | Yes | Yes | No | No | No | No | No | `canManageCourses` plus owner/admin |
| `/v2/staff` | Yes | Yes | No | No | No | No | No | `canManageUsers` plus owner/admin |
| `/v2/attendance` | Yes | Yes | Yes | Yes | No | No | No | `canManageAttendance` |
| `/v2/schedule` | Yes | Yes | Yes | Yes | No | No | No | `canViewSchedule` |
| `/v2/evaluations` | Yes | Yes | Yes | Yes | No | No | No | `canGrade` |
| `/v2/gradebook` | Yes | Yes | Yes | Yes | No | No | No | `canGrade` |
| `/v2/reports` | Yes | Yes | Yes | Yes | No | No | No | `canViewReports` plus staff role scope |
| `/v2/certificates` | Yes | Yes | No | No | No | No | No | `canManageCertificates` plus owner/admin |
| `/v2/materials` | Yes | Yes | Yes | Yes | No | No | No | `canManageMaterials` |
| `/v2/library` | Yes | Yes | Yes | Yes | No | No | No | `canAccessLibrary` |
| `/v2/my-space` | No | No | No | No | Yes | No | No | `canSubmit` excluding managerial capabilities |
| `/v2/guardian-space` | No | No | No | No | No | Yes | No | `canViewLinkedStudents` plus guardian |

## Role-to-route matrix

| Role | Directly accessible routes |
|---|---|
| Owner | Dashboard, notifications, settings, audit log, courses/workspace, students/profile, enrollments, staff, attendance, schedule, evaluations, gradebook, reports, certificates, materials, library |
| Admin | Same routed modules as owner; `canManageInstitution` remains false |
| Teacher | Dashboard, notifications, courses/workspace, students/profile, attendance, schedule, evaluations, gradebook, reports, materials, library |
| Assistant | Same routed modules as teacher |
| Student | Dashboard, notifications, courses/workspace, my space |
| Guardian | Dashboard, notifications, guardian space |
| Support | Dashboard, notifications |

## Navigation consistency

- Every current navigation destination has a route contract.
- Every navigation item is visible only when its corresponding direct-access helper permits the role.
- Dynamic course and student detail routes intentionally reuse the access helper of their parent module and do not add separate navigation entries.
- The `/v2` entry page is a protected redirect to `/v2/dashboard`; it is not a module contract.

## Direct access helpers

| Routes | Runtime access helper |
|---|---|
| Dashboard | Protected V2 layout and active membership |
| Courses and course workspace | `canAccessCoursesV2` |
| Students and student profile | `canAccessStudentsV2` |
| My space | `canAccessMySpaceV2` |
| Guardian space | `canAccessGuardianSpaceV2` |
| Attendance | `canAccessAttendanceV2` |
| Evaluations | `canAccessEvaluationsV2` |
| Materials | `canAccessMaterialsV2` |
| Gradebook | `canAccessGradebookV2` |
| Reports | `canAccessReportsV2` |
| Certificates | `canAccessCertificatesV2` |
| Staff | `canAccessStaffV2` |
| Enrollments | `canAccessEnrollmentsV2` |
| Schedule | `canAccessScheduleV2` |
| Library | `canAccessLibraryV2` |
| Settings | `canAccessSettingsV2` |
| Audit log | `canAccessAuditLogV2` |
| Notifications | `canAccessNotificationsV2` |

## Inferred or pending contracts

- Dashboard has no module-specific capability; authentication and active membership are enforced by the V2 boundary.
- Courses, students, attendance, evaluations, materials, gradebook, certificates, staff, enrollments, and settings still use capabilities that combine viewing with management or mutation authority.
- Course workspace and student profile reuse parent-module authorization. Future relationship-aware integration must add object-level authorization after route-level admission.

## Risks

1. Route-level access does not prove row-level access to an institution, section, student, or linked guardian record.
2. Navigation visibility is usability behavior, not a security boundary.
3. Capability-only helpers depend on the role capability matrix remaining reviewed and tested.
4. Future routes can drift unless they are added to the centralized contract in the same change.
5. Real endpoints will need equivalent server-side policy tests and deny-by-default RLS.

## Recommendations

1. Require every new V2 route PR to update the centralized route contract.
2. Split remaining read/write capabilities before real data integration.
3. Add object-level policy contracts for courses, sections, students, and guardian links.
4. Translate the approved route-role matrix into reviewed RLS requirements rather than duplicating frontend assumptions blindly.
