/**
 * Nocturna · Seed script
 * ------------------------------------------------------------------
 * Idempotent seed for the real Supabase instance. Uses SERVICE_ROLE
 * so RLS is bypassed. It provisions:
 *   1 institution      : "Nocturna Academy"
 *   3 auth users       : admin / teacher / student  (fixed emails + password)
 *   3 profiles         : created automatically by the on_auth_user_created trigger
 *                        (reads raw_app_meta_data.institution_id + user_role + full_name)
 *   1 course           : owned by teacher, created_by admin
 *   1 enrollment       : student → course
 *   1 task             : course, created_by teacher, due in +7d, max_score 100
 *   1 submission       : student, content-only (no file upload here)
 *   1 grade            : teacher, 85/100 + feedback
 *
 * Idempotency
 *   - institution   : by slug 'nocturna-academy'
 *   - users         : by email (listUsers → find)
 *   - course        : by (institution_id, name)
 *   - enrollment    : unique (course_id, student_id)
 *   - task          : by (course_id, title)
 *   - submission    : unique (task_id, student_id)
 *   - grade         : unique (submission_id)
 *
 * Usage:
 *   yarn tsx scripts/seed.ts
 *
 * Requires in /app/.env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 * ------------------------------------------------------------------
 */

import 'dotenv/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// ---------------------------------------------------------------
// Config
// ---------------------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    '❌ Faltan variables de entorno. Necesito NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.'
  );
  process.exit(1);
}

const INSTITUTION_NAME = 'Nocturna Academy';
const INSTITUTION_SLUG = 'nocturna-academy';

const PASSWORD = 'Nocturna2025!';

type SeedUser = {
  email: string;
  role: 'admin' | 'teacher' | 'student';
  fullName: string;
};

const SEED_USERS: SeedUser[] = [
  { email: 'admin@nocturna.test',   role: 'admin',   fullName: 'Ada Admin' },
  { email: 'teacher@nocturna.test', role: 'teacher', fullName: 'Tomás Teacher' },
  { email: 'student@nocturna.test', role: 'student', fullName: 'Sara Student' },
];

const COURSE_NAME = 'Introducción a Nocturna';
const TASK_TITLE  = 'Entrega inicial · Bienvenida';

// ---------------------------------------------------------------
// Admin client
// ---------------------------------------------------------------
const admin: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
function step(label: string) {
  console.log(`\n→ ${label}`);
}

function ok(label: string) {
  console.log(`  ✓ ${label}`);
}

function info(label: string) {
  console.log(`  • ${label}`);
}

async function findUserByEmail(email: string) {
  // listUsers pagina; 3 usuarios caben de sobra en la primera página
  let page = 1;
  const perPage = 200;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function upsertInstitution(): Promise<string> {
  step(`Institución "${INSTITUTION_NAME}" (slug=${INSTITUTION_SLUG})`);

  const { data: existing, error: selErr } = await admin
    .from('institutions')
    .select('id, name')
    .eq('slug', INSTITUTION_SLUG)
    .maybeSingle();
  if (selErr) throw new Error(`select institutions: ${selErr.message}`);

  if (existing) {
    ok(`ya existe (${existing.id})`);
    return existing.id;
  }

  const { data: inserted, error: insErr } = await admin
    .from('institutions')
    .insert({ name: INSTITUTION_NAME, slug: INSTITUTION_SLUG })
    .select('id')
    .single();
  if (insErr) throw new Error(`insert institutions: ${insErr.message}`);

  ok(`creada (${inserted.id})`);
  return inserted.id;
}

async function upsertAuthUser(
  u: SeedUser,
  institutionId: string
): Promise<string> {
  step(`Usuario ${u.role} <${u.email}>`);

  const existing = await findUserByEmail(u.email);

  const appMetadata = {
    institution_id: institutionId,
    user_role: u.role,
    full_name: u.fullName,
  };

  if (existing) {
    // actualizamos app_metadata por si el tenant cambió
    const { error: upErr } = await admin.auth.admin.updateUserById(existing.id, {
      app_metadata: appMetadata,
      password: PASSWORD, // reset fijo para facilitar pruebas
      email_confirm: true,
    });
    if (upErr) throw new Error(`updateUserById: ${upErr.message}`);
    ok(`ya existía, metadata+password sincronizados (${existing.id})`);

    // Asegurar profile alineado (el trigger solo corre al crear)
    const { error: profErr } = await admin
      .from('profiles')
      .upsert(
        {
          id: existing.id,
          email: u.email,
          full_name: u.fullName,
          role: u.role,
          institution_id: institutionId,
        },
        { onConflict: 'id' }
      );
    if (profErr) throw new Error(`upsert profile (existing): ${profErr.message}`);

    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: PASSWORD,
    email_confirm: true,
    app_metadata: appMetadata,
    user_metadata: { full_name: u.fullName }, // decorativo, el trigger lee app_metadata
  });
  if (error || !data.user) {
    throw new Error(`createUser(${u.email}): ${error?.message ?? 'unknown'}`);
  }

  // El trigger on_auth_user_created ya creó el profile. Verificamos y reforzamos.
  const { error: profErr } = await admin
    .from('profiles')
    .upsert(
      {
        id: data.user.id,
        email: u.email,
        full_name: u.fullName,
        role: u.role,
        institution_id: institutionId,
      },
      { onConflict: 'id' }
    );
  if (profErr) throw new Error(`upsert profile (new): ${profErr.message}`);

  ok(`creado + profile ok (${data.user.id})`);
  return data.user.id;
}

