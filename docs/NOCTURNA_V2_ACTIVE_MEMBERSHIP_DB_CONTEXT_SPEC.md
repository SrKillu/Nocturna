# Nocturna V2 — Especificación de active membership en DB/RLS

STATUS: PENDING_REVIEW

## 1. Objetivo

RLS debe resolver el tenant activo usando identidad y estado actuales, sin
confiar en `institution_id`, role, capabilities o membership IDs enviados por el
cliente.

## 2. Principio de autoridad

- `auth.uid()` identifica al usuario autenticado.
- El claim obligatorio `session_id` identifica la sesión Supabase actual.
- La active membership selecciona el contexto tenant de esa sesión.
- Una cookie HTTP-only puede transportar un selector, no conceder autoridad.
- La DB valida profile, membership, institution y selection vigentes.
- Role/capabilities se derivan de autoridad server-controlled revisada.
- Capability habilita una operación; no reemplaza tenant, assignment o enrollment.

## 3. Modelo recomendado

Nombre conceptual: `membership_session_selections`. El nombre y schema finales
requieren aprobación. Preferencia: schema privado/no expuesto a Data API.

| Campo conceptual | Regla |
|---|---|
| `selection_id` | PK opaca |
| `auth_user_id` o `profile_id` | Debe corresponder a `auth.uid()` |
| `session_id` | UUID del claim JWT; una selección vigente por sesión |
| `membership_id` | FK a la membership V2 versionada |
| `institution_id` | Derivado/constraint con membership; nunca aceptado como autoridad cliente |
| `status` | `active`, `revoked`, `expired` u otro set aprobado |
| `selected_at` | `timestamptz` |
| `expires_at` | Opcional; no supera la política de sesión |
| `revoked_at` | Nulo mientras esté vigente |
| `metadata` | Mínima, estructurada y no sensible; no contiene capabilities |

Constraints conceptuales:

- unique vigente por `session_id`;
- session y usuario/profile coherentes;
- membership e institution coherentes;
- índices por `session_id/status`, `membership_id/status` y cleanup temporal;
- writes únicamente por un flujo server-side autorizado;
- sin grants de mutación para browser.

La cookie actual puede contener `membership_id` o un selector opaco para pedir el
cambio. El servidor valida y persiste la selección. RLS nunca lee la cookie.

## 4. Selección y validación

Una selección es válida únicamente si:

1. `auth.uid()` existe.
2. `auth.jwt()->>'session_id'` existe y corresponde a la sesión actual.
3. El profile pertenece al auth user y está activo.
4. La selection pertenece a ese profile/user y session.
5. La selection está activa, no expirada y no revocada.
6. La membership pertenece al profile y está `active`.
7. La membership apunta a la misma institution derivada.
8. La institution está en un estado admitido (`active`; `trial` requiere decisión).
9. Role/capabilities se derivan de DB/configuración revisada.
10. La relación de dominio actual también autoriza la fila.

No se aceptan como autoridad:

- `institution_id` del body/query/header;
- role o capabilities enviados por UI;
- `user_metadata`;
- una cookie no validada;
- un claim viejo sin join al estado DB.

## 5. Multi-device

- Sesión A (`session_id=A`) puede seleccionar membership Alpha.
- Sesión B (`session_id=B`) puede seleccionar membership Beta.
- Cambiar A actualiza solo la fila de A.
- Revocar membership Alpha invalida todas las selections que la referencian.
- Cerrar A invalida la selection de A sin afectar B.
- Cambiar role/capabilities se refleja por consulta DB, no por copiar valores en
  la selection.

Supabase almacena sesiones en `auth.sessions` y cada JWT incluye `session_id`.
Para acciones sensibles, comprobar que esa sesión aún existe ofrece una garantía
más fuerte después de logout. Cómo consultar `auth.sessions` desde RLS queda
sujeto a revisión de privilegios:

- preferencia inicial: validación server-side con `getUser()` y session claim,
  más selection/RLS por estado actual;
- si se exige comprobación DB directa de `auth.sessions`, diseñar un helper
  privado mínimo y auditarlo expresamente;
- no conceder SELECT amplio sobre `auth.sessions`;
- no aprobar `SECURITY DEFINER` hasta demostrar que es indispensable, con
  `search_path` fijo, sin execute a `PUBLIC` y tests de abuso.

## 6. Helpers conceptuales

Ningún helper de esta sección es SQL aprobado.

