# Nocturna V2 — Matriz de pruebas de active membership

STATUS: PENDING_REVIEW

Estas pruebas son especificaciones futuras. C32 no ejecuta SQL ni levanta una DB.

| ID | Actor / estado inicial | Acción | Resultado esperado | Tablas futuras afectadas | Tipo de prueba | Riesgo |
|---|---|---|---|---|---|---|
| AM-01 | Usuario con una membership Alpha activa | Listar courses | Solo Alpha autorizado | selection, memberships, profiles, institutions, courses | Integración RLS | Baseline |
| AM-02 | Usuario con memberships Alpha y Beta, sin selection | Listar | Deny/active membership required | selections, memberships | Negativa | Elección ambigua |
| AM-03 | Usuario Alpha/Beta; sesión A selecciona Alpha | Consultar A | Solo Alpha | selections, memberships, courses | Integración | Tenant equivocado |
| AM-04 | Mismo usuario; sesión B selecciona Beta | Consultar A y B | A=Alpha, B=Beta | selections | Multi-session | Contaminación cross-device |
| AM-05 | A cambia a Beta | Consultar B | B permanece Beta; no cambia por A | selections | Concurrencia | Selección global |
| AM-06 | Selector manipulado a membership ajena | Guardar/consultar | Deny; selection no creada | selections, memberships | Negativa/API+RLS | IDOR |
| AM-07 | Selector inexistente | Guardar | Safe error; sin contexto | selections | Negativa | Enumeración |
| AM-08 | Selection expirada | Listar/detail | Deny | selections | RLS temporal | Sesión stale |
| AM-09 | Selection revocada | Listar/detail | Deny | selections | RLS | Reutilización |
| AM-10 | Selection de otro auth user | Consultar | Deny | selections, profiles | Negativa | Cross-user |
| AM-11 | Membership suspended | Consultar con selection vigente | Deny inmediato por DB | memberships, selections | Revocación | Claim/cookie stale |
| AM-12 | Membership revoked/left | Consultar | Deny inmediato | memberships, selections | Revocación | Acceso residual |
| AM-13 | Profile inactive | Consultar | Deny | profiles | Negativa | Cuenta deshabilitada |
| AM-14 | Institution suspended | Consultar | Deny | institutions | Negativa | Tenant suspendido |
| AM-15 | JWT con tenant/role viejo | Consultar | DB actual prevalece | memberships, roles | Stale-token | Privilegio obsoleto |
| AM-16 | Cookie con membership vieja | Consultar | Cookie solo selector; DB niega | selections, memberships | Negativa | Autoridad cliente |
| AM-17 | Auth session revocada | Acción sensible | Deny; selection no restaura sesión | auth.sessions, selections | Session revocation | Token post-logout |
| AM-18 | JWT sin `session_id` | Resolver contexto | Deny cerrado | selections | Negativa | Contexto no vinculable |
| AM-19 | No active membership | Abrir `/v2`/repositorio | Active membership required | memberships | Integración server | Fallback inseguro |
| AM-20 | Membership cambia entre list y detail | Abrir detail | Reautorizar; deny/safe not-found | memberships, courses | TOCTOU | Acceso residual |
| AM-21 | Course ID Beta en sesión Alpha | Detail directo | Safe not-found | courses, memberships | Direct-object RLS | Cross-tenant IDOR |
| AM-22 | Role teacher cambia a student | Consultar sin token refresh | Role DB actual manda; acceso staff termina | memberships/roles | Stale-token | Escalamiento |
| AM-23 | Capability revocada/cambiada | Consultar | Capability DB/config actual manda | roles/capabilities | Integración | Claim stale |
| AM-24 | Membership Alpha revocada con A y B apuntando a ella | Consultar A/B | Ambas niegan Alpha | memberships, selections | Multi-session revocation | Revocación parcial |
| AM-25 | Logout solo sesión A | Consultar A/B | A niega; B continúa si válida | auth.sessions, selections | Multi-session logout | Logout global accidental |
| AM-26 | Teacher asignado a section A | Course detail A+B | Course visible; solo section A | section_staff, sections, courses | Relación RLS | Sibling leakage |
| AM-27 | Student enrolled en section A | Course detail | Solo course/section A | students, enrollments | Relación RLS | Peer access |
| AM-28 | Guardian/support con selection activa | Courses direct ID | Deny/safe not-found | memberships, courses | Role negative | Capability bypass |
| AM-29 | Helper de contexto ejecutado solo | Resolver IDs/role | Resultado consistente, sin filas privadas | context tables | Unit SQL/pgTAP | Helper leakage |
| AM-30 | Helpers relacionales encadenados | Consultar sections | Sin error de recursión | section_staff/enrollments | Smoke RLS | Policy recursion |
| AM-31 | Data API sin grant explícito | Consultar tabla privada | Permission denied antes de RLS | grants/context table | Privilege test | Exposición accidental |
| AM-32 | Browser intenta service role | Inicializar/adaptador | Imposible; credencial ausente | N/A | Static/security | RLS bypass |

## Fixtures mínimas

- Alpha y Beta.
- Un usuario con memberships activas en ambas.
- Dos `session_id` válidos simultáneos.
- Selectors válidos, ajenos, expirados y revocados.
- Memberships active/suspended/revoked.
- Profile activo/inactivo e institution activa/suspendida.
- Roles/capabilities antes y después de cambio.
- Course/section repetidos entre tenants.
- Teacher con una de dos sections y student con una de dos enrollments.

## Evidencia requerida

- Resultados por rol autenticado, no solo como postgres/service role.
- Verificación de grants y RLS como capas separadas.
- Queries de direct ID y listas.
- Pruebas de dos sesiones simultáneas.
- Prueba de logout/session removal para acciones sensibles.
- Smoke test de grafo anti-recursión.
- `EXPLAIN` de lookups por session/membership después de crear índices.
- Ningún test usa datos reales o credenciales de producción.
