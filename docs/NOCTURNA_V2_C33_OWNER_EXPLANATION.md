# Nocturna V2 — Explicación C33 para el dueño del proyecto

STATUS: PENDING_REVIEW

## 1. ¿Qué problema resuelve C33?

C33 define cómo cerrar la brecha entre el Auth V1 que sí está versionado en las
migraciones y el Auth V2 que ya usa el runtime. No aplica cambios: produce un
contrato objetivo, una transición no destructiva y un pseudo-SQL para revisión.

## 2. ¿Por qué `institution_memberships` y `roles` son críticos?

Son las piezas que permiten que una persona tenga varias instituciones y un rol
distinto en cada una. Auth V2 ya consulta:

- `institution_memberships` para saber a qué tenants pertenece un perfil;
- `roles` para obtener `owner`, `admin`, `teacher`, `assistant`, `student`,
  `guardian` o `support`.

Sin sus migraciones, el repo no puede reconstruir el esquema que el código espera
ni demostrar sus constraints, índices, grants o RLS.

## 3. ¿Por qué `profiles.institution_id + role` no basta?

Ese modelo V1 guarda un solo tenant y un solo rol por usuario. No puede representar
simultáneamente:

- docente en Alpha;
- admin en Beta;
- dos sesiones activas con selecciones distintas.

Además, el JWT V1 copia ese tenant/rol y puede quedar obsoleto. V2 necesita que el
perfil sea global y que la autoridad tenant viva en memberships actuales.

## 4. ¿Por qué no crear tablas duplicadas?

Si se crea otra tabla `profiles`, `memberships`, `courses` o `enrollments` sin
reconciliar la existente, dos fuentes distintas podrían decidir quién accede.
Eso rompe auditoría, backfill, RLS y rollback. C33 propone evolucionar los objetos
existentes y versionar exactamente las tablas que el runtime ya nombra.

## 5. ¿Qué significa “schema context fix pass”?

Es un pase de diseño que:

1. inventaría lo que existe y lo que el código espera;
2. define el esquema objetivo;
3. diseña un backfill sin borrar columnas V1;
4. ordena el futuro cutover de JWT, RLS y active membership;
5. identifica las pruebas necesarias antes de ejecutar SQL.

## 6. ¿Qué falta antes de migrar Courses + Sections?

- confirmar el drift remoto en un batch explícitamente autorizado;
- convertir el pseudo-SQL Auth V2 en una migración local revisable;
- probar roles, memberships y selections con seed sintético;
- definir terms, sections, section staff y la evolución de enrollments;
- probar el grafo RLS sin recursión;
- revisar grants/Data API;
- demostrar rollback o forward-fix;
- obtener aprobación humana.

## 7. ¿Qué NO se tocó en C33?

- Supabase remoto o producción;
- SQL ejecutado o migraciones reales;
- endpoints, runtime, middleware, V1 o UI;
- capabilities, package files, `.env`, Vercel o Railway.

## 8. Etapa actual

**Fase E.2 — Reconciliación Auth V2 y contexto tenant antes de migración.**

C33 reduce blockers y hace explícito el camino, pero no declara el sistema listo
para una migración aplicable.
