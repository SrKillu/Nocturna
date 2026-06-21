# Nocturna V2 — Plan de proyección staff y RLS

STATUS: PENDING_REVIEW

## Problema

La UI actual muestra `teacherName` y “Equipo docente”. Ese texto no autoriza a
leer perfiles privados. Un join directo desde `section_staff` hacia perfiles con
policies que regresan a asignaciones puede crear recursión o ampliar campos.

## Campos permitidos en una futura proyección pública mínima

- identificador opaco de assignment, solo si la UI lo necesita;
- nombre público o display label aprobado;
- assignment role (`teacher`/`assistant`);
- estado público mínimo necesario;
- opcionalmente avatar público revisado.

## Campos que no se deben exponer

- email, teléfono, dirección o identificador de auth;
- membership status interno o session metadata;
- información contractual, HR, documentos o contactos;
- otras instituciones, otras asignaciones o capabilities;
- notas privadas, auditoría o datos de soporte.

## Alternativa A — Etiqueta genérica

Mostrar “Equipo docente” o “Docente asignado” sin consultar perfiles.

- Ventaja: menor riesgo y cero dependencia recursiva.
- Desventaja: menos contexto visual.
- Recomendación: usarla en la primera implementación real.

## Alternativa B — Vista `security_invoker`

Una vista mínima puede unir assignment y una fuente pública de display si las
policies base ya permiten exactamente esas filas.

- En PostgreSQL 15+, `security_invoker = true` hace que apliquen privilegios/RLS
  del invocador.
- Aun así, los grants y cada tabla base deben revisarse.
- No resuelve por sí sola una policy recursiva.
- No debe apuntar a un perfil privado de propósito general.

Es válida solo después de demostrar con pruebas que el grafo de policies no tiene
ciclos y que ninguna columna adicional queda accesible.

## Alternativa C — Tabla/proyección controlada

Una tabla separada de display público por membership/staff puede contener solo
los campos aprobados.

- Ventaja: separación clara de información pública y privada.
- Riesgo: sincronización, lifecycle y auditoría.
- Requiere un write path confiable futuro; no se agrega en C31.

Puede ser preferible cuando exista un dominio Staff real y un proceso de
actualización controlado.

## Evitar recursión y escalamiento

- La policy de `sections` comprueba la asignación del actor, no consulta perfiles.
- La policy de `section_staff` no debe consultar otra vez una vista que dependa
  de `section_staff`.
- El curso puede ser visible por `EXISTS` de una sección asignada, pero su lista
  de secciones debe filtrarse por la policy exacta de `sections`.
- Co-staff no obtiene automáticamente directorio, contacto ni otras asignaciones.
- La proyección pública solo se consulta después de establecer que la sección es
  visible.
- No usar `SECURITY DEFINER` para “romper” la recursión.

## Recomendación conservadora

1. Primera implementación: etiqueta genérica “Equipo docente”.
2. No consultar staff private profile.
3. Diseñar después una fuente pública mínima independiente.
4. Si se usa vista, exigir `security_invoker`, grants mínimos y pruebas de RLS.
5. No usar `SECURITY DEFINER` como atajo.

## Pruebas requeridas

- owner/admin ven únicamente staff de su institución;
- teacher A ve su sección A, no staff de sección B no autorizada;
- co-staff solo ve los campos públicos aprobados;
- student matriculado ve, como máximo, el resumen público de su sección;
- guardian/support no ven la proyección;
- direct ID cross-tenant devuelve vacío/safe not-found;
- ninguna query expone email/auth ID/otras memberships;
- prueba explícita de no recursión;
- vista invoker y una vista definer de control producen el resultado esperado:
  la variante definer no se autoriza para exposición;
- revocación de assignment elimina el resumen.
