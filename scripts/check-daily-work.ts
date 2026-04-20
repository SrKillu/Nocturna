import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function probe(table: string) {
  const r = await admin.from(table).select('*', { count: 'exact', head: true });
  if (r.error) {
    const missing = r.error.message.toLowerCase().includes('does not exist') ||
                    r.error.code === '42P01' ||
                    r.error.code === 'PGRST205';
    return { table, exists: !missing, error: r.error.message, count: null as number | null };
  }
  return { table, exists: true, error: null, count: r.count ?? 0 };
}

(async () => {
  console.log('─── Nocturna · Pre-flight DB check ─────────────────────────');
  const tables = [
    'institutions',
    'profiles',
    'courses',
    'enrollments',
    'tasks',
    'submissions',
    'grades',
    'materials',
    'messages',
    'final_grades',
    'teacher_invites',
    'student_invites',
    'daily_work',
    'daily_work_submissions',
  ];

  const results = await Promise.all(tables.map(probe));
  const pad = (s: string, n: number) => (s + ' '.repeat(n)).slice(0, n);
  for (const r of results) {
    const icon = r.exists ? '✅' : '❌';
    const count = r.exists ? `${r.count ?? '?'} rows` : 'MISSING';
    console.log(`${icon} ${pad(r.table, 26)} ${pad(count, 14)} ${r.error ?? ''}`);
  }

  const missing = results.filter((r) => !r.exists).map((r) => r.table);
  console.log('─────────────────────────────────────────────────────────────');
  if (missing.length === 0) {
    console.log('✅ Todas las tablas críticas presentes.');
  } else {
    console.log('⚠️  Tablas faltantes:', missing.join(', '));
    console.log('   Aplica la(s) migración(es) correspondiente(s) en Supabase SQL Editor.');
  }

  // Smoke test si daily_work existe
  if (results.find((r) => r.table === 'daily_work')?.exists) {
    console.log('\n─── Smoke test daily_work (insert + delete) ─────────────────');
    const { data: course } = await admin.from('courses').select('id, institution_id').limit(1).maybeSingle();
    const { data: admUser } = await admin
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle();

    if (course && admUser) {
      const probeTitle = `__probe_${Date.now()}`;
      const ins = await admin
        .from('daily_work')
        .insert({
          institution_id: course.institution_id,
          course_id: course.id,
          title: probeTitle,
          description: 'probe row',
          created_by: admUser.id,
        })
        .select('id')
        .single();
      if (ins.error) {
        console.log('❌ INSERT falló:', ins.error.message);
      } else {
        console.log('✅ INSERT OK:', ins.data.id);
        const del = await admin.from('daily_work').delete().eq('id', ins.data.id);
        console.log(del.error ? `⚠️  cleanup falló: ${del.error.message}` : '✅ cleanup OK');
      }
    } else {
      console.log('(saltado: no hay curso/admin seed con el que probar)');
    }
  }
})();
