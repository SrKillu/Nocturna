# Nocturna V2 — Reconciliación del esquema local existente

STATUS: PENDING_REVIEW

## 1. Archivos locales revisados

Se revisaron, sin ejecutar:

- `supabase/migrations/0001_helper_functions.sql`
- `supabase/migrations/0002_core_tables.sql`
- `supabase/migrations/0003_indexes.sql`
- `supabase/migrations/0004_triggers.sql`
- `supabase/migrations/0005_rls_policies.sql`
- `supabase/migrations/0006_auth_hook.sql`
- `supabase/migrations/0007_storage.sql`
- `supabase/migrations/0008_auth_hardening.sql`
- `supabase/migrations/0009_business_rpcs.sql`
- `supabase/migrations/0010_storage_hardening.sql`
- `supabase/migrations/0011_courses_insert_staff.sql`
- `supabase/migrations/0016_tasks_attachments.sql`
- `supabase/migrations/0020_invites.sql`
- `supabase/migrations/0022_daily_work.sql`
- `docs/sql-drafts/NOCTURNA_V2_C30_COURSES_SECTIONS_SCHEMA_RLS_DRAFT.sql`
- Auth V1/V2 local bajo `lib/auth/`, `lib/supabase/`, middleware y los dos
  handlers Auth V2 autorizados.

Existe `supabase/migrations/`. No existen `supabase/schemas/`, `database/` ni un
directorio raíz `migrations/`. No se encontró un dump declarativo del estado
actual. Ningún archivo fue aplicado.

## 2. Entidades y conceptos existentes

| Concepto | Estado local | Evidencia |
|---|---|---|
| Institutions | Existe V1 | `public.institutions(id, name, slug, created_at, updated_at)` |
| Profiles | Existe V1 | PK = `auth.users.id`; un `institution_id`, un enum `role`, `is_active`, `session_version` |
| Memberships | No existe en migrations | Runtime V2 consulta `institution_memberships` |
| Roles | No existe tabla en migrations | Runtime V2 hace join a `roles:role_id(key)` |
| Capabilities | Solo código TypeScript | Matriz estática `ROLE_CAPABILITIES`; no autoridad DB |
| Active membership | Cookie/runtime solamente | `active_membership_id` validada server-side, no contexto RLS persistido |
| Sessions | Supabase Auth + contador V1 | JWT incluye sesión; migrations solo agregan `profiles.session_version` global |
| Users/Auth | Existe integración | `auth.users`, trigger de perfil y custom access token hook |
| Courses | Existe V1 | Curso tenant-scoped con `teacher_id`; sin código, estado, periodo o secciones |
| Sections | No existe | Solo diseño C30 |
| Enrollments | Existe V1 | Curso ↔ `profiles`; sin sección, periodo, status ni lifecycle |
| Students | No existe tabla separada | V1 usa `profiles` directamente como estudiante |

## 3. Compatibilidad con C30/C31

