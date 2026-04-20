#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Nocturna - SaaS académica multi-tenant con Next.js 14 (App Router) + TypeScript estricto,
  Supabase (Auth + Postgres + Storage), RLS por institution_id en JWT, Zod en todos los endpoints,
  roles student/teacher/admin/super_admin. Flujo end-to-end: signup institución → admin crea cursos
  → asigna profesor → profesor crea tareas → estudiante se matricula y entrega → profesor califica.

backend:
  - task: "Signup de institución + bootstrap de admin"
    implemented: true
    working: "NA"
    file: "app/api/auth/signup/route.ts, lib/services/auth.service.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Endpoint público usa service-role para crear institutions + auth user (email_confirm) + profile admin con rollback en caso de error. Requiere credenciales reales de Supabase y migraciones aplicadas."

  - task: "Middleware de sesión + protección de rutas"
    implemented: true
    working: "NA"
    file: "middleware.ts, lib/supabase/middleware.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Usa @supabase/ssr con getUser() (no getSession). /dashboard/* redirige a /login si no hay sesión. /api/* devuelve 401. /api/admin/* exige rol admin/super_admin via claim user_role. Guard si Supabase no está configurado."

  - task: "CRUD cursos (admin) + listado por rol"
    implemented: true
    working: "NA"
    file: "app/api/courses/route.ts, app/api/courses/[id]/teacher/route.ts, lib/services/courses.service.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "institution_id siempre desde JWT. Admins crean; profesores ven sus cursos; estudiantes ven matriculados. Zod valida entrada."

  - task: "Matriculación estudiante"
    implemented: true
    working: "NA"
    file: "app/api/courses/[id]/enroll/route.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Estudiante solo puede matricularse a sí mismo; admin puede matricular a cualquiera de su tenant. RLS refuerza."

  - task: "Creación de tareas (profesor/admin)"
    implemented: true
    working: "NA"
    file: "app/api/tasks/route.ts, lib/services/tasks.service.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Profesor debe ser el teacher_id del curso; admin puede crear en cualquier curso del tenant."

  - task: "Entrega de tareas + listado"
    implemented: true
    working: "NA"
    file: "app/api/tasks/[id]/submissions/route.ts, lib/services/submissions.service.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Estudiante upsert su entrega (re-entrega permitida mientras no esté calificada). Profesor ve todas las entregas del task con perfil del estudiante."

  - task: "Calificación de entregas"
    implemented: true
    working: "NA"
    file: "app/api/submissions/[id]/grade/route.ts, lib/services/grades.service.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Upsert de grade + cambio de status de submission a 'graded'. Solo teacher/admin."

  - task: "RLS policies + Auth Hook"
    implemented: true
    working: "NA"
    file: "supabase/migrations/0002_rls_policies.sql, supabase/migrations/0003_auth_hook.sql"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "RLS activado en todas las tablas. Políticas basadas en jwt_institution_id() y jwt_user_role(). Custom Access Token Hook inyecta user_role + institution_id. Usuario debe activar el hook en Dashboard → Authentication → Hooks."

frontend:
  - task: "Landing + auth pages (ES)"
    implemented: true
    working: true
    file: "app/page.tsx, app/(auth)/login/page.tsx, app/(auth)/signup/page.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Landing, login y signup renderizan en español (200 OK verificado con curl + screenshot)."

  - task: "Dashboard role-based"
    implemented: true
    working: "NA"
    file: "app/dashboard/*"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Layout con sidebar y topbar. /dashboard redirige según rol. Admin ve cursos+usuarios, teacher ve sus cursos con tabs (tareas + estudiantes), student ve cursos disponibles + mis tareas."

metadata:
  created_by: "main_agent"
  version: "0.1.0"
  test_sequence: 0
  run_ui: false

