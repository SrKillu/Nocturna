/**
 * Open-redirect guard. Accepts ONLY server-local paths.
 * Reject if:
 *   - raw is falsy or not a string
 *   - does not start with '/'
 *   - starts with '//' (scheme-relative)
 *   - starts with '/<scheme>:' (rare but possible bypass)
 *   - contains backslashes (IE/Edge path normalisation)
 *   - contains whitespace or control chars
 *   - starts with the well-known auth pages (prevents bounce-to-login loops)
 */
export function sanitizeNextParam(raw: string | null | undefined, fallback = '/dashboard'): string {
  if (!raw || typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/')) return fallback;
  if (trimmed.startsWith('//')) return fallback;
  if (/^\/[a-z][a-z0-9+\-.]*:/i.test(trimmed)) return fallback;
  if (trimmed.includes('\\')) return fallback;
  if (/\s/.test(trimmed)) return fallback;
  if (trimmed === '/login' || trimmed.startsWith('/login?') || trimmed.startsWith('/login/')) return fallback;
  if (trimmed === '/signup' || trimmed.startsWith('/signup?') || trimmed.startsWith('/signup/')) return fallback;
  if (trimmed === '/auth/callback' || trimmed.startsWith('/auth/callback?')) return fallback;
  return trimmed;
}
