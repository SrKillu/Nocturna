# Nocturna V2 — Plan de transición Auth V1 a V2

STATUS: PENDING_REVIEW

## 1. Estado actual V1

- `profiles` contiene tenant/role únicos.
- El hook JWT copia `institution_id`, `user_role`, `is_active` y
  `session_version`.
- `auth.institution_id()`/`auth.user_role()` alimentan RLS.
- Courses y enrollments son tenant-wide.
- `teacher_id` representa un solo docente de curso.
- `session_version` invalida globalmente tokens del profile.

## 2. Estado objetivo V2

- Profile global vinculado a `auth.users`.
- Múltiples `institution_memberships` por profile.
- Roles V2 versionados.
- Membership activa seleccionada por `session_id`.
- Contexto tenant derivado y revalidado contra DB.
- Policies por tenant más assignment/enrollment exactos.
- Claims V1 retirados solo después del cutover probado.

## 3. Estrategia incremental

### A. Versionar Auth V2 faltante como draft

- Confirmar drift remoto autorizado.
- Preparar migración local revisable para roles, memberships y selections.
- No aplicar remotamente.
- Definir grants y RLS junto al schema.

### B. Backfill no destructivo

Para cada profile V1 consistente:

- obtener `profiles.institution_id`;
- mapear enum role a role V2;
- crear una membership inicial;
- registrar inconsistencias en reporte, no inventar tenant/role.

El backfill debe ser idempotente y demostrar conteos antes/después.

### C. Mantener columnas V1

- `profiles.institution_id`, `profiles.role` y `session_version` permanecen.
- V1 continúa consumiendo claims/hook existentes.
- No sincronización bidireccional improvisada; definir un writer autorizado.

### D. Crear active selections

- Una selección por `session_id`.
- Para usuarios de una sola membership puede crearse/seleccionarse de forma
  explícita y auditada.
- Multi-membership exige elección.
- Cookie solo solicita la selección.

### E. Cambiar RLS V2 gradualmente

- Crear helpers y policies en una base local aislada.
- Probar contexto antes de domain policies.
- Adoptar por slice, comenzando read-only.
- No reemplazar policies V1 globales hasta que el consumidor V2 correspondiente
  esté probado y el cutover tenga rollback.

### F. Seed y staging

- Dos tenants y usuarios multi-membership.
- Todos los roles V2.
- Sesiones simultáneas.
- Memberships revocadas/suspendidas.
- Assignments/enrollments positivos y negativos.
- Pruebas de grants, RLS, ID directo, recursión y stale claims.

### G. Considerar corte de claims V1

Solo después de:

- cero consumidores V1 dependientes o bridge aprobado;
- métricas y logs de contexto V2;
- rollback ensayado;
- aceptación humana.

El hook puede entonces reducir claims tenant/role o tratarlos solo como legacy.

## 4. Reglas de seguridad

- No DROP, TRUNCATE ni hard delete.
- No borrar `profiles.role` o `profiles.institution_id` todavía.
- No romper V1.
- No ejecutar en producción.
- No `db push` sin aprobación explícita.
- No usar `service_role` en browser.
- No ampliar policies durante el periodo híbrido.
- No tratar backfill como confirmación de autorización.

## 5. Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| Usuario con varias instituciones | Backfill inicial + selección explícita por session |
| `super_admin` vs owner | No mapear a owner global; contrato separado |
| JWT stale | DB actual manda; refresh/invalidation y tests |
| Service role server-side | Reducir alcance, autenticar primero, auditar; nunca browser |
| Drift remoto/local | Inspección autorizada y migration baseline antes de aplicar |
| Dos autoridades durante transición | Marcar V1/V2, writers controlados y cutover por slice |
| Policy recursion | Grafo acíclico y smoke tests |
| Backfill incompleto | Reporte de excepciones y ejecución idempotente |
| Rollback | Mantener V1, feature gate y forward-fix probado |

## 6. Evidencia requerida antes de aplicar

- inventario remoto/local conciliado;
- migración local pequeña y revisada;
- dry-run/backfill en DB desechable;
- policy tests C32;
- query plans/indexes;
- grants/Data API audit;
- rollback/forward-fix;
- aprobación humana.

## Veredicto

`C33_V1_V2_TRANSITION_PLAN_DRAFTED_NOT_APPROVED_FOR_SQL`
