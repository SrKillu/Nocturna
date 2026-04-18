import 'server-only';

/**
 * Builds the Content Security Policy for a given request.
 *
 * Production uses strict-dynamic + per-request nonce (no 'unsafe-inline' on scripts).
 * Development relaxes the rules to keep the Next.js HMR overlay working.
 *
 * Tailwind/shadcn still need 'unsafe-inline' on style-src at runtime (CSS-in-JS
 * injected by radix/sonner), which is a widely accepted trade-off (style-based
 * attacks are strictly less dangerous than script-based ones).
 */
export function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV !== 'production';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseHost = supabaseUrl.startsWith('http') ? new URL(supabaseUrl).host : '';
  const supabaseOrigin = supabaseHost ? `https://${supabaseHost}` : '';
  const supabaseWs = supabaseHost ? `wss://${supabaseHost}` : '';

  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    // Dev needs eval for Webpack HMR / React refresh.
    ...(isDev ? ["'unsafe-eval'", "'unsafe-inline'"] : []),
  ];

  const styleSrc = ["'self'", "'unsafe-inline'"]; // see note above

  const imgSrc = ["'self'", 'data:', 'blob:', ...(supabaseOrigin ? [supabaseOrigin] : []), 'https://*.supabase.co'];

  const connectSrc = [
    "'self'",
    ...(supabaseOrigin ? [supabaseOrigin] : []),
    ...(supabaseWs ? [supabaseWs] : []),
    'https://*.supabase.co',
    'wss://*.supabase.co',
    ...(isDev ? ['ws:', 'http://localhost:*'] : []),
  ];

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': scriptSrc,
    'style-src': styleSrc,
    'img-src': imgSrc,
    'font-src': ["'self'", 'data:'],
    'connect-src': connectSrc,
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'object-src': ["'none'"],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
  };

  const parts = Object.entries(directives).map(
    ([k, v]) => `${k} ${v.join(' ')}`
  );
  if (!isDev) parts.push('upgrade-insecure-requests');

  return parts.join('; ');
}

/**
 * Generates a cryptographically random nonce suitable for CSP script-src.
 * 16 bytes of entropy, base64-url encoded (no padding, 22 chars).
 * Uses Web APIs only so it runs in the Edge runtime.
 */
export function generateNonce(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  let binary = '';
  for (let i = 0; i < arr.length; i += 1) binary += String.fromCharCode(arr[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
