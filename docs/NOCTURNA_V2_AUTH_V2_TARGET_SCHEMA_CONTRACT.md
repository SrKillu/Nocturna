# Nocturna V2 — Contrato objetivo de esquema Auth V2

STATUS: PENDING_REVIEW

## Principios

- Evolucionar objetos existentes; no duplicar autoridades.
- Mantener V1 hasta que V2 tenga seed, backfill y pruebas.
- Tenant y role actuales provienen de membership, no de input cliente.
- Active membership se selecciona por sesión.
- Capabilities y relación de dominio son controles distintos.
- No hay SQL aprobado en este documento.

## 1. `profiles`

### Decisión

Conservar `profiles.id = auth.users.id`. Es compatible con el runtime actual y
evita una segunda identidad de aplicación.

### Fuente de verdad objetivo

- `id`, datos de display mínimos, `is_active`, timestamps;
- opcional locale/avatar público si se aprueba;
- membership es la autoridad de institución y role.

### Columnas V1 legacy

- `institution_id`;
- `role`;
- `session_version` global.

No se eliminan en la transición. Se marcan legacy, se mantienen sincronizadas
solo para flujos V1 aprobados y nunca autorizan V2 por sí solas.

### Lo que profile no debe autorizar

- tenant V2 activo;
- role V2 efectivo;
- capabilities;
- assignment, enrollment o guardian linkage.

## 2. `institutions`

Usar `public.institutions` existente y conservar `id`.

Adiciones candidatas:

- `status`: provisioning/trial/active/suspended/archived tras aprobar vocabulario;
- `locale`;
- `timezone`;
- `archived_at`;
- constraints de status/archive y timestamps.

No crear otro tenant root. `slug` puede seguir como clave humana, no autoridad.

## 3. `roles`

Contrato:

- `id` UUID opaco;
- `key` text único y estable;
- `display_name`;
- `is_system` boolean;
- `status` active/retired;
- `sort_order`;
- timestamps.

Seeds de sistema candidatos:

- owner
- admin
- teacher
- assistant
- student
- guardian
- support

Compatibilidad V1:

| V1 | V2 candidato | Nota |
|---|---|---|
| `super_admin` | `owner` solo dentro de tenant | No conservar bypass global implícito |
| `admin` | `admin` | V2 admin no obtiene `canManageInstitution` automáticamente |
| `teacher` | `teacher` | Assignment sigue siendo obligatorio |
| `student` | `student` | Enrollment sigue siendo obligatorio |

La semántica cross-tenant de `super_admin` requiere un contrato separado; no debe
materializarse como owner de todas las instituciones.

## 4. `institution_memberships`

Contrato candidato:

- `id` UUID PK;
- `institution_id` FK a institutions;
- `profile_id` FK a profiles;
- `role_id` FK a roles;
- `status`: invited/active/suspended/left o vocabulario aprobado;
- `effective_from`, `effective_until`;
- `joined_at`;
- `revoked_at`/`left_at` si el lifecycle lo requiere;
- `session_version` o revocation version por membership, decisión pendiente;
- timestamps.

Constraints:

- profile/role/institution obligatorios;
- fechas válidas;
- evitar duplicados activos equivalentes;
- owner-last-owner protection en operaciones futuras;
- no asumir una sola membership por profile.

Índices:

- `(profile_id, status, institution_id, id)`;
- `(institution_id, role_id, status, id)`;
- `(institution_id, profile_id, status, id)`;
- FK indexes no cubiertos.

RLS boundary:

- usuario puede listar sus memberships mínimas;
- administración futura solo con capability y mismo tenant;
- domain policies resuelven solo la membership seleccionada;
- no exponer roles/status de otros tenants;
- writes pasan por un flujo server-side auditado futuro.

Lifecycle:

`invited → active → suspended/left`; reactivación y expiración requieren decisión.

## 5. Capabilities

Recomendación conservadora:

- persistir role/membership en DB;
- mantener `ROLE_CAPABILITIES` en TypeScript como contrato versionado por ahora;
- validar que el role key DB pertenece al set aprobado;
- no crear `role_capabilities` hasta definir personalización, versionado,
  invalidación y uso dentro de RLS.

Antes de persistir capabilities, debe existir una matriz DB/código única y pruebas
que impidan drift. El cliente nunca aporta capabilities como autoridad.

## 6. `membership_session_selections`

Usa la especificación C32.

Contrato candidato:

- `id` UUID PK;
- `session_id` UUID único por selección vigente;
- `profile_id`;
- `membership_id`;
- `status`;
- `selected_at`, `expires_at`, `revoked_at`;
- metadata mínima no sensible;
- timestamps.

`institution_id` puede omitirse por normalización y derivarse de membership, o
almacenarse solo con constraint compuesto. No aceptar un valor arbitrario.

Restricciones:

- selection pertenece a `auth.uid()`/profile y al JWT `session_id`;
- membership activa y del profile;
- una selection vigente por session;
- revocación/expiración fail closed.

Grants/RLS:

- preferencia por schema privado/no Data API;
- sin SELECT general ni mutations de browser;
- flujo de selección server-side mínimo;
- cualquier helper privilegiado requiere revisión separada;
- no grant a `PUBLIC`.

## 7. Backward compatibility

- No DROP/TRUNCATE.
- No eliminar `profiles.role` ni `profiles.institution_id`.
- Mantener hook y middleware V1 hasta cutover.
- Backfill crea memberships sin cambiar aún las policies V1.
- V2 adopta contexto por feature/slice, no globalmente en un solo despliegue.
- Rollback desactiva consumidores V2 y conserva datos de backfill.

## 8. Open decisions

1. Estado remoto real de `institution_memberships`/`roles`.
2. Nombre/schema final de selection.
3. Status vocabularies exactos.
4. Estrategia de `auth.sessions` para acciones sensibles.
5. Ownership y grants de helpers.
6. Necesidad de membership-level session version.
7. Política de `trial`.
8. Mapeo y tratamiento de `super_admin`.
9. Backfill de usuarios sin tenant o perfiles inconsistentes.
10. Cutover de custom access token hook.
11. Si capabilities se persistirán y cuándo.
12. Rollback/forward-fix y observabilidad del cutover.
