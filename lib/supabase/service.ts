import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service Role Supabase client.
 * BYPASSES RLS. Server-side ONLY. Never expose to the client.
 * Use exclusively for privileged operations (signup bootstrap, admin migrations,
 * signed storage URLs, etc.).
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase service-role environment variables');
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
