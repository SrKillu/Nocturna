# Nocturna V2 Read Capability Adoption Report

STATUS: PENDING_REVIEW

## Executive summary

C28 adopts the explicit read capabilities introduced in C27 for current V2 route admission and navigation. The effective role-to-route matrix remains unchanged; broader management, grading, submission, attendance, material, certificate, and user capabilities no longer grant route read access by themselves.

## Before and after

| Module | Previous read gate | Adopted read gate | Effective roles |
|---|---|---|---|
| Courses and workspace | `canManageCourses` / `canGrade` / `canSubmit` | `canViewCourses` | Owner, admin, teacher, assistant, student |
| Students directory | `canManageCourses` / `canGrade` | `canViewStudents` | Owner, admin, teacher, assistant |
| Student profile | Shared student helper | `canViewStudentProfiles` | Owner, admin, teacher, assistant |
| My Space | `canSubmit` plus exclusions | `canViewOwnStudentProfile` plus student role | Student |
| Enrollments | `canManageCourses` plus role | `canViewEnrollments` plus role | Owner, admin |
| Attendance | `canManageAttendance` | `canViewAttendance` | Owner, admin, teacher, assistant |
| Evaluations | `canGrade` | `canViewEvaluations` | Owner, admin, teacher, assistant |
| Gradebook | `canGrade` | `canViewGradebook` | Owner, admin, teacher, assistant |
| Materials | `canManageMaterials` | `canViewMaterials` | Owner, admin, teacher, assistant |
| Certificates | `canManageCertificates` plus role | `canViewCertificates` plus role | Owner, admin |
| Staff | `canManageUsers` plus role | `canViewStaff` plus role | Owner, admin |

## Effective role matrix

| Role | Adopted module access |
|---|---|
| Owner | Courses, students/profile, enrollments, attendance, evaluations, gradebook, materials, certificates, staff |
| Admin | Same as owner |
| Teacher | Courses, students/profile, attendance, evaluations, gradebook, materials |
| Assistant | Same as teacher |
| Student | Courses and My Space |
| Guardian | No adopted module access change |
| Support | No adopted module access change |

## No access change confirmation

- Central route-contract tests still evaluate all 20 routed modules across all 7 roles.
- Navigation and direct-access helpers use the same role matrix.
- Dynamic course and student profile routes remain covered.
- Dashboard, notifications, settings, audit log, schedule, library, reports, and guardian space retain their existing contracts.

## Negative capability tests

Synthetic capability objects verify that the former overloaded grants no longer admit route reads:

- Course management, grading, and submission do not substitute for `canViewCourses`.
- Course management and grading do not substitute for student directory/profile reads.
- Submission does not substitute for the student self-profile read.
- Course management does not substitute for enrollment reads.
- Attendance management, grading, material management, certificate management, and user management do not substitute for their corresponding read capabilities.

## Scope and safety

No Supabase, endpoint, server action, migration, SQL, middleware, package, deployment, production, or V1 change is included. Two page files receive only minimal helper import/signature updates; visual rendering is unchanged.

## Remaining risks

1. Route capabilities do not establish institution, assignment, enrollment, own-record, or guardian-link scope.
2. Navigation remains a usability control rather than a security boundary.
3. Future real reads require deny-by-default RLS and server-side object authorization.
4. Write/action capabilities remain to be adopted when real mutations are designed.

## Recommended next steps

1. Define relationship-aware object contracts before Supabase integration.
2. Keep route reads and write actions on separate capability paths.
3. Add endpoint and RLS policy tests together with any future real data implementation.
