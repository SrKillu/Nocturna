# Nocturna V2 — Hallazgos de revisión del borrador C30

STATUS: PENDING_REVIEW

## Escala

- **BLOCKER:** impide convertir el borrador en migración.
- **HIGH:** riesgo serio que debe resolverse antes de integración.
- **MEDIUM:** debe cerrarse durante la conversión y prueba local.
- **LOW:** mejora de claridad o mantenimiento.
- **DECISION_REQUIRED:** existen alternativas válidas y hace falta aprobación.
- **READY:** suficiente como base conceptual, aún sujeto a pruebas.

## Hallazgos

| # | Área | Clasificación | Hallazgo y acción requerida |
|---:|---|---|---|
| 1 | Trusted active membership DB context | **BLOCKER** | `current_active_membership_id()` es un placeholder. Definir selección server-side ligada a `auth.uid()` y sesión, validada contra membership/perfil/institución actuales. |
| 2 | Multi-device active membership | **BLOCKER** | Una selección global por usuario causaría interferencia entre dispositivos. Persistir por `session_id` o identificador de sesión autenticada y probar cambios independientes. |
| 3 | Revoked/suspended membership freshness | **BLOCKER** | JWT puede quedar obsoleto. La política sensible debe consultar estado actual en DB; revocar membership o sesión debe cerrar acceso sin esperar una edición de cliente. |
| 4 | Owner/admin same-institution access | **READY** | La regla es clara: membership activa y misma institución. Falta implementarla y probar institución suspendida/perfil inactivo. |
| 5 | Teacher/assistant assigned-section access | **HIGH** | El curso puede ser visible por una asignación, pero cada sección embebida debe autorizarse de manera independiente. Probar curso con secciones A/B y asignación solo a A. |
| 6 | Student enrolled-section access | **DECISION_REQUIRED** | Es compatible con la matriz actual solo con `students`/`enrollments` mínimos y pruebas completas. Sin ello, mantener temporalmente la ruta estudiantil mock-backed. |
| 7 | Guardian/support denial | **READY** | La negación coincide con capabilities y contratos de ruta. Añadir prueba DB explícita para lista, detalle y IDs conocidos. |
| 8 | Cross-institution direct ID safe not-found | **READY** | El contrato es correcto. Debe comprobarse en el boundary server-side que no distingue inexistente de no autorizado. |
| 9 | Archived courses | **DECISION_REQUIRED** | Ocultar por defecto. Owner/admin solo mediante filtro histórico explícito aprobado; demás roles diferidos. |
| 10 | Closed academic terms | **DECISION_REQUIRED** | No equivalen automáticamente a archivado. Proponer consulta histórica explícita owner/admin; staff/student histórico diferido. |
| 11 | Staff summary projection | **HIGH** | `teacherName` actual no justifica acceso a perfiles privados. Primer slice: etiqueta genérica o proyección pública mínima aprobada. |
| 12 | Enrollment count projection | **HIGH** | Un count puede filtrar existencia y tamaño de grupos. Limitar a secciones visibles y decidir roles; ningún row de estudiante debe acompañarlo. |
| 13 | RLS recursion risk | **BLOCKER** | Policies que encadenan `section_staff`, `profiles`, `sections` o `enrollments` pueden recursar. Diseñar grafo de dependencias y probar cada policy aislada. |
| 14 | Security invoker vs security definer views | **HIGH** | Una vista normal puede omitir RLS. Solo considerar `security_invoker = true` en PG15+ y revisar grants; no usar `SECURITY DEFINER` como atajo. |
| 15 | Index completeness | **MEDIUM** | Los accesos principales están cubiertos conceptualmente. Confirmar índices para todas las FK y predicados RLS con `EXPLAIN` sobre volumen sintético. |
| 16 | Policy test completeness | **MEDIUM** | La base es buena. Faltan revocación durante request, múltiples memberships/sesiones, proyección staff, vistas y reglas históricas cerradas. |
| 17 | Seed completeness | **MEDIUM** | Incluye dos tenants y relaciones negativas. Añadir dos sesiones del mismo usuario, perfil/institución inactivos y co-staff visible/no visible. |
| 18 | Rollback readiness | **HIGH** | Hay principios, pero no procedimiento verificable. La futura migración necesita rollback/forward-fix ensayado y orden de grants/policies. |
| 19 | Existing schema reconciliation | **BLOCKER** | Los nombres, estados, IDs, Auth V2 y migraciones existentes no han sido comparados contra una base local real. No crear objetos paralelos por suposición. |
| 20 | Migration readiness | **BLOCKER** | No hay mecanismo activo aprobado ni evidencia de políticas ejecutadas. C30 no está listo para convertirse directamente en migración. |

## Riesgos transversales

- `TO authenticated` no autoriza filas por sí solo.
- `user_metadata` no es autoridad de autorización.
- Claims server-controlled en JWT pueden quedar obsoletos hasta refrescar token.
- Grants/Data API y RLS son controles distintos y deben revisarse juntos.
- `service_role` no debe aparecer en browser ni compensar policies incompletas.
- Una capability habilita la categoría de operación; no reemplaza tenant ni relación.

## Qué está listo conceptualmente

- Courses + Sections read-only es el slice inicial adecuado.
- La separación entre curso visible y sección exactamente visible es correcta.
- La matriz owner/admin, staff asignado, estudiante matriculado y actores negados
  es una buena base.
- Los IDs opacos, constraints tenant-scoped, índices por relación, safe not-found,
  seed de dos instituciones y pruebas negativas están bien encaminados.
- El archivo SQL sigue siendo deliberadamente no ejecutable.

## Veredicto

`C31_C30_DRAFT_NEEDS_FIXES`

C30 debe recibir las decisiones y evidencias anteriores antes de una conversión
a migración. El veredicto no rechaza el slice: evita que sus placeholders se
conviertan prematuramente en controles de producción.
