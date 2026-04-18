/**
 * Inspect the JWT that Supabase actually issues after signInWithPassword.
 * This tells us exactly which claims the Custom Access Token Hook is injecting.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function decodeJwt(token: string) {
  const [, payload] = token.split('.');
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
}

async function main() {
  const email = 'admin@nocturna.test';
  const password = 'Nocturna2025!';

  console.log(`\n→ signInWithPassword(${email})`);
  const anon = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    console.error('✗ login failed:', error?.message);
    process.exit(1);
  }

  const jwt = decodeJwt(data.session.access_token);
  console.log('\n=== RAW access token claims ===');
  console.log(JSON.stringify(jwt, null, 2));

  console.log('\n=== Critical claim values & types ===');
  for (const k of ['user_role', 'institution_id', 'session_version', 'is_active']) {
    const topLevel = (jwt as Record<string, unknown>)[k];
    const appMeta = (jwt.app_metadata as Record<string, unknown> | undefined)?.[k];
    console.log(`  top-level ${k.padEnd(16)} = ${JSON.stringify(topLevel)} (${typeof topLevel})`);
    console.log(`  app_meta  ${k.padEnd(16)} = ${JSON.stringify(appMeta)} (${typeof appMeta})`);
  }

  // Compare with DB
  const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
  const { data: prof } = await admin
    .from('profiles')
    .select('id, email, role, institution_id, is_active, session_version')
    .eq('email', email)
    .maybeSingle();
  console.log('\n=== DB profile row ===');
  console.log(JSON.stringify(prof, null, 2));

  console.log('\n=== Verdict ===');
  const mAppSv = (jwt.app_metadata as Record<string, unknown> | undefined)?.session_version;
  const dbSv = (prof as Record<string, unknown> | null)?.session_version;
  console.log(`  JWT session_version = ${JSON.stringify(mAppSv)}  ·  DB = ${JSON.stringify(dbSv)}`);
  if (mAppSv === undefined) {
    console.log('  ❌ HOOK NOT INJECTING session_version → cause of "session_expired"');
  } else if (Number(mAppSv) !== Number(dbSv)) {
    console.log('  ⚠️ mismatch between JWT and DB');
  } else {
    console.log('  ✓ values match — problem must be elsewhere');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