async function upsertCourse(
  institutionId: string,
  teacherId: string,
  adminId: string
): Promise<string> {
  step(`Curso "${COURSE_NAME}"`);

  const { data: existing, error: selErr } = await admin
    .from('courses')
    .select('id')
    .eq('institution_id', institutionId)
    .eq('name', COURSE_NAME)
    .maybeSingle();
  if (selErr) throw new Error(`select courses: ${selErr.message}`);

  if (existing) {
    // reforzamos teacher_id por si cambió
    await admin
      .from('courses')
      .update({ teacher_id: teacherId })
      .eq('id', existing.id);
    ok(`ya existe (${existing.id})`);
    return existing.id;
  }

  const { data, error } = await admin
    .from('courses')
    .insert({
      institution_id: institutionId,
      name: COURSE_NAME,
      description:
        'Curso de bienvenida con materiales introductorios, entregas y calificaciones.',
      teacher_id: teacherId,
      created_by: adminId,
    })
    .select('id')
    .single();
  if (error) throw new Error(`insert course: ${error.message}`);

  ok(`creado (${data.id})`);
  return data.id;
}

async function upsertEnrollment(
  institutionId: string,
  courseId: string,
  studentId: string
) {
  step('Matriculación student → course');

  const { data: existing } = await admin
    .from('enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (existing) {
    ok(`ya matriculado (${existing.id})`);
    return existing.id;
  }

  const { data, error } = await admin
    .from('enrollments')
    .insert({
      institution_id: institutionId,
      course_id: courseId,
      student_id: studentId,
    })
    .select('id')
    .single();
  if (error) throw new Error(`insert enrollment: ${error.message}`);
  ok(`creada (${data.id})`);
  return data.id;
}

