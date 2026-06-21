# Nocturna V2 — Inventario de esquema Auth V2

STATUS: PENDING_REVIEW

## 1. Esquema local versionado

### Núcleo V1

| Objeto | Migración | Forma relevante |
|---|---|---|
| `public.institutions` | `0002_core_tables.sql` | `id`, `name`, `slug`, timestamps |
| `public.profiles` | `0002`, `0008` | `id = auth.users.id`, un `institution_id`, enum `role`, email/name, `is_active`, `session_version` |
| `public.courses` | `0002` | tenant, nombre/descripción, un `teacher_id`, creator |
| `public.enrollments` | `0002` | tenant, course, `student_id = profiles.id`; unique course/student |
| `public.user_role` | `0001` | student, teacher, admin, super_admin |
| JWT helpers | `0001`, `0008` | `auth.institution_id`, `auth.user_role`, `auth.session_version`, `auth.is_active` |
| Custom token hook | `0006`, `0008` | copia un tenant/rol/status/version desde profile |
| RLS | `0005`, `0011` y módulos posteriores | tenant por JWT; courses/enrollments SELECT tenant-wide |

### Otros objetos versionados

- tasks, submissions, grades y audit log;
- Storage policies y file registry;
- business RPCs;
- teacher/student invites;
- daily work y submissions.

Son evidencia de dependencia con el modelo V1; no forman el contrato Auth V2.

## 2. Esquema esperado por el runtime Auth V2

| Tabla/campo esperado | Evidencia de código | Forma esperada | ¿Existe en migrations? | Riesgo y decisión |
|---|---|---|---|---|
| `institution_memberships` | `lib/auth/active-membership.ts:156` | lista memberships por `profile_id` | No | Drift confirmado; versionar con el mismo nombre antes de depender de ella |
| membership `id` | select y `MembershipSummary` | UUID usado como `membershipId`/cookie | No | Debe ser PK opaca y no autoridad cliente |
| `institution_id` | select/join y contexto | FK tenant | Solo en otras tablas | Constraint con membership e institution |
| `profile_id` | query `.eq('profile_id', user.id)` | FK al profile/auth user | No | Conservar `profiles.id = auth.users.id` simplifica compatibilidad |
| membership `status` | filter runtime | active/invited/suspended/left | No | Cerrar vocabulario y lifecycle; DB actual manda |
| `joined_at` | select runtime | timestamp opcional | No | Definir `timestamptz` |
| `role_id` | join `roles:role_id` | FK a roles | No | Drift crítico |
| `roles.key` | join runtime | RoleKey V2 | No | Unique estable; compatibilidad con enum V1 |
| institution `name/slug/status` | join runtime | resumen y admisión | Parcial | `status` falta en migrations |
| `active_membership_id` | cookie, types y handler | selector HTTP-only actual | No DB context | Migrar a selection por `session_id`; cookie solo solicita |
| `session_id` | especificación C32/Supabase JWT | UUID por sesión | No app table | Base de `membership_session_selections` |
| `session_version` | V1 profile/JWT | invalidación global de tokens | Sí, profile | No reemplaza revocación por membership/sesión |
| capabilities | `getCapabilitiesForRoleKey` | matriz TypeScript | No DB | Mantener en código por ahora; no copiar a cliente como autoridad |
| `app_metadata` | JWT helpers/middleware | claims V1 server-controlled | Auth hook V1 | Pista de compatibilidad, no autoridad única V2 |

### Queries Auth V2 observadas

- `validateSessionV2()` autentica con `getUser()`.
- `getProfileForSessionV2()` lee profile activo con service client.
- `listMembershipsForUser()` usa service client y consulta
  `institution_memberships`, `roles` e `institutions`.
- `resolveActiveMembership()` valida la cookie contra memberships activas.
- `/api/memberships/active` recibe un membership UUID, lo valida y escribe cookie.
- `/api/auth/me-v2` expone el contexto resuelto.

El runtime actual valida server-side, pero RLS todavía no puede resolver esa
selection porque no existe una representación DB versionada por sesión.

## 3. Diferencias V1/V2

| Tema | V1 versionado | V2 esperado |
|---|---|---|
| Perfil | Identidad + tenant + rol | Identidad global |
| Tenant | `profiles.institution_id` único | membership seleccionada por sesión |
| Rol | enum único en profile | role row por membership |
| Roles válidos | student/teacher/admin/super_admin | owner/admin/teacher/assistant/student/guardian/support |
| JWT | tenant/role únicos | session ID + contexto validado en DB |
| Cambio de tenant | token/profile | selection por sesión |
| Courses | tenant-wide, un teacher | course + sections + assignments exactos |
| Enrollments | course/profile | section/term/student/lifecycle |
| Capabilities | inexistentes en DB | matriz TypeScript actual |

## 4. Hallazgos de drift

- No existe migración para `institution_memberships`.
- No existe migración para `roles`.
- No existe selección de membership por sesión.
- `institutions.status`, requerido por runtime, no está versionado.
- El vocabulario RoleKey V2 no está representado en DB.
- `profiles.institution_id` es `NOT NULL`, incompatible con perfil global y
  onboarding/multi-membership.
- Runtime usa tablas no reconstruibles desde el repo.
- El estado remoto real no fue inspeccionado en C33.

## Conclusión

`C33_AUTH_V2_SCHEMA_DRIFT_CONFIRMED`

El inventario local está completo para los archivos permitidos, pero confirma
drift entre migrations y runtime. No se puede declarar el esquema ejecutable ni
equivalente al remoto.

## C34 Remote Verification Update

The schema-only remote inspection confirms and expands the C33 inventory:

| Object | Remote | Local migrations | Runtime/contract | Decision |
|---|---:|---:|---|---|
| `institution_memberships` | No | No | Runtime-required | Missing, critical |
| `roles` | No | No | Runtime-required | Missing, critical |
| `role_capabilities` | No | No | TypeScript matrix for now | Keep deferred |
| `membership_session_selections` | No | No | C32/C33 contract | Missing |
| `institutions.status` | No | No | Runtime-required | Missing, critical |
| `profiles` | Yes | Yes | V1 bridge | Remote/local shape differs |
| `courses` | Yes | Yes | V1 bridge | Remote/local shape differs |
| `enrollments` | Yes | Yes | V1 bridge | `created_at` remote vs `enrolled_at` local |
| `academic_terms` | No | No | Future contract | Missing |
| exact `sections` | No | No | Future contract | `course_sections` is not equivalent |
| `section_staff` | No | No | Future contract | Missing |
| `students` | No | No | Decision pending | V1 profile convention only |

The remote uses the V1 `user_role` enum and access-token hook. It does not
contain the database authority required by Auth V2.

**C34 verdict:** `C34_REMOTE_SCHEMA_DRIFT_CONFIRMED`.
