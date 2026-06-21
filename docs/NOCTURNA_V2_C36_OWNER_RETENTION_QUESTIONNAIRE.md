STATUS: PENDING_REVIEW

# Cuestionario de retención para el owner

## Instrucciones

Responder sin pegar datos personales, secretos, contraseñas ni contenidos
reales. Si una respuesta requiere revisar la base, marcar “requiere auditoría
autorizada”; no copiar registros al documento.

Clasificaciones sugeridas:

- critical business data
- useful non-critical data
- test/demo data
- unknown ownership
- obsolete

## Preguntas

1. ¿La base actual tiene usuarios reales?
2. ¿La base actual tiene instituciones reales?
3. ¿Hay cursos reales?
4. ¿Hay estudiantes reales?
5. ¿Hay notas o calificaciones reales?
6. ¿Hay materiales reales?
7. ¿Hay mensajes reales?
8. ¿Hay archivos en Storage que deban conservarse?
9. ¿Hay documentos oficiales o académicos?
10. ¿Hay datos sensibles?
11. ¿Hay obligaciones legales, contractuales o institucionales?
12. ¿Se puede mantener la DB actual como legacy read-only?
13. ¿Se puede iniciar Supabase V2 staging sin migrar datos?
14. ¿Se requiere conservar IDs de Auth?
15. ¿Se requiere migrar usuarios o se pueden recrear usuarios de staging?
16. ¿Qué dominios se pueden descartar como demo/test?
17. ¿Qué dominios requieren revisión manual?
18. ¿Quién aprueba eliminación, archivo o migración futura?
19. ¿Qué fecha de corte aplica?
20. ¿Qué evidencias deben guardarse antes de cambiar algo?

## Formato de respuesta

| Pregunta | Respuesta owner | Clasificación | Acción recomendada |
|---|---|---|---|
| 1. Usuarios reales | Pendiente | unknown ownership | Preservar; no migrar |
| 2. Instituciones reales | Pendiente | unknown ownership | Preservar; no migrar |
| 3. Cursos reales | Pendiente | unknown ownership | Preservar; no migrar |
| 4. Estudiantes reales | Pendiente | unknown ownership | Preservar; no migrar |
| 5. Notas/calificaciones | Pendiente | unknown ownership | Preservar; posible registro crítico |
| 6. Materiales | Pendiente | unknown ownership | Preservar; revisar propiedad |
| 7. Mensajes | Pendiente | unknown ownership | Preservar; revisar privacidad |
| 8. Storage | Pendiente | unknown ownership | Preservar; no copiar |
| 9. Documentos oficiales | Pendiente | unknown ownership | Bloquear retiro |
| 10. Datos sensibles | Pendiente | unknown ownership | Restringir acceso |
| 11. Obligaciones | Pendiente | unknown ownership | Consultar responsable |
| 12. Legacy read-only | Pendiente | N/A | Decisión operativa |
| 13. Staging sin datos | Pendiente | N/A | Recomendado si se aprueba |
| 14. IDs Auth | Pendiente | unknown ownership | No recrear todavía |
| 15. Migración usuarios | Pendiente | unknown ownership | Definir después de identidad |
| 16. Demo/test | Pendiente | unknown ownership | No descartar sin confirmar |
| 17. Revisión manual | Pendiente | unknown ownership | Asignar custodio |
| 18. Aprobador | Pendiente | N/A | Nombrar responsable |
| 19. Fecha de corte | Pendiente | N/A | Definir antes de export |
| 20. Evidencias | Pendiente | N/A | Definir backup/log/aprobación |

## Cierre requerido

El owner debe firmar o aprobar explícitamente:

- clasificación por dominio;
- permiso para staging sintético;
- estado legacy/read-only;
- necesidad de conservar IDs;
- dominios candidatos a export/migración;
- autoridad para archivo o eliminación.