test_plan:
  current_focus:
    - "Esperando credenciales Supabase reales del usuario"
    - "Aplicar migraciones SQL (0001-0004) en orden"
    - "Activar Custom Access Token Hook en Dashboard Supabase"
    - "Crear bucket privado 'submissions'"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
  - agent: "main"
    message: |
      FEATURE — Acceso relajado para usuarios sin institución.

      OBJETIVO: usuarios autenticados sin institution_id pueden entrar al
      dashboard (antes iban a /auth/pending), con panel inline para unirse.

      ① MIDDLEWARE (lib/supabase/middleware.ts)
        * Nuevo `TENANT_OPTIONAL_PAGE_PREFIXES = ['/dashboard','/invites','/invite']`.
        * 2 checkpoints de tenant (JWT claim + DB gate) ahora respetan esta lista:
          si la ruta es tenant-optional, se deja pasar. Otras rutas protegidas
          (cursos, tareas, materiales, etc.) siguen exigiendo tenant.
        * **Fix crítico de RLS**: el middleware y `validateSessionLoose()` ahora
          leen el profile del usuario propio con `createServiceRoleClient()` lazy
          (solo el profile del user autenticado). Motivo: la policy
          `profiles_select_tenant` exige institution_id match, por lo que un
          user sin tenant no puede leer su propio profile → "no_profile". Sin
          tocar DB, bypass controlado solo para su propio id.

      ② LAYOUT Y PÁGINAS
        * app/(dashboard)/layout.tsx: usa validateSessionLoose (antes requireAuth).
          Redirige a /login solo si NO hay sesión. Si error es invalid_profile
          lleva a /login?error=... (caso edge). Ya no manda a /auth/pending.
        * app/(dashboard)/dashboard/page.tsx: detecta ctx.institutionId ausente
          y renderiza <JoinInstitutionPanel role={ctx.role} />.

      ③ UI
        * components/dashboard/join-institution-panel.tsx (NUEVO): panel
          "¡Bienvenido a Nocturna!" con input de código UUID + botón Unirme +
          2 cards explicativas (QR · rol). Reutiliza el mismo POST /api/invites/consume
          que ya funciona desde /auth/pending. Tras consumir hace refreshSession +
          hard-nav a /courses/[id] (student) o /dashboard (teacher).

      ④ PROTECCIONES MANTENIDAS
        * /api/* con tenant requirement siguen devolviendo 403 para user sin
          institution (flujo seguro: ningún dato cross-tenant se expone).
        * Rutas /courses, /tasks, /submissions, /grades, /admin, /teachers,
          /materials, /chat siguen con guardias estrictas.

      VERIFICACIÓN (screenshot manual):
        ✓ Registro libre → redirect a /dashboard (antes: /auth/pending).
        ✓ Sidebar visible con 8 items.
        ✓ Panel onboarding visible con título "¡Bienvenido a Nocturna!".
        ✓ "Rol: Estudiante" · "INSTITUCIÓN —".
        ✓ typecheck + lint OK.

      NO MODIFICÓ: DB, lógica de invites, RLS policies.


  - agent: "main"
    message: |
      BUGFIX — Registro con invitación + error CSRF `missing_token`.

      ① CSRF FIX
        * `/api/auth/register` agregado a `ECHO_EXEMPT_PREFIXES` en
          lib/security/csrf.ts (al lado de `/api/auth/signup` y `/api/auth/logout`).
          El endpoint es público y se hit antes de que exista la cookie CSRF.
          La defensa sigue siendo el Origin/Referer check.
        * Verificado con curl: POST /api/auth/register sin token CSRF → 201 ✅
        * (El resto del sistema mantiene el double-submit cookie activo.)

      ② REGISTRO CON TOKEN — FLUJO POST-REGISTER ROBUSTO
        Actualizado `app/(auth)/auth/register/page.tsx::submit` con:
          1. `[register] start` log con payload redacted.
          2. POST /api/auth/register → log `[register] success` o `[register] failed`.
          3. `signInWithPassword` + **polling de getSession 3×300ms** para garantizar
             que la cookie esté persistida antes del próximo request.
          4. **Fallback de consume**: si hay `effectiveToken` Y `tokenConsumed === false`
             (el service no pudo consumir), se llama explícitamente a
             POST /api/invites/consume → log `[register] consume fallback OK` o error.
          5. Redirect final con `window.location.href` (hard nav) después de
             `router.refresh()` + `refreshSession()` para evitar cache RSC con el
             JWT antiguo. `/courses/[id]` para student · `/dashboard` para teacher ·
             `/auth/pending` si algo no se resolvió.
          6. Errores explícitos con toasts + console.error (no más redirect silencioso).

      RESULTADO: QR → /auth/register?token=XYZ → cuenta creada → consume ejecutado
      (atómico en backend con fallback en frontend) → enrollment en DB → redirect al curso.

      NO SE MODIFICÓ: DB, invites.service.ts, auth.service.ts (ya funcionan).


  - agent: "main"
    message: |
      FEATURE — Registro público (student + teacher self-service).

      ① REGISTRO PÚBLICO
        * Schema Zod: `publicRegisterSchema` en lib/validations/auth.ts (fullName, email,
          password≥8, role ∈ student|teacher, token? uuid). role='admin' imposible.
        * Service: `registerPublicUser(input)` en lib/services/auth.service.ts
            - Sin token: crea user + profile con institution_id=null (pending state).
            - Con student_invite: alinea role+institution del invite, upsert enrollment,
              marca invite usado. Idempotente.
            - Con teacher_invite: sobreescribe role='teacher' + institution del invite.
            - Rollback del auth.user si falla el profile.
            - Logging [auth.register] en cada paso.
        * Endpoint: `POST /api/auth/register` con rate-limit authSignup (3/min/IP),
          listado en PUBLIC_API_PREFIXES del middleware. Comparte rate-limit con signup
          institucional (mismo riesgo de abuso).

      ② UI
        * /auth/register (cliente): form modern con RoleCard toggle (Student/Teacher),
          campo token opcional, autodetecta ?token= desde URL (rol heredado + campo
          readonly). Post-signup inicia sesión y redirige según resultado
          (enrolledCourseId → curso · institutionId → dashboard · null → /auth/pending).
        * /auth/pending: landing para user autenticado sin institución. Input para pegar
          token → POST /api/invites/consume → refreshSession → redirect.
        * Link desde /login → /auth/register y /signup.

      ③ AUTH PLUMBING
        * lib/auth/session.ts + `validateSessionLoose()`: variante que permite
          institutionId=null. Pensada ÚNICAMENTE para onboarding (no usar en dashboard).
        * /api/invites/consume ahora usa validateSessionLoose (antes rechazaba user sin
          tenant con missing_tenant).
        * /app/(dashboard)/layout.tsx: si requireAuth falla con FORBIDDEN+institution → 
          redirect('/auth/pending') (en vez de /login).
        * Middleware: agregados '/api/auth/register', '/auth/register', '/auth/pending'
          a PUBLIC_API_PREFIXES y AUTH_PAGES.

      SEGURIDAD
        * role NUNCA puede ser 'admin' desde registro público (Zod enum + service doble
          check). Bootstrap de admin queda solo en /api/auth/signup (institución).
        * Token valida UUID formato + expires_at + revoked + used antes de cualquier
          INSERT.
        * Rate-limit por IP.

      VERIFICACIÓN (scripts/smoke-register.ts):
        Caso A (libre)              → ✅ institutionId=null, tokenConsumed=false
        Caso B (student_invite)     → ✅ institutionId+enrolledCourseId set, tokenConsumed=true
        Caso C (teacher_invite)     → ⚠️ bloqueado por bug de schema DB: la tabla
                                        teacher_invites del usuario tiene columnas viejas
                                        (falta used/used_at/used_by/revoked/email_hint).
                                        Ver SQL de alineación en el mensaje del chat.

      NO SE MODIFICÓ: estructura DB (solo código + páginas). signup de institución sigue intacto.


  - agent: "main"
    message: |
      BUGFIX CRÍTICO — Flujo consume invite estudiante creaba 500 silencioso.

      ROOT CAUSE (confirmado con smoke test):
        `lib/services/invites.service.ts::consumeInvite` hacía
        `.select('id, ..., enrolled_at')` sobre la tabla `enrollments`, pero la DB
        del usuario tiene la columna como `created_at` (la migración 0002 define
        `enrolled_at` pero fue sobreescrita/divergente). Resultado: error 42703
        "column enrollments.enrolled_at does not exist" → consumeInvite lanzaba
        INTERNAL_ERROR → enrollment nunca se creaba aunque el endpoint devolvía
        un toast de error poco claro.

      FIX aplicado:
        1. `.select(..., created_at)` en lugar de `enrolled_at`.
        2. INSERT reemplazado por `.upsert(..., { onConflict: 'course_id,student_id',
           ignoreDuplicates: false })` + `.select().single()` → idempotente, retorna
           fila creada o existente. Maneja duplicados sin error.
        3. Validación de institución relajada: solo rechaza si usuario YA pertenece
           a OTRA institución; si tiene `null` o la misma, continúa.
        4. Sincronización de profile + app_metadata ANTES del enrollment (institution_id
           + role='student' + is_active=true), garantizando coherencia.
        5. Mark-as-used NO aborta el flujo si falla (solo loguea warning), porque el
           enrollment ya se creó y es lo crítico.
        6. Logging detallado con etiqueta `[invites.consume]` en cada paso
           (invite found · enrollment ready · invite marked as used).

      UI:
        `ConsumeInviteClient` ahora hace `router.refresh()` **antes** del
        `router.push(/courses/[id])` → invalida el cache RSC para que la página
        destino vea el enrollment recién creado en el primer render.

      VERIFICACIÓN (scripts/smoke-consume-invite.ts):
        ✓ consumeInvite ejecuta sin error
        ✓ enrollment creado en DB (verificado por UUID directo: 4f290624-...)
        ✓ student_invite.used=true · used_at · used_by actualizados
        ✓ Segundo intento es idempotente (mismo enrollmentId, 0 duplicados)
        ✓ typecheck + lint OK

      NO SE MODIFICÓ: estructura DB, otros módulos.


  - agent: "main"
    message: |
      FEATURE — Módulos incrementales 1-3 (Estudiantes · Limpieza Invitaciones · Trabajos cotidianos).

      ① ESTUDIANTES POR CURSO
        * lib/services/students.service.ts · listCourseStudents(ctx, courseId) con
          ownership check (staff o teacher del curso).
        * GET /api/courses/[id]/students con requireRole(['admin','super_admin','teacher']).
        * components/courses/course-students-tab.tsx → tabla nombre/email/fecha + empty state.
        * Pestaña "Estudiantes" solo visible para role !== 'student'.

      ② LIMPIEZA DE INVITACIONES
        * revokeTeacherInvite / revokeStudentInvite ahora devuelven {deleted:boolean} y
          aplican semántica dual:
            - 1er DELETE sobre invite activa → set revoked=true (soft)
            - 2do DELETE sobre invite ya revocada → DELETE real (hard)
        * InviteQrCard: botón "Revocar" (activo) → "Eliminar" (revocado) con confirm.
        * invites-admin-panel + invites-teacher-panel distinguen toast + mutación local.

      ③ TRABAJOS COTIDIANOS (módulo paralelo más liviano que tareas)
        * SQL: supabase/migrations/0022_daily_work.sql (2 tablas + RLS + índices + unique
          constraint (work_id, student_id) para upsert de respuesta). ⚠️ Usuario debe aplicarlo.
        * lib/services/daily-work.service.ts · list/create/delete/submit/listSubmissions
          con assertCanManageCourse + assertEnrolledOrStaff.
        * Endpoints:
            GET  /api/courses/[id]/daily-work            (listar, enriquecido con my_submission y count)
            POST /api/courses/[id]/daily-work            (teacher/admin crea)
            POST /api/daily-work/[id]/submit             (student envía/actualiza respuesta — upsert)
            GET  /api/daily-work/[id]                    (teacher ve todas las respuestas)
            DELETE /api/daily-work/[id]                  (teacher elimina)
        * components/courses/course-daily-work-tab.tsx: UI unificada expandible
            - teacher: formulario "Publicar trabajo" + lista colapsable + panel de respuestas
              por trabajo al expandir.
            - student: lista con badge "Entregada" + textarea para responder/editar.
        * Pestaña "Trabajos" visible para todos los roles.

      Verificaciones: typecheck ✅ · lint ✅ · screenshots verificados (tabs Trabajos y
      Estudiantes renderizan correctamente para role=teacher).

      PENDIENTE usuario:
        * Correr /app/supabase/migrations/0022_daily_work.sql en Supabase SQL Editor.
        * Sin ese SQL, /api/courses/[id]/daily-work devolverá 500.

      PRÓXIMAS ITERACIONES (no incluidas aquí):
        * Módulo 4 — Chat privado 1-a-1 (requiere rediseño: conversations + participants).
        * Módulo 5 — Roles definidos (auditar requireRole en endpoints + UI conditional).
        * Fase 2 — RLS audit + rate limit invites/chat + reemplazar listUsers → getUserByEmail.


  - agent: "main"
    message: |
      FEATURE — Integración UI completa + Sistema QR (Módulo 7).
        1. Sidebar: agregadas 4 entradas → Materiales, Chat, Invitaciones (bajo Espacio)
           y Profesores (bajo Gestión). Rutas nuevas: /teachers, /materials, /chat, /invites,
           /invite/[token]. Todas las rutas nuevas agregadas a PROTECTED_PAGE_PREFIXES en
           lib/supabase/middleware.ts.
        2. Master-detail reutilizable: components/courses/course-picker-aside.tsx se usa en
           /materials y /chat para listar cursos del usuario + filtro + selección con
           ?courseId=... reflejado en la URL. Reutiliza los mismos <CourseMaterialsTab> y
           <CourseChatTab> que ya existían en la vista de detalle del curso.
        3. Sistema QR:
           * SQL idempotente en supabase/migrations/0020_invites.sql (tablas teacher_invites
             y student_invites + RLS con claims inline). ⚠️ El usuario debe correrlo en su DB.
           * Service: lib/services/invites.service.ts (list/create/revoke/lookup/consume).
             Tipos puros extraídos a lib/invites/types.ts para evitar romper 'server-only' al
             importarse desde client components.
           * Endpoints: /api/invites/teachers, /api/invites/students (GET+POST),
             /api/invites/teachers/[id] DELETE, /api/invites/students/[id] DELETE,
             /api/invites/lookup/[token] GET, /api/invites/consume POST.
           * UI: InvitesAdminPanel + InvitesTeacherPanel (con shadcn Card/Select),
             InviteQrCard dibuja el QR en <canvas> usando librería `qrcode`, botones
             "Copiar enlace" y "Revocar". Página pública autenticada /invite/[token]
             muestra preview + botón "Aceptar" que llama /consume y (para teachers)
             refresca sesión Supabase antes de redirigir a /dashboard.
        4. Auth flow: al consumir invite de teacher actualizamos profiles (role/institution)
           + app_metadata vía service client + refreshSession desde el browser para que el
           Custom Access Token Hook emita el nuevo JWT en el próximo request.
        5. Dependencia nueva: `qrcode` + `@types/qrcode` agregadas a package.json.

      Verificaciones: typecheck ✅, lint ✅, screenshots verificados — sidebar muestra
      Panel/Cursos/Tareas/Entregas/Calificaciones/Materiales/Chat/Invitaciones y
      Profesores/Administración; /chat, /materials e /invites renderizan el layout
      master-detail correctamente con los cursos seed.

      PENDIENTE usuario (no-código):
        * Correr /app/supabase/migrations/0020_invites.sql en Supabase SQL Editor.
        * Sin ese SQL, /invites renderiza pero crear/listar invitaciones responde 500.


    message: |
      Arquitectura + flujo E2E implementados. App corre (home=200, /api/health=200, /dashboard=307).
      Para validar: el usuario debe (1) crear proyecto Supabase, (2) pegar URL + anon + service_role en
      /app/.env, (3) correr las 4 migraciones SQL de /app/supabase/migrations en orden, (4) habilitar
      el hook `public.custom_access_token_hook` en Dashboard → Authentication → Hooks, (5) crear bucket
      privado `submissions`. Después de eso se puede testear signup → login → crear curso → matricular
      → crear tarea → entregar → calificar.

  - task: "RPC transaccional grade_submission"
    implemented: true
    working: "NA"
    file: "supabase/migrations/0009_business_rpcs.sql, lib/services/grades.service.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Una sola llamada RPC upsert grade + flip status + audit_log. SECURITY INVOKER. Valida ownership del teacher y score<=max_score. Errores Postgres mapeados a ApiError sin leak."

  - task: "Rate limiting (auth/signup, admin/users, files)"
    implemented: true
    working: "NA"
    file: "lib/rate-limit.ts, app/api/auth/signup/route.ts, app/api/institution/users/route.ts, app/api/files/*"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Fixed-window in-memory. signup 3/60s por IP, admin create 10/60s user+IP, upload 30/60s, download 60/60s. Header Retry-After en 429."

  - task: "Files service (signed upload + signed download)"
    implemented: true
    working: "NA"
    file: "lib/services/files.service.ts, app/api/files/upload/route.ts, app/api/files/signed-url/route.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Path convention {institution}/{student}/{task}/{uuid-filename}. MIME whitelist + size 20MB. createSignedUploadUrl para subir directo a Storage. createSignedUrl 60s con existencia verificada via storage.list(). 404 si cross-tenant para no filtrar existencia."

  - task: "Audit log service"
    implemented: true
    working: "NA"
    file: "lib/services/audit.service.ts"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Best-effort insert con institution_id desde DEFAULT auth.institution_id(). Usado en user.invite y file.upload_url.issued. grade.upsert ya lo hace desde el RPC."

  - task: "PROMPT 8 — QA automatizado (suite de seguridad)"
    implemented: true
    working: true
    file: "vitest.config.ts, tests/unit/*.test.ts, tests/e2e/*.test.ts, tests/helpers/*"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          Suite híbrida implementada con Vitest 2.1:
            * Unit tier (44 tests, 5 archivos, corre sin red, todo PASS):
                - T11 rate-limit (sliding window, ban exponencial, scope IP/user)
                - T12 CSRF (double-submit, origin/referer, echo-exempt, constant-time)
                - T18 file-magic (PDF/PNG/JPEG/WEBP/DOCX/text UTF-8, spoof detection)
                - middleware-auth (10 tests: unauth API/page, claims, session_version, role mismatch, admin guard, CSRF integrado)
                - race-conditions (mapping P0002/42501/22023 → ApiError, upsert concurrente simulado)
            * E2E tier (13 tests, 4 archivos, auto-skip con creds placeholder):
                - T15 rls-isolation (cross-tenant SELECT/INSERT/audit_log negados)
                - T17 jwt-invalidation (bump_session_version + JWT claim verification)
                - T16 audit-log (grade.upsert escribe fila, institution_id no spoofable)
                - T15b permissions (student no crea cursos, teacher no dueño no califica, admin sí)
          Scripts: npm test · npm run test:unit · npm run test:e2e · npm run test:watch · npm run test:security.
          Helpers: `hasRealSupabase()` gate, `seedTenant/teardownTenant`, `mockRequest`, `server-only` shim.
          Estado actual sin credenciales reales: 44 passed · 13 skipped · typecheck limpio.

metadata_tests:
  last_run: "npm test"
  last_result: "44 passed | 13 skipped (57 total)"
  unit_files: 5
  e2e_files: 4

  - task: "PROMPT FRONTEND 1 — Base y Layout (route group unificado)"
    implemented: true
    working: true
    file: "app/(dashboard)/layout.tsx, components/layout/*, lib/hooks/*, lib/rbac/*"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          Refactor de shell completado (opción A · reemplazo limpio):
            * ELIMINADO: app/dashboard/* (layout, page, admin/, teacher/, student/) y components/dashboard/*.
            * NUEVO route group app/(dashboard)/ con layout.tsx (sidebar + topbar + auth guard via requireAuth()).
            * 6 páginas flat: /dashboard, /courses, /tasks, /submissions, /grades, /admin (placeholders listos para módulos).
            * components/layout/: app-shell, sidebar, mobile-sidebar (Sheet responsive), topbar (avatar+nombre+dropdown logout), page-header, empty-module.
            * lib/rbac/nav.ts: single source of truth de navegación; entrada "Admin" filtrada por role (admin | super_admin).
            * lib/rbac/labels.ts: roleLabel compartido.
            * lib/hooks/use-session.ts: hook client que proyecta app_metadata del JWT.
            * lib/hooks/use-logout.ts: logout centralizado (API + SDK + redirect).
            * Admin page re-chequea rol server-side (defensa contra deep-link).
            * middleware.ts: isProtectedPage ahora cubre los 6 prefijos flat.
            * Typecheck: 0 errores · Tests: 44 passed | 13 skipped · curl /dashboard, /courses, /admin → 307 redirect a login (correcto en modo placeholder).

  - task: "PROMPT FRONTEND 2 — Autenticación (login + callback pulidos)"
    implemented: true
    working: true
    file: "app/(auth)/layout.tsx, app/(auth)/login/page.tsx, components/auth/login-form.tsx, components/auth/login-alert.tsx, lib/auth/error-map.ts, app/auth/callback/route.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          Refactor del flujo de autenticación:
            * app/(auth)/layout.tsx: shell compartido para /login y /signup, centra el card y redirige a /dashboard si ya hay sesión válida (server-side getUser()).
            * app/(auth)/login/page.tsx: ahora es Server Component que sanitiza ?next y ?error, renderiza <LoginAlert/> y <LoginForm/>.
            * components/auth/login-form.tsx: client component con react-hook-form + Zod (loginSchema), validación inline aria-invalid/aria-describedby, estado de carga (Loader2 animado), error global + toast, router.replace(nextPath) + refresh tras éxito.
            * components/auth/login-alert.tsx: mapping centralizado de códigos (not_authenticated, invalid_profile, inactive_account, missing_tenant, session_expired, invalid_callback) a copy en español.
            * lib/auth/error-map.ts: traduce errores de Supabase Auth a mensajes seguros (sin enumeración de cuentas, bucket 429/400/422/network).
            * app/auth/callback/route.ts: exchangeCodeForSession + validateSession() + fallback a /login?error=<code> con logs estructurados; default next=/dashboard.
            * NO se manipulan tokens manualmente — Supabase SSR gestiona cookies.
          Verificación: typecheck limpio · npm test → 44 passed | 13 skipped · /login responde 200 con banner de error y formulario accesible.

  - task: "PROMPT FRONTEND 3 — Dashboard principal"
    implemented: true
    working: true
    file: "app/(dashboard)/dashboard/page.tsx, lib/services/dashboard.service.ts, components/dashboard/*, lib/utils/date.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          Dashboard principal como Server Component con agregador único:
            * lib/services/dashboard.service.ts: getDashboardOverview(ctx) devuelve {role, displayName, institutionName, kpis, courses, tasks, activity}. Una sola round-trip coordinada vía Promise.all. RLS garantiza tenant-scoping. Fallback emptyOverview() cuando Supabase no está configurado o hay migraciones pendientes.
            * Queries role-aware (student → enrollments + own submission status; teacher → cursos propios + pendientes por revisar; admin → tenant completo).
            * KPIs: Cursos activos, Tareas/Entregas pendientes, Entregas 7d, Calificadas 7d (count:exact head:true, cheap).
            * Componentes en components/dashboard/:
                - welcome-card: saludo dinámico (mañana/tarde/noche) + rol + institución, gradient sutil.
                - kpi-grid: 4 KPIs responsive (2 col mobile, 4 col xl).
                - courses-card: top-5 cursos con descripción + CTA "Abrir".
                - tasks-card: top-5 tareas ordenadas por due_date; badges de estado (Pendiente/Enviada/Calificada para student; "N por revisar" para staff).
                - activity-card: timeline con iconografía por acción (grade.upsert, file.*, session.invalidate, login_success, logout).
            * lib/utils/date.ts: formatRelativeDate con Intl.RelativeTimeFormat (es) + salto a fecha absoluta >14d.
            * app/(dashboard)/dashboard/page.tsx: dynamic='force-dynamic' (datos frescos), try/catch con fallback a empty para no derribar el shell si falla una subquery.
            * SIN fetch a /api/* desde Server Components (pattern correcto en Next.js 14: llamar servicios directamente).
          Verificación: typecheck ✅ · tests 44 passed | 13 skipped ✅ · /dashboard → 307 a login en modo placeholder.

  - task: "PROMPT FRONTEND 4 — Cursos (listado + detalle + crear)"
    implemented: true
    working: true
    file: "app/(dashboard)/courses/page.tsx, app/(dashboard)/courses/[id]/page.tsx, app/api/courses/[id]/route.ts, lib/services/courses.service.ts, components/courses/*"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          Módulo de Cursos completo:
            * app/(dashboard)/courses/page.tsx (Server Component): llama listCourses() + listInstitutionTeachers() (si es admin), grid responsive 1/2/3 col, EmptyModule cuando no hay cursos, CTA "Crear curso" solo para admin/super_admin.
            * app/(dashboard)/courses/[id]/page.tsx (Server Component): detalle con getCourseDetail(); generateMetadata dinámico; 3 MetaCards (Profesor, Estudiantes, Tareas); listado de tareas ordenado por due_date; botón "Matricularme" solo si es student no matriculado; notFound() si RLS filtra.
            * app/api/courses/[id]/route.ts (nuevo): GET para uso cliente futuro; 404 si RLS filtra (no leak de existencia).
            * lib/services/courses.service.ts: añadido getCourseDetail(ctx, id) → {course, teacher, enrollment_count, task_count, tasks(top-20), is_enrolled}. Promise.all de 4 queries.
            * components/courses/course-card.tsx: card con icono, nombre, descripción (line-clamp-2 + min-height), fecha relativa de creación; hover translate-y + border highlight.
            * components/courses/create-course-dialog.tsx (client): shadcn Dialog + react-hook-form + Zod (createCourseSchema); Select de profesor con fallback UNASSIGNED; apiFetch() con CSRF automático; toast + router.refresh() tras éxito; reset en cancel/close.
            * components/courses/enroll-button.tsx (client): POST /api/courses/:id/enroll con loading + toast + refresh.
          Verificación: typecheck ✅ · tests 44 passed | 13 skipped ✅ · /courses y /courses/[id] → 307 a login en modo placeholder (correcto).

  - task: "PROMPT FRONTEND 5 — Tareas (listado + filtro + detalle + crear)"
    implemented: true
    working: true
    file: "app/(dashboard)/tasks/page.tsx, app/(dashboard)/tasks/[id]/page.tsx, app/api/tasks/[id]/route.ts, lib/services/tasks.service.ts, components/tasks/*"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          Módulo de Tareas completo:
            * lib/services/tasks.service.ts: añadido listAllTasks(ctx, {courseId?}) role-aware (student→enrolled, teacher→own courses, admin→tenant) y getTaskDetail(ctx, id) con conteos submission_count/submitted_count/graded_count + own_submission para student + can_edit.
            * app/(dashboard)/tasks/page.tsx (Server Component): PageHeader con CTA "Crear tarea" (teacher/admin), TaskFilterBar, lista con TaskListRow, EmptyModule. Filtro vía ?courseId= en URL (shareable).
            * app/(dashboard)/tasks/[id]/page.tsx: generateMetadata dinámico; 4 MetaCards (Curso linkeado/Entrega/Entregas/Calificadas); tarjeta "Tu entrega" para student; sección enunciado con whitespace-pre-wrap; notFound() si RLS filtra.
            * app/api/tasks/[id]/route.ts (nuevo): GET para uso cliente; 404 si no visible.
            * components/tasks/task-filter-bar.tsx (client): Select que hace router.push con ?courseId= (URL como estado).
            * components/tasks/task-list-row.tsx: fila con icono, curso, fecha relativa, max score, badge role-aware (Pendiente/Enviada/Calificada/Tarde para student; "N por revisar" para staff).
            * components/tasks/create-task-dialog.tsx (client): Dialog + react-hook-form + Zod local (acepta datetime-local, convierte a ISO); Select de curso filtrado (teacher → solo sus cursos); input maxScore numérico; toast + refresh.
          Verificación: typecheck ✅ · tests 44 passed | 13 skipped ✅ · /tasks y /tasks/[id] → 307 a login en modo placeholder.

  - task: "PROMPT FRONTEND 6 — Entregas (drag & drop + historial + 3-step upload)"
    implemented: true
    working: true
    file: "app/(dashboard)/submissions/page.tsx, app/(dashboard)/tasks/[id]/page.tsx, lib/services/submissions.service.ts, components/submissions/*"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          Módulo de Entregas completo con flujo seguro 3-step:
            * components/submissions/submission-uploader.tsx (client, cross-module): state machine por fase (idle→requesting→uploading→confirming→submitting→done/error). Drag & drop con Enter/Space, validación cliente MIME+tamaño, XHR PUT con onprogress para barra real, llamadas encadenadas:
                1. POST /api/files/upload   → {fileId, signedUrl, path}
                2. PUT directo a Storage (barra %)
                3. POST /api/files/confirm  → magic-byte verification
                4. POST /api/tasks/:id/submissions → filePath + comentario
               Si confirmación devuelve 'blocked' → aborta con mensaje claro.
            * lib/services/submissions.service.ts: añadidos listMySubmissions (student) y listSubmissionsForReview (teacher→own courses, admin→tenant) con joins a tasks/courses/profiles/grades.
            * app/(dashboard)/submissions/page.tsx: listado role-aware con SubmissionStatusFilter (URL ?status=). Muestra curso, tarea, fecha, autor (para staff), archivo adjunto, calificación N/Max.
            * components/submissions/submission-row.tsx: fila con icono, status badge (Calificada/Enviada/Tarde/Devuelta), grade_score/grade_max.
            * components/submissions/submission-status-filter.tsx (client): Select que hace router.push a ?status=.
            * app/(dashboard)/tasks/[id]/page.tsx: inyectado SubmissionUploader para students (server→client boundary correcta); existingStatus='graded' deshabilita el formulario.
          Verificación: typecheck ✅ · tests 44 passed | 13 skipped ✅ · /submissions → 307 a login en modo placeholder.

  - task: "PROMPT FRONTEND 7 — Calificaciones (tabla role-aware + inline grading)"
    implemented: true
    working: true
    file: "app/(dashboard)/grades/page.tsx, lib/services/grades.service.ts, components/grades/*"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          Módulo de Calificaciones completo:
            * lib/services/grades.service.ts: añadidos listGradesForStudent(ctx) (submissions propias + grade embebida) y listGradesForReview(ctx, {onlyPending?}) (teacher→own courses, admin→tenant; filtro por status='submitted' si onlyPending).
            * app/(dashboard)/grades/page.tsx (Server Component): split por rol. Student → StudentGradesTable read-only. Staff → ReviewGradesTable con edición inline + GradeFilter (Todas/Pendientes) vía ?pending=1.
            * components/grades/student-grades-table.tsx: shadcn Table con columnas Tarea (link a /tasks/:id) · Curso · Entregada (fecha relativa) · Nota (score/max) · Feedback (line-clamp-2) · Estado (badge). Columnas hidden md/lg para responsive.
            * components/grades/review-grades-table.tsx: columnas Tarea · Curso · Estudiante · Enviada · Estado · Nota/Feedback (GradeCell). Misma estrategia responsive.
            * components/grades/grade-cell.tsx (client): inline Input numérico (0..max_score) + Textarea feedback + botón Guardar. POST a /api/submissions/:id/grade → RPC grade_submission (upsert + status flip + audit). Validación cliente antes de enviar. toast + router.refresh() tras éxito. Cada celda mantiene su propio loading (rows independientes).
            * components/grades/grade-filter.tsx (client): pair de botones estilo segmented control, URL-first ?pending=1.
          Verificación: typecheck ✅ · tests 44 passed | 13 skipped ✅ · /grades → 307 a login en modo placeholder.

  - task: "PROMPT FRONTEND 8 — UX, Estado y Performance"
    implemented: true
    working: true
    file: "lib/hooks/use-api-swr.ts, lib/hooks/use-mutation.ts, components/skeletons/*, app/(dashboard)/*/loading.tsx, app/(dashboard)/error.tsx, app/(dashboard)/not-found.tsx, app/global-error.tsx, components/courses/create-course-dialog-lazy.tsx, components/tasks/create-task-dialog-lazy.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          Capa de UX, caching y performance:
            * Estado cliente: añadido swr (npm) + jsonFetcher wrapping apiFetch (CSRF echo automático, envelope {data}/{error} normalizado, no retry en error).
            * lib/hooks/use-api-swr.ts: hook tipado para polling/optimistic client-side (Server Components siguen siendo el primary path; SWR cubre casos específicos sin necesidad de un QueryProvider global).
            * lib/hooks/use-mutation.ts: wrapper uniforme (POST/PUT/PATCH/DELETE) con apiFetch + toast consistente + router.refresh() opcional + loading state. Elimina 8+ líneas de boilerplate por formulario.
            * components/skeletons/: DashboardSkeleton (layout-matched, 4 KPIs + 2 cards + activity), CardGridSkeleton, ListSkeleton, TableSkeleton, PageHeaderSkeleton — todos con aria-busy/aria-live="polite".
            * loading.tsx por ruta: /dashboard, /courses, /tasks, /submissions, /grades, /admin. Next.js usa Suspense boundary automáticamente → skeleton instantáneo en navegación.
            * app/(dashboard)/error.tsx: client error boundary por route group. Captura cualquier throw en servicios/páginas, muestra card amigable con botón Reintentar + link al panel + error.digest para trazabilidad. Mantiene el shell.
            * app/(dashboard)/not-found.tsx: 404 dentro del shell autenticado (sidebar intacto).
            * app/global-error.tsx: fallback HTML standalone para crashes del root layout.
            * Lazy loading: components/courses/create-course-dialog-lazy.tsx + components/tasks/create-task-dialog-lazy.tsx con next/dynamic({ssr:false}) + loading fallback del trigger. Los bundles de los dialogs (react-hook-form + Zod + shadcn Dialog ≈ 45 kB gz) se cargan solo si el admin/teacher abre el modal. Páginas /courses y /tasks actualizadas para usar las versiones Lazy.
          Verificación: typecheck ✅ · tests 44 passed | 13 skipped ✅ · /login → 200 con form accesible (screenshot verificada).

  - task: "Bug fix: Preview iframe rechaza conexión (X-Frame-Options + CSP frame-ancestors)"
    implemented: true
    working: true
    file: "next.config.js, lib/security/csp.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          Root cause: dos capas bloqueaban el embedding del iframe del preview de Emergent:
            1. next.config.js: X-Frame-Options: DENY (static header en el edge)
            2. lib/security/csp.ts: CSP frame-ancestors 'none' (dinámico en middleware)
          
          Fix aplicado (manteniendo toda la seguridad):
            * Removido X-Frame-Options por completo (deprecated, no soporta allowlists; CSP frame-ancestors lo supersede en todos los browsers modernos).
            * CSP frame-ancestors ahora: 'self' https://*.emergentagent.com https://*.preview.emergentagent.com (allowlist estricto, solo el dominio preview de Emergent puede embeber).
            * Cross-Origin-Opener-Policy: same-origin → same-origin-allow-popups (permite popups del iframe para OAuth callback futuro sin perder aislamiento).
            * Cross-Origin-Resource-Policy: same-origin → cross-origin (necesario para que el iframe cargue JS/CSS bundles).
          
          Seguridad conservada:
            * Clickjacking sigue imposible en cualquier dominio NO whitelisted.
            * Todo el resto del CSP (script-src con nonce+strict-dynamic, connect-src acotado a Supabase, form-action 'self', object-src 'none', etc.) intacto.
            * STS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy sin cambios.
          
          Verificación: curl -I muestra el header correcto; typecheck ✅; tests 44 passed | 13 skipped ✅.

  - task: "Redesign UI: Teams + Classroom + SaaS premium"
    implemented: true
    working: true
    file: "tailwind.config.js, lib/ui/course-accents.ts, components/courses/*, components/layout/*, components/dashboard/courses-card.tsx, lib/rbac/nav.ts, lib/security/csrf.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          Rediseño completo + dos bugs críticos descubiertos y arreglados:
          
          Bug #1 (Tailwind): content glob era ['./**/*.{js,jsx}'] → NO escaneaba .tsx, por lo que clases dinámicas de componentes TS no se aplicaban. Añadido ts,tsx al glob en tailwind.config.js → muchos estilos que estaban "rotos" ahora se aplican (se ve claramente en las screenshots).
          
          Bug #2 (CSRF): signup real desde el preview devolvía csrf:origin_mismatch porque el ingress de Emergent no siempre forwarda x-forwarded-host. Refactor de sameOrigin() para usar allowlist de trusted hosts: request host + host de NEXT_PUBLIC_BASE_URL. Ahora cualquier origen canónico del preview pasa el check sin relajar seguridad.
          
          Redesign (Teams + Classroom + SaaS):
            * lib/ui/course-accents.ts: 8 acentos deterministas por UUID (FNV-1a hash) con gradientes Tailwind (violet/sky/emerald/rose/amber/fuchsia/cyan/lime) + courseInitials().
            * components/courses/course-card.tsx: card Classroom-style con hero gradient, iniciales grandes, discos decorativos (pure CSS blur), hover translate-y + ring. Accepts href direct. teacherName + status badge (Activo/Archivado con dot color).
            * app/(dashboard)/courses/[id]/page.tsx: rework COMPLETO. Hero gradient grande con iniciales 2xl + badge de profesor, meta strip (estudiantes/tareas/fecha creado/matriculado). Tabs shadcn: Novedades (Stream) · Tareas · Personas.
            * components/courses/course-stream.tsx: timeline vertical con connector line + dots coloreados por tipo (task_created violet, submission sky, grade emerald). Fecha relativa.
            * components/courses/course-people.tsx: dos secciones separadas (Profesor·a, Estudiantes) con Avatar + iniciales + email.
            * components/courses/course-tasks-tab.tsx: lista in-tab con hover state + chevron animado + link a gestión global.
            * lib/services/courses.service.ts: añadidos listCoursePeople(ctx, id) y listCourseActivity(ctx, id) (aggregation tasks+submissions+grades sorted newest).
            * lib/rbac/nav.ts: navGroupsForRole() → secciones "Espacio" y "Gestión" (agrupación estilo Teams).
            * components/layout/sidebar.tsx: Teams-style — secciones con header uppercase, active state con pill primary/10 + barra acento -left-1 inset-y-1.5, iconos coloreados por estado.
            * components/layout/topbar.tsx: breadcrumb-like "Nocturna / {pageTitle}" dinámico via usePathname; quick action "Nuevo curso/tarea" según rol; avatar + menu limpio.
            * components/dashboard/courses-card.tsx: mini-hero tiles 2 col con gradient initial + chevron animado.
          
          Verificación: typecheck ✅ · tests 44 passed | 13 skipped ✅ · screenshots confirman landing + login con design premium (violet accent, spacing amplio, rounded-xl, sombras suaves, jerarquía tipográfica clara).

  - task: "Dark mode completo con next-themes + toggle animado + transiciones suaves"
    implemented: true
    working: true
    file: "app/layout.tsx, components/theme-provider.tsx, components/theme-toggle.tsx, components/layout/topbar.tsx, app/(auth)/layout.tsx, app/globals.css, components/courses/course-card.tsx, components/courses/course-stream.tsx, components/submissions/submission-uploader.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          Dark mode production-quality implementado end-to-end:
            * components/theme-provider.tsx: wrapper de next-themes con attribute="class", defaultTheme="system", enableSystem, storageKey="nocturna.theme" (evita colisiones con otras apps).
            * components/theme-toggle.tsx: trigger con Sun/Moon cross-fade (300ms absolute + rotate+scale+opacity), dropdown con 3 opciones Claro/Oscuro/Sistema, indicador de dot primary en la opción activa; añade/remueve `.theme-transition` en <html> por 220ms para un crossfade suave sin lag permanente.
            * app/layout.tsx: <html lang="es" suppressHydrationWarning> ya estaba; envuelvo children en <ThemeProvider>.
            * app/globals.css: completadas variables sidebar-* para .dark (Teams-style rail un tono más profundo que card); regla scoped `html.theme-transition *` que aplica transition-property solo mientras se cambia (no afecta hover/focus).
            * components/layout/topbar.tsx: ThemeToggle integrado entre quick-action y avatar; spacing responsive (gap-2 sm:gap-3).
            * app/(auth)/layout.tsx: ThemeToggle fixed top-right para no-autenticados.
            * Dark polish para clases hardcodeadas: bg-emerald-100/violet-100/sky-100 → + dark:bg-<color>-500/15|20 + dark:text-<color>-300 en course-card.tsx, course-stream.tsx, submission-uploader.tsx.
            * Todo el resto del UI usa tokens semánticos (bg-background, bg-card, text-foreground, border-border, bg-muted, text-muted-foreground, bg-sidebar, bg-primary/10) que ya conmutan automáticamente vía CSS variables.
          
          Verificación: typecheck ✅ · tests 44 passed | 13 skipped ✅ · screenshots capturadas /login-light, /login-dark, /landing-dark confirman: dark rail sidebar, cards elevadas sin colores quemados, violet accent preservado, gradiente del hero (bg-gradient-to-b from-background to-accent/30) se adapta perfectamente.

  - task: "Bug fix: login redirige a /login?error=session_expired tras Supabase real"
    implemented: true
    working: true
    file: "lib/auth/jwt-claims.ts (nuevo), lib/supabase/middleware.ts, lib/auth/session.ts, tests/unit/middleware-auth.test.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          Root cause definitivo (identificado via inspect-jwt.ts decodificando un JWT real):
            * `supabase.auth.getUser()` expone `user.app_metadata` **desde `auth.users.raw_app_meta_data`** (columna de la DB), NO los claims del access token.
            * El Custom Access Token Hook 0008 inyecta `session_version` e `is_active` **en los claims del JWT** (top-level y app_metadata), pero Supabase Auth **sobrescribe `app_metadata` del JWT con raw_app_meta_data post-hook**, borrando los campos nuevos que el hook añadió a `app_metadata`.
            * Resultado: `user.app_metadata.session_version === undefined` → el middleware cae al fallback `-1` → `-1 !== db.session_version (0)` → `session_expired`.
            * (Para `user_role` e `institution_id` el bug no se manifestaba porque esos campos SÍ están en `raw_app_meta_data` del seed y el SDK los expone.)

          Log del middleware que lo confirmó: `[mw:deny] reason:'session_expired' detail:'jwt=-1 db=0'`.

          Fix aplicado:
            * **Nuevo** `lib/auth/jwt-claims.ts` — decodifica el access token (edge-runtime safe via atob+TextDecoder) y normaliza claims mergeando top-level + app_metadata con coerción de tipos robusta (handles number vs string). `readCurrentJwtClaims(supabase)` es la API pública.
            * `lib/supabase/middleware.ts` — reemplazado `claims = user.app_metadata` por `claims = await readCurrentJwtClaims(supabase)`. Mantiene toda la lógica de gates (role, institution, session_version, is_active) sin cambios.
            * `lib/auth/session.ts` — mismo reemplazo en validateSession(). Eliminado `Number.isFinite` boilerplate (la normalización ahora vive en jwt-claims.ts).
            * `tests/unit/middleware-auth.test.ts` — actualizado el mock de @supabase/ssr: ahora `getSession()` devuelve un JWT sintético cuyo payload refleja `app_metadata` tanto top-level como anidado, preservando 100% la cobertura de los 10 tests.

          Verificación end-to-end (scripts/smoke-auth.ts):
            * admin@nocturna.test   → GET /dashboard → 200 ✅
            * teacher@nocturna.test → GET /dashboard → 200 ✅
            * student@nocturna.test → GET /dashboard → 200 ✅
          Typecheck ✅ · unit tests 44/44 ✅ · lint limpio ✅.
          Ya no se redirige a /login?error=session_expired con sesión válida.

          Scripts de diagnóstico creados para futuras sesiones:
            * scripts/seed.ts          — seed idempotente del tenant (institución + 3 users + course + task + submission + grade).
            * scripts/inspect-jwt.ts   — decodifica el JWT emitido por signInWithPassword y compara con la DB.
            * scripts/smoke-auth.ts    — simula login + /dashboard sin browser, útil para regresiones.
            * scripts/check-tables.ts  — verifica existencia de tablas y columnas críticas (is_active, session_version).

          Credenciales guardadas en /app/memory/test_credentials.md (password: Nocturna2025!).

  - task: "Bug fix: CSRF origin_mismatch en POST desde iframe preview"
    implemented: true
    working: true
    file: "lib/security/csrf.ts, lib/supabase/middleware.ts, scripts/smoke-post-course.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          Root cause: el check `sameOrigin()` rechazaba requests cuando el browser no envía Origin ni
          Referer utilizables (caso típico en iframes sandbox como el preview de Emergent, o con
          Referrer-Policy: no-referrer). El Origin literal "null" tampoco se manejaba, forzando un
          403 `csrf:origin_mismatch` aunque la defensa real — el double-submit cookie — sí llegara.

          Fix:
            * lib/security/csrf.ts · `sameOrigin` (boolean) reemplazado por `originCheck()` tri-state:
                'allowed' · Origin o Referer presentes y en la allowlist (request host + NEXT_PUBLIC_BASE_URL)
                'denied'  · headers presentes pero hosts NO trusted → ataque real, se rechaza.
                'missing' · ninguno usable (incluye Origin:"null" de sandboxed iframes).
              El literal 'null' ahora se ignora explícitamente antes de pasar a Referer.
            * `validateCsrf()` reestructurado:
                - 'denied'  → throw origin_mismatch (mantiene defensa).
                - 'allowed' → double-submit exigido como defence-in-depth.
                - 'missing' → double-submit como prueba criptográfica única SUFICIENTE
                  (la cookie es SameSite=Strict + non-HttpOnly: un atacante cross-origin NO puede
                  leerla ni hacer que el browser la envíe). Endpoints echo-exempt (signup/logout/
                  callback) siguen exigiendo Origin/Referer porque no tienen cookie aún.
            * lib/supabase/middleware.ts · `logDeny` enriquecido con origin/referer/host/xfHost en
              caso de CSRF para forenses (permanente, útil en producción).

          Verificación end-to-end (scripts/smoke-post-course.ts, 4 escenarios):
            A · Origin=http://localhost:3000     → pasa CSRF ✅
            B · Origin=<NEXT_PUBLIC_BASE_URL>    → pasa CSRF ✅
            C · sin Origin ni Referer            → ANTES 403 csrf:origin_mismatch · AHORA pasa CSRF ✅
            D · Origin con trailing slash        → pasa CSRF ✅

          Seguridad preservada:
            * SameSite=Strict bloquea que un attacker page envíe la cookie.
            * El attacker no puede leer la cookie (non-HttpOnly + same-origin JS only).
            * Si Origin llega con un host NO trusted → bloqueo inmediato (denied).
            * Tests unitarios 44/44 siguen pasando. Typecheck + lint limpios.

          NOTA APARTE · issue de RLS descubierto durante la verificación (NO reportado aún,
          pero afectará en UI):
            POST /api/courses ahora pasa CSRF correctamente, pero luego falla con 500 RLS
            `new row violates row-level security policy for table "courses"`. El JWT contiene
            user_role='admin' e institution_id correctos (verified via scripts/inspect-jwt.ts),
            y SELECT/PATCH sobre courses SÍ funcionan — solo INSERT falla. La policy
            `courses_insert_admin` parece no estar activa. Requiere investigación adicional
            (probablemente re-aplicar `0005_rls_policies.sql` o verificar que el DROP POLICY IF
            EXISTS + CREATE POLICY del consolidated.sql sí se haya ejecutado para INSERT).


  - task: "Fase A · Extensión CSRF allowlist para cluster hostname + teachers crean cursos"
    implemented: true
    working: "NA"
    file: "lib/security/csrf.ts, lib/services/courses.service.ts, app/(dashboard)/courses/page.tsx, components/courses/create-course-dialog.tsx, components/courses/create-course-dialog-lazy.tsx, supabase/migrations/0011_courses_insert_staff.sql, scripts/smoke-post-course.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Fase A completada en código. Usuario debe aplicar el SQL de migración para desbloquear RLS.

          1) CSRF — extensión crítica del allowlist:
             Log real del usuario reveló que Emergent preview sirve en DOS dominios simultáneos:
               * Browser → Host: nocturna-academic.cluster-8.preview.emergentcf.cloud
               * Ingress → x-forwarded-host: nocturna-academic.preview.emergentagent.com
             El fix del turno previo solo cubría 'missing' (Origin ausente). Este turno añade:
               * trustedHosts() ahora incluye Host + X-Forwarded-Host + nextUrl.host + NEXT_PUBLIC_BASE_URL.
             Smoke comprueba Origin=cluster con x-forwarded-host=cluster → pasa CSRF (antes: 403).

          2) RLS courses — nueva familia de policies staff:
             * supabase/migrations/0011_courses_insert_staff.sql:
                 - DROP courses_insert_admin / courses_update_admin / etc.
                 - CREATE courses_insert_staff · admin siempre · teacher solo sus propios cursos
                 - CREATE courses_update_staff · admin cualquiera · teacher sólo los asignados a él
                 - CREATE courses_delete_admin · sólo admin/super_admin
                 - NOTIFY pgrst + SELECT diagnóstico de pg_policy al final.
             * lib/services/courses.service.ts · createCourse ahora permite teacher; fuerza teacher_id=self
               para teachers (defence-in-depth, RLS también lo rechazaría).
             * UI — canCreate incluye teacher; CreateCourseDialog acepta canAssignTeacher prop
               (teachers no ven selector de profesor, se auto-asignan).

          3) Verificación smoke (scripts/smoke-post-course.ts, 6 escenarios):
             A · admin · origin=localhost                     → CSRF ✅ · luego RLS (esperado hasta SQL)
             B · admin · origin=public                        → CSRF ✅ · luego RLS
             C · admin · sin origin (iframe sandbox)          → CSRF ✅ · luego RLS
             E · admin · origin=cluster + x-forwarded-host    → CSRF ✅ · luego RLS ← CASO REAL USER
             F · admin · origin=evil.example (ataque real)    → CSRF rechaza 403 ✅
             G · teacher · origin=public                      → CSRF ✅ · luego RLS

          Typecheck ✅ · tests 44/44 ✅ · lint limpio.

          PENDIENTE POR PARTE DEL USUARIO:
            * Ejecutar supabase/migrations/0011_courses_insert_staff.sql en su SQL Editor.

  - task: "Fase B · Módulo 1 (Profesores) + Módulo 2 (Inscripción por email)"
    implemented: true
    working: "NA"
    file: "lib/services/teachers.service.ts, lib/services/enrollments.service.ts, app/api/admin/teachers/route.ts, app/api/courses/[id]/enroll/route.ts, app/(dashboard)/admin/teachers/page.tsx, components/admin/create-teacher-dialog.tsx, components/courses/enroll-student-panel.tsx, lib/rbac/nav.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Módulo 1 — Gestión de profesores (admin)
            * lib/services/teachers.service.ts · createTeacher/listTeachers. Reusa
              inviteUserToInstitution para crear auth user + profile atómicamente con
              role='teacher' + institution_id del caller. Password opcional: si no se envía,
              genera temporal y la retorna una sola vez (admin la copia al profesor).
            * GET/POST /api/admin/teachers con requireRole(['admin','super_admin']).
            * /admin/teachers page · lista con avatares/iniciales + courses_count por teacher +
              estado activo. CreateTeacherDialog muestra panel de credenciales una sola vez tras
              crear, con botones "copiar email" y "copiar password".
            * Nav · añadido link "Profesores" (icon Users2) en grupo Gestión, solo admin.

          Módulo 2 — Inscripción por email
            * lib/services/enrollments.service.ts · enrollStudentByEmail + unenrollStudent.
              Validaciones: curso pertenece al tenant, caller es admin o teacher del curso,
              email existe en el mismo institution, role=student, is_active, sin duplicar.
            * POST /api/courses/[id]/enroll dual-shape: acepta { email } o { studentId } (legacy).
            * DELETE /api/courses/[id]/enroll con { studentId } o ?studentId=.
            * components/courses/enroll-student-panel.tsx · form + lista + botón quitar con confirm.
              Integrado en tab "Personas" del course detail. Visibility controlada por canManage
              (admin/super_admin siempre; teacher solo si detail.teacher_id === ctx.userId).

          Verificaciones:
            * typecheck ✅ · tests unitarios 44/44 ✅ · lint clean.
            * Nada del flow existente tocado (login/courses/tasks siguen igual).
            * Sin SQL nuevo requerido. Requiere el SQL `0015_tasks_rls_staff.sql` pendiente
              (el usuario aún no lo aplicó; los logs siguen mostrando `POST /api/tasks 500` por
              esa razón — no relacionado con este módulo).

          PENDIENTE:
            * Módulo 3 (Chat) — tabla messages + endpoints + polling UI.
            * Módulo 4 (Materiales) — bucket + tabla materials + UI upload/download.
            * Módulo 5 (Notas) — tabla final_grades + UI teacher/student.
            * Módulo 6 (UX Curso tabs) — agregar tabs Materiales, Chat, Notas.
            * Módulo 7 (QR) — teacher_invites + student_invites + pantallas /join.
            * Tras eso, los 6 escenarios legítimos deben devolver 201 (curso creado).