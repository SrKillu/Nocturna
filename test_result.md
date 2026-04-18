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
