/**
 * Simula el flujo completo de invitación QR de estudiante:
 *   1. Teacher crea un student_invite.
 *   2. Student "acepta" la invitación (llama consumeInvite).
 *   3. Verifica:
 *      - enrollment creado
 *      - student_invite.used = true con used_at/used_by
 *      - No se duplica si se corre otra vez.
 *
 * Usa SERVICE_ROLE_KEY para bypass de RLS en la simulación.
 * NO llama al endpoint HTTP — invoca el service directamente para ejecutar la
 * misma ruta de código que corre en producción.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { consumeInvite } from '../lib/services/invites.service';
import type { AuthenticatedContext } from '../lib/types/auth';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function banner(s: string) {
  console.log(`\n─── ${s} ───`);
}

(async () => {
  banner('1. Leer seed (teacher, student, curso)');
  const { data: teacher } = await admin
    .from('profiles')
    .select('id, institution_id')
    .eq('role', 'teacher')
    .limit(1)
    .maybeSingle();
  const { data: student } = await admin
    .from('profiles')
    .select('id, institution_id, role')
    .eq('role', 'student')
    .limit(1)
    .maybeSingle();
  const { data: course } = await admin
    .from('courses')
    .select('id, institution_id, teacher_id, name')
    .eq('teacher_id', teacher?.id ?? '')
    .limit(1)
    .maybeSingle();

  if (!teacher || !student || !course) {
    console.log('✗ Faltan seed rows (teacher/student/course).');
    return;
  }
  console.log('teacher.id    :', teacher.id);
  console.log('student.id    :', student.id);
  console.log('course.id     :', course.id, course.name);
  console.log('institutionId :', course.institution_id);

  banner('2. Limpiar enrollment previo (si existe) + crear invite fresco');
  await admin
    .from('enrollments')
    .delete()
    .eq('course_id', course.id)
    .eq('student_id', student.id);

  const { data: invite, error: invErr } = await admin
    .from('student_invites')
    .insert({
      institution_id: course.institution_id,
      course_id: course.id,
      created_by: teacher.id,
      expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    })
    .select('id, token')
    .single();
  if (invErr || !invite) {
    console.log('✗ No se pudo crear invite:', invErr?.message);
    return;
  }
  console.log('invite.token  :', invite.token);

  banner('3. Consume invite (simulando al student)');
  const studentCtx: AuthenticatedContext = {
    user: { id: student.id } as AuthenticatedContext['user'],
    userId: student.id,
    role: 'student',
    institutionId: student.institution_id,
    email: 'student@nocturna.test',
  };

  try {
    const r = await consumeInvite(studentCtx, invite.token);
    console.log('✓ consumeInvite devolvió:', r);
  } catch (err) {
    console.log('✗ consumeInvite falló:', (err as Error).message);
  }

  banner('4. Verificar enrollment en DB');
  const { data: enr } = await admin
    .from('enrollments')
    .select('id, course_id, student_id, enrolled_at')
    .eq('course_id', course.id)
    .eq('student_id', student.id)
    .maybeSingle();
  console.log(enr ? `✅ enrollment ${enr.id} en ${enr.enrolled_at}` : '❌ NO hay enrollment');

  banner('5. Verificar invite marcado como usado');
  const { data: inv2 } = await admin
    .from('student_invites')
    .select('id, used, used_at, used_by')
    .eq('id', invite.id)
    .maybeSingle();
  console.log(
    inv2
      ? `✅ invite used=${inv2.used} used_at=${inv2.used_at} used_by=${inv2.used_by}`
      : '❌ invite no encontrado'
  );

  banner('6. Re-ejecutar consume (NO debe duplicar enrollment)');
  // Creamos otro invite y probamos que el upsert no tire.
  const { data: invite2 } = await admin
    .from('student_invites')
    .insert({
      institution_id: course.institution_id,
      course_id: course.id,
      created_by: teacher.id,
      expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    })
    .select('id, token')
    .single();
  try {
    const r2 = await consumeInvite(studentCtx, invite2!.token);
    console.log('✓ segundo consume:', r2);
  } catch (err) {
    console.log('✗ segundo consume falló:', (err as Error).message);
  }
  const { data: enrCount } = await admin
    .from('enrollments')
    .select('id', { count: 'exact' })
    .eq('course_id', course.id)
    .eq('student_id', student.id);
  console.log(`enrollments para ese par (debe ser 1): ${enrCount?.length}`);

  banner('DONE');
})();
