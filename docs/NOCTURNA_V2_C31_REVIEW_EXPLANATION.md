# Nocturna V2 — Explicación de revisión C31

STATUS: PENDING_REVIEW

## 1. ¿Qué hizo C30?

C30 convirtió los contratos visuales actuales de Courses V2 en un primer diseño de
PostgreSQL/Supabase para cursos y secciones de solo lectura. Propuso entidades,
relaciones, restricciones, índices, reglas RLS, datos sintéticos y pruebas de
políticas. También dejó un archivo SQL totalmente comentado para discutir el
diseño sin crear una migración ejecutable.

C30 no cambió Supabase, no ejecutó SQL y no conectó la interfaz a datos reales.

## 2. ¿Por qué C30 no se debe aplicar todavía?

Porque describe correctamente el problema, pero todavía contiene decisiones que
afectan directamente el aislamiento entre instituciones:

- falta cerrar cómo conoce RLS la membership activa de forma confiable;
- falta aprobar el comportamiento multi-dispositivo y la revocación inmediata;
- la visibilidad estudiantil requiere `students` y `enrollments` mínimos probados;
- el resumen del equipo docente puede filtrar información o crear RLS recursiva;
- el histórico de cursos, periodos y relaciones todavía no tiene política final;
- los nombres y relaciones deben reconciliarse con el esquema real existente;
- las políticas aún no se han ejecutado ni probado en una base local aislada.

Aplicar antes de resolver estos puntos convertiría supuestos en controles de
seguridad reales. Ese es precisamente el momento en que un error de diseño se
transforma en una fuga multi-tenant.

## 3. ¿Qué revisa C31?

C31 revisa C30 como diseño de seguridad, no como implementación. En particular:

- compara alternativas para el contexto activo de membership;
- define cómo tratar revocaciones, suspensiones y múltiples dispositivos;
- decide cuándo incluir estudiantes en el primer slice real;
- limita el resumen público del personal;
- evita que una asignación a una sección abra otras secciones del mismo curso;
- propone una regla conservadora para datos históricos;
- amplía el plan de pruebas y la puerta de entrada a una futura migración.

## 4. ¿Qué falta para producción?

Faltan, como mínimo:

1. reconciliar el borrador con el esquema y migraciones reales;
2. aprobar el mecanismo de active membership por sesión;
3. convertir el diseño en una migración pequeña y revisable;
4. levantar una base local o staging aislada con datos sintéticos;
5. ejecutar pruebas positivas, negativas, multi-tenant y de revocación;
6. revisar grants/Data API además de RLS;
7. medir planes de consulta e índices;
8. demostrar rollback o forward-fix;
9. integrar un repositorio server-side sin `service_role` en browser;
10. obtener aprobación humana explícita antes de cualquier `db push`.

## 5. ¿Qué significa multi-tenant sólido en Nocturna?

Significa que cada operación se autoriza con datos actuales de la base:

- identidad autenticada;
- membership activa y su institución;
- capability necesaria;
- relación concreta con el registro: administración, asignación o matrícula;
- estado vigente de la relación;
- proyección mínima de campos.

Conocer un ID, alterar un parámetro, cambiar de dispositivo o pertenecer a otra
institución no debe ampliar el acceso. Un ID inexistente y uno no autorizado deben
producir el mismo resultado público seguro.

## 6. ¿Por qué active membership es el punto más delicado?

Una persona puede pertenecer a varias instituciones. La interfaz necesita saber
cuál eligió, pero esa selección no puede convertirse por sí sola en autoridad.
Confiar en `institution_id` enviado por el cliente o en `user_metadata` editable
permitiría intentar seleccionar otro tenant.

La propuesta conservadora es guardar la selección en estado server-side ligado a
la sesión autenticada, y hacer que RLS vuelva a comprobar en DB que:

- la selección pertenece a `auth.uid()`;
- la membership sigue activa;
- la institución y el perfil siguen activos;
- la sesión y la selección no fueron revocadas.

La cookie HTTP-only puede identificar la selección, pero nunca sustituye esas
comprobaciones.

## 7. ¿Qué se necesita antes de `db push`?

- decisiones C31 aprobadas;
- esquema real reconciliado;
- migración revisada y todavía no aplicada remotamente;
- constraints de igualdad de tenant definidos declarativamente;
- políticas sin ciclos ni atajos `SECURITY DEFINER`;
- grants explícitos y exposición Data API decidida;
- seed sintético y pruebas RLS ejecutadas localmente;
- prueba de revocación, cambio de membership y acceso por ID directo;
- revisión de índices y planes de consulta;
- rollback/forward-fix ensayado;
- aprobación humana explícita del SQL final.

## 8. ¿Cómo se llama la etapa actual?

**Fase E — Diseño PostgreSQL/Supabase/RLS sin aplicación remota.**

Nocturna ya tiene una fundación V2 visual y autorización a nivel de rutas.
Todavía no tiene RLS real de dominio ejecutado y todavía no está en producción.
El objetivo actual es evitar errores de multi-tenancy antes de conectar datos
reales.
