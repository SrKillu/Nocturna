# Nocturna V2 — Explicación C32 para el dueño del proyecto

STATUS: PENDING_REVIEW

## 1. ¿Qué problema resuelve C32?

C32 convierte la idea de “membership activa” en una especificación técnica que
pueda revisarse antes de escribir SQL real. También compara esa idea con las
migraciones locales existentes para evitar crear tablas duplicadas o mantener dos
modelos de autorización incompatibles.

C32 no crea la solución en la base. Define qué tendría que existir, qué datos
serían autoridad y qué conflictos del repo deben resolverse primero.

## 2. ¿Por qué active membership es el corazón del multi-tenant?

Una misma persona puede pertenecer a Alpha y Beta con roles diferentes. Su
identidad (`auth.uid()`) dice quién es, pero no en qué institución está actuando.
La active membership une:

- usuario y perfil autenticados;
- sesión/dispositivo actual;
- institución seleccionada;
- rol y capabilities derivados;
- estado vigente de la membership.

Sin esa unión, una policy puede usar el tenant incorrecto o conceder acceso por un
claim viejo.

## 3. ¿Por qué una cookie HTTP-only no basta?

La cookie actual `active_membership_id` es útil para recordar una selección, pero:

- puede estar vencida o referir una membership revocada;
- no prueba que pertenezca al usuario o a la sesión actual;
- RLS no debe aceptar su valor como autoridad;
- una cookie compartida/global no modela correctamente dos dispositivos.

La cookie puede ser un selector opaco. El servidor y la base deben validar la
autoridad real.

## 4. ¿Por qué `user_metadata` no debe autorizar?

Supabase permite que un usuario autenticado modifique `user_metadata`. Por eso no
puede contener tenant, rol, membership o capabilities con valor de autorización.
Usarlo en RLS permitiría intentar elevar privilegios desde el cliente.

## 5. ¿Por qué JWT/app_metadata ayuda, pero no basta?

`app_metadata` no es editable por el usuario y el JWT incluye un `session_id`
único. Sirve para identificar la sesión y transportar pistas server-controlled.
Sin embargo, el JWT dura hasta expirar y sus claims pueden quedar obsoletos
después de suspender una membership, cambiar un rol o cerrar una institución.

La DB debe comprobar el estado actual. El claim no reemplaza esa comprobación.

## 6. ¿Qué significa “selección por sesión”?

Significa que cada sesión de Supabase guarda su propia selección:

- sesión A puede usar Alpha;
- sesión B puede usar Beta;
- cambiar Alpha por Beta en A no modifica B;
- revocar una membership corta todas las selecciones que dependan de ella;
- cerrar una sesión invalida su selección.

El `session_id` obligatorio del access token permite distinguir esas sesiones.

## 7. ¿Qué falta antes de convertir C30 en migración?

- versionar o importar el esquema Auth V2 real que hoy consume el runtime;
- reconciliar `profiles` de un solo tenant con múltiples memberships;
- decidir cómo evolucionar los `courses`/`enrollments` V1 sin duplicarlos;
- definir secciones, periodos, assignments y students faltantes;
- aprobar la tabla de selección por sesión y sus grants;
- decidir cómo comprobar una sesión revocada sin crear un bypass peligroso;
- probar helpers sin recursión;
- ejecutar la matriz RLS en una base local aislada;
- aprobar rollback/forward-fix y exposición Data API.

## 8. ¿Qué NO se tocó en C32?

- Supabase remoto;
- SQL o migraciones;
- endpoints o server actions;
- Auth V2 runtime;
- middleware, UI, navegación o capabilities;
- V1, package files, `.env`, deploy o producción.

## 9. Etapa actual

**Fase E.1 — Diseño de contexto tenant/RLS antes de migración.**

Nocturna tiene una fundación visual V2 y validación server-side de memberships,
pero el contexto todavía no está representado de forma versionada para RLS. C32
reduce esa ambigüedad antes de cualquier cambio real.
