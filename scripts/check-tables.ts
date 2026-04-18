import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

(async () => {
  console.log('--- Probe: profiles columns actually present ---');
  // Si is_active/session_version NO existen, este select debería fallar.
  const r = await admin
    .from('profiles')
    .select('id, email, full_name, role, institution_id, is_active, session_version')
    .limit(1);

  if (r.error) {
    console.log('✗ select WITH is_active+session_version FAILED:');
    console.log('  code   :', r.error.code);
    console.log('  hint   :', r.error.hint);
    console.log('  message:', r.error.message);
  } else {
    console.log('✓ select WITH is_active+session_version OK · sample row:');
    console.log(JSON.stringify(r.data?.[0], null, 2));
  }

  // Backup: sin los campos nuevos
  console.log('\n--- Probe: profiles without optional columns ---');
  const r2 = await admin
    .from('profiles')
    .select('id, email, full_name, role, institution_id')
    .limit(3);
  if (r2.error) console.log('✗', r2.error.message);
  else console.log('✓ rows:', r2.data);
})();