async function upsertTask(
  institutionId: string,
  courseId: string,
  teacherId: string
): Promise<string> {
  step(`Tarea "${TASK_TITLE}"`);

  const { data: existing, error: selErr } = await admin
    .from('tasks')
    .select('id')
    .eq('course_id', courseId)
    .eq('title', TASK_TITLE)
    .maybeSingle();
  if (selErr) throw new Error(`select tasks: ${selErr.message}`);

  if (existing) {
    ok(`ya existe (${existing.id})`);
    return existing.id;
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const { data, error } = await admin
    .from('tasks')
    .insert({
      institution_id: institutionId,
      course_id: courseId,
      title: TASK_TITLE,
      description:
        'Preséntate en un párrafo: nombre, qué estudias y una cosa interesante sobre ti.',
      due_date: dueDate.toISOString(),
      max_score: 100,
      created_by: teacherId,
    })
    .select('id')
    .single();
  if (error) throw new Error(`insert task: ${error.message}`);
  ok(`creada (${data.id})`);
  return data.id;
}

async function upsertSubmission(
  institutionId: string,
  taskId: string,
  studentId: string
): Promise<string> {
  step('Entrega del estudiante');

  const { data: existing, error: selErr } = await admin
    .from('submissions')
    .select('id')
    .eq('task_id', taskId)
    .eq('student_id', studentId)
    .maybeSingle();
  if (selErr) throw new Error(`select submissions: ${selErr.message}`);

  if (existing) {
    ok(`ya existe (${existing.id})`);
    return existing.id;
  }

  const { data, error } = await admin
    .from('submissions')
    .insert({
      institution_id: institutionId,
      task_id: taskId,
      student_id: studentId,
      content:
        'Hola, soy Sara. Estudio ingeniería de software y me encantan los sintetizadores modulares.',
      status: 'submitted',
    })
    .select('id')
    .single();
  if (error) throw new Error(`insert submission: ${error.message}`);
  ok(`creada (${data.id})`);
  return data.id;
}

async function upsertGrade(
  institutionId: string,
  submissionId: string,
  teacherId: string
): Promise<string> {
  step('Calificación');

  const { data: existing, error: selErr } = await admin
    .from('grades')
    .select('id')
    .eq('submission_id', submissionId)
    .maybeSingle();
  if (selErr) throw new Error(`select grades: ${selErr.message}`);

  if (existing) {
    ok(`ya existe (${existing.id})`);
    return existing.id;
  }

  const { data, error } = await admin
    .from('grades')
    .insert({
      institution_id: institutionId,
      submission_id: submissionId,
      teacher_id: teacherId,
      score: 85,
      feedback: '¡Bienvenida! Muy buena presentación. Sigue así.',
    })
    .select('id')
    .single();
  if (error) throw new Error(`insert grade: ${error.message}`);

  // flip status a 'graded' para coherencia con el flow normal (RPC grade_submission)
  await admin
    .from('submissions')
    .update({ status: 'graded' })
    .eq('id', submissionId);

  ok(`creada (${data.id}) · submission.status → graded`);
  return data.id;
}

function writeCredentials(params: {
  institutionId: string;
  ids: Record<'admin' | 'teacher' | 'student', string>;
}) {
  step('Guardando credenciales en /app/memory/test_credentials.md');

  const path = '/app/memory/test_credentials.md';
  const now = new Date().toISOString();

  const content = `# Test Credentials — Nocturna
# Generated by scripts/seed.ts at ${now}
# Shared password for all seed users.

## Supabase Instance
- URL: ${SUPABASE_URL}
- Institution: ${INSTITUTION_NAME}
- Institution slug: ${INSTITUTION_SLUG}
- Institution ID: ${params.institutionId}

## Shared password
\`${PASSWORD}\`

## Seed users

| Role     | Email                     | Password         | User ID                               |
|----------|---------------------------|------------------|---------------------------------------|
| admin    | admin@nocturna.test       | ${PASSWORD} | ${params.ids.admin}   |
| teacher  | teacher@nocturna.test     | ${PASSWORD} | ${params.ids.teacher} |
| student  | student@nocturna.test     | ${PASSWORD} | ${params.ids.student} |

## Seed data summary
- 1 course:   "${COURSE_NAME}" (teacher = teacher@nocturna.test, created_by = admin)
- 1 enrollment: student → course
- 1 task:     "${TASK_TITLE}" (due in +7 days, max_score=100)
- 1 submission: student · content-only
- 1 grade:    85/100 · submission.status='graded'

## ⚠️ Reminder
The **Custom Access Token Hook** MUST be enabled in the Supabase Dashboard:
  Authentication → Hooks → Custom Access Token Hook → select \`public.custom_access_token_hook\`
Without it, JWTs will lack \`user_role\` and \`institution_id\` in \`app_metadata\`, and the Next.js
middleware + RLS will reject every authenticated request.

## Re-run
\`\`\`
yarn tsx scripts/seed.ts
\`\`\`
Idempotent: re-running is safe (no duplicates; passwords and app_metadata get resynced).
`;

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf8');
  ok(`escrito (${content.length} bytes)`);
}

// ---------------------------------------------------------------
// Main
// ---------------------------------------------------------------
async function main() {
  console.log('════════════════════════════════════════');
  console.log('  Nocturna · seed                       ');
  console.log('════════════════════════════════════════');
  info(`Supabase: ${SUPABASE_URL}`);

  const institutionId = await upsertInstitution();

  const ids: Record<'admin' | 'teacher' | 'student', string> = {
    admin: '',
    teacher: '',
    student: '',
  };
  for (const u of SEED_USERS) {
    ids[u.role] = await upsertAuthUser(u, institutionId);
  }

  const courseId     = await upsertCourse(institutionId, ids.teacher, ids.admin);
  await upsertEnrollment(institutionId, courseId, ids.student);
  const taskId       = await upsertTask(institutionId, courseId, ids.teacher);
  const submissionId = await upsertSubmission(institutionId, taskId, ids.student);
  await upsertGrade(institutionId, submissionId, ids.teacher);

  writeCredentials({ institutionId, ids });

  console.log('\n════════════════════════════════════════');
  console.log('  ✓ Seed completed                      ');
  console.log('════════════════════════════════════════');
  console.log('\nNext step:');
  console.log('  1. Activa el Custom Access Token Hook en el Dashboard de Supabase.');
  console.log('  2. Prueba login con:');
  console.log('       admin@nocturna.test   / Nocturna2025!');
  console.log('       teacher@nocturna.test / Nocturna2025!');
  console.log('       student@nocturna.test / Nocturna2025!');
  console.log('  3. Corre los E2E: yarn test:e2e');
}

main().catch((e) => {
  console.error('\n❌ Seed failed:\n', e);
  process.exit(1);
});