| Helper | Propósito / salida | Dependencias permitidas | Riesgo y postura |
|---|---|---|---|
| `current_profile_id()` | Profile activo de `auth.uid()` o NULL | profiles | Bajo si profiles no depende del helper; `STABLE`, invoker preferido |
| `current_active_membership_id()` | Membership vigente de la selection de `session_id` o NULL | selections, memberships, profiles, institutions | Central; evitar policies que vuelvan al helper; `STABLE`, invoker preferido |
| `current_active_institution_id()` | Institution derivada de membership válida | Contexto anterior | No leer input/claim tenant como autoridad; wrapper simple |
| `current_role_key()` | Role actual de membership | memberships/roles | JWT solo pista; DB actual manda |
| `has_capability(key)` | Booleano para capability efectiva | role/capability config aprobada | No consultar tablas de dominio; evitar recursión |
| `is_owner_or_admin_in_current_institution()` | Booleano de rol + tenant actual | contexto/role | No concede cross-tenant |
| `is_assigned_to_section(section_id)` | Assignment activo exacto | section_staff + contexto | No consultar sections policy desde section_staff policy |
| `is_enrolled_in_section(section_id)` | Enrollment activo propio exacto | students/enrollments + contexto | No exponer peers ni counts |

### Contrato de inputs/outputs

- Todos salvo los dos helpers relacionales no reciben inputs del cliente.
- Los helpers relacionales reciben únicamente un ID de fila ya evaluada.
- Fallan cerrados: ausencia, inconsistencia o error produce NULL/false.
- No devuelven filas de profile, membership, session o assignment.
- No escriben, no registran selección y no usan service role.

### Volatilidad y privilegios

- `STABLE` es candidato porque el resultado debe ser consistente con el snapshot
  de la sentencia/transacción; se confirma con pruebas.
- La postura por defecto es security invoker.
- Tablas privadas pueden requerir grants mínimos de lectura al rol autenticado y
  RLS simple; no deben exponerse como API.
- Cualquier excepción `SECURITY DEFINER` requiere revisión separada, schema
  privado, owner no-login, `search_path` fijo, revoke a `PUBLIC`, inputs mínimos y
  pruebas de escalamiento.

## 7. Grafo anti-recursión

Orden conceptual:

1. identidad/session claim;
2. selection;
3. profile/membership/institution/role;
4. capability;
5. relación de dominio;
6. fila course/section.

Reglas:

- policies de selección/contexto no consultan courses/sections;
- policy de `section_staff` no llama a `is_assigned_to_section`;
- policy de enrollment no llama a `is_enrolled_in_section`;
- helpers de dominio consultan tablas relación con policies simples o una
  estrategia privada revisada;
- ejecutar smoke tests de cada helper y tabla por separado.

## 8. Riesgos

- JWT o cookie stale.
- Session fixation o selector reutilizado por otra sesión.
- Contaminación cross-device por selección global.
- Membership/profile/institution revocados sin revalidación.
- Grants de selección demasiado amplios.
- Recursión entre helpers y policies.
- `SECURITY DEFINER` o service role que eluda RLS.
- Exposición accidental por Data API.
- Drift entre tablas Auth V2 remotas y migrations locales.

## 9. Impacto en C30

- `current_active_membership_id()` debe resolver por `session_id`, no por
  institution claim o cookie.
- Courses/sections comparan su institution contra la derivada de membership.
- Owner/admin requieren role actual y mismo tenant.
- Staff requiere assignment exacto además de capability.
- Student solo puede entrar si students/enrollments están reconciliados y probados.
- Las policies V1 tenant-wide no son suficientes para el slice V2.

## 10. Puerta antes de SQL

- migrations versionadas de memberships/roles reales;
- schema de selection aprobado;
- strategy de `auth.sessions` aprobada;
- grants/RLS del contexto aprobados;
- grafo anti-recursión probado;
- transición V1/V2 definida;
- test matrix ejecutable;
- revisión humana.

## Veredicto

`C32_ACTIVE_MEMBERSHIP_SPEC_DRAFTED_NOT_APPROVED_FOR_SQL`

## C33 Dependency Update

La active membership depende ahora de un contrato Auth V2 explícito:

- `profiles` global y activo;
- `roles` versionados con RoleKey V2;
- `institution_memberships` versionadas y con lifecycle actual;
- `membership_session_selections` por JWT `session_id`;
- institution actual derivada de membership;
- capability matrix revisada.

Las dos primeras tablas esperadas por Auth V2 (`roles` e
`institution_memberships`) no existen en migrations locales. C33 define su
contrato y transición, pero no los crea.

`current_active_membership_id()` solo puede aprobarse cuando:

1. esas tablas estén reconciliadas con el estado real;
2. la selection table tenga grants/RLS aprobados;
3. el helper use un grafo no recursivo;
4. la estrategia de sesión sensible esté probada;
5. el backfill V1 sea verificable y reversible.

El pseudo-SQL C33 es únicamente material de revisión. La especificación continúa:
`C32_ACTIVE_MEMBERSHIP_SPEC_DRAFTED_NOT_APPROVED_FOR_SQL`.
