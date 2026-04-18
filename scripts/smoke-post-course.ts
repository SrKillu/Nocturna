/**
 * Reproduce the exact POST /api/courses the browser does, so we can see the
 * enhanced [mw:deny] log with origin / xfHost / trustedHosts.
 *
 * Scenarios:
 *   A) Origin = request host (default from browser talking to same origin)
 *   B) Origin = NEXT_PUBLIC_BASE_URL (canonical preview URL)
 *   C) No Origin header at all
 */
import 'dotenv/config';

const BASE = 'http://localhost:3000';
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const PUBLIC = process.env.NEXT_PUBLIC_BASE_URL!;
const PUBLIC_HOST = new URL(PUBLIC).host;

async function getAuthJar(): Promise<Map<string, string>> {
  const jar = new Map<string, string>();
  const r0 = await fetch(`${BASE}/login`, { redirect: 'manual' });
  const headers = r0.headers as Headers & { getSetCookie?: () => string[] };
  const setCookies: string[] =
    typeof headers.getSetCookie === 'function'
      ? headers.getSetCookie()
      : r0.headers.get('set-cookie')
        ? [r0.headers.get('set-cookie')!]
        : [];
  for (const sc of setCookies) {
    const [p] = sc.split(';');
    const i = p.indexOf('=');
    if (i > 0) jar.set(p.slice(0, i).trim(), p.slice(i + 1).trim());
  }

  const r1 = await fetch(`${SUPA}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${ANON}` },
    body: JSON.stringify({ email: 'admin@nocturna.test', password: 'Nocturna2025!' }),
  });
  const body = await r1.json();
  const ref = SUPA.replace(/^https?:\/\//, '').split('.')[0];
  const name = `sb-${ref}-auth-token`;
  const val =
    'base64-' +
    Buffer.from(
      JSON.stringify({
        access_token: body.access_token,
        token_type: 'bearer',
        expires_in: body.expires_in,
        expires_at: body.expires_at,
        refresh_token: body.refresh_token,
        user: body.user,
      })
    ).toString('base64');
  jar.set(name, val);
  return jar;
}

async function tryPost(label: string, jar: Map<string, string>, originHeader: string | undefined) {
  const csrf = jar.get('nocturna-csrf');
  const cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    cookie,
  };
  if (csrf) headers['x-csrf-token'] = csrf;
  if (originHeader !== undefined) headers.origin = originHeader;

  const r = await fetch(`${BASE}/api/courses`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Smoke course ' + Date.now(), description: 'test' }),
  });
  const text = await r.text();
  console.log(`[${label}]  origin=${originHeader ?? '(none)'}  →  ${r.status} ${text.slice(0, 140)}`);
}

async function main() {
  const jar = await getAuthJar();
  console.log('jar keys:', [...jar.keys()].join(', '));
  console.log('PUBLIC_BASE_URL host =', PUBLIC_HOST);
  console.log('---');

  // Scenario A: origin = localhost (request host)
  await tryPost('A · origin=localhost', jar, 'http://localhost:3000');

  // Scenario B: origin = public preview URL (what the browser sends)
  await tryPost('B · origin=public', jar, PUBLIC);

  // Scenario C: no origin header
  await tryPost('C · no-origin', jar, undefined);

  // Scenario D: origin with trailing slash (edge case)
  await tryPost('D · origin=public/', jar, PUBLIC + '/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
