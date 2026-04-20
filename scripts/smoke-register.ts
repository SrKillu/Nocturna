/**
 * Smoke test end-to-end del registro público.
 * Valida 3 escenarios:
 *   A) Registro libre sin token → institution_id=null, profile pending.
 *   B) Registro con student_invite → se crea profile + enrollment + invite used.
 *   C) Registro con teacher_invite → se crea profile con role=teacher.
 *
 * Usa SERVICE_ROLE_KEY. Limpia los users al final.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { registerPublicUser } from '../lib/services/auth.service';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function banner(s: string) {
  console.log(`\n─── ${s} ───`);
}

async function cleanup(email: string) {
  const { data } = await admin.auth.admin.listUsers();
  const user = data?.users.find((u) => u.email === email);
  if (user) await admin.auth.admin.deleteUser(user.id).catch(() => undefined);
}

(async () => {
  const tag = Date.now();
  const emailFree = `probe-free-${tag}@nocturna.test`;
  const emailSInv = `probe-student-${tag}@nocturna.test`;
  const emailTInv = `probe-teacher-${tag}@nocturna.test`;

  try {
    // seed
    const { data: teacher } = await admin
      .from('profiles')
      .select('id, institution_id')
      .eq('role', 'teacher')
      .limit(1)
      .single();
    const { data: course } = await admin
      .from('courses')
      .select('id, institution_id')
      .eq('teacher_id', teacher!.id)
      .limit(1)
      .single();

    banner('A) Registro libre (sin token)');
    const a = await registerPublicUser({
      fullName: 'Alumno Sin Tenant',
      email: emailFree,
      password: 'Test1234!',
      role: 'student',
    });
    console.log('result:', a);
    console.log('expect institutionId=null:', a.institutionId === null ? '✅' : '❌');
    console.log('expect role=student:', a.role === 'student' ? '✅' : '❌');
    console.log('expect tokenConsumed=false:', a.tokenConsumed === false ? '✅' : '❌');

    banner('B) Registro con student_invite');
    const inv = await admin
      .from('student_invites')
      .insert({
        institution_id: course!.institution_id,
        course_id: course!.id,
        created_by: teacher!.id,
        expires_at: new Date(Date.now() + 86_400_000).toISOString(),
      })
      .select('id, token')
      .single();
    const b = await registerPublicUser({
      fullName: 'Alumno Con Invite',
      email: emailSInv,
      password: 'Test1234!',
      role: 'student',
      token: inv.data!.token,
    });
    console.log('result:', b);
    console.log(
      'expect institutionId set:',
      b.institutionId === course!.institution_id ? '✅' : '❌'
    );
    console.log(
      'expect enrolledCourseId === course:',
      b.enrolledCourseId === course!.id ? '✅' : '❌'
    );
    console.log('expect tokenConsumed=true:', b.tokenConsumed === true ? '✅' : '❌');
    const enr = await admin
      .from('enrollments')
      .select('id')
      .eq('student_id', b.userId)
      .eq('course_id', course!.id)
      .maybeSingle();
    console.log('DB enrollment exists:', enr.data ? '✅' : '❌');

    banner('C) Registro con teacher_invite');
    const manualToken = (globalThis.crypto ?? require('node:crypto')).randomUUID();
    const tInvRes = await admin
      .from('teacher_invites')
      .insert({
        institution_id: course!.institution_id,
        created_by: teacher!.id,
        expires_at: new Date(Date.now() + 86_400_000).toISOString(),
        token: manualToken,
      })
      .select('id, token')
      .single();
    if (tInvRes.error || !tInvRes.data) {
      console.log('⚠️  no se pudo crear teacher_invite:', tInvRes.error?.message);
      return;
    }
    const c = await registerPublicUser({
      fullName: 'Prof Con Invite',
      email: emailTInv,
      password: 'Test1234!',
      role: 'student', // debería ser ignorado y sobreescrito
      token: tInvRes.data.token,
    });
    console.log('result:', c);
    console.log('expect role=teacher (desde invite):', c.role === 'teacher' ? '✅' : '❌');
    console.log(
      'expect institutionId set:',
      c.institutionId === course!.institution_id ? '✅' : '❌'
    );
    console.log('expect enrolledCourseId=null:', c.enrolledCourseId === null ? '✅' : '❌');

    banner('Verificación: invites marcados como usados');
    const sUsed = await admin
      .from('student_invites')
      .select('used, used_at, used_by')
      .eq('id', inv.data!.id)
      .single();
    console.log('student invite:', sUsed.data);
    const tUsed = await admin
      .from('teacher_invites')
      .select('used, used_at, used_by')
      .eq('id', tInvRes.data.id)
      .single();
    console.log('teacher invite:', tUsed.data);
  } finally {
    banner('Cleanup');
    await Promise.all([cleanup(emailFree), cleanup(emailSInv), cleanup(emailTInv)]);
    console.log('✓ usuarios de prueba eliminados');
  }
})();