| Entidad | Nombre actual | Propuesta C30 | Compatibilidad y riesgo | Decisión recomendada |
|---|---|---|---|---|
| Institution | `institutions.id` | `institutions.institution_id` | Identidad compatible; faltan status, locale, timezone y archive. Crear otra tabla duplicaría tenant root. | Evolucionar la tabla existente, conservando `id` salvo decisión de naming global. |
| Profile | `profiles.id = auth.users.id` y tenant/role directos | Perfil global + memberships | Conflicto estructural: V1 modela un tenant/rol por usuario; V2 necesita varios. | Mantener `profiles.id` como auth/profile ID y mover autoridad tenant/role a memberships; preservar columnas V1 durante transición. |
| Membership | Ausente en migrations; runtime usa `institution_memberships` | `memberships` | Fuente real no versionada; no se conocen constraints/policies definitivos. | No crear `memberships` paralela. Primero versionar/reconciliar `institution_memberships` existente. |
| Role | Enum V1 `user_role`; runtime espera tabla `roles` | `role_key`/roles | Dos representaciones y role sets distintos (`super_admin` vs owner/assistant/etc.). | Definir bridge explícito y una autoridad V2; no inferir schema de `roles` desde el join runtime. |
| Capability | Matriz TypeScript | helper `has_capability` | No existe modelo DB ni contrato de versión. | Para el primer slice, derivar de role key aprobado y mantener relación row-level separada; decidir después si se persiste. |
| Session selection | No existe | selección por sesión | Cookie actual no es visible para RLS; `session_version` invalida todas las sesiones del perfil, no selecciona tenant. | Agregar en futura migración una selección por `session_id`, después de reconciliar memberships. |
| Course | `courses` V1 | `courses` enriquecido | Reutilizable, pero la policy actual da SELECT a todo el tenant y `teacher_id` solo permite un docente. | Evolucionar, no duplicar; reemplazar lectura tenant-wide por matriz V2 en un corte coordinado. |
| Section | Ausente | `sections` | Sin conflicto nominal local, pero depende de course/term/tenant constraints. | Crear solo después de aprobar terms y claves compuestas tenant-safe. |
| Section staff | `courses.teacher_id` parcial | `section_staff` | El campo V1 no soporta asistentes, múltiples secciones ni lifecycle. | Migrar/compatibilizar asignaciones; no tratar `teacher_id` como modelo final. |
| Enrollment | `enrollments(course_id, student_id)` | enrollment por section/term/status | Incompatible semánticamente; la policy actual es tenant-wide y permite self-enroll/delete. | Diseñar evolución o tabla versionada sin conservar acceso amplio; no duplicar silenciosamente. |
| Student | Perfil con role student | tabla `students` ligada opcionalmente a profile | Falta separar persona académica de identidad autenticada. | Diferir student real-data o agregar entidad mínima junto con tests completos. |
| Academic term | Ausente | `academic_terms` | Necesario para secciones/enrollments C30. | Definir antes de convertir C30. |

## 4. Diferencias de lifecycle y multi-tenancy

- `institutions` local no tiene status; Auth V2 espera `active`, `trial`,
  `suspended` o `archived`.
- `profiles.institution_id` es `NOT NULL` en la migración, mientras comentarios y
  runtime contemplan onboarding sin tenant y múltiples memberships.
- `public.user_role` solo incluye student/teacher/admin/super_admin; RoleKey V2
  incluye owner/admin/teacher/assistant/student/guardian/support.
- `courses` y `enrollments` no tienen status/archive.
- `enrollments` no distingue term, section ni relación revocada.
- RLS V1 obtiene tenant/role del JWT y permite leer courses/enrollments completos
  del tenant; no implementa asignación exacta ni matrícula exacta.
- `auth.institution_id()` y `auth.user_role()` son `SECURITY DEFINER` con grants
  a roles de cliente. Aunque solo leen JWT, cualquier reemplazo debe revisar
  search path, grants y necesidad real.
- El custom access token hook inyecta un solo tenant/rol desde `profiles`; no
  modela selección por sesión.
- `bump_session_version` invalida globalmente tokens del perfil; no sustituye
  revocación/selectión por membership.

## 5. Riesgos

### Tablas duplicadas

Crear `memberships`, `profiles`, `courses` o `enrollments` nuevas usando nombres
C30 sin un plan de evolución podría partir la autoridad entre V1 y V2.

### Mezcla V1/V2

El middleware preserva claims V1 mientras `/v2` usa consultas Auth V2 con service
role. Una migración parcial puede hacer que runtime, JWT y RLS calculen tenants
distintos.

### Claims obsoletos

El hook actual transporta tenant/rol únicos. Cambios de membership/role no son
seguros hasta refrescar token salvo que la DB valide estado actual.

### Session context ausente

No hay selección persistida por `session_id`. La cookie solo se valida en el
servidor y no puede alimentar RLS de manera autónoma.

