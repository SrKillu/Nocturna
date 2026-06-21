# Nocturna V2 — Mapa de resolución de blockers C33

STATUS: PENDING_REVIEW

| Blocker | Estado antes | Qué resuelve C33 | Qué queda pendiente | ¿Bloquea migración? |
|---|---|---|---|---|
| `institution_memberships` missing | Runtime sin migration local | Define contrato, nombre, columnas, lifecycle, índices y transición | Confirmar remoto y crear/probar migration local | Sí |
| `roles` missing | Join runtime no reconstruible | Define roles V2 y bridge V1 | IDs/seed/migration/policies ejecutadas | Sí |
| Profile V1 one-tenant | Conflicto multi-membership | Mantiene profile ID global y marca tenant/role legacy | Backfill y writer/cutover probado | Sí |
| Active selection missing | Cookie server-only, no RLS context | Define selection por `session_id` y pseudo-SQL | Grants/helper/migration/tests | Sí |
| `current_active_membership_id()` | Placeholder | Lo vincula a selection + membership/profile/institution actuales | Implementación local y anti-recursion tests | Sí |
| Courses V1 tenant-wide | SELECT demasiado amplio para V2 | Define que se evoluciona, no duplica, y cutover por slice | Nueva policy coordinada con sections/assignments | Sí |
| Enrollments V1 tenant-wide | Course-level, sin lifecycle | Define evolución no destructiva | Modelo section/term/student y backfill | Sí |
| Sections missing | Solo draft C30 | Confirma dependencia del contexto Auth V2 | Migration/modelo/pruebas | Sí |
| Academic terms missing | Solo draft C30 | Mantiene en dependency order | Contrato SQL final | Sí |
| Students missing | Profile se usa como student | Decide no inventar equivalencia | Entidad mínima o student mock-backed | Condicional |
| Section staff missing | Solo `courses.teacher_id` | Define que teacher_id no es modelo final | Assignment migration/backfill | Sí |
| Policy recursion | No probada | Define grafo y postura invoker | Tests en DB local | Sí |
| Data API/grants | Sin evidencia | Separa grants de RLS; pseudo-SQL omite grants | Inventario y test de privilegios | Sí |
| `auth.sessions` validation | Estrategia abierta | Limita lookup estricto a acciones sensibles y exige revisión | Helper/boundary final probado | Sí |
| Remote drift unknown | No inspeccionado | Distingue drift local/runtime confirmado | Inspección remota read-only autorizada | Sí |
| Capabilities DB | Solo TypeScript | Decide conservar matriz código temporalmente | Política de persistencia futura | No para primer draft Auth |
| `super_admin` mapping | Riesgo de owner global | Prohíbe mapping global implícito | Contrato de soporte/plataforma | Sí para backfill afectado |
| Rollback/cutover | No demostrado | Define transición por fases manteniendo V1 | Ensayo local/staging | Sí |

## Qué quedó reducido

- El esquema objetivo Auth V2 ya tiene límites y objetos concretos.
- El camino V1→V2 es incremental y no destructivo.
- La selection por sesión ya tiene forma y dependencias.
- El pseudo-SQL permite revisar nombres, constraints, índices y RLS posture.
- Courses + Sections ya tiene una dependencia Auth explícita.

## Qué impide declarar readiness

- No se inspeccionó el remoto.
- No existe migración local ejecutable.
- No hubo DB local, backfill ni policy tests.
- No están definidas sections/terms/section_staff ni enrollment V2.
- No se resolvieron grants, helper privileges o rollback en ejecución.

## Veredicto

`C33_BLOCKERS_REDUCED_BUT_NOT_READY_FOR_MIGRATION`

## C34 Blocker Status Update

### Reduced

- Remote drift is no longer unknown.
- Presence/absence of the critical Auth V2 objects is confirmed.
- The V1 remote role/tenant helper model is documented.
- A schema-only evidence snapshot now exists.

### Still blocking

- `institution_memberships`, `roles` and session selections are absent.
- `institutions.status` is absent.
- No executable, reviewed migration reconciles remote and local state.
- No disposable-database reconstruction or RLS regression suite exists.
- Exact status vocabularies and V1-to-V2 backfill remain unapproved.

### Increased

- Remote-only tables prove unversioned DDL history.
- Shared V1 tables differ from migrations in columns, nullability, constraints,
  indexes and policies.
- Broad grants and policy differences require a joint privilege/RLS review.

**C34 decision:** `C34_REMOTE_SCHEMA_DRIFT_CONFIRMED`.

**Next:** `C34_RECOMMEND_C35_SCHEMA_BASELINE_RECONCILIATION`.
