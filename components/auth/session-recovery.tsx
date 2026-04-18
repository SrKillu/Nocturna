'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Client-side last-resort recovery: if a background fetch gets hit with a 401,
 * attempt a ONE-SHOT session refresh via Supabase, then retry the router
 * refresh. On repeated failure, redirect to /login with reason=session_expired.
 *
 * Intentionally un-aggressive: we do not intercept arbitrary fetches. Instead,
 * we listen for `auth.onAuthStateChange('TOKEN_REFRESHED' | 'SIGNED_OUT')` and
 * trigger a single router.refresh() per event so Server Components pick up the
 * new token without a full reload.
 */
export function SessionRecovery() {
  const router = useRouter();
  const triedRefresh = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED') {
        router.refresh();
      } else if (event === 'SIGNED_OUT') {
        router.replace('/login?error=session_expired');
      }
    });

    // One-shot explicit refresh in case we land on a page while the access
    // token is about to expire. Avoids the first protected request 401-ing.
    if (!triedRefresh.current) {
      triedRefresh.current = true;
      supabase.auth.refreshSession().catch(() => undefined);
    }

    return () => sub.subscription.unsubscribe();
  }, [router]);

  return null;
}
