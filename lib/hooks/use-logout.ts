'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Centralised logout handler. Use from any client component that needs to
 * terminate the session; wraps the API + SDK calls so the redirect/refresh
 * behaviour stays consistent.
 */
export function useLogout() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const logout = useCallback(
    async (scope: 'local' | 'global' = 'local') => {
      if (loading) return;
      setLoading(true);
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ scope }),
        }).catch(() => undefined);
        const supabase = createClient();
        await supabase.auth.signOut({ scope }).catch(() => undefined);
      } finally {
        setLoading(false);
        router.replace('/login');
        router.refresh();
      }
    },
    [loading, router]
  );

  return { logout, loading };
}
