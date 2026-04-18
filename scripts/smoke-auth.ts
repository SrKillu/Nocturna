/**
 * End-to-end auth flow smoke test (no browser required).
 *
 * 1. Hits /login once to receive csrf + Supabase cookies.
 * 2. Uses @supabase/ssr cookies emitted by signInWithPassword via direct REST call
 *    to /auth/v1/token?grant_type=password (same endpoint the browser hits).
 * 3. Re-uses the Set-Cookie cookies returned by /auth/v1/token on the Next app:
 *    calls /dashboard and asserts it returns 200 (not 307 → /login?error=...).
 *
 * This mirrors exactly what the browser does, but sidesteps the flaky screenshot tool.
 */
import 'dotenv/config';

const BASE = 'http://localhost:3000';
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const EMAIL = 'admin@nocturna.test';
const PWD = 'Nocturna2025!';

type CookieJar = Map<string, string>;

function setCookiesInto(jar: CookieJar, setCookieHeaders: string[]) {
  for (const sc of setCookieHeaders) {
    const [pair] = sc.split(';');
    const eq = pair.indexOf('=');
    if (eq < 0) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (value === '' || value.toLowerCase() === 'deleted') {
      jar.delete(name);
    } else {
      jar.set(name, value);
    }
  }
}

function cookieHeader(jar: CookieJar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

function extractSetCookies(res: Response): string[] {
  const headers = res.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie();
  }
  const raw = res.headers.get('set-cookie');
  return raw ? [raw] : [];
}

async function main() {
  const jar: CookieJar = new Map();

  console.log('\n(1) GET /login (prime csrf + anon cookies)');
  const r0 = await fetch(`${BASE}/login`, { redirect: 'manual' });
  setCookiesInto(jar, extractSetCookies(r0));
  console.log('   status:', r0.status, '· cookies now:', [...jar.keys()]);

  console.log('\n(2) POST supabase /auth/v1/token (signInWithPassword)');
  const r1 = await fetch(`${SUPA}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON,
      Authorization: `Bearer ${ANON}`,
    },
    body: JSON.stringify({ email: EMAIL, password: PWD }),
  });
  if (!r1.ok) {
    console.error('   ✗ supabase login failed', r1.status, await r1.text());
    process.exit(1);
  }
  const body = await r1.json();
  console.log('   ✓ got tokens (access_token length:', body.access_token.length, ')');

  // Manually synthesize the Supabase SSR cookie (sb-<ref>-auth-token).
  const ref = SUPA.replace(/^https?:\/\//, '').split('.')[0];
  const supaCookieName = `sb-${ref}-auth-token`;
  const cookieVal = `base64-${Buffer.from(
    JSON.stringify({
      access_token: body.access_token,
      token_type: 'bearer',
      expires_in: body.expires_in,
      expires_at: body.expires_at,
      refresh_token: body.refresh_token,
      user: body.user,
    })
  ).toString('base64')}`;
  jar.set(supaCookieName, cookieVal);
  console.log('   ✓ stored cookie', supaCookieName);

  console.log('\n(3) GET /dashboard with auth cookies');
  const r2 = await fetch(`${BASE}/dashboard`, {
    headers: { cookie: cookieHeader(jar) },
    redirect: 'manual',
  });
  const loc = r2.headers.get('location') ?? '';
  console.log('   status:', r2.status, '· location:', loc || '(none)');

  if (r2.status === 200) {
    console.log('\n✅ SUCCESS: /dashboard accessible with fresh session');
  } else if (r2.status === 307 && loc.includes('/login')) {
    const reason = new URL(loc, BASE).searchParams.get('error');
    console.log('\n❌ FAIL: middleware bounced to /login?error=' + reason);
    console.log('   → check server logs for [mw:deny] details');
    process.exit(2);
  } else {
    console.log('\n⚠️  unexpected response');
    process.exit(3);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
