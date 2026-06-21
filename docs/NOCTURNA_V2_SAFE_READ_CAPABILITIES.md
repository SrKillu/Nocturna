# Nocturna V2 Safe Read Capabilities

STATUS: PENDING_REVIEW

- Date: June 21, 2026
- Branch: `feature/nocturna-c27-safe-read-capability-additions-v2`
- Base commit: `e6f8447`

## 1. Summary

C27 adds explicit read-capability vocabulary for domains that currently use broader management, grading, or submission capabilities. These additions prepare Nocturna V2 for finer route contracts, endpoint policy, and deny-by-default RLS.

C27 does not adopt the new capabilities in navigation, route admission, runtime access helpers, or pages. The effective visible and direct-access matrix remains unchanged. C28 should adopt the approved read capabilities while updating route-role contract tests in the same change.

> C28 adopted the approved read capabilities for route admission and navigation while preserving the effective role matrix.

## 2. Capabilities added

| Capability | Purpose | Roles set to true | Domain | Future replacement for route reads | RLS risk reduced |
|---|---|---|---|---|---|
| `canViewCourses` | View course lists and workspaces | Owner, admin, teacher, assistant, student | Courses | Read inference from `canManageCourses`, `canGrade`, or `canSubmit` | Prevents course reads from implying course mutation |
| `canViewSections` | View sections/groups within authorized scope | Owner, admin, teacher, assistant, student | Sections | Read inference from course management/submission | Separates section visibility from roster/section writes |
| `canViewStudents` | View institutional student directory | Owner, admin, teacher, assistant | Students | Read inference from `canManageCourses` or `canGrade` | Prevents student list access from implying academic writes |
| `canViewStudentProfiles` | View authorized institutional student profiles | Owner, admin, teacher, assistant | Student profiles | Same overloaded student helper | Supports narrower sensitive-field projections |
| `canViewOwnStudentProfile` | View the authenticated student’s own profile | Student | Student self-service | Self-space inference from `canSubmit` | Separates personal reads from submission writes |
| `canViewEnrollments` | View institution enrollment records | Owner, admin | Enrollments | Read inference from `canManageCourses` | Separates queue visibility from lifecycle mutation |
| `canViewAttendance` | View authorized attendance data | Owner, admin, teacher, assistant | Attendance | `canManageAttendance` for route read | Separates attendance reads from recording/correction |
| `canViewEvaluations` | View authorized evaluation definitions | Owner, admin, teacher, assistant | Evaluations | `canGrade` for route read | Separates evaluation visibility from authoring/grading |
| `canViewGradebook` | View authorized gradebook data | Owner, admin, teacher, assistant | Gradebook | `canGrade` for route read | Separates grade visibility from score mutation |
| `canViewOwnGrades` | View the authenticated student’s own grades | Student | Gradebook self-service | Future personal grade view | Prevents broad gradebook access for students |
| `canViewLinkedStudentGrades` | View grades for a verified linked student | Guardian | Guardian/grade projections | Future guardian grade view | Requires relationship-derived scope instead of institution-wide access |
| `canViewMaterials` | View authorized course materials metadata | Owner, admin, teacher, assistant | Materials | `canManageMaterials` for route read | Separates metadata/object reads from upload/archive |
| `canViewCertificates` | View certificate records | Owner, admin | Certificates | `canManageCertificates` for route read | Separates directory visibility from issue/revoke actions |
| `canViewStaff` | View institution staff directory | Owner, admin | Staff | `canManageUsers` for route read | Separates directory reads from identity administration |

## 3. New read-capability role matrix

| Capability | Owner | Admin | Teacher | Assistant | Student | Guardian | Support |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `canViewCourses` | Yes | Yes | Yes | Yes | Yes | No | No |
| `canViewSections` | Yes | Yes | Yes | Yes | Yes | No | No |
| `canViewStudents` | Yes | Yes | Yes | Yes | No | No | No |
| `canViewStudentProfiles` | Yes | Yes | Yes | Yes | No | No | No |
| `canViewOwnStudentProfile` | No | No | No | No | Yes | No | No |
| `canViewEnrollments` | Yes | Yes | No | No | No | No | No |
| `canViewAttendance` | Yes | Yes | Yes | Yes | No | No | No |
| `canViewEvaluations` | Yes | Yes | Yes | Yes | No | No | No |
| `canViewGradebook` | Yes | Yes | Yes | Yes | No | No | No |
| `canViewOwnGrades` | No | No | No | No | Yes | No | No |
| `canViewLinkedStudentGrades` | No | No | No | No | No | Yes | No |
| `canViewMaterials` | Yes | Yes | Yes | Yes | No | No | No |
| `canViewCertificates` | Yes | Yes | No | No | No | No | No |
| `canViewStaff` | Yes | Yes | No | No | No | No | No |

Personal and relationship-derived capabilities are intentionally not granted to owner or admin. They express how a user relates to a record, not institutional authority.

## 4. Confirmation of no effective change

- Navigation definitions are unchanged.
- Direct route access helpers are unchanged.
- Central route-role contracts are unchanged.
- No page or layout is changed.
- Existing management/write capabilities and assignments are unchanged.
- No role gains or loses a visible route.
- No role gains or loses direct route admission.
- Supabase, RLS, migrations, and remote resources are unchanged.
- Endpoints and server actions are unchanged.
- V1 is unchanged.
- Package files are unchanged.

The new capabilities are vocabulary only until a future approved adoption batch.

## 5. Recommended next step

C28 should:

1. Replace overloaded read gates with the corresponding explicit read capabilities.
2. Update navigation and direct-access helpers together.
3. Update centralized route-role contract tests in the same PR.
4. Preserve the exact effective role matrix.
5. Keep management/write capabilities for future actions rather than route admission.

No RLS or endpoint should use the new vocabulary until route adoption and domain relationship requirements are reviewed.
