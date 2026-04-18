import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const tables = [
  'institutions', 'profiles', 'courses', 'enrollments',
  'tasks', 'submissions', 'grades', 'audit_log', 'file_objects',
];

(async () => {
  for (const t of tables) {
    const r = await admin.from(t).select('*').limit(1);
    if (r.error) {
      console.log(`✗ ${t.padEnd(14)} · ${r.error.code} · ${r.error.message}`);
    } else {
      console.log(`✓ ${t.padEnd(14)} · rows retrieved=${r.data?.length ?? 0}`);
    }
  }
})();
