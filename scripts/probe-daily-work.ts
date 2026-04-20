import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

(async () => {
  // Prueba REAL de INSERT para ver el error exacto.
  console.log('─── Probe INSERT en daily_work ───');
  const { data: course } = await admin
    .from('courses')
    .select('id, institution_id')
    .limit(1)
    .maybeSingle();
  const { data: admUser } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle();

  if (!course || !admUser) {
    console.log('✗ Faltan seed rows (course/admin). Abortando prueba.');
    return;
  }

  const r1 = await admin
    .from('daily_work')
    .insert({
      institution_id: course.institution_id,
      course_id: course.id,
      title: `probe_${Date.now()}`,
      description: 'schema-cache probe',
      created_by: admUser.id,
    })
    .select('id')
    .single();

  console.log('Insert status:');
  console.log('  error.code   :', r1.error?.code);
  console.log('  error.message:', r1.error?.message);
  console.log('  error.hint   :', r1.error?.hint);
  console.log('  error.details:', r1.error?.details);

  // Si el error es schema-cache, intentamos forzar el reload via RPC si hay alguna disponible.
  if (r1.error?.code === 'PGRST205' || /schema cache/i.test(r1.error?.message ?? '')) {
    console.log('\n⚠️  Diagnóstico: schema cache de PostgREST desactualizado.');
    console.log('   Solución:');
    console.log('   1) Dashboard Supabase → Settings → API → "Reload schema cache".');
    console.log("   2) O correr en SQL Editor:  NOTIFY pgrst, 'reload schema';");
  } else if (r1.data) {
    console.log('✅ INSERT OK id=', r1.data.id, '→ limpiando.');
    await admin.from('daily_work').delete().eq('id', r1.data.id);
  }

  // También probamos daily_work_submissions si el work se creó.
  if (r1.data) {
    console.log('\n─── Probe INSERT en daily_work_submissions ───');
    const { data: student } = await admin
      .from('profiles')
      .select('id')
      .eq('role', 'student')
      .limit(1)
      .maybeSingle();
    if (student) {
      // Recreamos un work para probar (el anterior ya se eliminó).
      const work = await admin
        .from('daily_work')
        .insert({
          institution_id: course.institution_id,
          course_id: course.id,
          title: `probe_sub_${Date.now()}`,
          created_by: admUser.id,
        })
        .select('id')
        .single();
      if (work.data) {
        const sub = await admin
          .from('daily_work_submissions')
          .insert({
            work_id: work.data.id,
            student_id: student.id,
            content: 'probe submission',
          })
          .select('id')
          .single();
        console.log('submission error?', sub.error?.message ?? 'OK');
        if (sub.data) {
          await admin.from('daily_work_submissions').delete().eq('id', sub.data.id);
        }
        await admin.from('daily_work').delete().eq('id', work.data.id);
      }
    }
  }
})();
