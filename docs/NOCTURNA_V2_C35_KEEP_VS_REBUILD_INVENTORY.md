STATUS: PENDING_REVIEW

# C35 Keep vs Rebuild Inventory

## Conservar

- Frontend Next.js y rutas `/v2`.
- Dashboard V2 y estados loading/empty/denied/error.
- Protección de rutas y validación server-side.
- Route-role contracts.
- Matriz de capabilities.
- Runtime Auth V2 como contrato adaptable, no como prueba de schema existente.
- Mocks, view models y tipos de presentación.
- Documentación C29–C34.
- Tests unitarios y CI guardrails.
- Roadmap y decisiones de seguridad.
- Contratos de Courses + Sections.
- Especificación de active membership por sesión.
- Inventario de riesgos, RLS y grants.

## Replantear desde cero para V2

- Schema Supabase V2.
- Secuencia de migraciones limpia y reconstruible.
- `institutions` con lifecycle.
- `profiles` como identidad global.
- `roles` e `institution_memberships`.
- `membership_session_selections`.
- Helpers de contexto DB/RLS.
- Grants least-privilege y RLS deny-by-default.
- `academic_terms`, `courses`, `sections`, `section_staff`.
- `students` y enrollments V2.
- Policies de Storage.
- Seed sintético de staging.
- Suite de tests DB/policies.
- Auditoría y estrategia de recovery.

## Mantener como legacy temporal

- Proyecto Supabase actual.
- Usuarios Auth actuales, hasta decidir retención/migración.
- Claims V1 de profile.
- Courses/enrollments V1.
- `course_sections`, `final_grades`, `materials`, `messages`.
- Auth hook V1.
- APIs y rutas V1.
- Datos y Storage actuales, sin modificarlos ni asumir que pueden eliminarse.

## No trasladar automáticamente

- Grants amplios.
- Policies permisivas o sin fuente versionada.
- Constraints/FKs duplicados.
- Nullability accidental.
- Tablas sin dueño funcional confirmado.
- Datos reales sin clasificación y autorización.
- Secrets, tokens o configuraciones de producción.

## Criterio de migración posterior

Cada objeto legacy requiere una clasificación:

| Classification | Action |
|---|---|
| Required business record | Map, validate and migrate through an approved plan |
| Useful but non-critical | Curate/export selectively after human review |
| Test/demo data | Recreate synthetically, do not copy |
| Unknown ownership | Quarantine in legacy until decided |
| Obsolete | Retain/archive according to policy, then retire separately |

## Decisión

El producto se conserva. Se reconstruye el fundamento de datos V2. La base
actual permanece como legacy temporal hasta completar retención y cutover.
