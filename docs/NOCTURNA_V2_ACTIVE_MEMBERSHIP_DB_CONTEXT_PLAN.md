# Nocturna V2 — Plan de contexto DB para active membership

STATUS: PENDING_REVIEW

## Objetivo

Permitir que RLS determine la membership activa sin confiar en
`institution_id`, `role_key`, capabilities o membership IDs editables por el
cliente.

## Principios no negociables

- `auth.uid()` identifica al usuario, no su tenant seleccionado.
- `user_metadata` es editable y no puede autorizar.
- Una cookie HTTP-only es un selector, no autoridad.
- La membership, perfil e institución deben validarse contra estado actual DB.
- `service_role` nunca se usa en browser.
- Revocación y suspensión deben prevalecer sobre claims o selecciones antiguas.

## Opción A — JWT con `active_membership_id` server-controlled

### Cómo funciona

Un servicio autorizado escribe `active_membership_id` en `app_metadata` o lo
inyecta mediante un mecanismo server-controlled; RLS lo lee desde `auth.jwt()`
y comprueba la fila de membership.

### Ventajas

- Fácil de consumir en policies.
- No requiere una tabla de selección por sesión.
- El cliente no puede editar `app_metadata`.

### Riesgos

- El JWT no es siempre fresco.
- Cambiar institución puede requerir refrescar token.
- Un claim global puede producir una selección compartida entre dispositivos.
- El claim nunca debe evitar la consulta de status actual de membership.

### Multi-device, revocación y compatibilidad

Multi-device es débil si todos comparten el mismo claim. La revocación puede ser
segura solo si cada policy vuelve a consultar la membership actual. Es compatible
con Supabase/RLS, pero no se recomienda como única fuente de contexto.

### Complejidad

Media. Parece simple, pero exige controlar actualización, refresh y consistencia.

## Opción B — Selección server-side persistida por sesión

### Cómo funciona

Una tabla privada conceptual relaciona el usuario y la sesión autenticada con una
membership seleccionada. Un flujo server-side valida que la membership pertenece
al usuario y está activa antes de guardar la selección. RLS resuelve la selección
usando `auth.uid()` y un identificador de sesión confiable, y vuelve a unir con
membership, perfil e institución actuales.

### Ventajas

- Selección independiente por dispositivo/sesión.
- Revocación efectiva mediante estado DB actual.
- No depende de input tenant del cliente como autoridad.
- Permite invalidar una selección sin modificar el JWT.

### Riesgos

- Hay que confirmar el identificador de sesión disponible y su ciclo de vida.
- La tabla y sus grants/policies son infraestructura de autorización crítica.
- Se necesita cleanup de sesiones expiradas y protección contra session fixation.

### Multi-device, revocación y compatibilidad

Es la mejor opción para multi-device. Cada sesión conserva su selección. Una
membership suspendida o revocada deja de satisfacer el join aunque la selección
siga almacenada. Es compatible con RLS si el lookup no introduce recursión ni
privilegios amplios.

### Complejidad

Media-alta, pero explícita y comprobable.

## Opción C — Cookie HTTP-only + repositorio/RPC server-side

### Cómo funciona

La cookie contiene un selector opaco. El servidor lo valida contra DB en cada
request sensible y ejecuta el repositorio con el contexto autenticado. Ningún
`institution_id` enviado por UI se acepta como autoridad.

### Ventajas

- Boundary de aplicación claro.
- Cookie no accesible desde JavaScript.
- Fácil de rotar o invalidar como selector.
- Permite safe not-found y composición de proyecciones en servidor.

### Riesgos

- La cookie puede quedar obsoleta o ser manipulada; siempre requiere validación.
- Por sí sola no da a RLS un contexto confiable para accesos Data API directos.
- Una RPC privilegiada o `service_role` usada como atajo anularía defensa en profundidad.

### Multi-device, revocación y compatibilidad

La cookie puede variar por dispositivo. La revocación es segura si cada request
consulta DB. Es compatible como boundary server-side, pero debe combinarse con
una autoridad DB como la Opción B para que RLS sea autónomo.

### Complejidad

Media.

## Comparación

| Criterio | A: claim JWT | B: estado por sesión | C: cookie + server |
|---|---|---|---|
| Frescura | Media/baja | Alta con join DB | Alta con validación DB |
| Multi-device | Débil si claim global | Fuerte | Fuerte como selector |
| RLS directo | Sí, con validación DB | Sí | No por sí sola |
| Revocación inmediata | Solo con join DB | Sí | Sí en server |
| Riesgo de autoridad cliente | Bajo si app metadata | Bajo | Bajo si selector solamente |
| Complejidad | Media | Media-alta | Media |

## Recomendación

Adoptar **B como autoridad objetivo**, combinada con **C como selector y boundary
de aplicación**:

1. cookie HTTP-only identifica una selección opaca;
2. el servidor valida usuario, sesión y membership;
3. la selección se persiste por sesión, no globalmente por usuario;
4. RLS resuelve esa selección y comprueba membership/perfil/institución actuales;
5. capabilities se derivan de role/configuración aprobada, no del cliente;
6. toda consulta sensible reautoriza la relación concreta;
7. no se usa `SECURITY DEFINER` ni `service_role` para evitar el diseño.

La Opción A puede servir como pista o optimización, nunca como única autoridad.

## Pruebas obligatorias

- dos sesiones del mismo usuario seleccionan instituciones distintas;
- selector modificado o perteneciente a otro usuario se rechaza;
- membership suspendida/revocada corta acceso;
- perfil o institución inactiva corta acceso;
- sesión revocada corta acceso;
- cambio de selección no afecta otra sesión;
- request iniciado antes de revocación tiene semántica transaccional documentada;
- claims antiguos no recuperan acceso;
- ausencia de selección produce `ACTIVE_MEMBERSHIP_REQUIRED`.
