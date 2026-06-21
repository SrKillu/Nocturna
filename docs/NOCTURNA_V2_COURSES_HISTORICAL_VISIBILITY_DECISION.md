# Nocturna V2 — Decisión de visibilidad histórica de Courses

STATUS: PENDING_REVIEW

## Objetivo

Definir una política inicial que no convierta relaciones terminadas en acceso
permanente accidental.

## Alternativas

### 1. Ocultar todo histórico por defecto

- Reduce exposición y simplifica consultas corrientes.
- Puede impedir auditoría académica legítima.
- Es la base segura para list/detail ordinarios.

### 2. Histórico para owner/admin

- Owner/admin con membership activa pueden consultar cursos/periodos históricos
  de su institución mediante filtro explícito.
- No concede acceso cross-tenant ni reactiva datos borrados.
- Requiere auditoría, límites y distinción entre `closed` y `archived`.

### 3. Histórico relacional para staff/student

- Staff con asignación terminada o student con enrollment completado podría ver
  un subconjunto histórico.
- Preserva continuidad académica, pero exige definir fechas, estados, campos y
  revocaciones legales.
- Se difiere hasta aprobar políticas específicas y pruebas de privacidad.

### 4. Filtro explícito

`includeArchived` o `termStatus` evita mezclar histórico con la consulta normal.
Debe validarse server-side y solo habilitarse para roles aprobados; no puede
ampliar tenant ni relación.

## Regla inicial recomendada

- Cursos y secciones `archived` quedan ocultos por defecto.
- Periodos `closed` solo aparecen bajo filtro histórico explícito para
  owner/admin de la misma institución.
- Un curso `completed` no es automáticamente visible si sus secciones están fuera
  del scope del actor.
- Staff/student historical visibility se difiere.
- Assignment `ended/revoked` y enrollment `withdrawn` no conceden acceso actual.
- Direct ID de un registro archived, closed fuera del filtro o fuera de scope
  produce safe not-found.
- No se admite `includeArchived=true` desde cliente sin autorización server-side.

## Casos por entidad

| Entidad/relación | Consulta normal | Flujo histórico inicial |
|---|---|---|
| Curso archived | Oculto | Owner/admin con filtro explícito |
| Sección archived | Oculta | Owner/admin con filtro explícito y curso visible |
| Periodo closed | Oculto por defecto | Owner/admin con `termStatus=closed` |
| Student withdrawn | No concede acceso | Diferido |
| Enrollment completed | No concede histórico por sí solo | Diferido |
| Staff assignment ended | No concede acceso | Diferido |
| Assignment revoked | Denegado | Nunca reactiva acceso |

## Pruebas obligatorias

- filtros ausentes no devuelven histórico;
- filtros manipulados por staff/student no amplían resultados;
- owner/admin solo ven histórico de su institución;
- IDs directos mantienen safe not-found;
- curso visible no abre secciones históricas no autorizadas;
- paginación/cursor no se reutiliza entre vista corriente e histórica;
- revocación prevalece sobre relación histórica;
- counts y staff summaries históricos no aparecen hasta tener contrato aprobado.
