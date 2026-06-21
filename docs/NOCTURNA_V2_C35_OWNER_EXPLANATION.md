STATUS: PENDING_REVIEW

# Explicación para el owner — C35

## Qué encontró C34

C34 miró únicamente la estructura de la base remota, sin leer filas. Confirmó
que la base real y las migraciones del repositorio no representan exactamente
lo mismo.

La base remota tiene tablas que no existen en las migraciones:

- `course_sections`
- `final_grades`
- `materials`
- `messages`

También faltan en remoto los objetos que Auth V2 espera:

- `roles`
- `institution_memberships`
- `membership_session_selections`
- `institutions.status`

## Por qué C35 no migra todavía

Aplicar una migración incremental ahora sería construir sobre una base que no
está completamente versionada. Podría duplicar constraints, fallar por columnas
nullable, cambiar políticas RLS o romper V1.

C35 documenta el problema; no lo aplica.

## Qué es un baseline

Un baseline es una representación revisable del punto de partida real. Permite
responder: “si levantamos una base vacía, ¿podemos reconstruir la estructura que
hoy existe en remoto?”

El baseline C35 es un draft de revisión. No es una migración y no debe copiarse
a `supabase/migrations` ni ejecutarse en remoto.

## Por qué remoto y repo deben reconciliarse

El repositorio debe ser la fuente auditable para reconstruir, probar y revisar
la base. Si remoto contiene objetos sin historia, nadie puede asegurar qué
ocurrirá al aplicar el siguiente cambio.

Reconciliar no significa borrar lo remoto. Significa:

1. documentarlo;
2. reconstruirlo en una base desechable;
3. comparar el resultado;
4. decidir qué se conserva o corrige;
5. recién después preparar una migración real.

## Qué significa “tabla remota no versionada”

Significa que la tabla existe en Supabase, pero no hay un archivo de migración
local que explique cómo crearla. Puede funcionar hoy, pero no es reproducible ni
segura como dependencia futura.

## Por qué faltan piezas críticas de Auth V2

Auth V2 necesita saber:

- a qué instituciones pertenece una persona;
- qué rol tiene en cada institución;
- qué membership eligió para la sesión actual;
- si esa institución y membership siguen activas.

Sin `roles`, `institution_memberships`, selección por sesión y
`institutions.status`, esa autoridad no existe en la base. El frontend y runtime
no deben asumirla.

## Qué puede hacerse después de C35

El siguiente paso seguro es C36:

- reconstruir el baseline en una base local/desechable;
- verificar tablas, constraints, funciones, triggers, RLS y grants;
- demostrar que V1 sigue funcionando;
- corregir el draft hasta que la reconstrucción sea determinística.

Después podrá prepararse un migration draft Auth V2 separado, todavía sin
aplicarlo.

## Qué no se tocó

- No se escribió en Supabase.
- No se ejecutó SQL.
- No se aplicaron migraciones.
- No se leyeron filas reales.
- No se modificaron runtime, endpoints, middleware, V1, packages o `.env`.
- No se hizo deploy ni merge.

## Decisión

`C35_BASELINE_RECONCILIATION_DRAFTED`

`C35_READY_FOR_DISPOSABLE_DB_RECONSTRUCTION`
