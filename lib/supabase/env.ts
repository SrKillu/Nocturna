/**
 * Returns true when the Supabase environment variables are set to real values
 * (not the placeholders emitted by `.env` before the operator fills them in).
 *
 * Used as a safety switch in middleware / clients so the app can boot and render
 * the landing page even before credentials are wired up.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return false;
  if (!/^https?:\/\//i.test(url)) return false;
  if (url.includes('YOUR_') || anon.includes('YOUR_')) return false;
  return true;
}

export function assertSupabaseConfigured(): void {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in /app/.env.'
    );
  }
}