### Recursión y privilegios

Nuevos helpers que consulten memberships/roles/selecciones pueden recursar con
sus policies. `SECURITY DEFINER` no debe usarse para ocultar ese problema.

### Constraints tenant incompletos

Las FK actuales comprueban IDs, pero no siempre que ambos lados compartan
`institution_id`. C30 necesita claves/constraints tenant-safe.

### Estado local incompleto

El runtime depende de `institution_memberships` y `roles`, pero ninguna migración
local los crea. Por tanto, el repo no permite reconstruir con certeza el esquema
Auth V2 que la aplicación espera.

## 6. Decisiones antes de C33

1. Obtener/versionar el origen real de `institution_memberships` y `roles`.
2. Confirmar si el remoto contiene drift no representado, mediante un batch
   explícitamente autorizado de inspección; C32 no lo hace.
3. Elegir una transición compatible para `profiles.institution_id`/`role`.
4. Definir si courses/enrollments se alteran o se migran con backfill.
5. Diseñar constraints de tenant y policy cutover sin abrir acceso temporal.
6. Revisar todos los grants explícitos, especialmente por el cambio de Data API
   de 2026.

## 7. Conclusión

`C32_SCHEMA_RECONCILIATION_INCOMPLETE_LOCAL_ONLY`

La evidencia local es suficiente para detectar incompatibilidades, pero no para
producir una migración segura: faltan precisamente las tablas Auth V2 que el
runtime usa. C33 debe ser un schema/context fix pass, no una conversión directa
de C30 a migración.

## C33 Auth V2 Schema Context Update

### Drift confirmado

C33 confirma mediante referencias directas del runtime que:

- `lib/auth/active-membership.ts` consulta `institution_memberships`;
- el mismo query espera `role_id` y `roles.key`;
- ninguna migración local crea `institution_memberships` o `roles`;
- el runtime espera `institutions.status`, que tampoco está en el schema base V1.

El drift confirmado es entre código y migrations locales. El estado remoto sigue
sin inspección y no se infiere.

### Decisión de no duplicación

- Conservar `profiles.id = auth.users.id`.
- Evolucionar `public.institutions`, no crear otro tenant root.
- Versionar el nombre ya usado por runtime: `institution_memberships`.
- Definir `roles` como autoridad de role key V2.
- Evolucionar courses/enrollments existentes mediante transición; no crear una
  segunda autoridad silenciosa.

### Ruta recomendada

1. Autorizar una inspección remota read-only o recuperar la migration fuente.
2. Conciliar el schema real con el contrato C33.
3. Crear una migration local draft separada para roles, memberships y selections.
4. Probar backfill V1 no destructivo en DB desechable.
5. Mantener columnas/policies V1 durante el bridge.
6. Adoptar contexto y policies V2 por slice.

**C33 verdict:** `C33_AUTH_V2_SCHEMA_DRIFT_CONFIRMED`.

## C34 Remote Schema Drift Inspection Update

C34 completed a linked, schema-only remote dump without reading table rows or
executing SQL writes.

- Remote Auth V2 tables `institution_memberships`, `roles`,
  `role_capabilities` and `membership_session_selections` are absent.
- `institutions.status` is absent.
- Remote `profiles`, `courses` and `enrollments` exist but differ from local
  migrations in nullability, columns, constraints, indexes or policies.
- `course_sections`, `final_grades`, `materials` and `messages` exist remotely
  without a creating migration in `supabase/migrations`.
- The remote remains V1-shaped around profile tenant/role JWT claims.

The remote/local/runtime difference is now confirmed rather than inferred.
Before any real migration, prepare a local baseline/reconciliation package and
test it in a disposable database.

**C34 verdict:** `C34_REMOTE_SCHEMA_DRIFT_CONFIRMED`.

**C35 recommendation:** `C34_RECOMMEND_C35_SCHEMA_BASELINE_RECONCILIATION`.
