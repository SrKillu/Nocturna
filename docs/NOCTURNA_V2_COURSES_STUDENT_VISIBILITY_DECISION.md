# Nocturna V2 — Decisión de visibilidad estudiantil en Courses

STATUS: PENDING_REVIEW

## Contexto

La matriz actual permite a `student` entrar a `/v2/courses` y al workspace de un
curso. RLS no puede transformar esa autorización de ruta en visibilidad segura
sin una relación de matrícula actual.

## Opción 1 — Incluir estudiantes desde el primer slice

### Alcance

Agregar `students` y `enrollments` mínimos, sin perfil académico, roster, notas,
asistencia ni calificaciones.

### Pros

- Mantiene la matriz actual con datos reales.
- Prueba temprano la relación más importante para futuros módulos.
- Evita acceso estudiantil por institución completa.

### Contras y riesgos

- Amplía el primer esquema y el grafo RLS.
- Aumenta riesgo de recursión y de filtrar peers/counts.
- Exige seed y pruebas completas de matrícula activa, retirada y cross-tenant.

### UX y complejidad

La UX puede pasar a real-data de forma coherente, pero solo si list/detail,
safe not-found y estados vacíos se prueban juntos. Complejidad media-alta.

## Opción 2 — Diferir visibilidad estudiantil

### Alcance

El primer slice real cubre owner/admin y staff asignado. Student no usa todavía
el repositorio real.

### Pros

- Reduce entidades y policies iniciales.
- Permite demostrar aislamiento institucional y por asignación primero.
- Menor superficie de datos sensibles.

### Contras y riesgos

- Si se deshabilita la ruta, cambia la matriz efectiva actual.
- Puede crear una experiencia desigual si no se comunica el estado.
- La integración posterior deberá ampliar cuidadosamente las policies.

### UX y complejidad

La ruta estudiantil necesitaría un estado controlado o permanecer mock-backed.
Complejidad inicial baja.

## Opción 3 — Student temporalmente mock-backed

### Alcance

Owner/admin/staff usan datos reales cuando el slice esté aprobado; student
conserva el adaptador mock con aviso de demostración.

### Pros

- Preserva el acceso visual actual.
- Evita afirmar una autorización DB que todavía no existe.
- Permite trabajar el slice estudiantil como PR separado.

### Contras y riesgos

- Dos fuentes temporales requieren separación explícita.
- No se deben mezclar counts o IDs mock con entidades reales.
- El usuario podría confundir demo con información institucional si no hay aviso.

### UX y complejidad

Impacto moderado y reversible. Requiere señalización clara y tests que bloqueen
el adaptador real para student.

## Decisión recomendada

**Incluir student visibility solo si se implementan minimal
`students`/`enrollments` y policy tests completos desde el inicio. Si no se puede
probar eso, diferir student real-data y mantenerlo mock-backed temporalmente.**

Para la futura conversión C32, la puerta es binaria:

- si existen seed y pruebas ejecutables para matrícula, incluir Opción 1;
- si no existen, escoger Opción 3 y excluir las policies estudiantiles de la
  primera migración, sin conceder acceso institucional genérico.

## Condiciones para incluir student

- identidad student enlazada al perfil autenticado;
- enrollment y section comparten tenant/term mediante constraints;
- solo statuses aprobados conceden acceso;
- sección exacta, no todas las secciones del curso;
- peer enrollments y roster siempre negados;
- counts aprobados por rol o ausentes;
- matrícula retirada/revocada corta acceso;
- safe not-found cross-tenant y por sección no matriculada;
- pruebas multi-membership y paginación.
